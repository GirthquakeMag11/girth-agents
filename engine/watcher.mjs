// The watcher: each activated project's records tree is watched with
// the engine's own filesystem watch, rounded out by a periodic pass.
// The platform's event stream is never involved; whatever a watch
// misses, the next pass catches.

import { watch } from "node:fs";
import { join } from "node:path";

export function createWatcher({ onPass, intervalMs = 5000 } = {}) {
  const projects = new Map(); // id -> {id, directory, recordsRoot, paused, watcher}
  let interval = null;
  let stopped = false;

  const debounce = (() => {
    const pending = new Set();
    let timer = null;
    return (id) => {
      pending.add(id);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        for (const queued of [...pending]) fire(queued);
        pending.clear();
      }, 0);
    };
  })();

  function fire(id) {
    const project = projects.get(id);
    if (!project || project.paused || stopped) return;
    onPass(id);
  }

  function beginWatch(project) {
    if (project.watcher) return;
    const root = join(project.directory, project.recordsRoot);
    try {
      project.watcher = watch(root, { recursive: true }, () => debounce(project.id));
      project.watcher.on("error", () => {
        // the periodic pass is the backstop; a failing watch is not a failing engine
      });
    } catch {
      project.watcher = null; // unsupported recursive watch — the pass alone carries it
    }
  }

  return {
    add({ id, directory, recordsRoot = "records" }) {
      projects.set(id, { id, directory, recordsRoot, paused: false, watcher: null });
      beginWatch(projects.get(id));
      debounce(id); // an add is itself a reason to look
    },
    remove(id) {
      const project = projects.get(id);
      if (project?.watcher) project.watcher.close();
      projects.delete(id);
    },
    pause(id) {
      const project = projects.get(id);
      if (project) project.paused = true;
    },
    resume(id) {
      const project = projects.get(id);
      if (project) {
        project.paused = false;
        debounce(id);
      }
    },
    list() {
      return [...projects.values()];
    },
    start() {
      interval = setInterval(() => {
        if (stopped) return;
        for (const project of projects.values()) {
          if (!project.paused) fire(project.id);
        }
      }, intervalMs);
    },
    async stop() {
      stopped = true;
      if (interval) clearInterval(interval);
      for (const project of projects.values()) {
        if (project.watcher) project.watcher.close();
      }
    },
  };
}