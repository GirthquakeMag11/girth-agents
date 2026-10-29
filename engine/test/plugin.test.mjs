import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installPlugin, installSkills, preflightPlugin } from "../plugin.mjs";

test("plugin: the installed tool surface contains the lever and the control tools", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-plugin-"));
  try {
    const path = await installPlugin({ cwd: dir, url: "http://127.0.0.1:1234", token: "token-123" });
    const source = await readFile(path, "utf8");
    for (const name of ["handoff", "dispatch", "dispatch_wait", "dispatch_status", "reload", "graphs"]) {
      assert.match(source, new RegExp(`name: "${name}"`));
    }
    assert.match(source, /http:\/\/127\.0\.0\.1:1234/);
    assert.match(source, /token-123/);
    assert.match(source, /engine-handoff/);
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
    assert.match(dispatching, /name: dispatching/);
    assert.match(dispatching, /dispatch_wait/);
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
