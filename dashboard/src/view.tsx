import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/solid";
import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { layoutGraph } from "./layout.mjs";
import { advanceHistoryCursor, nextRunner, nodeSweeps, runnerRemaining, runnerToken, runnerToneKey, sweepCells } from "./motion.mjs";
import { responsiveLayout } from "./responsive.mjs";
import { historyEmptyText, historyRows, historyStripText, historyToneKey } from "./history.mjs";
import {
  edgeColor,
  edgeList,
  engagementModel,
  liveDetails,
  nodeState,
  topologicalOrder,
  workflowsForNode,
} from "./model.mjs";

export type Theme = any;
type ConfigNode = {
  id: string;
  helper: string;
  objective: string;
  output: string;
  maxVisits?: number | null;
  handoff:
    | { mode: "terminal" }
    | { mode: "unconditional"; to: string; resume?: boolean }
    | { mode: "conditional"; labels: Array<{ label: string; to: string; resume?: boolean }> };
};
type Workflow = { id: string; entry: string; exit: string; nodes: string[]; connections?: string[]; strict?: boolean };
type Config = { graph: { outputRoot?: string; workflows?: Workflow[]; nodes: ConfigNode[] } };
type GraphInfo = { ok: boolean; version: string; valid: boolean; configPath: string };
type DispatchStatus = {
  dispatchId: string;
  node: string;
  workflow?: string | null;
  state: string;
  visits?: Record<string, number>;
  usage?: { cost: number; tokens: { input: number; output: number } };
  output?: { path?: string } | null;
  startedAt?: string | null;
  defect?: { code?: string; message?: string } | null;
};
type RuntimeEvent = { kind?: string; at?: string; node?: string; phase?: string; outcome?: string; status?: string };
type HistoryEntry = {
  seq?: number;
  at?: string;
  kind?: string;
  dispatchId?: string | null;
  workflow?: string | null;
  node?: string | null;
  phase?: string | null;
  outcome?: string | null;
  label?: string | null;
  from?: string | null;
  to?: string | null;
  status?: string | null;
  terminal?: string | null;
  code?: string | null;
  valid?: boolean | null;
};
type Runtime = {
  paused?: boolean;
  active: DispatchStatus | null;
  queue: DispatchStatus[];
  lastDefect?: { code?: string; message?: string; at?: string } | null;
  lastEvent?: RuntimeEvent | null;
  history?: HistoryEntry[];
  historyEpoch?: string;
};
export type Dashboard = { config: Config; info: GraphInfo; runtime: Runtime; fetchedAt: Date };
type Segment = { x: number; y: number; width: number; height: number; sides: Array<"top" | "right" | "bottom" | "left"> };
type Mark = { x: number; y: number; glyph: string };
type Chip = { x: number; y: number; text: string; width: number };
type Route = {
  key: string;
  from: string;
  to: string;
  labelText: string;
  resume: boolean;
  segments: Segment[];
  marks: Mark[];
  arrows: Mark[];
  tick: Mark;
  label: Chip;
  runnerPath: Array<{ x: number; y: number }>;
  self: boolean;
};
type Card = { id: string; x: number; y: number; width: number; height: number };
type Runner = { from: string; to: string; label: string; start: number };
type Container =
  | {
      workflowId: string;
      kind: "box";
      state: "active" | "queued";
      primary: boolean;
      nodeIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
    }
  | {
      workflowId: string;
      kind: "rail";
      state: "active" | "queued";
      primary: boolean;
      nodeIds: string[];
      x: number;
      y: number;
      width: number;
      height: number;
      ticks: Segment[];
      label: Chip;
    };
type Escape = { dispatchId?: string; node: string; mainWorkflow: string; allowed: string[]; memberships: string[] };
type Engagement = { containers: Container[]; escapes: Escape[]; activeNodes: string[]; queuedNodes: string[] };
type Layout = { width: number; height: number; cards: Card[]; routes: Route[]; containers: Container[] };

function outputPath(config: Config, node: ConfigNode) {
  const root = config.graph.outputRoot ?? ".";
  return root === "." ? node.output : `${root}/${node.output}`;
}

function handoffLines(node: ConfigNode) {
  if (node.handoff.mode === "terminal") return ["terminal"];
  if (node.handoff.mode === "unconditional") {
    return [`next → ${node.handoff.to}${node.handoff.resume ? " · resume" : ""}`];
  }
  return node.handoff.labels.map((entry) => `${entry.label} → ${entry.to}${entry.resume ? " · resume" : ""}`);
}

function tokens(usage?: DispatchStatus["usage"]) {
  if (!usage) return 0;
  return usage.tokens.input + usage.tokens.output;
}

function formatTokens(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}

