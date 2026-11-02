// The graph dashboard TUI. It reads everything through the graph-engine RPC
// snapshot — no HTTP, no project-local plugin file, and no graph config read
// from disk.

import { Plugin, usePlugin } from "@opencode/plugin/tui";
import type { PanelInput } from "@opencode/plugin/tui/context";
import { useTerminalDimensions } from "@opentui/solid";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { snapshotToDashboard } from "./dashboard/src/data.mjs";
import { GraphEngine } from "./rpc.ts";
import { DashboardView, type Dashboard } from "./dashboard/src/view.tsx";

const PANEL = "graph-dashboard";

// An RPC rejection is an object envelope, not an Error, so deriving a message
// from it must walk `message`/`error` rather than `String(cause)`, which would
// render "[object Object]".
function errorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === "object") {
    const value = cause as { message?: unknown; error?: unknown };
    return errorMessage(value.message ?? value.error);
  }
  return String(cause);
}

function DashboardPanel(props: { panel: PanelInput }) {
  const context = usePlugin();
  const theme = context.theme;
  const dimensions = useTerminalDimensions();
  const [dashboard, setDashboard] = createSignal<Dashboard | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  context.keymap.layer(() => ({
    commands: [{ id: "graph-dashboard.close", bind: "escape", run: () => props.panel.close() }],
  }));

  onMount(() => {
    let stopped = false;
    let busy = false;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const snapshot = await context.client.rpc(GraphEngine).snapshot();
        if (!stopped) {
          setDashboard(snapshotToDashboard(snapshot) as Dashboard);
          setError(null);
        }
      } catch (cause) {
        if (!stopped) setError(errorMessage(cause));
      } finally {
        busy = false;
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 1000);
    onCleanup(() => {
      stopped = true;
      clearInterval(timer);
    });
  });

  return (
    <DashboardView
      dashboard={dashboard}
      error={error}
      width={() => dimensions().width}
      height={() => dimensions().height}
      theme={theme}
    />
  );
}

export default Plugin.define({
  id: "graph-engine.tui",
  setup(context) {
    context.ui.slot({
      append: "session.panel",
      render: (panel) => (
        <Show when={panel.name === PANEL}>
          <DashboardPanel panel={panel} />
        </Show>
      ),
    });
    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "graph-dashboard.open",
          title: "Open graph dashboard",
          group: "Graph",
          bind: "ctrl+shift+g",
          palette: true,
          run: () => context.ui.panel.open(PANEL, { presentation: "fullscreen" }),
        },
      ],
      bindings: ["graph-dashboard.open"],
    }));
  },
});