import test from "node:test";
import assert from "node:assert/strict";
import { parseFrontmatter } from "./frontmatter.mjs";

test("frontmatter: parses the constrained subset — scalars, arrays, nested maps, comments", () => {
  const { data, body } = parseFrontmatter(`---
id: builder
job: Build the piece the brief names
model: openrouter/~deepseek/deepseek-flash-latest
budgetMs: 600000
retired: false
capabilities: [fs, bash]
permissions:
  allow: [fs, bash]
  denyRest: true
---
# The craft

The body text stays intact.`);
  assert.equal(data.id, "builder");
  assert.equal(data.job, "Build the piece the brief names");
  assert.equal(data.budgetMs, 600000);
  assert.equal(data.retired, false);
  assert.deepEqual(data.capabilities, ["fs", "bash"]);
  assert.deepEqual(data.permissions, { allow: ["fs", "bash"], denyRest: true });
  assert.ok(body.includes("# The craft"));
});

test("frontmatter: an array of inline maps parses", () => {
  const { data } = parseFrontmatter(`---
links:
  - from: in
    to: build
  - from: build
    to: grade
---
`);
  assert.deepEqual(data.links, [
    { from: "in", to: "build" },
    { from: "build", to: "grade" },
  ]);
});

test("frontmatter: node out-links parse — array items with nested conditions", () => {
  const { data } = parseFrontmatter(`---
id: grade
out:
  - to: out-done
    condition:
      field: verdict
      equals: pass
  - to: repair
    condition:
      field: verdict
      equals: fail
  - to: repair
    exhausted: true
  - to: bounce
---
`);
  assert.deepEqual(data.out, [
    { to: "out-done", condition: { field: "verdict", equals: "pass" } },
    { to: "repair", condition: { field: "verdict", equals: "fail" } },
    { to: "repair", exhausted: true },
    { to: "bounce" },
  ]);
});

test("frontmatter: comments are ignored, quoted strings keep their content", () => {
  const { data } = parseFrontmatter(`---
title: "Hello: world" # trailing comment
note: plain words # comment
---
`);
  assert.equal(data.title, "Hello: world");
  assert.equal(data.note, "plain words");
});

test("frontmatter: unsupported syntax is a typed, line-naming error — never a guess", () => {
  const cases = [
    ["flow map", "permissions: { allow: [fs] }"],
    ["block scalar", "job: |\n  many\n  lines"],
    ["tag", "model: !!str x"],
    ["unclosed quote", 'job: "never ends'],
  ];
  for (const [name, content] of cases) {
    assert.throws(
      () => parseFrontmatter(`---\n${content}\n---\nbody`),
      (e) => e instanceof SyntaxError && /line \d+/.test(e.message),
      `${name} must be rejected loudly`,
    );
  }
});

test("frontmatter: no frontmatter fence is a typed error", () => {
  assert.throws(
    () => parseFrontmatter("just body text"),
    (e) => e instanceof SyntaxError && /frontmatter/.test(e.message),
  );
});

test("frontmatter: an unclosed fence is a typed error", () => {
  assert.throws(
    () => parseFrontmatter("---\njob: builder"),
    (e) => e instanceof SyntaxError && /fence/.test(e.message),
  );
});