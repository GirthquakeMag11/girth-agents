import test from "node:test";
import assert from "node:assert/strict";
import { deferred, loadPlugin, tick, waitFor } from "./plugin-harness.mjs";

const CONTEXT = {
  sessionID: "session-1",
  agent: "interactive",
  messageID: "message-1",
  toolCallID: "call-1",
};

const CONTROLS = ["dispatch", "dispatch_status", "dispatch_cancel", "reload", "graph_info", "graph_map"];

function eventTools(harness, labels, extraNames = []) {
  const tools = {};
  for (const name of [...labels, ...extraNames]) {
    const definition = harness.editor.get(name);
    if (definition) tools[name] = definition;
  }
  return tools;
}

const STARTED = {
  ok: true,
  dispatchId: "d-1",
  node: "work",
  workflow: "pipeline",
  state: "running",
  display: "d-1 · running · work",
};

function terminalSnapshot(state) {
  const snapshot = {
    ok: true,
    dispatchId: "d-1",
    node: "work",
    workflow: "pipeline",
    state,
    terminal: state === "completed" ? "done" : null,
    display: `${state} display for d-1`,
  };
  if (state === "completed") snapshot.handoff = { from: "work", label: "pass" };
  if (state === "defect") snapshot.defect = { code: "handoff.none", message: "no handoff" };
  return snapshot;
}

test("collision: an existing pass tool is kept unchanged while next and the control tools are added", async () => {
  const pass = {
    name: "pass",
    description: "a user-authored pass tool",
    input: { type: "object", properties: {}, additionalProperties: false },
    async execute() {
      return { content: "user pass" };
    },
  };
  const harness = await loadPlugin({
    labels: ["pass", "next"],
    seedTools: [pass, { name: "bash", description: "a configured shell tool" }],
  });
  try {
    await harness.setup();

    assert.equal(harness.editor.get("pass"), pass, "the seeded pass definition must not be replaced");
    assert.equal(harness.editor.get("pass").description, "a user-authored pass tool");
    assert.equal(harness.editor.additions.includes("pass"), false, "the plugin must not add over the collision");

    const next = harness.editor.get("next");
    assert.ok(next, "the non-colliding label must be generated");
    assert.equal(next.description, "Finish this node and hand off with a message. Call exactly once.");
    for (const name of CONTROLS) {
      assert.ok(harness.editor.get(name), `${name} must be added`);
    }

    const preflights = harness.requestsFor("/tool/handoff-preflight");
    assert.equal(preflights.length, 1);
    assert.deepEqual(preflights[0].body, {
      labels: ["pass", "next"],
      collisions: ["pass"],
      catalogAvailable: true,
    });
  } finally {
    await harness.close();
  }
});

test("visibility: the context hook deletes only generated labels missing from the engine subset", async () => {
  const harness = await loadPlugin({
    labels: ["pass", "next"],
    seedTools: [{ name: "read", description: "a configured read tool" }],
  });
  try {
    await harness.setup();
    const hook = harness.lastHook("context");
    assert.equal(typeof hook, "function", "setup must register a context hook");

    harness.setRoute("/tool/handoff-tools", { body: { ok: true, labels: ["pass"] } });
    const tools = eventTools(harness, ["pass", "next"], ["dispatch", "reload", "read"]);
    const pass = tools.pass;
    const dispatch = tools.dispatch;
    const reload = tools.reload;
    const read = tools.read;

    await hook({ sessionID: "session-2", tools });

    assert.equal(tools.pass, pass, "an allowed generated label with the expected definition survives");
    assert.equal(Object.hasOwn(tools, "next"), false, "a generated label outside the subset is deleted");
    assert.equal(tools.dispatch, dispatch, "control tools survive");
    assert.equal(tools.reload, reload, "control tools survive");
    assert.equal(tools.read, read, "configured tools survive");

    const lookup = harness.lastRequest("/tool/handoff-tools");
    assert.equal(lookup.body.sessionID, "session-2");
  } finally {
    await harness.close();
  }
});

test("fail-closed: a rejected or non-OK visibility lookup deletes every generated label", async (t) => {
  const scenarios = [
    {
      name: "fetch rejection",
      route: () => {
        throw new Error("connection refused");
      },
    },
    {
      name: "non-OK response",
      route: { status: 503, body: { error: "engine unavailable" } },
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      const harness = await loadPlugin({ labels: ["pass", "next"] });
      try {
        await harness.setup();
        const hook = harness.lastHook("context");
        harness.setRoute("/tool/handoff-tools", scenario.route);

        const tools = eventTools(harness, ["pass", "next"], ["dispatch"]);
        await hook({ sessionID: "session-3", tools });

        assert.equal(Object.hasOwn(tools, "pass"), false);
        assert.equal(Object.hasOwn(tools, "next"), false);
        assert.deepEqual(Object.keys(tools), ["dispatch"], "only the control tool remains");
      } finally {
        await harness.close();
      }
    });
  }
});

