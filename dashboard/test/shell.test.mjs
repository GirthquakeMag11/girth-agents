import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tui = await readFile(new URL("../src/tui.tsx", import.meta.url), "utf8");
const view = await readFile(new URL("../src/view.tsx", import.meta.url), "utf8");

test("shell: escape closes the panel and the palette opens it fullscreen", () => {
  assert.match(tui, /id: "graph-dashboard\.close", bind: "escape"/);
  assert.match(tui, /panel\.open\(PANEL, \{ presentation: "fullscreen" \}\)/);
});

test("shell: every text element declares an explicit wrap policy", () => {
  const tags = view.match(/<text\b[^>]*>/gs) ?? [];
  assert.ok(tags.length > 0);
  for (const tag of tags) {
    assert.match(tag, /wrapMode="(none|word)"/, `text without an explicit wrap policy: ${tag}`);
  }
  const wordWrapped = tags.filter((tag) => tag.includes('wrapMode="word"'));
  assert.ok(wordWrapped.length > 0, "Details brief/objective fields may wrap deliberately");
  assert.ok(wordWrapped.length < tags.length, "most chrome must not wrap");
});

test("shell: the responsive shell drives the pane and console visibility", () => {
  assert.match(view, /responsiveLayout\(width\(\), height\(\)\)/);
  assert.match(view, /showOutline\(\)/);
  assert.match(view, /split\(\)/);
  assert.match(view, /showHistoryStrip\(\)/);
  assert.match(view, /consoleHeight\(\)/);
  assert.doesNotMatch(view, /node-select|selectNode|selectedNode/);
  assert.doesNotMatch(tui, /node-select|selectNode|selectedNode/);
});

test("shell: Details is driven only by live active entries", () => {
  assert.match(view, /liveDetails\(props\.config\(\), actives\(\)\)/);
  assert.doesNotMatch(view, /detailsNode|No nodes\./);
  assert.doesNotMatch(view, /first queued|else review/i);
});

test("shell: History is rendered in a pane and a one-line strip", () => {
  assert.match(view, /function HistoryPane/);
  assert.match(view, /function HistoryStrip/);
  assert.match(view, /historyEmptyText/);
  assert.match(view, /historyStripText/);
  const start = view.indexOf("function HistoryPane");
  const end = view.indexOf("function HistoryStrip", start);
  const historyPane = view.slice(start, end);
  assert.doesNotMatch(historyPane, /pulse|animate|setInterval|createSignal/);
});

test("shell: workflow containers are static and the node/connector motion uses native pieces", () => {
  assert.match(view, /titleColor=\{props\.tone\}/);
  assert.match(view, /borderColor=\{props\.tone\}/);
  assert.match(view, /fg=\{props\.tone\}/);
  assert.doesNotMatch(view, /categoricalPulse|containerPulses|nodePulseTone|raised\.max/);
  assert.match(view, /sweepCells\(card\.x, card\.width, props\.tick \* 50\)/);
  assert.match(view, /nodeSweeps\(state\.color, card\.width\)/);
  assert.match(view, /runnerToken\(props\.runner, props\.routes, Date\.now\(\)\)/);
  assert.match(view, /advanceHistoryCursor/);
  assert.match(view, /runnerRemaining\(current\.start\)/);
  assert.match(view, /setRunner\(null\)/);
  assert.match(view, /clearInterval\(motionTimer\)/);
  assert.doesNotMatch(view, /setTimeout\(\(\) => setRunner/);
  assert.match(view, /const token = \(\) =>/);
  assert.match(view, /visible=\{Boolean\(token\(\)\)\}/);
  assert.match(view, /token\(\)\?\.point\.x/);

  const containerStart = view.indexOf("function WorkflowContainer");
  const containerEnd = view.indexOf("function runnerTone", containerStart);
  const container = view.slice(containerStart, containerEnd);
  assert.doesNotMatch(container, /props\.tick|runner|pulse|animate|setInterval|borderTone/);

  const nodeStart = view.indexOf("function NodeCard");
  const nodeEnd = view.indexOf("function Connector", nodeStart);
  const node = view.slice(nodeStart, nodeEnd);
  assert.doesNotMatch(node, /tick|pulse|sweep|runner|raised\.max/);
  assert.match(node, /props\.theme\.background\.raised\.high/);
  assert.match(node, /props\.theme\.background\.raised\.base/);
  assert.match(node, /border\s+borderStyle="rounded"/);
  assert.doesNotMatch(node, /━━/);

  const connectorStart = view.indexOf("function Connector(props");
  const connectorEnd = view.indexOf("function WorkflowContainer", connectorStart);
  const connector = view.slice(connectorStart, connectorEnd);
  assert.doesNotMatch(connector, /props\.tick|runner|pulse|animate|setInterval/);
});
