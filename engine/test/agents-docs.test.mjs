import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../frontmatter.mjs";

// The canonical texts, transcribed verbatim from OpenCode v2.2.5:
//   A = packages/core/src/session/runner/prompt/system.txt with the four
//       tool-guidance bullets inlined (they are what render() injects for
//       agents that hold shell + write + edit);
//   B = PROMPT_EXPLORE from packages/core/src/plugin/agent.ts.
// The docs must match byte-for-byte: any drift from the originals faults here.
const BLOCK_A = `You are an AI agent running in OpenCode, a coding agent harness. Help the user accomplish their goals using the tools you have available.

# Harness
- Responses are rendered as GitHub-flavored Markdown.
- \`<system-reminder>\` blocks are harness instructions, not user-authored content. Read and follow them.
- Prefer parallelizing independent tool calls.
- Prefer dedicated tools over shell commands; fall back to the shell when a tool cannot do what you need.
- Do not chain shell commands with separators like \`echo "====";\` or \`printf '---'\`; the output becomes noisy in a way that makes the user's side of the conversation worse.
- Use the write tool to create files or completely replace their content. Prefer using the edit tool for targeted changes.
- Use the edit tool for targeted changes to existing text files. It replaces the exact text in \`oldString\` with \`newString\`, and the values must differ. By default, \`oldString\` must occur exactly once. If it occurs multiple times, include more surrounding context to make it unique or set \`replaceAll\` to true to replace every occurrence.

# Communication
- Use clear file paths when referring to files.
- Keep responses clear and concise, and avoid unnecessary technical jargon.

# Working in codebases
- Keep changes consistent with the structure, naming, style, and patterns of the surrounding code.
- Treat unfamiliar files or changes as potential user work and investigate before deleting or overwriting them.`;

const BLOCK_B = `You are a file search specialist. You excel at thoroughly navigating and exploring codebases.

Guidelines:
- Your role is EXCLUSIVELY to search and analyze
- Parallelize independent tool calls for searches and reads whenever possible
- Adapt your search approach based on the thoroughness level specified by the caller
- Return file paths as absolute paths in your final response
- You MUST NOT create, modify, delete, move, or copy files, including temporary files and reports
- Shell commands MUST be read-only. NEVER run commands that write files or change system state

Complete the user's search request efficiently and report your findings clearly.`;

const PLAN_MODE = `# Plan mode
You are in Plan mode. Discuss the plan with the user directly in the
conversation. Do not create or update plan files unless the user explicitly
asks you to; when they do, write them only in the plan directory
(\`~/.opencode/plan\`).
Do not modify any other files or ask a subagent to do so.
If the user asks you to implement changes, do not do so; tell them to switch
agents.`;

const ENV_RULES = [
  { action: "read", resource: "*.env", effect: "ask" },
  { action: "read", resource: "*.env.*", effect: "ask" },
  { action: "read", resource: "*.env.example", effect: "allow" },
];

const AGENTS_DIR = fileURLToPath(new URL("../../graph/agents/", import.meta.url));

async function doc(name) {
  const text = await readFile(`${AGENTS_DIR}${name}.md`, "utf8");
  return parseFrontmatter(text);
}

const body = async (name) => (await doc(name)).body.trim();

test("agents-docs: build.md is the base prompt verbatim, allow-by-default", async () => {
  const { data, body } = await doc("build");
  assert.equal(body.trim(), BLOCK_A.trim());
  assert.equal(data.mounts[0], "primary");
  assert.equal(data.description, "The default agent. Executes tools based on configured permissions.");
  assert.equal(data.model, undefined, "build inherits the default model");
  assert.deepEqual(data.permissions, [
    { action: "*", resource: "*", effect: "allow" },
    ...ENV_RULES,
    { action: "question", resource: "*", effect: "allow" },
  ]);
});

test("agents-docs: general.md is the base prompt verbatim, question/subagent denied", async () => {
  const { data, body } = await doc("general");
  assert.equal(body.trim(), BLOCK_A.trim());
  assert.equal(data.mounts[0], "subagent");
  assert.deepEqual(data.permissions, [
    { action: "*", resource: "*", effect: "allow" },
    ...ENV_RULES,
    { action: "question", resource: "*", effect: "deny" },
    { action: "subagent", resource: "*", effect: "deny" },
  ]);
});

test("agents-docs: plan.md is the base prompt plus plan mode, edit scoped to the plan dir", async () => {
  const { data, body } = await doc("plan");
  assert.equal(body.trim(), `${BLOCK_A.trim()}\n\n${PLAN_MODE.trim()}`);
  assert.equal(data.mounts[0], "primary");
  assert.deepEqual(data.permissions, [
    { action: "*", resource: "*", effect: "allow" },
    ...ENV_RULES,
    { action: "question", resource: "*", effect: "allow" },
    { action: "edit", resource: "*", effect: "deny" },
    { action: "edit", resource: "@PLAN_DIR@/**", effect: "allow" },
  ]);
});

test("agents-docs: explore.md is PROMPT_EXPLORE verbatim, deny-by-default allow-list", async () => {
  const { data, body } = await doc("explore");
  assert.equal(body.trim(), BLOCK_B.trim());
  assert.equal(data.mounts[0], "subagent");
  assert.deepEqual(data.permissions, [
    { action: "shell", resource: "*", effect: "allow" },
    { action: "grep", resource: "*", effect: "allow" },
    { action: "glob", resource: "*", effect: "allow" },
    { action: "webfetch", resource: "*", effect: "allow" },
    { action: "websearch", resource: "*", effect: "allow" },
    { action: "read", resource: "*", effect: "allow" },
    ...ENV_RULES,
    { action: "external_directory", resource: "*", effect: "allow" },
    { action: "subagent", resource: "*", effect: "deny" },
  ]);
});