test("definition mismatch: a replaced generated tool is deleted and reported as a collision", async () => {
  const harness = await loadPlugin({ labels: ["pass"] });
  try {
    await harness.setup();
    const hook = harness.lastHook("context");
    harness.setRoute("/tool/handoff-tools", { body: { ok: true, labels: ["pass"] } });

    const tools = eventTools(harness, ["pass"]);
    tools.pass = { ...tools.pass, description: "a user tool that replaced the generated one" };

    await hook({ sessionID: "session-4", tools });

    assert.equal(Object.hasOwn(tools, "pass"), false, "the mismatched definition is removed");

    const preflights = harness.requestsFor("/tool/handoff-preflight");
    assert.equal(preflights.length, 2, "setup and the mismatch both report");
    const report = preflights.at(-1).body;
    assert.deepEqual(report, {
      labels: ["pass"],
      collisions: ["pass"],
      catalogAvailable: true,
      sessionID: "session-4",
    });
  } finally {
    await harness.close();
  }
});

test("background: one terminal synthetic per state, none for foreground", async (t) => {
  for (const state of ["completed", "defect", "cancelled"]) {
    await t.test(state, async () => {
      const harness = await loadPlugin({ labels: ["pass"] });
      try {
        await harness.setup();
        const snapshot = terminalSnapshot(state);
        const release = deferred();
        const order = [];
        harness.setRoute("/tool/dispatch", { body: STARTED });
        harness.setRoute("/tool/dispatch/wait", async () => {
          order.push("wait-request");
          await release.promise;
          order.push("wait-resolved");
          return { body: snapshot };
        });

        const dispatch = harness.editor.get("dispatch");
        const result = await dispatch.execute(
          { prompt: "do the work", node: "work", background: true },
          CONTEXT,
        );
        order.push("dispatch-returned");

        assert.equal(result.content, STARTED.display, "background returns the started display");
        assert.deepEqual(order, ["wait-request", "dispatch-returned"], "the return precedes wait resolution");
        assert.equal(harness.syntheticCalls.length, 0, "nothing is notified before the terminal wait resolves");

        release.resolve();
        await waitFor(() => harness.syntheticCalls.length === 1, { label: `${state} synthetic` });
        await tick(25);
        assert.equal(harness.syntheticCalls.length, 1, "exactly one terminal notification");
        assert.equal(harness.requestsFor("/tool/dispatch/wait").length, 1, "one internal wait");

        const synthetic = harness.syntheticCalls[0];
        assert.equal(synthetic.sessionID, CONTEXT.sessionID);
        assert.equal(synthetic.description, "graph dispatch d-1");
        assert.match(synthetic.text, new RegExp(`<graph-dispatch dispatchID="d-1" state="${state}">`));
        assert.ok(synthetic.text.includes(snapshot.display), "the notification carries the focused display");
        assert.equal(synthetic.metadata.source, "graph-dispatch");
        assert.equal(synthetic.metadata.dispatchId, "d-1");
        assert.equal(synthetic.metadata.state, state);
        assert.equal(synthetic.metadata.node, "work");
        assert.equal(synthetic.metadata.workflow, "pipeline");
        assert.equal(synthetic.metadata.label, state === "completed" ? "pass" : null);
      } finally {
        await harness.close();
      }
    });
  }

  await t.test("foreground has no notification", async () => {
    const harness = await loadPlugin({ labels: ["pass"] });
    try {
      await harness.setup();
      const snapshot = terminalSnapshot("completed");
      harness.setRoute("/tool/dispatch", { body: STARTED });
      harness.setRoute("/tool/dispatch/wait", { body: snapshot });

      const result = await harness.editor.get("dispatch").execute(
        { prompt: "do the work", node: "work" },
        CONTEXT,
      );

      assert.equal(result.content, snapshot.display);
      await tick(25);
      assert.equal(harness.syntheticCalls.length, 0, "foreground dispatch never notifies");
    } finally {
      await harness.close();
    }
  });

  await t.test("a rejected synthetic does not change the dispatch outcome", async () => {
    const harness = await loadPlugin({ labels: ["pass"] });
    try {
      await harness.setup();
      harness.setRoute("/tool/dispatch", { body: STARTED });
      harness.setRoute("/tool/dispatch/wait", { body: terminalSnapshot("defect") });
      harness.setSynthetic(async () => {
        throw new Error("the dispatching session disappeared");
      });

      const result = await harness.editor.get("dispatch").execute(
        { prompt: "do the work", node: "work", background: true },
        CONTEXT,
      );

      assert.equal(result.content, STARTED.display, "the background result is unchanged");
      await waitFor(() => harness.syntheticCalls.length === 1, { label: "rejected synthetic" });
      await tick(25);
      assert.equal(harness.syntheticCalls.length, 1);
    } finally {
      await harness.close();
    }
  });
});

