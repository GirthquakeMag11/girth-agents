import test from "node:test";
import assert from "node:assert/strict";
import { composeBrief } from "../brief.mjs";

const graphAgent = { craft: "The graph agent's craft." };

test("brief: attached skills follow the agent's craft", () => {
  const brief = composeBrief({
    graphAgent: {
      craft: "The graph agent's craft.",
      skillDocs: [{ id: "test-first", instructions: "Write the failing test first." }],
    },
    node: { id: "a", objective: "A", handoff: { mode: "terminal" } },
    prompt: "p",
    previousOutput: null,
    previousMessage: null,
    outputAbs: null,
  });
  const craft = brief.indexOf("# Your craft");
  const skill = brief.indexOf("# Skill: test-first");
  const work = brief.indexOf("# Work");
  assert.ok(craft !== -1 && skill > craft && work > skill);
  assert.match(brief, /Write the failing test first\./);
});

test("brief: conditional handoffs list labels and descriptions without target ids", () => {
  const node = {
    id: "review",
    objective: "Review the work.",
    handoff: {
      mode: "conditional",
      labels: [
        { label: "pass", to: "done", description: "Pass it." },
        { label: "fail", to: "implement", description: "Fix it." },
      ],
    },
  };
  const brief = composeBrief({
    graphAgent,
    node,
    prompt: "The dispatched prompt.",
    previousOutput: "/tmp/prev.md",
    outputAbs: "/tmp/work/review.md",
  });
  assert.match(brief, /The graph agent's craft/);
  assert.match(brief, /The dispatched prompt/);
  assert.match(brief, /\/tmp\/prev\.md/);
  assert.match(brief, /\/tmp\/work\/review\.md/);
  assert.match(brief, /`pass`/);
  assert.match(brief, /`fail`/);
  assert.match(brief, /with a message/);
  assert.match(brief, /The previous node's verified output/);
  assert.doesNotMatch(brief, /to: \"done\"|to: \"implement\"/);
  assert.doesNotMatch(brief, /`handoff`/);
});

test("brief: the upstream handoff message is context", () => {
  const brief = composeBrief({
    graphAgent,
    node: {
      id: "b",
      objective: "Continue.",
      handoff: { mode: "terminal" },
    },
    prompt: "p",
    previousOutput: "/tmp/a.md",
    previousMessage: "The review found one issue.",
    outputAbs: "/tmp/b.md",
  });
  assert.match(brief, /The review found one issue\./);
  assert.match(brief, /\/tmp\/a\.md/);
});

test("brief: no output omits the file requirement", () => {
  const brief = composeBrief({
    graphAgent,
    node: {
      id: "review",
      objective: "Review.",
      handoff: {
        mode: "conditional",
        labels: [{ label: "pass", to: "done", description: "Pass it." }],
      },
    },
    prompt: "p",
    previousOutput: null,
    previousMessage: null,
    outputAbs: null,
  });
  assert.doesNotMatch(brief, /# Output/);
  assert.doesNotMatch(brief, /Write your result/);
  assert.doesNotMatch(brief, /When the output exists/);
  assert.match(brief, /When the objective is met/);

  const terminal = composeBrief({
    graphAgent,
    node: { id: "z", objective: "Z", handoff: { mode: "terminal" } },
    prompt: "p",
    previousOutput: null,
    previousMessage: null,
    outputAbs: null,
  });
  assert.match(terminal, /End your turn/);
  assert.doesNotMatch(terminal, /Write the output/);
});

test("brief: unconditional uses next; terminal forbids the tool", () => {
  const unconditional = composeBrief({
    graphAgent,
    node: { id: "a", objective: "A", handoff: { mode: "unconditional", to: "b", description: "Ready." } },
    prompt: "p",
    previousOutput: null,
    outputAbs: "/tmp/a.md",
  });
  assert.match(unconditional, /call the `next` tool/);
  assert.match(unconditional, /Ready\./);

  const terminal = composeBrief({
    graphAgent,
    node: { id: "z", objective: "Z", handoff: { mode: "terminal" } },
    prompt: "p",
    previousOutput: "/tmp/a.md",
    outputAbs: "/tmp/z.md",
  });
  assert.match(terminal, /Do not call a handoff tool/);
  assert.doesNotMatch(terminal, /call the `next` tool/);
});
