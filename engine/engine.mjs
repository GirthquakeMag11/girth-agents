// The engine's boot-to-ready. argv[2] is the config path. stdout
// carries notices only (versioned JSON-lines); everything human-facing
// goes to stderr. Invalid config is a loud refusal: exit 2, the broken
// constraint named. Once booted, the engine watches its activated
// projects' records and reconciles from their stamps.

import { readFileSync } from "node:fs";
import { validateConfig } from "./validate-config.mjs";
import { encode } from "./stdio.mjs";
import { createReconciler } from "./reconciler.mjs";
import { createWatcher } from "./watcher.mjs";

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
const verdict = validateConfig(text);
if (!verdict.valid) {
  for (const reason of verdict.reasons) log(`engine: invalid config: ${reason}`);
  process.exit(2);
}

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
let readySent = false;

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
        break;
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