function elapsed(status?: DispatchStatus | null) {
  if (!status?.startedAt) return "00:00";
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(status.startedAt)) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function clock(value?: string | Date | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour12: false });
}

function identity(info: GraphInfo) {
  const file = info.configPath.split(/[\\/]/).pop() || "graph";
  return file.length > 28 ? `${file.slice(0, 27)}…` : file;
}

function stateColor(theme: Theme, color: string) {
  if (color === "running") return theme.text.feedback.success.base;
  if (color === "queued") return theme.text.feedback.warning.base;
  if (color === "terminal") return theme.text.faint;
  return theme.text.muted;
}

function edgeTone(theme: Theme, label: string) {
  const color = edgeColor(label);
  if (color === "pass") return theme.text.feedback.success.base;
  if (color === "fail") return theme.text.feedback.error.base;
  return theme.text.muted;
}

function workflowTone(theme: Theme, index: number) {
  return theme.categorical[index % theme.categorical.length]?.[500] ?? theme.text.muted;
}

function workflowState(workflow: Workflow, engagement: Engagement) {
  const container = engagement.containers.find((entry) => entry.workflowId === workflow.id);
  if (!container) return { marker: "○", label: "idle", color: "idle" };
  if (container.state === "queued") return { marker: "◌", label: "queued", color: "queued" };
  return { marker: "●", label: container.kind === "main" ? "main" : "connected", color: "running" };
}

function Header(props: {
  info: () => GraphInfo;
  config: () => Config;
  runtime: () => Runtime;
  width: () => number;
  theme: Theme;
}) {
  const stacked = () => responsiveLayout(props.width(), 1).headerStacked;
  const active = () => props.runtime().active;
  const engine = () => (props.runtime().paused ? "paused" : active() ? "live" : "idle");
  const engineColor = () =>
    props.runtime().paused
      ? props.theme.text.feedback.warning.base
      : active()
        ? props.theme.text.feedback.success.base
        : props.theme.text.muted;
  const workflows = () => props.config().graph.workflows?.length ?? 0;
  const nodes = () => props.config().graph.nodes.length;
  const counts = () => `${workflows()} workflow${workflows() === 1 ? "" : "s"} · ${nodes()} nodes`;
  const validity = () => (props.info().valid ? "valid" : "invalid");
  const validityColor = () =>
    props.info().valid ? props.theme.text.muted : props.theme.text.feedback.error.base;

  return (
    <box
      height={stacked() ? 4 : 2}
      flexDirection="column"
      border={["bottom"]}
      borderColor={props.theme.border.base}
      paddingLeft={2}
      paddingRight={2}
      flexShrink={0}
      overflow="hidden"
    >
      <Show
        when={stacked()}
        fallback={
          <box flexDirection="row" justifyContent="space-between" minWidth={0}>
            <text fg={props.theme.text.base} attributes={TextAttributes.BOLD} wrapMode="none" truncate>
              {identity(props.info())}
            </text>
            <box flexDirection="row" gap={2} flexShrink={0}>
              <text fg={props.theme.text.muted} wrapMode="none" truncate>
                {counts()}
              </text>
              <text fg={engineColor()} wrapMode="none" truncate>
                ● {engine()}
              </text>
              <text fg={validityColor()} wrapMode="none" truncate>
                {validity()}
              </text>
              <text fg={props.theme.text.muted} wrapMode="none" truncate>
                v{props.info().version}
              </text>
              <text fg={props.theme.text.faint} wrapMode="none" truncate>
                read-only · esc to close
              </text>
            </box>
          </box>
        }
      >
        <box flexDirection="row" justifyContent="space-between" minWidth={0}>
          <text fg={props.theme.text.base} attributes={TextAttributes.BOLD} wrapMode="none" truncate>
            {identity(props.info())}
          </text>
          <text fg={props.theme.text.faint} wrapMode="none" truncate>
            read-only · esc to close
          </text>
        </box>
        <box flexDirection="row" gap={2}>
          <text fg={props.theme.text.muted} wrapMode="none" truncate>
            {counts()}
          </text>
          <text fg={engineColor()} wrapMode="none" truncate>
            ● {engine()}
          </text>
        </box>
        <box flexDirection="row" gap={2}>
          <text fg={validityColor()} wrapMode="none" truncate>
            {validity()}
          </text>
          <text fg={props.theme.text.muted} wrapMode="none" truncate>
            v{props.info().version}
          </text>
        </box>
      </Show>
    </box>
  );
}

