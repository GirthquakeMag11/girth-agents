import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "..");
const src = join(root, "src");
const fixtures = join(here, "..", "fixtures");
const repo = join(here, "..", "..");

const patterns = [
  ["renderFrame", /renderFrame\s*\(/],
  ["canvas", /\bcanvas\b/],
  ["style-grid", /styles\s*\[[^\]]+\]\s*\[[^\]]+\]/],
  ["paint", /\bpaint\s*\(/],
  ["hline", /\bhline\s*\(/],
  ["vline", /\bvline\s*\(/],
  ["box-helper", /(^|[^<\w])box\s*\(/m],
  ["row-grid", /row\s*\.\s*join\s*\(\s*["'`]{2}\s*\)/],
  ["grid-buffer", /(?:Array\s*\.\s*from|new\s+Array)\s*\([\s\S]{0,160}?\.fill\s*\(/],
  ["render-mjs", /render\.mjs/],
];

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.(mjs|ts|tsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test("dashboard: live source has no character-canvas renderer", async () => {
  for (const file of await sourceFiles(src)) {
    const source = await readFile(file, "utf8");
    for (const [name, pattern] of patterns) {
      assert.doesNotMatch(source, pattern, `${name} found in ${file}`);
    }
  }
});

test("dashboard: known-bad fixtures prove the anti-canvas patterns", async () => {
  for (const [name, pattern] of patterns) {
    const source = await readFile(join(fixtures, `bad-${name}.mjs`), "utf8");
    assert.match(source, pattern, `fixture for ${name} did not match`);
  }
});

test("dashboard: the old ignored character-canvas package is removed", async () => {
  await assert.rejects(() => readFile(join(repo, ".opencode", "plugins", "graph-dashboard", "tui.tsx"), "utf8"));
  await assert.rejects(() => readFile(join(repo, ".opencode", "plugins", "graph-dashboard", "render.mjs"), "utf8"));
});
