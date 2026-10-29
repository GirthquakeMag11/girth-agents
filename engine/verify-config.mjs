// The configuration verifier: the gate a workflow config passes before
// it ships. It answers "is this a config problem?" in three layers —
// the deep schema (each constraint named), the graph's structure
// (dangling references, unreachable nodes, dead routes), and a dry-run
// matrix that drives the config through the REAL executor against a
// fake driver, probing every condition's branch plus the value nothing
// routes. Anything the verifier faults on is the config's; anything
// that fails later on a config it verified sound is the engine's.

import { createExecutor } from "./executor.mjs";

const NODE_TYPES = new Set(["entry", "task", "exit"]);
const RECORD_KINDS = new Set(["question", "defect"]);

const fault = (code, message) => ({ code, message });

function deepSchemaFaults(doc) {
  const faults = [];
  const ids = new Set();

  for (const node of doc.graph?.nodes ?? []) {
    const at = node?.id ?? "(unnamed)";
    if (typeof node?.id !== "string" || node.id.trim() === "") {
      faults.push(fault("schema", `node ${at}: id must be a non-empty string`));
    } else if (ids.has(node.id)) {
      faults.push(fault("schema", `node ${node.id}: duplicate id`));
    }
    if (node?.id) ids.add(node.id);

    if (!NODE_TYPES.has(node?.type)) {
      faults.push(fault("schema", `node ${at}: type must be entry, task, or exit`));
      continue;
    }
    if (node.type === "task") {
      if (typeof node.helper !== "string" || node.helper.trim() === "") {
        faults.push(fault("schema", `node ${at}: helper must be a non-empty string`));
      }
      if (typeof node.artifact !== "string" || node.artifact.trim() === "") {
        faults.push(fault("schema", `node ${at}: artifact must be a non-empty string`));
      }
      if (node.budgetMs !== undefined && (typeof node.budgetMs !== "number" || !(node.budgetMs > 0))) {
        faults.push(fault("schema", `node ${at}: budgetMs must be a positive number`));
      }
      if (node.resume !== undefined && (typeof node.resume !== "string" || node.resume.trim() === "")) {
        faults.push(fault("schema", `node ${at}: resume must name a node id`));
      }
      if (node.requires !== undefined && (!Array.isArray(node.requires) || node.requires.some((r) => typeof r !== "string"))) {
        faults.push(fault("schema", `node ${at}: requires must be an array of strings`));
      }
      if (node.maxVisits !== undefined && (!Number.isInteger(node.maxVisits) || node.maxVisits < 1)) {
        faults.push(fault("schema", `node ${at}: maxVisits must be a positive integer`));
      }
      if (typeof node.objective !== "string" || node.objective.trim() === "") {
        faults.push(fault("schema", `node ${at}: objective must be a non-empty string`));
      }
    }
    if (node.type === "entry" && node.marker !== undefined && typeof node.marker !== "string") {
      faults.push(fault("schema", `node ${at}: marker must be a string`));
    }
    if (node.type === "exit" && node.record !== undefined) {
      if (typeof node.record !== "object" || node.record === null || !RECORD_KINDS.has(node.record.kind)) {
        faults.push(fault("schema", `node ${at}: record.kind must be question or defect`));
      }
    }
  }

  for (const link of doc.graph?.links ?? []) {
    const at = `link ${link.from ?? "?"}->${link.to ?? "?"}`;
    if (typeof link.from !== "string" || link.from.trim() === "") {
      faults.push(fault("schema", `${at}: from must be a non-empty string`));
    }
    if (typeof link.to !== "string" || link.to.trim() === "") {
      faults.push(fault("schema", `${at}: to must be a non-empty string`));
    }
    if (link.condition !== undefined) {
      if (typeof link.condition !== "object" || link.condition === null || typeof link.condition.field !== "string" || !("equals" in link.condition)) {
        faults.push(fault("schema", `${at}: condition needs a string field and an equals value`));
      }
    }
    if (link.exhausted !== undefined && typeof link.exhausted !== "boolean") {
      faults.push(fault("schema", `${at}: exhausted must be a boolean`));
    }
  }

  for (const [id, fitting] of Object.entries(doc.agents ?? {})) {
    if (typeof fitting.job !== "string" || fitting.job.trim() === "") {
      faults.push(fault("schema", `helper ${id}: job must be a non-empty string`));
    }
    if (!Array.isArray(fitting.capabilities) || fitting.capabilities.length === 0 || fitting.capabilities.some((c) => typeof c !== "string")) {
      faults.push(fault("schema", `helper ${id}: capabilities must be a non-empty array of strings`));
    }
    if (typeof fitting.permissions !== "object" || fitting.permissions === null) {
      faults.push(fault("schema", `helper ${id}: permissions must be a ruleset object`));
    }
    if (typeof fitting.model !== "string" || fitting.model.trim() === "") {
      faults.push(fault("schema", `helper ${id}: model must be a non-empty string`));
    }
    if (typeof fitting.body !== "string" || fitting.body.trim() === "") {
      faults.push(fault("schema", `agent ${id}: its body must be non-empty — an agent's craft lives in its own file; skills are reusable techniques, never the agent`));
    }
    if (fitting.skills !== undefined && !Array.isArray(fitting.skills)) {
      faults.push(fault("schema", `agent ${id}: skills, when present, must be an array of referenced techniques`));
    }
    for (const skill of fitting.skills ?? []) {
      if (!skill || typeof skill.instructions !== "string" || skill.instructions.trim() === "") {
        faults.push(fault("schema", `agent ${id}: skill '${skill?.id ?? "?"}' has no instructions`));
      }
    }
  }

  return faults;
}

