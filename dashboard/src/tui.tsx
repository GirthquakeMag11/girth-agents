import { Plugin, usePlugin } from "@opencode/plugin/tui";
import type { PanelInput } from "@opencode/plugin/tui/context";
import { useTerminalDimensions } from "@opentui/solid";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { loadDashboard } from "./data.mjs";
import { DashboardView, type Dashboard } from "./view.tsx";

const PANEL = "graph-dashboard";

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
        const session = context.data.session.get(props.panel.sessionID);
        const directory = session?.location?.directory;
        if (!directory) throw new Error("session workspace is unavailable");
        const data = (await loadDashboard(directory)) as Dashboard;
        if (!stopped) {
          setDashboard(data);
          setError(null);
        }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : String(cause));
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
  id: "graph-dashboard.tui",
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