function Outline(props: {
  workflows: () => Workflow[];
  nodes: () => ConfigNode[];
  edges: () => Array<{ from: string; to: string; label: string; resume: boolean; key: string }>;
  runtime: () => Runtime;
  engagement: () => Engagement;
  width: number;
  visible?: boolean;
  theme: Theme;
}) {
  const actives = () => (props.runtime().active ? [props.runtime().active!] : []);
  const queue = () => props.runtime().queue;
  const shared = (id: string) => workflowsForNode(props.workflows(), id).length > 1;
  const anyShared = () => props.nodes().some((node) => shared(node.id));
  const counts = () => ({
    running: actives().length,
    queued: queue().length,
  });

  return (
    <box
      width={props.width}
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={props.theme.border.base}
      backgroundColor={props.theme.background.raised.base}
      title="Outline"
      titleColor={props.theme.text.muted}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
      visible={props.visible ?? true}
    >
      <scrollbox flexGrow={1} minHeight={0}>
        <box flexDirection="column" gap={1}>
          <box flexDirection="column">
            <text fg={props.theme.text.faint} wrapMode="none">
              WORKFLOWS
            </text>
            <Show when={props.workflows().length > 0} fallback={<text fg={props.theme.text.faint} wrapMode="none">none</text>}>
              <For each={props.workflows()}>
                {(workflow) => {
                  const state = () => workflowState(workflow, props.engagement());
                  return (
                    <text fg={stateColor(props.theme, state().color)} wrapMode="none" truncate>
                      {state().marker} {workflow.id}
                    </text>
                  );
                }}
              </For>
            </Show>
          </box>
          <box flexDirection="column">
            <text fg={props.theme.text.faint} wrapMode="none">
              NODES
            </text>
            <For each={props.nodes()}>
              {(node) => {
                const state = () => nodeState(node, actives(), queue());
                return (
                  <text fg={stateColor(props.theme, state().color)} wrapMode="none" truncate>
                    {state().marker} {node.id}
                    {shared(node.id) ? " *" : ""}
                  </text>
                );
              }}
            </For>
            <text fg={props.theme.text.faint} wrapMode="none" visible={anyShared()}>
              * shared
            </text>
          </box>
          <box flexDirection="column">
            <text fg={props.theme.text.faint} wrapMode="none">
              STATE
            </text>
            <text fg={props.theme.text.muted} wrapMode="none">
              ● running {counts().running}
            </text>
            <text fg={props.theme.text.muted} wrapMode="none">
              ◌ queued {counts().queued}
            </text>
            <text fg={props.theme.text.muted} wrapMode="none">
              ○ idle {Math.max(0, props.nodes().length - counts().running - counts().queued)}
            </text>
          </box>
          <box flexDirection="column">
            <text fg={props.theme.text.faint} wrapMode="none">
              GRAPH
            </text>
            <text fg={props.theme.text.muted} wrapMode="none" truncate>
              {props.workflows().length}wf · {props.nodes().length}n · {props.edges().length} links
            </text>
          </box>
        </box>
      </scrollbox>
    </box>
  );
}

function NodeCard(props: {
  node: ConfigNode;
  card: Card;
  runtime: () => Runtime;
  escaped: boolean;
  theme: Theme;
}) {
  const actives = () => (props.runtime().active ? [props.runtime().active!] : []);
  const state = () => nodeState(props.node, actives(), props.runtime().queue);
  return (
    <box
      position="absolute"
      left={props.card.x}
      top={props.card.y}
      width={props.card.width}
      height={props.card.height}
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={stateColor(props.theme, state().color)}
      backgroundColor={
        state().color === "running" ? props.theme.background.raised.high : props.theme.background.raised.base
      }
      paddingLeft={2}
      paddingRight={2}
      flexShrink={0}
      overflow="hidden"
    >
      <box flexDirection="row" justifyContent="space-between">
        <text
          fg={state().color === "running" ? props.theme.text.base : props.theme.text.muted}
          attributes={state().color === "running" ? TextAttributes.BOLD : 0}
          wrapMode="none"
          truncate
        >
          {props.node.id}
        </text>
        <text fg={stateColor(props.theme, state().color)} wrapMode="none" truncate>
          {state().marker} {state().label}
        </text>
      </box>
      <box flexDirection="row" justifyContent="space-between" minWidth={0}>
        <text fg={state().color === "running" ? props.theme.text.muted : props.theme.text.faint} wrapMode="none" truncate>
          {props.node.helper}
        </text>
        <text fg={props.theme.text.feedback.warning.base} wrapMode="none" truncate visible={props.escaped}>
          ⚠ escape
        </text>
      </box>
    </box>
  );
}

