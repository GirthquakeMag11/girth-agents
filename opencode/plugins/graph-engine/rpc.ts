// The server/dashboard contract. The server part registers this RPC; the
// dashboard polls `snapshot` at its one-second interval. RPC events are not
// part of the first installer.

import { Rpc } from "@opencode/plugin/rpc";

export const GraphEngine = Rpc.define({
  id: "graph-engine",
  methods: {
    // The SDK walks every method's input and output validators and the
    // contract's events map unconditionally, so each piece must be declared
    // in full. A no-argument method still takes an empty object: the client
    // serializes `snapshot()` as an absent input, which no input schema
    // accepts, so the caller passes `{}`.
    snapshot: {
      input: { type: "object", properties: {}, required: [], additionalProperties: true },
      output: { type: "object", properties: {}, required: [], additionalProperties: true },
    },
    dispatchStatus: {
      input: {
        type: "object",
        properties: { dispatchId: { type: "string" } },
        required: ["dispatchId"],
        additionalProperties: false,
      },
      output: { type: "object", properties: {}, required: [], additionalProperties: true },
    },
  },
  events: {},
});