test("foreground wait: dispatch blocks on the engine wait and returns its display", async () => {
  const harness = await loadPlugin();
  try {
    await harness.setup();
    const snapshot = terminalSnapshot("completed");
    const release = deferred();
    harness.setRoute("/tool/dispatch", { body: STARTED });
    harness.setRoute("/tool/dispatch/wait", async () => {
      await release.promise;
      return { body: snapshot };
    });

    let settled = false;
    const pending = harness.editor.get("dispatch").execute({ prompt: "do the work", node: "work" }, CONTEXT);
    pending.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    await tick(25);
    assert.equal(settled, false, "dispatch stays pending while the wait is unresolved");
    assert.equal(harness.requestsFor("/tool/dispatch/wait").length, 1);

    release.resolve();
    const result = await pending;
    assert.equal(result.content, snapshot.display);
    assert.equal(harness.syntheticCalls.length, 0);
  } finally {
    await harness.close();
  }
});

test("foreground wait: a running/timedOut snapshot is retried until the completed display", async () => {
  const harness = await loadPlugin();
  try {
    await harness.setup();
    const snapshot = terminalSnapshot("completed");
    let calls = 0;
    harness.setRoute("/tool/dispatch", { body: STARTED });
    harness.setRoute("/tool/dispatch/wait", () => {
      calls += 1;
      if (calls === 1) {
        return {
          body: {
            ok: true,
            dispatchId: "d-1",
            node: "work",
            state: "running",
            timedOut: true,
            display: "d-1 · running · work",
          },
        };
      }
      return { body: snapshot };
    });

    const result = await harness.editor.get("dispatch").execute(
      { prompt: "do the work", node: "work" },
      CONTEXT,
    );

    assert.equal(calls, 2, "the timeout must be followed by another wait");
    assert.equal(result.content, snapshot.display, "the terminal display is returned");
  } finally {
    await harness.close();
  }
});

test("status: default returns the focused display and raw returns the snapshot", async () => {
  const harness = await loadPlugin({ labels: ["pass"] });
  try {
    await harness.setup();
    harness.setRoute("/tool/dispatch/status", {
      body: {
        ok: true,
        dispatchId: "d-1",
        state: "completed",
        terminal: "done",
        display: "d-1 · completed · terminal done",
      },
    });
    const status = harness.editor.get("dispatch_status");
    const focused = await status.execute({ dispatchId: "d-1" }, CONTEXT);
    assert.equal(focused.content, "d-1 · completed · terminal done");

    const raw = await status.execute({ dispatchId: "d-1", raw: true }, CONTEXT);
    assert.match(raw.content, /"state":"completed"/);
    assert.match(raw.content, /"display":"d-1 · completed · terminal done"/);
  } finally {
    await harness.close();
  }
});

test("collision: a label matching a control tool is skipped and the control tool survives", async () => {
  const harness = await loadPlugin({ labels: ["reload", "next"] });
  try {
    await harness.setup();
    assert.ok(harness.editor.get("reload"), "the control reload tool exists");
    assert.equal(harness.editor.get("reload").description.includes("Validate and swap"), true);
    assert.ok(harness.editor.get("next"), "the non-colliding label is generated");
    assert.equal(harness.editor.additions.includes("reload"), true, "control tools are added before the check");
    const preflights = harness.requestsFor("/tool/handoff-preflight");
    assert.deepEqual(preflights[0].body, {
      labels: ["reload", "next"],
      collisions: ["reload"],
      catalogAvailable: true,
    });
  } finally {
    await harness.close();
  }
});

test("definition mismatch: same schema with a different executor is removed", async () => {
  const harness = await loadPlugin({ labels: ["pass"] });
  try {
    await harness.setup();
    const hook = harness.lastHook("context");
    harness.setRoute("/tool/handoff-tools", { body: { ok: true, labels: ["pass"] } });

    const tools = eventTools(harness, ["pass"]);
    const original = harness.editor.get("pass");
    const replacement = {
      name: original.name,
      description: original.description,
      input: original.input,
      options: original.options,
      execute: async () => ({ content: "not the generated tool" }),
    };
    harness.editor.tools.set("pass", replacement);
    tools.pass = { description: original.description, input: original.input };

    await hook({ sessionID: "session-5", tools });
    assert.equal(Object.hasOwn(tools, "pass"), false, "a same-schema replacement is not executable");
    const report = harness.requestsFor("/tool/handoff-preflight").at(-1).body;
    assert.deepEqual(report.collisions, ["pass"]);
  } finally {
    await harness.close();
  }
});

test("collision reports preserve earlier setup collisions", async () => {
  const pass = { name: "pass", description: "user pass", input: { type: "object" } };
  const harness = await loadPlugin({ labels: ["pass", "next"], seedTools: [pass] });
  try {
    await harness.setup();
    const hook = harness.lastHook("context");
    harness.setRoute("/tool/handoff-tools", { body: { ok: true, labels: ["pass", "next"] } });
    const tools = eventTools(harness, ["next"]);
    tools.next = { ...tools.next, description: "replaced" };
    await hook({ sessionID: "session-6", tools });
    const report = harness.requestsFor("/tool/handoff-preflight").at(-1).body;
    assert.deepEqual([...report.collisions].sort(), ["next", "pass"]);
  } finally {
    await harness.close();
  }
});