function Connector(props: { route: Route; theme: Theme }) {
  const tone = () => edgeTone(props.theme, props.route.labelText);
  return (
    <>
      <For each={props.route.segments}>
        {(segment) => (
          <box
            position="absolute"
            left={segment.x}
            top={segment.y}
            width={segment.width}
            height={segment.height}
            border={segment.sides}
            borderColor={tone()}
            flexShrink={0}
          />
        )}
      </For>
      <For each={props.route.marks}>
        {(mark) => (
          <text position="absolute" left={mark.x} top={mark.y} fg={tone()} wrapMode="none">
            {mark.glyph}
          </text>
        )}
      </For>
      <For each={props.route.arrows}>
        {(arrow) => (
          <text position="absolute" left={arrow.x} top={arrow.y} fg={tone()} wrapMode="none">
            {arrow.glyph}
          </text>
        )}
      </For>
      <text position="absolute" left={props.route.tick.x} top={props.route.tick.y} fg={tone()} wrapMode="none">
        {props.route.tick.glyph}
      </text>
      <box
        position="absolute"
        left={props.route.label.x}
        top={props.route.label.y}
        backgroundColor={props.theme.background.raised.high}
        paddingLeft={1}
        paddingRight={1}
        flexShrink={0}
      >
        <text fg={tone()} wrapMode="none">
          {props.route.label.text}
        </text>
      </box>
    </>
  );
}

function WorkflowContainer(props: { container: Container; tone: string; theme: Theme }) {
  if (props.container.kind === "box") {
    return (
      <box
        position="absolute"
        left={props.container.x}
        top={props.container.y}
        width={props.container.width}
        height={props.container.height}
        border
        borderStyle={props.container.primary ? "double" : "single"}
        borderColor={props.tone}
        title={props.container.label}
        titleColor={props.tone}
        flexShrink={0}
      />
    );
  }
  return (
    <>
      <box
        position="absolute"
        left={props.container.x}
        top={props.container.y}
        width={props.container.width}
        height={props.container.height}
        border={["left"]}
        borderStyle={props.container.primary ? "double" : "single"}
        borderColor={props.tone}
        flexShrink={0}
      />
      <For each={props.container.ticks}>
        {(tick) => (
          <box
            position="absolute"
            left={tick.x}
            top={tick.y}
            width={tick.width}
            height={tick.height}
            border={tick.sides}
            borderColor={props.tone}
            flexShrink={0}
          />
        )}
      </For>
      <box
        position="absolute"
        left={props.container.label.x}
        top={props.container.label.y}
        backgroundColor={props.theme.background.raised.high}
        paddingLeft={1}
        paddingRight={1}
        flexShrink={0}
      >
        <text fg={props.tone} wrapMode="none">
          {props.container.label.text}
        </text>
      </box>
    </>
  );
}

function runnerTone(theme: Theme, label: string) {
  const key = runnerToneKey(label);
  if (key === "success") return theme.text.feedback.success.base;
  if (key === "error") return theme.text.feedback.error.base;
  if (key === "muted") return theme.text.muted;
  return theme.text.faint;
}

function ConnectorRunner(props: { runner: Runner | null; routes: Route[]; tick: number; theme: Theme }) {
  const token = () => {
    props.tick;
    return runnerToken(props.runner, props.routes, Date.now());
  };
  return (
    <text
      position="absolute"
      left={token()?.point.x ?? 0}
      top={token()?.point.y ?? 0}
      fg={token() ? runnerTone(props.theme, token().label) : props.theme.text.faint}
      wrapMode="none"
      zIndex={20}
      visible={Boolean(token())}
    >
      ◆
    </text>
  );
}

