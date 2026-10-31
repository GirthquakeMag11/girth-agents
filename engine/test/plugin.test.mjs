import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installPlugin, installSkills, removeCommands, removeAgent, preflightPlugin } from "../plugin.mjs";

const pluginInput = (dir) => ({
  cwd: dir,
  url: "http://127.0.0.1:1234",
  token: "token-123",
});

test("plugin: the installed tool surface contains the lever and the control tools", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-plugin-"));
  try {
    const path = await installPlugin(pluginInput(dir));
    const source = await readFile(path, "utf8");
    for (const name of ["handoff", "dispatch", "dispatch_wait", "dispatch_status", "dispatch_cancel", "reload", "graph_info", "graph_map"]) {
      assert.match(source, new RegExp(`name: "${name}"`));
    }
    assert.doesNotMatch(source, /name: "graphs"/);
    assert.doesNotMatch(source, /graph: \{ type: "string" \}/);
    assert.doesNotMatch(source, /required: \["graph"/);
    assert.match(source, /http:\/\/127\.0\.0\.1:1234/);
    assert.match(source, /token-123/);
    assert.match(source, /engine-handoff/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin: removeCommands removes the old engine command and leaves a user command", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-commands-"));
  try {
    const commands = join(dir, ".opencode", "commands");
    await mkdir(commands, { recursive: true });
    await writeFile(join(commands, "graph.md"), "---\nagent: graph-view\n---\nCall graph_map.\n", "utf8");
    await removeCommands({ cwd: dir });
    await assert.rejects(() => readFile(join(commands, "graph.md"), "utf8"));

    await writeFile(join(commands, "graph.md"), "Review the graph by hand.\n", "utf8");
    await removeCommands({ cwd: dir });
    assert.equal(await readFile(join(commands, "graph.md"), "utf8"), "Review the graph by hand.\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin: removeAgent removes the old engine agent and leaves a user agent", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-agent-cleanup-"));
  try {
    const agents = join(dir, ".opencode", "agents");
    await mkdir(agents, { recursive: true });
    await writeFile(join(agents, "graph-view.md"), "---\ndescription: Read-only graph view.\n---\nCall graph_map.\n", "utf8");
    await removeAgent({ cwd: dir });
    await assert.rejects(() => readFile(join(agents, "graph-view.md"), "utf8"));

    await writeFile(join(agents, "graph-view.md"), "A user-authored agent.\n", "utf8");
    await removeAgent({ cwd: dir });
    assert.equal(await readFile(join(agents, "graph-view.md"), "utf8"), "A user-authored agent.\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin: both interactive skills are installed as SKILL.md", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-skills-"));
  try {
    await installSkills({ cwd: dir });
    const authoring = await readFile(join(dir, ".opencode", "skills", "graph-authoring", "SKILL.md"), "utf8");
    const dispatching = await readFile(join(dir, ".opencode", "skills", "dispatching", "SKILL.md"), "utf8");
    assert.match(authoring, /name: graph-authoring/);
    assert.match(authoring, /reload\(\)/);
    assert.doesNotMatch(authoring, /graphs\(\)/);
    assert.match(dispatching, /name: dispatching/);
    assert.match(dispatching, /dispatch_wait/);
    assert.doesNotMatch(dispatching, /graphs\(\)/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("plugin: preflight finds the active engine plugin", async () => {
  const fake = {
    plugins: async () => [
      { id: "other", state: { status: "active" }, source: { type: "local", path: "/x" } },
      { id: "engine-handoff", state: { status: "active" }, source: { type: "local", path: "/y" } },
    ],
  };
  const found = await preflightPlugin(fake, "/tmp", { timeoutMs: 100 });
  assert.equal(found.id, "engine-handoff");
});
