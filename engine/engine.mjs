// The engine's boot-to-ready. argv[2] is the config path. stdout
// carries notices only (versioned JSON-lines); everything human-facing
// goes to stderr. Invalid config is a loud refusal: exit 2, the broken
// constraint named. Once booted, the engine watches its activated
// projects' records and reconciles from their stamps.

import { readFileSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "./config-loader.mjs";
import { encode } from "./stdio.mjs";
import { createReconciler } from "./reconciler.mjs";
import { createWatcher } from "./watcher.mjs";
import { createExecutor } from "./executor.mjs";
import { createServerDriver } from "./driver.mjs";
import { createDelivery } from "./delivery.mjs";

const say = (kind, payload) => process.stdout.write(encode(kind, payload) + "\n");
const log = (...a) => process.stderr.write(a.join(" ") + "\n");

const configPath = process.argv[2];
if (!configPath) {
  log("engine: no config path given");
  process.exit(2);
}
let text;
try {
  text = readFileSync(configPath, "utf8");
} catch (e) {
  log(`engine: cannot read config: ${e.message}`);
  process.exit(2);
}
const loaded = await loadConfig(configPath);
if (loaded.faults.length > 0) {
  for (const f of loaded.faults) log(`engine: invalid config: [${f.code}] ${f.message}`);
  process.exit(2);
}
const configDoc = loaded.doc;

say("version", { version: 1 });

const reconciler = createReconciler();
const watcher = createWatcher({
  onPass: async (id) => {
    const project = watcher.list().find((p) => p.id === id);
    if (!project) return;
    const result = await reconciler.reconcile(project.directory, project.recordsRoot);
    if (result.ready.length > 0) {
      log(`engine: ready work in ${id}: ${result.ready.length} ready`);
    }
  },
  intervalMs: Math.max(1, Number(process.env.PASS_MS || 0)) || 5000,
});
watcher.start();

const pendingClaims = [];
const runs = new Map();
let runCount = 0;
let readySent = false;
let driver = null;

function describeRun(run) {
  const described = {
    runId: run.runId,
    projectId: run.projectId,
    state: run.state,
    startedAt: run.startedAt,
    events: run.events,
    terminal: run.terminal,
    failure: run.failure,
    exitRecord: run.exitRecord,
    currentSession: null,
  };
  if (run.state === "in-flight" && run.currentStep?.sessionIdx !== undefined && driver) {
    described.currentSession = driver.describeSession(run.currentStep.sessionIdx);
  }
  return described;
}

async function getDriver() {
  if (driver) return driver;
  const fittings = {};
  for (const [id, fitting] of Object.entries(configDoc.agents ?? {})) {
    fittings[id] = {
      model: fitting.model,
      capabilities: fitting.capabilities ?? [],
      permissions: fitting.permissions,
    };
  }
  driver = await createServerDriver({ serviceFile: process.env.OPENCODE_SERVICE_FILE, fittings, fetchImpl: fetch });
  return driver;
}

async function claim(input) {
  const directory = input.directory;
  if (!directory || !input.file) {
    say("defect", { message: "claim-input without directory or file" });
    return;
  }
  const entries = (configDoc.graph?.nodes ?? []).filter((n) => n.type === "entry");
  const entry = entries[0];
  if (!entry) {
    say("defect", { message: "no entry node configured" });
    return;
  }
  let text;
  try {
    text = await readFile(join(directory, input.file), "utf8");
  } catch (e) {
    say("defect", { message: `claim unreadable: ${e.message}` });
    return;
  }
  if (entry.marker && !text.includes(entry.marker)) {
    say("defect", { message: `claim rejected: the entry node's marker '${entry.marker}' is absent` });
    log(`engine: claim ${input.file} rejected — marker absent`);
    return;
  }

  try {
    const runId = `run-${++runCount}`;
    const runState = {
      runId,
      projectId: directory,
      state: "in-flight",
      startedAt: new Date().toISOString(),
      events: [],
    };
    runs.set(runId, runState);
    const ex = createExecutor({
      graph: configDoc.graph,
      agents: configDoc.agents,
      onStep: (event) => {
        runState.events.push(event);
        runState.currentStep = event;
      },
      driver: await getDriver(),
      readFile: (path) => readFile(path, "utf8").catch(() => null),
      artifactPath: (projectId, node) => join(projectId, node.artifact),
      writeExitRecord: async ({ projectId, node }) => {
        const kind = node.record?.kind === "defect" ? "defect" : "question";
        const state = kind === "defect" ? "awaiting-attention" : "awaiting-answer";
        const record = {
          kind,
          state,
          chain: projectId,
          node: node.id,
          at: new Date().toISOString(),
        };
        const recordsDir = join(projectId, "records");
        await mkdir(recordsDir, { recursive: true });
        await writeFile(join(recordsDir, `${node.id}.json`), JSON.stringify(record, null, 2));
        say("exit-committed", { node: node.id, recordKind: kind, state });
        return { file: join(recordsDir, `${node.id}.json`) };
      },
    });
    const result = await ex.run({ projectId: directory, entryNode: entry.id, directory });
    runState.state = "finished";
    runState.terminal = result.terminal;
    runState.failure = result.failure?.kind ? { kind: result.failure.kind, message: result.failure.message } : undefined;
    if (result.exit) {
      runState.exitRecord = result.exit.file;
    }
    if (result.failure) {
      say("defect", { message: result.failure.message });
      log(`engine: chain failed: ${result.failure.kind}: ${result.failure.message}`);
      return;
    }
    if (result.exit) {
      const delivery = createDelivery({ repoPath: directory });
      const record = result.exit.file ? { file: result.exit.file } : undefined;
      if (record) {
        const rel = record.file.slice(directory.length + 1);
        const commit = await delivery.commitUnit({ files: [rel], message: `feat(engine): ${result.terminal} recorded` });
        log(`engine: exit committed: ${commit.state}`);
        const syncState = await delivery.sync();
        log(`engine: sync: ${syncState.state}${syncState.detail ? ` (${syncState.detail})` : ""}`);
      }
    }
  } catch (e) {
    say("defect", { message: e.message });
    log(`engine: claim failed: ${e.kind ?? e.name}: ${e.message}`);
  }
}

async function boot() {
  if (readySent) return;
  readySent = true;
  let total = 0;
  for (const project of watcher.list()) {
    const result = await reconciler.reconcile(project.directory, project.recordsRoot);
    total += result.ready.length;
  }
  log(`engine: ready work: ${total} ready`);
  say("ready");
}

function addProject(entry) {
  const directory = typeof entry === "string" ? entry : entry.directory;
  if (!directory) return;
  const id = directory;
  const recordsRoot = typeof entry === "string" ? "records" : entry.recordsRoot ?? "records";
  watcher.add({ id, directory, recordsRoot });
  return id;
}

let pending = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  pending += chunk;
  let idx;
  while ((idx = pending.indexOf("\n")) !== -1) {
    const line = pending.slice(0, idx).trim();
    pending = pending.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      log("engine: malformed line ignored");
      continue;
    }
    switch (msg.kind) {
      case "watch-list":
        for (const entry of msg.directories ?? []) addProject(entry);
        log(`engine: watch-list applied (${watcher.list().length})`);
        boot();
        break;
      case "activation-added":
        addProject({ directory: msg.directory });
        log(`engine: watching ${msg.directory}`);
        boot();
        break;
      case "activation-removed":
        watcher.remove(msg.directory);
        log(`engine: unwatching ${msg.directory}`);
        break;
      case "project-paused":
        watcher.pause(msg.directory);
        log(`engine: paused ${msg.directory}`);
        break;
      case "project-resumed":
        watcher.resume(msg.directory);
        log(`engine: resumed ${msg.directory}`);
        break;
      case "claim-input":
        pendingClaims.push(msg);
        log(`engine: claimed input ${msg.file} (${pendingClaims.length} pending)`);
        claim(msg);
        break;
      case "introspect": {
        if (msg.runId) {
          const run = runs.get(msg.runId);
          say("introspection", run
            ? { found: true, run: describeRun(run) }
            : { found: false, runId: msg.runId });
        } else {
          say("introspection", { found: true, runs: [...runs.values()].map(describeRun) });
        }
        break;
      }
      default:
        log(`engine: unknown poke ${msg.kind} ignored`);
    }
  }
});

async function shutdown() {
  await watcher.stop();
  process.exit(0);
}
process.stdin.on("end", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const heartbeatMs = Math.max(1, Number(process.env.HEARTBEAT_MS || 0)) || 5000;
setInterval(() => say("heartbeat", { at: new Date().toISOString() }), heartbeatMs);