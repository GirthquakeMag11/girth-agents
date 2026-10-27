import { Plugin } from "@opencode/plugin/tui"

export default Plugin.define({
  id: "girth-agents.tui",
  setup(context: any) {
    // The sidebar's real readouts arrive with the engine (ticket 16).
    // This slot exists now to verify the TUI side loads and renders.
    return context.ui.slot({
      append: "sidebar.content",
      render: () => "girth-agents",
    })
  },
})