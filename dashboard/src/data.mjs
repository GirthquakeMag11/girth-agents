// The RPC snapshot → dashboard adapter. The dashboard reads the full graph
// document, graph info, and structured runtime straight from the snapshot;
// there is no endpoint parsing, no HTTP, and no project-directory argument.

export function snapshotToDashboard(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new Error("graph-engine snapshot is empty");
  const config = snapshot.config;
  const info = snapshot.info;
  const runtime = snapshot.runtime;
  if (!config?.graph || !Array.isArray(config.graph.nodes)) {
    throw new Error("graph-engine snapshot has no graph document");
  }
  if (!info || typeof info !== "object" || typeof info.configPath !== "string") {
    throw new Error("graph-engine snapshot has no graph info");
  }
  if (!runtime || typeof runtime !== "object") {
    throw new Error("graph-engine snapshot has no runtime state");
  }
  return {
    config,
    info,
    runtime,
    fetchedAt: new Date(),
  };
}