function structureFaults(doc) {
  const faults = [];
  const nodes = doc.graph?.nodes ?? [];
  const links = doc.graph?.links ?? [];
  const ids = new Set(nodes.map((n) => n.id));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outbound = new Map(nodes.map((n) => [n.id, []]));
  for (const link of links) {
    if (outbound.has(link.from)) outbound.get(link.from).push(link);
  }

  if (!nodes.some((n) => n.type === "entry")) {
    faults.push(fault("graph.no-entry", "no entry node: nothing can ever be claimed"));
  }

  for (const link of links) {
    if (!ids.has(link.from)) faults.push(fault("graph.dangling-link", `link ${link.from}->${link.to}: 'from' names no node`));
    if (!ids.has(link.to)) faults.push(fault("graph.dangling-link", `link ${link.from}->${link.to}: 'to' names no node`));
  }

  for (const node of nodes) {
    if (node.type === "task") {
      if (!(node.helper in (doc.agents ?? {}))) {
        faults.push(fault("graph.unknown-helper", `node ${node.id}: helper '${node.helper}' has no fitting`));
      } else if (node.requires) {
        const capabilities = doc.agents[node.helper].capabilities ?? [];
        const missing = node.requires.filter((r) => !capabilities.includes(r));
        if (missing.length > 0) {
          faults.push(fault("graph.requires-beyond-fitting", `node ${node.id}: '${node.helper}' lacks ${missing.join(", ")}`));
        }
      }
      if ((outbound.get(node.id) ?? []).length === 0 && node.type !== "exit") {
        faults.push(fault("graph.no-route", `node ${node.id}: no outbound link`));
      }
    }
    if (node.type === "entry" && (outbound.get(node.id) ?? []).length === 0) {
      faults.push(fault("graph.no-route", `entry ${node.id}: no outbound link`));
    }
    if (node.type === "exit" && (outbound.get(node.id) ?? []).length > 0) {
      faults.push(fault("graph.exit-routed", `exit ${node.id}: an exit terminates — links out of it are dead structure`));
    }
    const normalLinks = (outbound.get(node.id) ?? []).filter((l) => !l.exhausted);
    const conditionalCount = normalLinks.filter((l) => l.condition).length;
    const unconditionalCount = normalLinks.length - conditionalCount;
    if (conditionalCount > 0 && unconditionalCount > 0) {
      faults.push(fault("graph.mixed-routing", `node ${node.id}: out-links must be conditional or unconditional, never a mixture — no catch-alls`));
    }
    if (conditionalCount === 0 && unconditionalCount > 1) {
      faults.push(fault("graph.multi-unconditional", `node ${node.id}: at most one unconditional outbound link`));
    }
    if (node.type === "entry" && conditionalCount > 0) {
      faults.push(fault("graph.entry-conditional", `entry ${node.id}: an entry routes unconditionally`));
    }
    if (node.type === "task" && node.maxVisits !== undefined) {
      const exhaustedLinks = (outbound.get(node.id) ?? []).filter((l) => l.exhausted);
      if (exhaustedLinks.length !== 1) {
        faults.push(fault("graph.retry-no-exhaust", `node ${node.id}: maxVisits ${node.maxVisits} needs exactly one exhausted outbound link, found ${exhaustedLinks.length}`));
      }
    }
  }

  const reached = new Set();
  for (const entry of nodes.filter((n) => n.type === "entry")) {
    const queue = [entry.id];
    while (queue.length > 0) {
      const id = queue.shift();
      if (reached.has(id)) continue;
      reached.add(id);
      for (const link of outbound.get(id) ?? []) queue.push(link.to);
    }
  }
  for (const node of nodes) {
    if (!reached.has(node.id)) {
      faults.push(fault("graph.unreachable", `node ${node.id}: unreachable from any entry — dead config`));
    }
  }

  return faults;
}

