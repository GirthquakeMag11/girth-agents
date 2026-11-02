import test from "node:test";
import assert from "node:assert/strict";
import { composeBrief } from "../brief.mjs";

const graphAgent = { prompt: "The graph agent's prompt." };

test("brief: attached skills follow the agent's prompt", () => {
  const brief = composeBrief({
    graphAgent: {
      prompt: "The graph agent's prompt.",
      skillDocs: [{ id: "test-first", instructions: "Write the failing test first." }],
    },
    node: { id: "a", objective: "A", handoff: { mode: "terminal" } },
    prompt: "p",
    previousMessage: null,
  });
  const prompt = brief.indexOf("# Your instructions");
  const skill = brief.indexOf("# Skill: test-first");
  const work = brief.indexOf("# Work");
  assert.ok(prompt !== -1 && skill > prompt && work > skill);
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
  assert.match(brief, /The graph agent's prompt/);
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
  assert.doesNotMatch(brief, /# Output/);
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

test("brief: unconditional uses next; terminal forbids the tool", () => {
  const unconditional = composeBrief({
    graphAgent,
    node: { id: "a", objective: "A", handoff: { mode: "unconditional", to: "b", description: "Ready." } },
    prompt: "p",
    previousMessage: null,
  });
  assert.match(unconditional, /call the `next` tool/);
  assert.match(unconditional, /Ready\./);

  const terminal = composeBrief({
    graphAgent,
    node: { id: "z", objective: "Z", handoff: { mode: "terminal" } },
    prompt: "p",
    previousMessage: "The previous message.",
  });
  assert.match(terminal, /Do not call a handoff tool/);
  assert.doesNotMatch(terminal, /call the `next` tool/);
});
