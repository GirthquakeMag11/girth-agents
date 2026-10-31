// The dispatch queue: one active dispatch, FIFO behind it, in memory only.
// A record is the live snapshot of one dispatch. Nothing here is durable;
// a restart loses the active dispatch and the queue.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TERMINAL = new Set(["completed", "defect", "cancelled"]);

export function createDispatchQueue({ run, onEvent = () => {} }) {
  const state = {
    paused: false,
    active: null,
    queue: [],
    nextId: 0,
    records: new Map(),
    waiters: [],
  };

  const emit = (kind, payload) => {
    try {
      onEvent(kind, payload);
    } catch {
      // A notice sink must never change the engine's verdict.
    }
  };

  function snapshot(record) {
    if (!record) return null;
    return {
      dispatchId: record.id,
      node: record.node,
      workflow: record.workflow ?? null,
      state: record.state,
      cancelRequested: Boolean(record.cancelled),
      createdAt: record.createdAt,
      startedAt: record.startedAt ?? null,
      finishedAt: record.finishedAt ?? null,
      visits: record.visits ?? {},
      terminal: record.terminal ?? null,
      defect: record.defect ?? null,
      handoff: record.handoff ?? null,
      sessionId: record.sessionId ?? null,
      output: record.output ?? null,
      usage: record.usage ?? { cost: 0, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } },
      result: record.result ?? null,
    };
  }

  function finish(record, status) {
    record.state = status;
    record.finishedAt = new Date().toISOString();
    emit("completion", {
      dispatchId: record.id,
      status,
      terminal: record.terminal ?? null,
      visits: record.visits ?? {},
      defect: record.defect ?? null,
      usage: record.usage ?? null,
      at: record.finishedAt,
    });
    record._resolve(snapshot(record));
  }

  async function pump() {
    if (state.paused || state.active || state.queue.length === 0) return;
    const record = state.queue.shift();
    state.active = record;
    record.state = "running";
    record.startedAt = new Date().toISOString();
    emit("dispatched", { dispatchId: record.id, node: record.node, at: record.startedAt });

    try {
      if (record.cancelled) {
        record.state = "cancelled";
      } else {
        const result = await run(record);
        record.result = result ?? null;
        if (record.cancelled) record.state = "cancelled";
        else if (record.defect) record.state = "defect";
        else record.state = "completed";
      }
    } catch (e) {
      if (record.cancelled) {
        record.state = "cancelled";
        record.defect = null;
      } else {
        record.state = "defect";
        record.defect = { code: e?.kind ?? "internal", message: e?.message ?? String(e) };
        emit("defect", { dispatchId: record.id, code: record.defect.code, message: record.defect.message });
      }
    } finally {
      state.active = null;
      finish(record, record.state);
      pump();
    }
  }

  function enqueue({ node, prompt, workflow = null }) {
    const id = `d-${++state.nextId}`;
    const record = {
      id,
      node,
      workflow,
      prompt,
      state: "queued",
      createdAt: new Date().toISOString(),
      visits: {},
      defect: null,
      handoff: null,
      cancelled: false,
    };
    record.done = new Promise((resolve) => {
      record._resolve = resolve;
    });
    state.records.set(id, record);
    state.queue.push(record);
    emit("queued", { dispatchId: id, node, workflow, at: record.createdAt });
    pump();
    return record;
  }

  async function wait(id, timeoutMs = 300000) {
    const record = state.records.get(id);
    if (!record) return null;
    if (TERMINAL.has(record.state)) return snapshot(record);
    const result = await Promise.race([
      record.done,
      sleep(Math.max(1, timeoutMs)).then(() => ({ ...snapshot(record), timedOut: true })),
    ]);
    return result;
  }

  function status(id) {
    return state.records.get(id) ? snapshot(state.records.get(id)) : null;
  }

  async function cancel(id, { interrupt = async () => {} } = {}) {
    const record = state.records.get(id);
    if (!record) return null;
    if (TERMINAL.has(record.state)) return snapshot(record);

    record.cancelled = true;

    if (record.state === "queued") {
      const index = state.queue.indexOf(record);
      if (index !== -1) state.queue.splice(index, 1);
      record.state = "cancelled";
      record.defect = null;
      record.finishedAt = new Date().toISOString();
      emit("completion", {
        dispatchId: record.id,
        status: "cancelled",
        terminal: record.terminal ?? null,
        visits: record.visits ?? {},
        defect: null,
        usage: record.usage ?? null,
        at: record.finishedAt,
      });
      record._resolve(snapshot(record));
      return snapshot(record);
    }

    if (record.sessionId) {
      try {
        await interrupt(record.sessionId);
      } catch {
        // the session is already stopping; the cancelled state still wins
      }
    }
    return snapshot(record);
  }

  function pause() {
    if (state.paused) return;
    state.paused = true;
    emit("paused", { at: new Date().toISOString() });
  }

  function resume() {
    if (!state.paused) return;
    state.paused = false;
    for (const resolve of state.waiters.splice(0)) resolve();
    emit("resumed", { at: new Date().toISOString() });
    pump();
  }

  async function waitIfPaused() {
    while (state.paused) {
      await new Promise((resolve) => state.waiters.push(resolve));
    }
  }

  function introspect() {
    return {
      paused: state.paused,
      active: snapshot(state.active),
      queue: state.queue.map(snapshot),
    };
  }

  return {
    enqueue,
    wait,
    status,
    cancel,
    pause,
    resume,
    waitIfPaused,
    introspect,
    get active() {
      return state.active;
    },
    get paused() {
      return state.paused;
    },
  };
}