function GraphPane(props: {
  nodes: () => ConfigNode[];
  edges: () => Array<{ from: string; to: string; label: string; resume: boolean; key: string }>;
  order: () => { order: string[]; back: Set<string> };
  runtime: () => Runtime;
  workflows: () => Workflow[];
  containers: () => Container[];
  escaped: (id: string) => boolean;
  tick: number;
  runner: Runner | null;
  width: () => number;
  theme: Theme;
}) {
  const layout = createMemo(
    () =>
      layoutGraph(props.nodes(), props.edges(), props.order().order, props.width(), {
        nodeWidth: 34,
        nodeHeight: 4,
        gap: 4,
        containers: props.containers(),
      }) as Layout,
  );
  const nodeById = (id: string) => props.nodes().find((node) => node.id === id);
  let scroll: any;
  const focusCard = () => {
    const node = props.runtime().active?.node ?? props.runtime().queue[0]?.node;
    return node ? layout().cards.find((card) => card.id === node) : undefined;
  };
  const scrollToFocus = () => {
    const card = focusCard();
    if (scroll && card) scroll.scrollTo({ x: 0, y: Math.max(0, card.y - 2) });
  };
  createEffect(() => {
    focusCard();
    const timer = setTimeout(scrollToFocus, 100);
    onCleanup(() => clearTimeout(timer));
  });
  const containerTone = (container: Container) => {
    if (container.state === "queued") return props.theme.text.feedback.warning.base;
    const index = props.workflows().findIndex((workflow) => workflow.id === container.workflowId);
    return workflowTone(props.theme, Math.max(0, index));
  };
  const actives = () => (props.runtime().active ? [props.runtime().active!] : []);
  const queue = () => props.runtime().queue;

  return (
    <box
      flexGrow={1}
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={props.theme.border.base}
      backgroundColor={props.theme.background.raised.base}
      title="Graph"
      titleColor={props.theme.text.muted}
      paddingLeft={1}
      paddingRight={1}
      minWidth={0}
      overflow="hidden"
    >
      <scrollbox
        flexGrow={1}
        minHeight={0}
        ref={(element) => {
          scroll = element;
          setTimeout(scrollToFocus, 100);
        }}
      >
        <box position="relative" width={layout().width} height={layout().height}>
          <For each={layout().containers}>
            {(container) => (
              <WorkflowContainer container={container} tone={containerTone(container)} theme={props.theme} />
            )}
          </For>
          <For each={layout().routes}>{(route) => <Connector route={route} theme={props.theme} />}</For>
          <For each={layout().cards}>
            {(card) => {
              const node = nodeById(card.id);
              if (!node) return null;
              return (
                <NodeCard
                  node={node}
                  card={card}
                  runtime={props.runtime}
                  escaped={props.escaped(card.id)}
                  theme={props.theme}
                />
              );
            }}
          </For>
          <For each={layout().cards}>
            {(card) => {
              const node = nodeById(card.id);
              if (!node) return null;
              const state = nodeState(node, actives(), queue());
              const sweep = () => (nodeSweeps(state.color, card.width) ? sweepCells(card.x, card.width, props.tick * 50) : null);
              return (
                <text
                  position="absolute"
                  left={sweep()?.x ?? 0}
                  top={card.y + (sweep()?.yOffset ?? 0)}
                  fg={props.theme.text.feedback.success.base}
                  wrapMode="none"
                  visible={Boolean(sweep())}
                >
                  {sweep()?.glyph ?? "━━"}
                </text>
              );
            }}
          </For>
          <ConnectorRunner runner={props.runner} routes={layout().routes} tick={props.tick} theme={props.theme} />
        </box>
      </scrollbox>
    </box>
  );
}

function DetailsPane(props: {
  config: () => Config;
  workflows: () => Workflow[];
  runtime: () => Runtime;
  engagement: () => Engagement;
  width: number;
  height?: number;
  visible?: boolean;
  theme: Theme;
}) {
  const actives = () => (props.runtime().active ? [props.runtime().active!] : []);
  const entries = () => liveDetails(props.config(), actives());
  const membershipTone = (member: { workflowId: string; state: string }) => {
    if (member.state === "queued") return props.theme.text.feedback.warning.base;
    if (member.state === "inactive") return props.theme.text.muted;
    const index = props.workflows().findIndex((workflow) => workflow.id === member.workflowId);
    return workflowTone(props.theme, Math.max(0, index));
  };
  const membershipMarker = (state: string) => (state === "active" ? "●" : state === "queued" ? "◌" : "○");

  return (
    <box
      width={props.width}
      height={props.height}
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={props.theme.border.base}
      backgroundColor={props.theme.background.raised.base}
      title="Details"
      titleColor={props.theme.text.muted}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
      visible={props.visible ?? true}
    >
      <scrollbox flexGrow={1} minHeight={0}>
        <For each={entries()}>
          {(entry, index) => {
            const state = () => nodeState(entry.node, actives(), []);
            const escape = () => props.engagement().escapes.find((item) => item.node === entry.node.id);
            return (
              <box flexDirection="column" gap={1}>
                <box
                  height={1}
                  flexShrink={0}
                  border={["top"]}
                  borderColor={props.theme.border.base}
                  visible={index() > 0}
                />
                <box flexDirection="column">
                  <text fg={props.theme.text.base} attributes={TextAttributes.BOLD} wrapMode="none">
                    {entry.node.id}
                  </text>
                  <text fg={stateColor(props.theme, state().color)} wrapMode="none">
                    {state().marker} {state().label} · {entry.node.helper}
                  </text>
                </box>
                <box flexDirection="column">
                  <text fg={props.theme.text.faint} wrapMode="none">
                    CONTRACT
                  </text>
                  <text fg={props.theme.text.muted} wrapMode="word">
                    output  {outputPath(props.config(), entry.node)}
                  </text>
                  <text fg={props.theme.text.muted} wrapMode="none">
                    max     {entry.node.maxVisits ?? "—"} visits
                  </text>
                  <text fg={props.theme.text.muted} wrapMode="none">
                    visits  {entry.dispatch.visits?.[entry.node.id] ?? 0}/{entry.node.maxVisits ?? "—"}
                  </text>
                  <For each={handoffLines(entry.node)}>
                    {(line) => (
                      <text fg={props.theme.text.muted} wrapMode="word">
                        {line}
                      </text>
                    )}
                  </For>
                </box>
                <box flexDirection="column">
                  <text fg={props.theme.text.faint} wrapMode="none">
                    BRIEF
                  </text>
                  <text fg={props.theme.text.muted} wrapMode="word">
                    {entry.node.objective}
                  </text>
                </box>
                <box flexDirection="column">
                  <text fg={props.theme.text.faint} wrapMode="none">
                    WORKFLOWS
                  </text>
                  <Show
                    when={entry.memberships.length > 0}
                    fallback={
                      <text fg={props.theme.text.faint} wrapMode="none">
                        none
                      </text>
                    }
                  >
                    <For each={entry.memberships}>
                      {(member) => (
                        <text fg={membershipTone(member)} wrapMode="none" truncate>
                          {membershipMarker(member.state)} {member.workflowId}
                        </text>
                      )}
                    </For>
                  </Show>
                </box>
                <box flexDirection="column" visible={Boolean(escape())}>
                  <text fg={props.theme.text.faint} wrapMode="none">
                    ESCAPE
                  </text>
                  <text fg={props.theme.text.feedback.warning.base} wrapMode="word">
                    {escape()?.node} left {escape()?.mainWorkflow} and its connections.
                  </text>
                </box>
                <box flexDirection="column">
                  <text fg={props.theme.text.faint} wrapMode="none">
                    RUN
                  </text>
                  <text fg={props.theme.text.muted} wrapMode="word">
                    {entry.dispatch.dispatchId} · {entry.dispatch.state} · {elapsed(entry.dispatch)}
                  </text>
                </box>
                <box flexDirection="column">
                  <text fg={props.theme.text.faint} wrapMode="none">
                    OUTPUT
                  </text>
                  <text fg={props.theme.text.muted} wrapMode="word">
                    {entry.dispatch.output?.path ?? "—"}
                  </text>
                </box>
              </box>
            );
          }}
        </For>
      </scrollbox>
    </box>
  );
}

