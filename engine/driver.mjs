// Pure wire-shape helpers the executor imports. The live session client is
// engine/plugin-driver.mjs; there is no HTTP, URL, or token here.

// `"provider/id#variant"` -> OpenCode's Model.Ref `{ providerID, id, variant? }`.
// Mirrors the SDK's Model.Ref.parse: split on the first "/", then "#".
export function modelRef(model) {
  const slash = model.indexOf("/");
  const hash = model.indexOf("#");
  const providerID = model.slice(0, slash);
  const id = model.slice(slash + 1, hash === -1 ? undefined : hash);
  const variant = hash === -1 ? undefined : model.slice(hash + 1);
  if (
    slash <= 0 ||
    id === "" ||
    providerID.includes("#") ||
    (variant !== undefined && (variant === "" || variant.includes("#")))
  ) {
    const err = new Error(`model '${model}' is not a 'provider/model' reference`);
    err.kind = "model-ref";
    throw err;
  }
  return { id, providerID, ...(variant !== undefined ? { variant } : {}) };
}

// A leading deny is the deny-rest. The agent's rules follow, with the
// handoff action added by the engine for non-terminal nodes; the rules are
// already {action, resource, effect}, so nothing is synthesized here.
export function permissionsFor({ handoff = false, rules = [], subagents = [] } = {}) {
  return [
    { action: "*", resource: "*", effect: "deny" },
    ...(handoff ? [{ action: "handoff", resource: "*", effect: "allow" }] : []),
    ...rules,
    ...subagents.map((id) => ({ action: "subagent", resource: id, effect: "allow" })),
  ];
}