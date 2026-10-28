// The reconciler: derives project state from committed records and
// nothing else. State lives in the stamps the records carry; anything
// in the durable vocabulary is an item, an unknown state is collected,
// and holdings this pass missed are simply found by the next one.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const STATES = [
  "ready",
  "stamped-done",
  "stamped-pass",
  "stamped-fail",
  "awaiting-answer",
  "awaiting-attention",
  "invalidated",
];

const KNOWN = new Set(STATES);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // an unreadable or absent tree yields to the next pass
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile() && entry.name.endsWith(".json")) yield path;
  }
}

export function createReconciler() {
  return {
    async reconcile(directory, recordsRoot = "records") {
      const root = join(directory, recordsRoot);
      const items = [];
      const unknown = [];
      for await (const file of walk(root)) {
        let doc;
        try {
          doc = JSON.parse(await readFile(file, "utf8"));
        } catch {
          continue; // not a record — never this pass's business
        }
        if (doc && typeof doc === "object" && typeof doc.state === "string") {
          items.push({ file, state: doc.state });
          if (!KNOWN.has(doc.state)) unknown.push({ file, state: doc.state });
        }
      }
      return {
        items,
        unknown,
        ready: items.filter((i) => i.state === "ready"),
      };
    },
  };
}