function DetailsStrip(props: {
  config: () => Config;
  workflows: () => Workflow[];
  runtime: () => Runtime;
  visible?: boolean;
  theme: Theme;
}) {
  const actives = () => (props.runtime().active ? [props.runtime().active!] : []);
  const entries = () => liveDetails(props.config(), actives());
  const first = () => entries()[0];
  const state = () => {
    const entry = first();
    return entry ? nodeState(entry.node, actives(), []) : null;
  };
  const membershipTone = (member: { workflowId: string; state: string }) => {
    if (member.state === "queued") return props.theme.text.feedback.warning.base;
    if (member.state === "inactive") return props.theme.text.muted;
    const index = props.workflows().findIndex((workflow) => workflow.id === member.workflowId);
    return workflowTone(props.theme, Math.max(0, index));
  };
  const membershipMarker = (state: string) => (state === "active" ? "●" : state === "queued" ? "◌" : "○");
  return (
    <box
      height={2}
      flexShrink={0}
      border={["bottom"]}
      borderColor={props.theme.border.base}
      paddingLeft={2}
      paddingRight={2}
      overflow="hidden"
      visible={props.visible ?? true}
    >
      <box flexDirection="row" gap={2}>
        <text fg={props.theme.text.base} attributes={TextAttributes.BOLD} wrapMode="none" truncate>
          Details
        </text>
        <box flexDirection="row" gap={2} visible={Boolean(first())}>
          <text fg={props.theme.text.muted} wrapMode="none" truncate>
            {first()?.node.id ?? ""} · {state()?.marker ?? ""} {state()?.label ?? ""} · {first()?.node.helper ?? ""}
          </text>
          <box flexDirection="row" gap={1}>
            <For each={first()?.memberships ?? []}>
              {(member) => (
                <text fg={membershipTone(member)} wrapMode="none" truncate>
                  {membershipMarker(member.state)}
                  {member.workflowId}
                </text>
              )}
            </For>
          </box>
        </box>
        <text fg={props.theme.text.faint} wrapMode="none" truncate visible={entries().length > 1}>
          +{Math.max(0, entries().length - 1)} more
        </text>
      </box>
    </box>
  );
}

function historyTone(theme: Theme, entry: HistoryEntry) {
  const key = historyToneKey(entry);
  if (key === "success") return theme.text.feedback.success.base;
  if (key === "error") return theme.text.feedback.error.base;
  if (key === "warning") return theme.text.feedback.warning.base;
  if (key === "faint") return theme.text.faint;
  return theme.text.muted;
}