async function matrixFaults(doc) {
  const faults = [];
  const nodes = doc.graph.nodes;
  const links = doc.graph.links;
  const entries = nodes.filter((n) => n.type === "entry");
  const conditions = links.filter((l) => l.condition);

  const defaults = new Map();
  for (const link of conditions) {
    if (!defaults.has(link.condition.field)) defaults.set(link.condition.field, link.condition.equals);
  }
  const fields = [...defaults.keys()];
  const assign = (fieldValue) => {
    const stamps = {};
    for (const field of fields) stamps[field] = fieldValue[field] ?? defaults.get(field);
    return stamps;
  };
  const NO_MATCH = "__no-route-probe__";

  const cases = [{ name: "default", stamps: assign({}) }];
  for (const link of conditions) {
    const stamps = assign({ [link.condition.field]: link.condition.equals });
    cases.push({ name: `branch ${link.to} (${link.condition.field}=${link.condition.equals})`, stamps });
  }
  cases.push({ name: "no-match probe", stamps: assign(Object.fromEntries(fields.map((f) => [f, NO_MATCH]))) });

  // a loop is legal when it can escape: on a later lap through the same
  // artifact, serve the stamps that route to the exit branch, so a
  // retry cycle terminates if — and only if — it has a way out. No exit
  // branch, no escape: the lap keeps the probe's stamps and the matrix
  // names the step-overflow loop fault.
  const exitIds = new Set(nodes.filter((n) => n.type === "exit").map((n) => n.id));
  const escapeLink = conditions.find((l) => exitIds.has(l.to));
  const escapeStamps = escapeLink ? assign({ [escapeLink.condition.field]: escapeLink.condition.equals }) : null;

  let sessionCount = 0;
  const driver = {
    spawn: async () => sessionCount++,
    prompt: async () => ({ outcome: "succeeded" }),
    interrupt() {},
  };
  const contentByNode = new Map();
  // every node that produces an artifact takes part in the matrix — a
  // dispatch-capable entry included
  const artifactNodes = nodes.filter((n) => n.artifact && (n.type === "task" || (n.type === "entry" && n.helper)));
  for (const node of artifactNodes) {
    contentByNode.set(`${node.id}->${node.artifact}`, null); // filled per case below
  }

  for (const probe of cases) {
    const isNoMatch = probe.name === "no-match probe";
    for (const node of artifactNodes) {
      contentByNode.set(`${node.id}->${node.artifact}`, JSON.stringify(probe.stamps));
    }
    const reads = new Map();
    const executor = createExecutor({
      graph: doc.graph,
      driver,
      readFile: async (path) => {
        const lap = reads.get(path) ?? 0;
        reads.set(path, lap + 1);
        if (lap > 0 && escapeStamps) return JSON.stringify(escapeStamps);
        return contentByNode.get(path) ?? null;
      },
      artifactPath: (_projectId, node) => `${node.id}->${node.artifact}`,
    });
    for (const entry of entries) {
      const result = await executor.run({ projectId: `verify:${probe.name}`, entryNode: entry.id });
      if (isNoMatch) {
        // the no-match probe must defect loudly at the first conditional
        // node — the engine enforcing the stamps. A route out is the fault.
        const outcome = result.failure ? result.failure.kind : "completed";
        if (outcome !== "no-route") {
          faults.push(fault("graph.matrix.unexpected-route", `${probe.name} at entry ${entry.id}: expected a loud no-route defect, got '${outcome}'`));
        }
      } else if (result.failure) {
        faults.push(fault(`graph.matrix.${result.failure.kind}`, `${probe.name}: ${result.failure.message}`));
      }
    }
  }

  return faults;
}

export async function verifyConfig(doc) {
  let faults = [...deepSchemaFaults(doc), ...structureFaults(doc)];
  if (faults.length === 0) {
    faults = faults.concat(await matrixFaults(doc));
  }
  return { valid: faults.length === 0, configFaults: faults };
}