import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runDispatch } from "../executor.mjs";
import { createDispatchQueue } from "../queue.mjs";

const emptyTokens = () => ({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } });

function usage(cost, input = 0, output = 0) {
  return { cost, tokens: { ...emptyTokens(), input, output } };
}

const config = {
  version: "4",
  agents: [
    { id: "builder", model: "test/model", agent: "build", permissions: ["read"] },
    { id: "reviewer", model: "test/model", agent: "build", permissions: ["read"] },
  ],
  graph: {
    outputRoot: "work",
    maxSteps: 20,
    nodes: [
      {
        id: "a",
        agent: "builder",
        objective: "Do the node.",
        output: "a.md",
        handoff: { mode: "terminal" },
      },
    ],
  },
};

function outputFromBrief(brief) {
  return /Write your result to this exact path:\n\n`([^`]+)`/.exec(brief)?.[1] ?? null;
}

function fakeDriver({ onPrompt }) {
  const sessions = new Map();
  const created = [];
  const deleted = [];
  let next = 0;
  return {
    created,
    deleted,
    sessions,
    async createSession({ title }) {
      const id = `s${++next}`;
      const node = title.split("/").at(-1);
      sessions.set(id, { id, node, cost: 0, tokens: emptyTokens(), outcome: null });
      created.push(id);
      return { id };
    },
    async getSession(id) {
      const session = sessions.get(id);
      if (!session) throw new Error("no such session");
      return { id, cost: session.cost, tokens: session.tokens, outcome: session.outcome };
    },
    async prompt(id, brief, options) {
      const session = sessions.get(id);
      const result = await onPrompt({ session, node: session.node, brief, options });
      if (result.outcome && result.outcome !== "succeeded") {
        session.outcome = result.outcome;
        return { id, outcome: result.outcome, cost: session.cost, tokens: session.tokens };
      }
      session.cost += result.cost ?? 0;
      session.tokens = {
        input: session.tokens.input + (result.tokens?.input ?? 0),
        output: session.tokens.output + (result.tokens?.output ?? 0),
        reasoning: session.tokens.reasoning + (result.tokens?.reasoning ?? 0),
        cache: {
          read: session.tokens.cache.read + (result.tokens?.cache?.read ?? 0),
          write: session.tokens.cache.write + (result.tokens?.cache?.write ?? 0),
        },
      };
      session.outcome = "succeeded";
      return { id, outcome: "succeeded", cost: session.cost, tokens: session.tokens };
    },
    async messages() {
      return [];
    },
    async deleteSession(id) {
      deleted.push(id);
    },
    async interrupt() {},
  };
}

test("executor: a failed session on the first visit is a named session defect", async () => {
  const driver = fakeDriver({ onPrompt: async () => ({ outcome: "failed" }) });
  const record = { id: "d-1", node: "a", prompt: "p", visits: {} };
  await assert.rejects(
    () => runDispatch({ driver, config, record, cwd: "/tmp", onEvent: () => {} }),
    (error) => error.kind === "session-failed" && error.message.includes("s1"),
  );
  assert.deepEqual(driver.deleted, ["s1"]);
});

test("executor: an interrupted session is named, not an internal error", async () => {
  const driver = fakeDriver({ onPrompt: async () => ({ outcome: "interrupted" }) });
  const record = { id: "d-1", node: "a", prompt: "p", visits: {} };
  await assert.rejects(
    () => runDispatch({ driver, config, record, cwd: "/tmp", onEvent: () => {} }),
    (error) => error.kind === "session-interrupted" && error.message.includes("s1"),
  );
});

test("executor: a prompt timeout keeps its session-timeout code and session id", async () => {
  const driver = fakeDriver({
    onPrompt: async () => {
      const error = new Error("session s1 did not reach an outcome within 10ms");
      error.kind = "session-timeout";
      throw error;
    },
  });
  const record = { id: "d-1", node: "a", prompt: "p", visits: {} };
  await assert.rejects(
    () => runDispatch({ driver, config, record, cwd: "/tmp", onEvent: () => {} }),
    (error) => error.kind === "session-timeout" && error.message.includes("s1"),
  );
  assert.deepEqual(driver.deleted, ["s1"]);
});

test("executor: a failed resumed visit keeps the resumed session id", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-resume-fail-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        maxVisits: 3,
        handoff: {
          mode: "conditional",
          labels: [{ label: "again", to: "b", description: "again" }],
        },
      },
      {
        id: "b",
        agent: "reviewer",
        objective: "B.",
        output: "b.md",
        maxVisits: 3,
        handoff: { mode: "unconditional", to: "a", resume: true },
      },
    ];
    let record;
    let calls = 0;
    const driver = fakeDriver({
      onPrompt: async ({ session, node, brief }) => {
        calls += 1;
        if (node === "a" && calls === 3) return { outcome: "failed" };
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, `pass ${calls}\n`, "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: node === "a" ? "again" : "next",
          callID: null,
          outputHash: createHash("sha256").update(content).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: record.handoff?.label,
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    await assert.rejects(
      () => runDispatch({ driver, config: graphConfig, record, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "session-failed" && error.message.includes("s1"),
    );
    assert.equal(record.visits.a, 2);
    assert.equal(record.sessionId, "s1");
    assert.ok(driver.deleted.includes("s1"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: resume reuses one builder session; fresh gives the reviewer a new session", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-executor-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "builder",
        agent: "builder",
        objective: "Build.",
        output: "builder.md",
        maxVisits: 3,
        handoff: {
          mode: "conditional",
          labels: [
            { label: "again", to: "reviewer", description: "review" },
            { label: "finish", to: "done", description: "finish" },
          ],
        },
      },
      {
        id: "reviewer",
        agent: "reviewer",
        objective: "Review.",
        output: "reviewer.md",
        maxVisits: 3,
        handoff: { mode: "unconditional", to: "builder", resume: true },
      },
      {
        id: "done",
        agent: "builder",
        objective: "Finish.",
        output: "final.md",
        handoff: { mode: "terminal" },
      },
    ];

    let record;
    const visits = new Map();
    const driver = fakeDriver({
      onPrompt: async ({ session, node, brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, `${node} ${session.id}\n`, "utf8");
        if (node !== "done") {
          const count = (visits.get(session.id) ?? 0) + 1;
          visits.set(session.id, count);
          const label = node === "builder" ? (count >= 3 ? "finish" : "again") : "next";
          const content = await import("node:fs/promises").then((fs) => fs.readFile(output));
          record.handoff = {
            label,
            callID: null,
            outputHash: createHash("sha256").update(content).digest("hex"),
            outputPath: output,
            at: new Date().toISOString(),
          };
        }
        return { outcome: "succeeded", cost: 0.5, tokens: { input: 10, output: 2 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: record.handoff?.label,
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];

    record = { id: "d-1", node: "builder", prompt: "p", visits: {} };
    const steps = [];
    const result = await runDispatch({
      driver,
      config: graphConfig,
      record,
      cwd: dir,
      onEvent: (kind, payload) => {
        if (kind === "step") steps.push(payload);
      },
    });

    assert.equal(result.terminal, "done");
    const builderBegins = steps.filter((step) => step.phase === "begin" && step.node === "builder");
    const reviewerBegins = steps.filter((step) => step.phase === "begin" && step.node === "reviewer");
    assert.equal(builderBegins.length, 3);
    assert.equal(reviewerBegins.length, 2);
    assert.equal(new Set(builderBegins.map((step) => step.sessionId)).size, 1, "builder must resume one session");
    assert.equal(new Set(reviewerBegins.map((step) => step.sessionId)).size, 2, "reviewer must be fresh every visit");
    assert.deepEqual(builderBegins.map((step) => step.resumed), [false, true, true]);
    assert.ok(String(builderBegins[1].upstream ?? "").endsWith("/work/reviewer.md"));
    assert.equal(record.usage.cost, 3);
    assert.equal(record.usage.tokens.input, 60);
    assert.equal(record.usage.tokens.output, 12);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a strict workflow escape wins over a failed session outcome", async () => {
  const graph = {
    outputRoot: "work",
    maxSteps: 10,
    workflows: [{ id: "A", entry: "a", exit: "term", nodes: ["a", "term"], strict: true }],
    nodes: [
      {
        id: "a",
        agent: "builder",
        objective: "choose",
        output: "a.md",
        handoff: { mode: "unconditional", to: "term" },
      },
      { id: "term", agent: "builder", objective: "finish", output: "term.md", handoff: { mode: "terminal" } },
    ],
  };
  const doc = { ...config, graph };
  const record = { id: "d-1", node: "a", prompt: "p", visits: {} };
  const driver = fakeDriver({
    onPrompt: async () => {
      record.handoffDefect = Object.assign(new Error("workflow escape"), { kind: "workflow.escape" });
      return { outcome: "failed" };
    },
  });
  await assert.rejects(
    () => runDispatch({ driver, config: doc, record, cwd: "/tmp", onEvent: () => {} }),
    (error) => error.kind === "workflow.escape",
  );
});

test("executor: a recorded workflow escape wins when the prompt throws", async () => {
  const graph = {
    outputRoot: "work",
    maxSteps: 10,
    workflows: [{ id: "A", entry: "a", exit: "term", nodes: ["a", "term"], strict: true }],
    nodes: [
      {
        id: "a",
        agent: "builder",
        objective: "choose",
        output: "a.md",
        handoff: { mode: "unconditional", to: "term" },
      },
      { id: "term", agent: "builder", objective: "finish", output: "term.md", handoff: { mode: "terminal" } },
    ],
  };
  const doc = { ...config, graph };
  const record = { id: "d-1", node: "a", prompt: "p", visits: {} };
  const driver = fakeDriver({
    onPrompt: async () => {
      record.handoffDefect = Object.assign(new Error("workflow escape"), { kind: "workflow.escape" });
      const error = new Error("session timeout");
      error.kind = "session-timeout";
      throw error;
    },
  });
  await assert.rejects(
    () => runDispatch({ driver, config: doc, record, cwd: "/tmp", onEvent: () => {} }),
    (error) => error.kind === "workflow.escape",
  );
});

test("executor: resume is rejected when the target is not the input source", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-resume-return-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      { id: "a", agent: "builder", objective: "A.", output: "a.md", handoff: { mode: "unconditional", to: "b" } },
      {
        id: "b",
        agent: "builder",
        objective: "B.",
        output: "b.md",
        handoff: { mode: "unconditional", to: "c", resume: true },
      },
      { id: "c", agent: "builder", objective: "C.", output: "c.md", handoff: { mode: "terminal" } },
    ];
    let record;
    const driver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "ok\n", "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: "next",
          callID: null,
          outputHash: createHash("sha256").update(content).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: record.handoff?.label,
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    await assert.rejects(
      () => runDispatch({ driver, config: graphConfig, record, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "resume.not-return",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: the handoff message is upstream context and history stays content-free", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-message-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        handoff: { mode: "unconditional", to: "b" },
      },
      {
        id: "b",
        agent: "reviewer",
        objective: "B.",
        output: "b.md",
        handoff: { mode: "terminal" },
      },
    ];
    const briefs = [];
    let record;
    const events = [];
    const driver = fakeDriver({
      onPrompt: async ({ session, node, brief }) => {
        briefs.push({ node, brief });
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, `${node}\n`, "utf8");
        if (node === "a") {
          const content = await readFile(output);
          record.handoff = {
            label: "next",
            message: "The implementation is ready.",
            callID: null,
            outputHash: createHash("sha256").update(content).digest("hex"),
            outputPath: output,
            at: new Date().toISOString(),
          };
        }
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: record.handoff?.label,
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    const result = await runDispatch({
      driver,
      config: graphConfig,
      record,
      cwd: dir,
      onEvent: (kind, payload) => events.push({ kind, payload }),
    });

    assert.equal(result.terminal, "b");
    assert.equal(briefs.length, 2);
    assert.match(briefs[1].brief, /The implementation is ready\./);
    assert.match(briefs[1].brief, /\/a\.md/);
    assert.doesNotMatch(briefs[1].brief, /call the `next` tool/);
    const handoffEvent = events.find((event) => event.kind === "handoff");
    assert.equal(handoffEvent.payload.message, undefined);
    assert.equal(handoffEvent.payload.label, "next");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a read-only graph agent completes a node with no output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-no-output-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        handoff: { mode: "unconditional", to: "b" },
      },
      {
        id: "b",
        agent: "reviewer",
        objective: "B.",
        handoff: { mode: "terminal" },
      },
    ];
    const briefs = [];
    let record;
    const driver = fakeDriver({
      onPrompt: async ({ node, brief }) => {
        briefs.push({ node, brief });
        if (node === "a") {
          record.handoff = {
            label: "next",
            message: "The message is the deliverable.",
            callID: null,
            outputHash: null,
            outputPath: null,
            at: new Date().toISOString(),
          };
        }
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: record.handoff?.label,
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    const result = await runDispatch({
      driver,
      config: graphConfig,
      record,
      cwd: dir,
      onEvent: () => {},
    });

    assert.equal(result.terminal, "b");
    assert.equal(result.output, null);
    assert.equal(record.output, null);
    assert.equal(briefs.length, 2);
    assert.doesNotMatch(briefs[0].brief, /# Output/);
    assert.doesNotMatch(briefs[0].brief, /Write your result/);
    assert.match(briefs[1].brief, /The message is the deliverable\./);
    assert.doesNotMatch(briefs[1].brief, /\/a\.md/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a dispatcher handoff completes with the message and keeps its output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-dispatcher-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        handoff: {
          mode: "conditional",
          labels: [{ label: "report", to: "$dispatcher", description: "Report." }],
        },
      },
    ];
    const message = "The outcome is ready.";
    let record;
    const driver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "done\n", "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: "report",
          message,
          callID: null,
          outputHash: createHash("sha256").update(content).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: "report",
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    const result = await runDispatch({
      driver,
      config: graphConfig,
      record,
      cwd: dir,
      onEvent: () => {},
    });

    assert.equal(result.dispatcher, true);
    assert.equal(result.result.response, message);
    assert.equal(result.result.responseTruncated, false);
    assert.equal(result.handoff.to, "$dispatcher");
    assert.equal(result.handoff.message, message);
    assert.equal(record.terminal, undefined);
    assert.equal(record.output.path, join(dir, "work", "a.md"));
    assert.equal(record.result.response, message);
    assert.equal(record.retainedOrigin.node, "a");
    assert.equal(record.retainedOrigin.sessionId, "s1");
    assert.equal(record.retainedOrigin.message, message);
    assert.ok(!driver.deleted.includes("s1"), "the dispatcher origin session is retained");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a dispatcher response is capped at 16 KiB", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-dispatcher-cap-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        handoff: {
          mode: "conditional",
          labels: [{ label: "report", to: "$dispatcher", description: "Report." }],
        },
      },
    ];
    const message = "abc" + "😀".repeat(5000);
    let record;
    const driver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "done\n", "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: "report",
          message,
          callID: null,
          outputHash: createHash("sha256").update(content).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: "report",
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    const result = await runDispatch({
      driver,
      config: graphConfig,
      record,
      cwd: dir,
      onEvent: () => {},
    });

    assert.equal(result.result.responseTruncated, true);
    assert.ok(Buffer.byteLength(result.result.response, "utf8") <= 16 * 1024);
    assert.ok(!result.result.response.includes("\uFFFD"));
    assert.equal(result.handoff.message.length, message.length);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a return resumes the retained session with the message", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-return-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        handoff: { mode: "terminal" },
      },
    ];
    let seen = null;
    const driver = fakeDriver({
      onPrompt: async ({ session, brief, options }) => {
        seen = { session, brief, options };
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "done\n", "utf8");
        return { outcome: "succeeded", cost: 0.1, tokens: { input: 1, output: 1 } };
      },
    });
    const session = await driver.createSession({ title: "d-0/a" });
    const record = {
      id: "d-1",
      node: "a",
      prompt: "p",
      visits: {},
      resumeSessionId: session.id,
      resumeMessage: "The message back.",
      resumeBudgetMs: 5000,
    };
    const result = await runDispatch({
      driver,
      config: graphConfig,
      record,
      cwd: dir,
      onEvent: () => {},
    });

    assert.equal(result.terminal, "a");
    assert.equal(seen.session.id, session.id);
    assert.equal(seen.options.budgetMs, 5000);
    assert.match(seen.brief, /The message back\./);
    assert.equal(driver.created.length, 1);
    assert.equal(record.output.path, join(dir, "work", "a.md"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a declared output that is missing, empty, or changed defects", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-output-errors-"));
  try {
    const missingConfig = structuredClone(config);
    missingConfig.graph.nodes = [
      { id: "a", agent: "builder", objective: "A.", output: "a.md", handoff: { mode: "terminal" } },
    ];
    const missingDriver = fakeDriver({
      onPrompt: async () => ({ outcome: "succeeded", cost: 0, tokens: { input: 0, output: 0 } }),
    });
    await assert.rejects(
      () => runDispatch({ driver: missingDriver, config: missingConfig, record: { id: "d-1", node: "a", prompt: "p", visits: {} }, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "output.missing",
    );

    const emptyDriver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "", "utf8");
        return { outcome: "succeeded", cost: 0, tokens: { input: 0, output: 0 } };
      },
    });
    await assert.rejects(
      () => runDispatch({ driver: emptyDriver, config: missingConfig, record: { id: "d-1", node: "a", prompt: "p", visits: {} }, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "output.empty",
    );

    const changedConfig = structuredClone(config);
    changedConfig.graph.nodes = [
      { id: "a", agent: "builder", objective: "A.", output: "a.md", handoff: { mode: "unconditional", to: "b" } },
      { id: "b", agent: "reviewer", objective: "B.", output: "b.md", handoff: { mode: "terminal" } },
    ];
    let record;
    const changedDriver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "original\n", "utf8");
        const original = await readFile(output);
        record.handoff = {
          label: "next",
          message: "m",
          callID: null,
          outputHash: createHash("sha256").update(original).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        await writeFile(output, "changed\n", "utf8");
        return { outcome: "succeeded", cost: 0, tokens: { input: 0, output: 0 } };
      },
    });
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    await assert.rejects(
      () => runDispatch({ driver: changedDriver, config: changedConfig, record, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "output.changed",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a no-output dispatch snapshot carries output null", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-no-output-queue-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      { id: "a", agent: "builder", objective: "A.", handoff: { mode: "terminal" } },
    ];
    const driver = fakeDriver({
      onPrompt: async () => ({ outcome: "succeeded", cost: 0, tokens: { input: 0, output: 0 } }),
    });
    const queue = createDispatchQueue({
      run: (record) =>
        runDispatch({ driver, config: graphConfig, record, cwd: dir, onEvent: () => {} }),
    });
    const record = queue.enqueue({ node: "a", prompt: "p" });
    const result = await queue.wait(record.id, 1000);
    assert.equal(result.state, "completed");
    assert.equal(result.output, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: a dispatcher handoff that later defects is not retained", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-dispatcher-defect-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        handoff: {
          mode: "conditional",
          labels: [{ label: "report", to: "$dispatcher", description: "Report." }],
        },
      },
    ];
    let record;
    const driver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "done\n", "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: "report",
          message: "The outcome.",
          callID: "h",
          outputHash: createHash("sha256").update(content).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        return { outcome: "succeeded", cost: 0, tokens: { input: 0, output: 0 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 2 },
        content: [
          {
            type: "tool",
            id: "s",
            name: "shell",
            state: { status: "completed" },
            time: { created: 2, completed: 2 },
          },
        ],
      },
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: "report",
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    await assert.rejects(
      () => runDispatch({ driver, config: graphConfig, record, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "handoff.not-last",
    );
    assert.equal(record.retainedOrigin, undefined);
    assert.ok(driver.deleted.includes("s1"), "a failed dispatcher handoff deletes its session");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("executor: cancelling after dispatcher acceptance does not retain the origin", async () => {
  const dir = await mkdtemp(join(tmpdir(), "engine-dispatcher-cancel-"));
  try {
    const graphConfig = structuredClone(config);
    graphConfig.graph.nodes = [
      {
        id: "a",
        agent: "builder",
        objective: "A.",
        output: "a.md",
        handoff: {
          mode: "conditional",
          labels: [{ label: "report", to: "$dispatcher", description: "Report." }],
        },
      },
    ];
    let record;
    const driver = fakeDriver({
      onPrompt: async ({ brief }) => {
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, "done\n", "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: "report",
          message: "The outcome.",
          callID: "h",
          outputHash: createHash("sha256").update(content).digest("hex"),
          outputPath: output,
          at: new Date().toISOString(),
        };
        record.cancelled = true;
        return { outcome: "succeeded", cost: 0, tokens: { input: 0, output: 0 } };
      },
    });
    driver.messages = async () => [
      {
        time: { created: 1 },
        content: [
          {
            type: "tool",
            id: "h",
            name: "report",
            state: { status: "completed" },
            time: { created: 1, completed: 1 },
          },
        ],
      },
    ];
    record = { id: "d-1", node: "a", prompt: "p", visits: {} };
    await assert.rejects(
      () => runDispatch({ driver, config: graphConfig, record, cwd: dir, onEvent: () => {} }),
      (error) => error.kind === "cancelled",
    );
    assert.equal(record.retainedOrigin, undefined);
    assert.ok(driver.deleted.includes("s1"), "a cancelled dispatcher handoff deletes its session");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
