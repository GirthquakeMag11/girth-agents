// The graph dashboard TUI. It reads everything through the graph-engine RPC
// snapshot — no HTTP, no project-local plugin file, and no graph config read
// from disk.

import { Plugin, usePlugin } from "@opencode/plugin/tui";
import { useTerminalDimensions } from "@opentui/solid";
import { createSignal, onCleanup, onMount } from "solid-js";
import { snapshotToDashboard } from "./dashboard/src/data.mjs";
import { GraphEngine } from "./rpc.ts";
import { DashboardView, type Dashboard } from "./dashboard/src/view.tsx";

const ROUTE = "graph-dashboard";

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

// A full-screen route, not a session panel. The dashboard shows engine-global
// state — one graph, one runtime — while session panels silently return false
// when opened with no active session, which leaves the dashboard unreachable
// from Home. A route opens from anywhere.
function DashboardRoute() {
  const context = usePlugin();
  const theme = context.theme;
  const dimensions = useTerminalDimensions();
  const [dashboard, setDashboard] = createSignal<Dashboard | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  context.keymap.layer(() => ({
    commands: [{ id: "graph-dashboard.close", bind: "escape", run: () => context.ui.router.navigate({ type: "home" }) }],
  }));

  onMount(() => {
    let stopped = false;
    let busy = false;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const snapshot = await context.client.rpc(GraphEngine).snapshot({});
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
    const unregister = context.ui.router.register({
      name: ROUTE,
      render: () => <DashboardRoute />,
    });
    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "graph-dashboard.open",
          title: "Open graph dashboard",
          group: "Graph",
          // alt+g, not ctrl+shift+g: the test-drive terminal (gnome-terminal)
          // does not report the Shift bit on control characters, so
          // ctrl+shift+g arrives as ctrl+g — OpenCode's default "first
          // message" binding — and the dashboard key never fires there.
          bind: "alt+g",
          palette: true,
          run: () => context.ui.router.navigate({ type: "plugin", name: ROUTE }),
        },
      ],
      bindings: ["graph-dashboard.open"],
    }));
    return unregister;
  },
});