// The dispatch queue: one active dispatch, FIFO behind it, in memory only.
// A record is the live snapshot of one dispatch. Nothing here is durable;
// a restart loses the active dispatch and the queue.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      graph: record.graph,
      node: record.node,
      state: record.state,
      createdAt: record.createdAt,
      startedAt: record.startedAt ?? null,
      finishedAt: record.finishedAt ?? null,
      visits: record.visits ?? {},
      terminal: record.terminal ?? null,
      defect: record.defect ?? null,
      handoff: record.handoff ?? null,
      sessionId: record.sessionId ?? null,
      output: record.output ?? null,
      result: record.result ?? null,
    };
  }

  async function pump() {
    if (state.paused || state.active || state.queue.length === 0) return;
    const record = state.queue.shift();
    state.active = record;
    record.state = "running";
    record.startedAt = new Date().toISOString();
    emit("dispatched", { dispatchId: record.id, graph: record.graph, node: record.node, at: record.startedAt });

    try {
      const result = await run(record);
      record.result = result ?? null;
      if (record.defect) record.state = "defect";
      else record.state = "completed";
    } catch (e) {
      record.state = "defect";
      record.defect = { code: e?.kind ?? "internal", message: e?.message ?? String(e) };
      emit("defect", { dispatchId: record.id, code: record.defect.code, message: record.defect.message });
    } finally {
      record.finishedAt = new Date().toISOString();
      state.active = null;
      emit("completion", {
        dispatchId: record.id,
        graph: record.graph,
        status: record.state,
        terminal: record.terminal ?? null,
        visits: record.visits ?? {},
        defect: record.defect ?? null,
        at: record.finishedAt,
      });
      record._resolve(snapshot(record));
      pump();
    }
  }

  function enqueue({ graph, node, prompt }) {
    const id = `d-${++state.nextId}`;
    const record = {
      id,
      graph,
      node,
      prompt,
      state: "queued",
      createdAt: new Date().toISOString(),
      visits: {},
      defect: null,
      handoff: null,
    };
    record.done = new Promise((resolve) => {
      record._resolve = resolve;
    });
    state.records.set(id, record);
    state.queue.push(record);
    emit("queued", { dispatchId: id, graph, node, at: record.createdAt });
    pump();
    return record;
  }

  async function wait(id, timeoutMs = 300000) {
    const record = state.records.get(id);
    if (!record) return null;
    if (record.state === "completed" || record.state === "defect") return snapshot(record);
    const result = await Promise.race([
      record.done,
      sleep(Math.max(1, timeoutMs)).then(() => ({ ...snapshot(record), timedOut: true })),
    ]);
    return result;
  }

  function status(id) {
    return state.records.get(id) ? snapshot(state.records.get(id)) : null;
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
