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

// A leading deny is the deny-rest. An allow-only list is not deny-rest:
// unlisted tools stay visible and default to ask on the live wire.
export function permissionsFor({ handoff = false, allow = [] } = {}) {
  const actions = [];
  if (handoff) actions.push("handoff");
  for (const action of allow) {
    if (typeof action === "string" && action.trim() !== "" && !actions.includes(action)) actions.push(action);
  }
  return [
    { action: "*", resource: "*", effect: "deny" },
    ...actions.map((action) => ({ action, resource: "*", effect: "allow" })),
  ];
}