import test from "node:test";
import assert from "node:assert/strict";
import { composeBrief } from "../brief.mjs";

const graphAgent = { prompt: "The graph agent's prompt." };

test("brief: the agent body is system, not brief; skills still follow", () => {
  const brief = composeBrief({
    graphAgent: {
      prompt: "The graph agent's prompt.",
      skillDocs: [{ id: "test-first", instructions: "Write the failing test first." }],
    },
    node: { id: "a", objective: "A", handoff: { mode: "terminal" } },
    prompt: "p",
    previousMessage: null,
  });
  assert.doesNotMatch(brief, /# Your instructions/);
  assert.doesNotMatch(brief, /The graph agent's prompt/);
  const skill = brief.indexOf("# Skill: test-first");
  const work = brief.indexOf("# Work");
  assert.ok(skill !== -1 && work > skill);
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
    previousMessage: "The previous review found one issue.",
  });
  assert.match(brief, /The dispatched prompt/);
  assert.match(brief, /The previous review found one issue\./);
  assert.match(brief, /`pass`/);
  assert.match(brief, /`fail`/);
  assert.match(brief, /with a message/);
  assert.doesNotMatch(brief, /to: \"done\"|to: \"implement\"/);
  assert.doesNotMatch(brief, /`handoff`/);
  assert.doesNotMatch(brief, /# Output/);
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
    previousMessage: "The review found one issue.",
  });
  assert.match(brief, /The review found one issue\./);
  assert.match(brief, /# Input from the previous node/);
  assert.doesNotMatch(brief, /# Output/);
  assert.doesNotMatch(brief, /verified output/);
});

test("brief: a resumed dispatcher prompt is labelled as dispatcher input", () => {
  const brief = composeBrief({
    graphAgent,
    node: {
      id: "b",
      objective: "Continue.",
      handoff: { mode: "terminal" },
    },
    prompt: "p",
    previousMessage: "The dispatcher resumed this node.",
    inputSource: "dispatcher",
  });
  assert.match(brief, /# Input from the dispatcher/);
  assert.doesNotMatch(brief, /# Input from the previous node/);
  assert.match(brief, /The dispatcher resumed this node\./);

  const fromNode = composeBrief({
    graphAgent,
    node: {
      id: "b",
      objective: "Continue.",
      handoff: { mode: "terminal" },
    },
    prompt: "p",
    previousMessage: "The previous node handed off.",
    inputSource: "node",
  });
  assert.match(fromNode, /# Input from the previous node/);
  assert.doesNotMatch(fromNode, /# Input from the dispatcher/);

  const start = composeBrief({
    graphAgent,
    node: {
      id: "b",
      objective: "Continue.",
      handoff: { mode: "terminal" },
    },
    prompt: "p",
    previousMessage: null,
    inputSource: "dispatcher",
  });
  assert.match(start, /# Input\n\nThis is the start node/);
});

test("brief: legacy output inputs are ignored", () => {
  const brief = composeBrief({
    graphAgent,
    node: {
      id: "a",
      objective: "A.",
      output: "a.md",
      previousOutput: "/tmp/a.md",
      outputAbs: "/tmp/b.md",
      handoff: { mode: "terminal" },
    },
    prompt: "p",
    previousMessage: null,
  });
  assert.doesNotMatch(brief, /# Output/);
  assert.doesNotMatch(brief, /Write your result/);
  assert.doesNotMatch(brief, /\/tmp\/a\.md/);
  assert.doesNotMatch(brief, /\/tmp\/b\.md/);
  assert.doesNotMatch(brief, /verified output/);
});

test("brief: no output section or file requirement", () => {
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
    previousMessage: null,
  });
  assert.doesNotMatch(brief, /# Output/);
  assert.doesNotMatch(brief, /Write your result/);
  assert.doesNotMatch(brief, /When the output exists/);
  assert.match(brief, /When the objective is met/);

  const terminal = composeBrief({
    graphAgent,
    node: { id: "z", objective: "Z", handoff: { mode: "terminal" } },
    prompt: "p",
    previousMessage: null,
  });
  assert.match(terminal, /End your turn/);
  assert.doesNotMatch(terminal, /Write the output/);
});

test("brief: unconditional uses the handoff tool; terminal forbids the tool", () => {
  const unconditional = composeBrief({
    graphAgent,
    node: { id: "a", objective: "A", handoff: { mode: "unconditional", to: "b", description: "Ready." } },
    prompt: "p",
    previousMessage: null,
  });
  assert.match(unconditional, /call the `handoff` tool/);
  assert.doesNotMatch(unconditional, /call the `next` tool/);
  assert.match(unconditional, /Ready\./);

  const terminal = composeBrief({
    graphAgent,
    node: { id: "z", objective: "Z", handoff: { mode: "terminal" } },
    prompt: "p",
    previousMessage: "The previous message.",
  });
  assert.match(terminal, /Do not call a handoff tool/);
  assert.doesNotMatch(terminal, /call the `handoff` tool/);
});
