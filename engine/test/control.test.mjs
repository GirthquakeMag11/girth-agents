import test from "node:test";
import assert from "node:assert/strict";
import { startControlServer } from "../control.mjs";

test("control: /handoff accepts a body larger than the generic cap", async () => {
  let received = null;
  const server = await startControlServer({
    token: "token-123",
    handlers: {
      handoff: async (body) => {
        received = body;
        return { body: { ok: true } };
      },
    },
  });
  try {
    const message = "x".repeat(1024 * 1024 + 1024);
    const res = await fetch(server.url + "/handoff", {
      method: "POST",
      headers: { "content-type": "application/json", "x-engine-token": "token-123" },
      body: JSON.stringify({ message }),
    });
    assert.equal(res.status, 200);
    assert.equal(received.message.length, message.length);
  } finally {
    await server.close();
  }
});
