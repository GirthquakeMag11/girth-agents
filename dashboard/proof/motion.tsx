import { testRender } from "@opentui/solid";
import { createSignal } from "solid-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DashboardView } from "../src/view.tsx";

const theme = {
  background: { base: "#1d2021", raised: { base: "#282828", high: "#3c3836", max: "#504945" } },
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
  ],
};

const repo = process.cwd();
const captures = join(repo, "dashboard", "proof", "captures");
await mkdir(captures, { recursive: true });
const product = JSON.parse(await readFile(join(repo, "engine", "example-graph.json"), "utf8"));
const baseHistory = [{ seq: 1, at: "2026-10-30T14:00:00.000Z", kind: "queued", dispatchId: "d-1", workflow: "build-review", node: "implement" }];

const productData = {
  config: product,
  info: { ok: true, version: "1.3.0", valid: true, configPath: "engine/example-graph.json" },
  runtime: {
    active: {
      dispatchId: "d-1",
      node: "review",
      workflow: "build-review",
      state: "running",
      visits: { review: 1 },
      usage: { cost: 0.1, tokens: { input: 1, output: 1 } },
      startedAt: "2026-10-30T14:00:01.000Z",
    },
    queue: [],
    lastDefect: null,
    lastEvent: null,
    history: baseHistory,
    historyEpoch: "motion-boot",
  },
  fetchedAt: new Date("2026-10-30T14:00:02.000Z"),
};

const [data, setData] = createSignal(productData);
const productRenderer = await testRender(
  () => <DashboardView dashboard={data} error={() => null} width={() => 160} height={() => 50} theme={theme} />,
  { width: 160, height: 50 },
);
await productRenderer.renderOnce();
setData({
  ...productData,
  runtime: {
    ...productData.runtime,
    history: [
      ...baseHistory,
      {
        seq: 2,
        at: "2026-10-30T14:00:03.000Z",
        kind: "handoff",
        dispatchId: "d-1",
        workflow: "build-review",
        from: "review",
        to: "implement",
        label: "fail",
      },
    ],
  },
});
await new Promise((resolve) => setTimeout(resolve, 120));
await productRenderer.renderOnce();
const productFrame = productRenderer.captureCharFrame();
await writeFile(join(captures, "motion-runner-160x50.txt"), productFrame, "utf8");
await productRenderer.dispose();
if (!productFrame.includes("◆")) throw new Error("handoff runner token is not visible");

const selfGraph = {
  graph: {
    outputRoot: "work",
    workflows: [{ id: "self", entry: "a", exit: "a", nodes: ["a"], connections: [], strict: false }],
    nodes: [
      {
        id: "a",
        helper: "builder",
        objective: "Self-handoff demo.",
        output: "a.md",
        handoff: { mode: "conditional", labels: [{ label: "again", to: "a" }] },
      },
    ],
  },
};
const selfData = {
  ...productData,
  config: selfGraph,
  runtime: {
    ...productData.runtime,
    active: { ...productData.runtime.active, node: "a", workflow: "self" },
    history: [{ seq: 1, at: "2026-10-30T14:00:00.000Z", kind: "queued", dispatchId: "d-2", workflow: "self", node: "a" }],
    historyEpoch: "self-boot",
  },
};
const [selfSignal, setSelf] = createSignal(selfData);
const selfRenderer = await testRender(
  () => <DashboardView dashboard={selfSignal} error={() => null} width={() => 160} height={() => 50} theme={theme} />,
  { width: 160, height: 50 },
);
await selfRenderer.renderOnce();
setSelf({
  ...selfData,
  runtime: {
    ...selfData.runtime,
    history: [
      ...selfData.runtime.history,
      {
        seq: 2,
        at: "2026-10-30T14:00:03.000Z",
        kind: "handoff",
        dispatchId: "d-2",
        workflow: "self",
        from: "a",
        to: "a",
        label: "again",
      },
    ],
  },
});
await new Promise((resolve) => setTimeout(resolve, 120));
await selfRenderer.renderOnce();
const selfFrame = selfRenderer.captureCharFrame();
await writeFile(join(captures, "motion-self-160x50.txt"), selfFrame, "utf8");
await selfRenderer.dispose();
if (selfFrame.includes("◆")) throw new Error("self-handoff must not render a runner token");

console.log("PASS  handoff runner visible; self-handoff has no token");
