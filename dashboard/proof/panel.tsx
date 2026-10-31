import { testRender } from "@opentui/solid";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DashboardView } from "../src/view.tsx";

process.env.TZ = "UTC";

const theme = {
  background: {
    base: "#1d2021",
    raised: { base: "#282828", high: "#3c3836", max: "#504945" },
  },
  border: { base: "#665c54" },
  text: {
    base: "#ebdbb2",
    muted: "#bdae93",
    faint: "#928374",
    feedback: {
      success: { base: "#b8bb26", muted: "#b8bb26" },
      warning: { base: "#fabd2f", muted: "#fabd2f" },
      error: { base: "#fb4934", muted: "#fb4934" },
    },
  },
  categorical: [
    { 300: "#a8d8d0", 500: "#83a598" },
    { 300: "#e8b8c8", 500: "#d3869b" },
    { 300: "#c8e8b8", 500: "#8ec07c" },
    { 300: "#f8d0a8", 500: "#fe8019" },
  ],
};

const repo = process.cwd();
const config = JSON.parse(await readFile(join(repo, "engine", "example-graph.json"), "utf8"));
const baseHistory = [
  { seq: 1, at: "2026-10-30T13:59:58.000Z", kind: "queued", dispatchId: "d-1", workflow: "build-review", node: "implement" },
  { seq: 2, at: "2026-10-30T13:59:59.000Z", kind: "dispatched", dispatchId: "d-1", workflow: "build-review", node: "implement" },
  { seq: 3, at: "2026-10-30T13:59:59.200Z", kind: "step", dispatchId: "d-1", workflow: "build-review", node: "implement", phase: "begin" },
  { seq: 4, at: "2026-10-30T14:00:31.000Z", kind: "step", dispatchId: "d-1", workflow: "build-review", node: "implement", phase: "end", outcome: "succeeded", label: "next" },
  { seq: 5, at: "2026-10-30T14:00:31.100Z", kind: "handoff", dispatchId: "d-1", workflow: "build-review", from: "implement", to: "review", label: "next" },
  { seq: 6, at: "2026-10-30T14:00:31.200Z", kind: "step", dispatchId: "d-1", workflow: "build-review", node: "review", phase: "begin" },
];

const activeRuntime = {
  paused: false,
  active: {
    dispatchId: "d-1",
    node: "review",
    workflow: "build-review",
    state: "running",
    visits: { implement: 1, review: 1 },
    usage: { cost: 0.0182, tokens: { input: 1840, output: 612 } },
    startedAt: "2026-10-30T14:00:31.200Z",
  },
  queue: [
    {
      dispatchId: "d-2",
      node: "implement",
      workflow: "build-review",
      state: "queued",
      visits: {},
      usage: { cost: 0, tokens: { input: 0, output: 0 } },
    },
  ],
  lastDefect: null,
  lastEvent: { kind: "step", phase: "begin", node: "review", at: "2026-10-30T14:00:31.200Z" },
  history: baseHistory,
  historyEpoch: "proof-boot",
};

const idleHistory = [
  ...baseHistory,
  { seq: 7, at: "2026-10-30T14:01:19.000Z", kind: "step", dispatchId: "d-1", workflow: "build-review", node: "review", phase: "end", outcome: "succeeded", label: "pass" },
  { seq: 8, at: "2026-10-30T14:01:19.100Z", kind: "handoff", dispatchId: "d-1", workflow: "build-review", from: "review", to: "done", label: "pass" },
  { seq: 9, at: "2026-10-30T14:01:19.200Z", kind: "step", dispatchId: "d-1", workflow: "build-review", node: "done", phase: "begin" },
  { seq: 10, at: "2026-10-30T14:01:21.000Z", kind: "step", dispatchId: "d-1", workflow: "build-review", node: "done", phase: "end", outcome: "succeeded", label: null },
  { seq: 11, at: "2026-10-30T14:01:21.100Z", kind: "completion", dispatchId: "d-1", workflow: "build-review", status: "completed", terminal: "done" },
];
const idleRuntime = {
  paused: false,
  active: null,
  queue: [],
  lastDefect: null,
  lastEvent: { kind: "completion", dispatchId: "d-1", status: "completed", terminal: "done", at: "2026-10-30T14:01:21.100Z" },
  history: idleHistory,
  historyEpoch: "proof-boot",
};

const info = { ok: true, version: "1.3.0", valid: true, configPath: "engine/example-graph.json" };
const cases = [
  {
    name: "history-active-160x50",
    width: 160,
    height: 50,
    data: { config, info, runtime: activeRuntime, fetchedAt: new Date("2026-10-30T14:00:35.000Z") },
  },
  {
    name: "history-idle-160x50",
    width: 160,
    height: 50,
    data: { config, info, runtime: idleRuntime, fetchedAt: new Date("2026-10-30T14:01:22.000Z") },
  },
  {
    name: "history-active-120x40",
    width: 120,
    height: 40,
    data: { config, info, runtime: activeRuntime, fetchedAt: new Date("2026-10-30T14:00:35.000Z") },
  },
  {
    name: "history-strip-80x24",
    width: 80,
    height: 24,
    data: { config, info, runtime: activeRuntime, fetchedAt: new Date("2026-10-30T14:00:35.000Z") },
  },
];

const captures = join(repo, "dashboard", "proof", "captures");
await mkdir(captures, { recursive: true });

for (const entry of cases) {
  Date.now = () => entry.data.fetchedAt.getTime();
  const renderer = await testRender(
    () => (
      <DashboardView
        dashboard={() => entry.data}
        error={() => null}
        width={() => entry.width}
        height={() => entry.height}
        theme={theme}
      />
    ),
    { width: entry.width, height: entry.height },
  );
  await renderer.renderOnce();
  await new Promise((resolve) => setTimeout(resolve, 150));
  await renderer.renderOnce();
  const frame = renderer.captureCharFrame();
  await writeFile(join(captures, `${entry.name}.txt`), frame, "utf8");
  console.log(`captured ${entry.name} (${frame.length} chars)`);
  await renderer.dispose();
}
