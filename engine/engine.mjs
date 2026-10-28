// The engine's boot-to-ready. argv[2] is the config path. stdout
// carries notices only (versioned JSON-lines); everything human-facing
// goes to stderr. Invalid config is a loud refusal: exit 2, the broken
// constraint named.

import { readFileSync } from "node:fs";
import { validateConfig } from "./validate-config.mjs";
import { encode } from "./stdio.mjs";

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

const directories = new Set();
let readySent = false;
const maybeReady = () => {
  if (!readySent) {
    readySent = true;
    say("ready");
  }
};

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
        for (const dir of msg.directories ?? []) directories.add(dir);
        log(`engine: watch-list applied (${directories.size})`);
        maybeReady();
        break;
      case "activation-added":
        directories.add(msg.directory);
        log(`engine: watching ${msg.directory}`);
        break;
      case "activation-removed":
        directories.delete(msg.directory);
        log(`engine: unwatching ${msg.directory}`);
        break;
      case "claim-input":
      case "project-paused":
      case "project-resumed":
        log(`engine: poke ${msg.kind} accepted (not yet wired)`);
        break;
      default:
        log(`engine: unknown poke ${msg.kind} ignored`);
    }
  }
});
process.stdin.on("end", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

const heartbeatMs = Math.max(1, Number(process.env.HEARTBEAT_MS || 0)) || 5000;
setInterval(() => say("heartbeat", { at: new Date().toISOString() }), heartbeatMs);