// The supervisor: keeps the engine alive under the plugin. An
// unexpected exit is respawned with backoff; a graceful shutdown
// (SIGTERM/SIGINT to the supervisor, or graceful() from a test) kills
// the child and does not respawn it.

import { spawn } from "node:child_process";
import { nextDelay } from "./supervisor-policy.mjs";

export function spawnAndSupervise(command, { backoff, onSpawn = () => {} } = {}) {
  let shuttingDown = false;
  let child = null;
  let attempts = 0;
  let exited = false;
  const exitResolvers = [];

  const settle = () => {
    exited = true;
    exitResolvers.splice(0).forEach((r) => r());
  };

  const launch = () => {
    if (shuttingDown) return;
    child = spawn(command, { shell: true, stdio: ["ignore", "inherit", "inherit"] });
    onSpawn();
    child.on("exit", (code, signal) => {
      if (shuttingDown) {
        settle();
        return;
      }
      attempts += 1;
      const delay = nextDelay(attempts - 1, backoff);
      process.stderr.write(JSON.stringify({ event: "respawn", attempt: attempts, delay, code, signal }) + "\n");
      setTimeout(() => {
        if (!shuttingDown) launch();
      }, delay);
    });
  };
  launch();

  const shutdown = () => {
    shuttingDown = true;
    if (child) child.kill("SIGTERM");
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return {
    graceful() {
      shutdown();
      const nextExit = exited
        ? Promise.resolve()
        : new Promise((resolve) => exitResolvers.push(resolve));
      return nextExit.then(() => {
        process.off("SIGTERM", shutdown);
        process.off("SIGINT", shutdown);
      });
    },
    exited() {
      return exited || shuttingDown;
    },
  };
}