import test from "node:test";
import assert from "node:assert/strict";
import { checkHandoffOrder } from "../executor.mjs";

function tool(id, name, { created = 1, completed = 1, label, status = "completed" } = {}) {
  return {
    type: "tool",
    id,
    name,
    state: { status, ...(label ? { input: { label } } : {}) },
    time: { created, completed },
  };
}

function message(created, content) {
  return { id: `msg-${created}`, type: "assistant", time: { created }, content };
}

test("order: the history is newest-first and the handoff is last chronologically", () => {
  const handoff = { callID: "h", label: "next", at: new Date(2000).toISOString() };
  const messages = [
    message(3000, [{ type: "text", text: "done" }]),
    message(2000, [tool("h", "handoff", { created: 2000, completed: 2000, label: "next" })]),
    message(1000, [tool("w", "write", { created: 1000, completed: 1000 })]),
  ];
  assert.equal(checkHandoffOrder(messages, handoff), null);
});

test("order: a tool after the handoff is a defect", () => {
  const handoff = { callID: "h", label: "next", at: new Date(2000).toISOString() };
  const messages = [
    message(3000, [tool("w2", "write", { created: 3000, completed: 3000 })]),
    message(2000, [tool("h", "handoff", { created: 2000, completed: 2000, label: "next" })]),
  ];
  assert.match(checkHandoffOrder(messages, handoff) ?? "", /followed the handoff/);
});

test("order: a parallel tool that finished after the handoff is a defect", () => {
  const handoff = { callID: "h", label: "next", at: new Date(2000).toISOString() };
  const messages = [
    message(2000, [tool("h", "handoff", { created: 2000, completed: 2000, label: "next" })]),
    message(1000, [tool("s", "shell", { created: 1000, completed: 2500 })]),
  ];
  assert.match(checkHandoffOrder(messages, handoff) ?? "", /completed after/);
});

test("order: a missing handoff or an errored handoff is a defect", () => {
  assert.match(checkHandoffOrder([], { callID: "h", label: "next", at: new Date(1).toISOString() }) ?? "", /no tool calls/);
  const handoff = { callID: "h", label: "next", at: new Date(1).toISOString() };
  const messages = [message(1, [tool("h", "handoff", { created: 1, completed: 1, label: "next", status: "error" })])];
  assert.match(checkHandoffOrder(messages, handoff) ?? "", /ended error/);
});
