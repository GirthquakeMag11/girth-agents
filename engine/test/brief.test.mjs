import test from "node:test";
import assert from "node:assert/strict";
import { composeBrief } from "../brief.mjs";

const helper = { craft: "The helper's craft." };

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
    helper,
    node,
    prompt: "The dispatched prompt.",
    previousOutput: "/tmp/prev.md",
    outputAbs: "/tmp/work/review.md",
  });
  assert.match(brief, /The helper's craft/);
  assert.match(brief, /The dispatched prompt/);
  assert.match(brief, /\/tmp\/prev\.md/);
  assert.match(brief, /\/tmp\/work\/review\.md/);
  assert.match(brief, /`pass`/);
  assert.match(brief, /`fail`/);
  assert.doesNotMatch(brief, /to: \"done\"|to: \"implement\"/);
});

test("brief: unconditional uses next; terminal forbids the tool", () => {
  const unconditional = composeBrief({
    helper,
    node: { id: "a", objective: "A", handoff: { mode: "unconditional", to: "b", description: "Ready." } },
    prompt: "p",
    previousOutput: null,
    outputAbs: "/tmp/a.md",
  });
  assert.match(unconditional, /label `next`/);
  assert.match(unconditional, /Ready\./);

  const terminal = composeBrief({
    helper,
    node: { id: "z", objective: "Z", handoff: { mode: "terminal" } },
    prompt: "p",
    previousOutput: "/tmp/a.md",
    outputAbs: "/tmp/z.md",
  });
  assert.match(terminal, /Do not call the handoff tool/);
  assert.doesNotMatch(terminal, /label `next`/);
});