function HistoryPane(props: { history: () => HistoryEntry[]; width: number; height: number; theme: Theme }) {
  const rows = () => historyRows(props.history());
  return (
    <box
      width={props.width}
      height={props.height}
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={props.theme.border.base}
      backgroundColor={props.theme.background.raised.base}
      title="History"
      titleColor={props.theme.text.muted}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
    >
      <scrollbox flexGrow={1} minHeight={0}>
        <Show when={rows().length > 0} fallback={<text fg={props.theme.text.faint} wrapMode="none">{historyEmptyText}</text>}>
          <For each={rows()}>
            {(row) => (
              <text fg={historyTone(props.theme, row.entry)} wrapMode="none" truncate>
                {row.text}
              </text>
            )}
          </For>
        </Show>
      </scrollbox>
    </box>
  );
}

function HistoryStrip(props: { history: () => HistoryEntry[]; visible?: boolean; theme: Theme }) {
  return (
    <box
      height={1}
      flexShrink={0}
      paddingLeft={2}
      paddingRight={2}
      backgroundColor={props.theme.background.base}
      visible={props.visible ?? true}
    >
      <text fg={props.theme.text.muted} wrapMode="none" truncate>
        {historyStripText(props.history())}
      </text>
    </box>
  );
}

function RunConsole(props: { runtime: () => Runtime; height: number; updated: () => Date | undefined; theme: Theme }) {
  const active = () => props.runtime().active;
  const queue = () => props.runtime().queue;
  const usage = () => active()?.usage;
  const event = () => {
    const last = props.runtime().lastEvent;
    if (!last) return "event    —";
    const parts = [last.kind, last.status ?? last.outcome, last.node, last.at ? clock(last.at) : null].filter(Boolean);
    return `event    ${parts.join(" · ")}`;
  };
  const defect = () => {
    const last = props.runtime().lastDefect;
    return last ? `defect   ${last.code ?? "unknown"}${last.message ? ` · ${last.message}` : ""}` : "defect   none";
  };
  const lines = () => {
    const rows = [
      ["RUN CONSOLE", props.theme.text.faint],
      [
        active()
          ? `active   ● ${active()!.dispatchId} ${active()!.node} · ${active()!.state} · ${elapsed(active())}`
          : "active   idle",
        props.theme.text.muted,
      ],
      [
        queue().length
          ? `queue    ${queue().map((entry) => `◌ ${entry.dispatchId} ${entry.node}`).join("   ")}`
          : "queue    empty",
        props.theme.text.muted,
      ],
      [`cost     $${(usage()?.cost ?? 0).toFixed(4)} · ${formatTokens(tokens(usage()))} tokens`, props.theme.text.muted],
      [defect(), props.theme.text.muted],
      [event(), props.theme.text.muted],
      [`updated  ${clock(props.updated())}`, props.theme.text.faint],
    ];
    return rows.slice(0, Math.max(0, props.height - 1));
  };

  return (
    <box
      height={props.height}
      flexDirection="column"
      border={["top"]}
      borderColor={props.theme.border.base}
      paddingLeft={2}
      paddingRight={2}
      flexShrink={0}
      overflow="hidden"
    >
      <For each={lines()}>
        {(line) => (
          <text fg={line[1]} wrapMode="none" truncate flexShrink={0}>
            {line[0]}
          </text>
        )}
      </For>
    </box>
  );
}

function StatusBar(props: {
  runtime: () => Runtime;
  updated: () => Date | undefined;
  width: () => number;
  theme: Theme;
}) {
  const active = () => props.runtime().active;
  const queue = () => props.runtime().queue;
  const usage = () => active()?.usage;
  const counts = () => `${active() ? 1 : 0} active · ${queue().length} queued · ${props.runtime().lastDefect ? 1 : 0} defects`;
  const stacked = () => responsiveLayout(props.width(), 1).footerStacked;
  return (
    <box
      height={stacked() ? 2 : 1}
      flexDirection="column"
      paddingLeft={2}
      paddingRight={2}
      flexShrink={0}
      overflow="hidden"
    >
      <box flexDirection="row" justifyContent="space-between">
        <text fg={props.theme.text.muted} wrapMode="none" truncate>
          {counts()} · elapsed {elapsed(active())} · updated {clock(props.updated())}
        </text>
        <text fg={props.theme.text.muted} wrapMode="none" truncate visible={!stacked()}>
          ${(usage()?.cost ?? 0).toFixed(4)} · {formatTokens(tokens(usage()))} tokens · read-only · esc to close
        </text>
      </box>
      <text fg={props.theme.text.muted} wrapMode="none" truncate visible={stacked()}>
        ${(usage()?.cost ?? 0).toFixed(4)} · {formatTokens(tokens(usage()))} tokens · read-only · esc to close
      </text>
    </box>
  );
}


