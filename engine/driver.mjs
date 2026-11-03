// Pure wire-shape helpers the executor imports. The live session client is
// engine/plugin-driver.mjs; there is no HTTP, URL, or token here.

export function modelRef(model) {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1) {
    const err = new Error(`model '${model}' is not a 'provider/model' reference`);
    err.kind = "model-ref";
    throw err;
  }
  return { id: model.slice(slash + 1), providerID: model.slice(0, slash) };
}

// A leading deny is the deny-rest. The agent's rules follow, with the
// handoff action added by the engine for non-terminal nodes; the rules are
// already {action, resource, effect}, so nothing is synthesized here.
export function permissionsFor({ handoff = false, allow = [], subagents = [] } = {}) {
  return [
    { action: "*", resource: "*", effect: "deny" },
    ...(handoff ? [{ action: "handoff", resource: "*", effect: "allow" }] : []),
    ...allow,
    ...subagents.map((id) => ({ action: "subagent", resource: id, effect: "allow" })),
  ];
}