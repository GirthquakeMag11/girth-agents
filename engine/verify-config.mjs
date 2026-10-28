// The configuration verifier: the gate a workflow config passes before
// it ships. It answers "is this a config problem?" in three layers —
// the deep schema (each constraint named), the graph's structure
// (dangling references, unreachable nodes, dead routes), and a dry-run
// matrix that drives the config through the REAL executor against a
// fake driver, probing every condition's branch plus the value nothing
// routes. Anything the verifier faults on is the config's; anything
// that fails later on a config it verified sound is the engine's.

import { validateConfig } from "./validate-config.mjs";
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
  }

  for (const [id, fitting] of Object.entries(doc.helpers ?? {})) {
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
      if (!(node.helper in (doc.helpers ?? {}))) {
        faults.push(fault("graph.unknown-helper", `node ${node.id}: helper '${node.helper}' has no fitting`));
      } else if (node.requires) {
        const capabilities = doc.helpers[node.helper].capabilities ?? [];
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
  const tasks = nodes.filter((n) => n.type === "task");
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

  let sessionCount = 0;
  const driver = {
    spawn: async () => sessionCount++,
    prompt: async () => ({ outcome: "succeeded" }),
    interrupt() {},
  };
  const contentByNode = new Map();
  for (const node of tasks) {
    contentByNode.set(`${node.id}->${node.artifact}`, null); // filled per case below
  }

  for (const probe of cases) {
    for (const node of tasks) {
      contentByNode.set(`${node.id}->${node.artifact}`, JSON.stringify(probe.stamps));
    }
    const executor = createExecutor({
      graph: doc.graph,
      driver,
      readFile: async (path) => contentByNode.get(path) ?? null,
      artifactPath: (_projectId, node) => `${node.id}->${node.artifact}`,
    });
    for (const entry of entries) {
      const result = await executor.run({ projectId: `verify:${probe.name}`, entryNode: entry.id });
      if (result.failure) {
        faults.push(fault(`graph.matrix.${result.failure.kind}`, `${probe.name}: ${result.failure.message}`));
      }
    }
  }

  return faults;
}

export async function verifyConfig(text) {
  const shallow = validateConfig(text);
  if (!shallow.valid) {
    return { valid: false, configFaults: shallow.reasons.map((r) => fault("schema", r)) };
  }
  const doc = JSON.parse(text);
  let faults = [...deepSchemaFaults(doc), ...structureFaults(doc)];
  if (faults.length === 0) {
    faults = faults.concat(await matrixFaults(doc));
  }
  return { valid: faults.length === 0, configFaults: faults };
}