// The server/dashboard contract. The server part registers this RPC; the
// dashboard polls `snapshot` at its one-second interval. RPC events are not
// part of the first installer.

import { Rpc } from "@opencode/plugin/rpc";

export const GraphEngine = Rpc.define({
  id: "graph-engine",
  methods: {
    snapshot: {
      output: { type: "object", additionalProperties: true },
    },
    dispatchStatus: {
      input: {
        type: "object",
        properties: { dispatchId: { type: "string" } },
        required: ["dispatchId"],
        additionalProperties: false,
      },
      output: { type: "object", additionalProperties: true },
    },
  },
});