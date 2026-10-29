import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runDispatch } from "../executor.mjs";

const emptyTokens = () => ({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } });

function usage(cost, input = 0, output = 0) {
  return { cost, tokens: { ...emptyTokens(), input, output } };
}

const config = {
  version: "3",
  helpers: [
    { id: "builder", model: "test/model", agent: "build", permissions: ["read"] },
    { id: "reviewer", model: "test/model", agent: "build", permissions: ["read"] },
  ],
  graph: {
    outputRoot: "work",
    maxSteps: 20,
    nodes: [
      {
        id: "a",
        helper: "builder",
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
    async prompt(id, brief) {
      const session = sessions.get(id);
      const result = await onPrompt({ session, node: session.node, brief });
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
        helper: "builder",
        objective: "A.",
        output: "a.md",
        session: "resume",
        maxVisits: 3,
        handoff: {
          mode: "conditional",
          labels: [{ label: "again", to: "a", description: "again" }],
        },
      },
    ];
    let record;
    let calls = 0;
    const driver = fakeDriver({
      onPrompt: async ({ session, brief }) => {
        calls += 1;
        if (calls === 2) return { outcome: "failed" };
        const output = outputFromBrief(brief);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, `pass ${calls}\n`, "utf8");
        const content = await readFile(output);
        record.handoff = {
          label: "again",
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
            name: "handoff",
            state: { status: "completed", input: { label: record.handoff?.label } },
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
    assert.deepEqual(driver.deleted, ["s1"]);
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
        helper: "builder",
        objective: "Build.",
        output: "builder.md",
        session: "resume",
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
        helper: "reviewer",
        objective: "Review.",
        output: "reviewer.md",
        session: "fresh",
        maxVisits: 3,
        handoff: { mode: "unconditional", to: "builder" },
      },
      {
        id: "done",
        helper: "builder",
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
            name: "handoff",
            state: { status: "completed", input: { label: record.handoff?.label } },
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