export function DashboardView(props: {
  dashboard: () => Dashboard | null;
  error: () => string | null;
  width: () => number;
  height: () => number;
  theme: Theme;
}) {
  const theme = props.theme;
  const [tick, setTick] = createSignal(0);
  const [runner, setRunner] = createSignal<Runner | null>(null);
  let cursor = { epoch: undefined as string | undefined, watermark: 0 };

  onMount(() => {
    const motionTimer = setInterval(() => {
      setTick((value) => value + 1);
      const current = runner();
      if (current && runnerRemaining(current.start) <= 0) setRunner(null);
    }, 50);
    onCleanup(() => clearInterval(motionTimer));
  });

  createEffect(() => {
    const data = props.dashboard();
    if (!data) return;
    const next = advanceHistoryCursor(data.runtime.history ?? [], data.runtime.historyEpoch ?? "", cursor);
    cursor = next.cursor;
    if (next.handoff) {
      setRunner((current) => nextRunner(current, next.handoff));
    } else if (next.reset) {
      setRunner(null);
    }
  });

  const width = () => props.width();
  const height = () => props.height();
  const shell = () => responsiveLayout(width(), height());
  const split = () => shell().split;
  const showOutline = () => shell().showOutline;
  const showDetailsStrip = () => shell().detailsStrip;
  const showHistoryStrip = () => shell().historyStrip;
  const outlineWidth = () => shell().outlineWidth;
  const detailsWidth = () => shell().detailsWidth;
  const detailsHeight = () => shell().detailsHeight;
  const historyHeight = () => shell().historyHeight;
  const consoleHeight = () => shell().consoleHeight;
  const graphWidth = () => shell().graphWidth;
  const config = () => props.dashboard()!.config;
  const info = () => props.dashboard()!.info;
  const runtime = () => props.dashboard()!.runtime;
  const workflows = () => config().graph.workflows ?? [];
  const nodes = () => config().graph.nodes;
  const edges = () => edgeList(config().graph.nodes);
  const order = () => topologicalOrder(config().graph.nodes, edges());
  const engagement = createMemo<Engagement>(() => {
    const data = props.dashboard();
    if (!data) return { containers: [], escapes: [], activeNodes: [], queuedNodes: [] };
    return engagementModel(data.config, data.runtime.active ? [data.runtime.active] : [], data.runtime.queue);
  });
  const escaped = (id: string) => engagement().escapes.some((entry) => entry.node === id);
  const history = () => runtime().history ?? [];
  const fetchedAt = () => props.dashboard()?.fetchedAt;

  return (
    <box width="100%" height="100%" flexDirection="column" backgroundColor={theme.background.base} overflow="hidden">
      <Show
        when={props.dashboard()}
        fallback={
          <box padding={2}>
            <text fg={props.error() ? theme.text.feedback.error.base : theme.text.muted} wrapMode="word">
              {props.error() ?? "Loading graph…"}
            </text>
          </box>
        }
      >
        <Header info={info} config={config} runtime={runtime} width={width} theme={theme} />
        <DetailsStrip config={config} workflows={workflows} runtime={runtime} visible={showDetailsStrip()} theme={theme} />
        <box flexGrow={1} flexDirection="row" minHeight={0} gap={1} padding={1} overflow="hidden">
          <Outline
            workflows={workflows}
            nodes={nodes}
            edges={edges}
            runtime={runtime}
            engagement={engagement}
            width={outlineWidth()}
            visible={showOutline()}
            theme={theme}
          />
          <GraphPane
            nodes={nodes}
            edges={edges}
            order={order}
            runtime={runtime}
            workflows={workflows}
            containers={() => engagement().containers}
            escaped={escaped}
            tick={tick()}
            runner={runner()}
            width={graphWidth}
            theme={theme}
          />
          <box
            width={detailsWidth()}
            flexDirection="column"
            gap={1}
            flexShrink={0}
            visible={split()}
          >
            <DetailsPane
              config={config}
              workflows={workflows}
              runtime={runtime}
              engagement={engagement}
              width={detailsWidth()}
              height={detailsHeight()}
              theme={theme}
            />
            <HistoryPane
              history={history}
              width={detailsWidth()}
              height={historyHeight()}
              theme={theme}
            />
          </box>
        </box>
        <HistoryStrip history={history} visible={showHistoryStrip()} theme={theme} />
        <RunConsole runtime={runtime} height={consoleHeight()} updated={fetchedAt} theme={theme} />
        <StatusBar runtime={runtime} updated={fetchedAt} width={width} theme={theme} />
      </Show>
    </box>
  );
}
