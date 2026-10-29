// The graph config: one JSON file, strict schema, named faults, and a
// structural verifier. Any node may be a dispatch entry point; every node
// must reach a terminal, and every cycle must carry a visit bound.

import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const HANDOFF_MODES = new Set(["terminal", "unconditional", "conditional"]);

const fault = (code, message) => ({ code, message });

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function strict(object, allowed, at, faults) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) faults.push(fault("schema.unknown-field", `${at}: unknown field '${key}'`));
  }
}

function string(value, at, faults, { required = true } = {}) {
  if (value === undefined) {
    if (required) faults.push(fault("schema.string", `${at}: required string is missing`));
    return;
  }
  if (typeof value !== "string" || value.trim() === "") {
    faults.push(fault("schema.string", `${at}: must be a non-empty string`));
  }
}

function integer(value, at, faults, { required = false, min = 1 } = {}) {
  if (value === undefined) {
    if (required) faults.push(fault("schema.integer", `${at}: required integer is missing`));
    return;
  }
  if (!Number.isInteger(value) || value < min) {
    faults.push(fault("schema.integer", `${at}: must be an integer >= ${min}`));
  }
}

function relativePath(value, at, faults, { required = true } = {}) {
  if (value === undefined) {
    if (required) faults.push(fault("schema.path", `${at}: required path is missing`));
    return;
  }
  if (typeof value !== "string" || value.trim() === "") {
    faults.push(fault("schema.path", `${at}: must be a non-empty relative path`));
    return;
  }
  if (value.includes("\0") || isAbsolute(value) || value.split(/[\\/]/).includes("..")) {
    faults.push(fault("schema.path", `${at}: must be a relative path without '..' or NUL`));
  }
}

function validateHelper(helper, at, faults) {
  if (!isObject(helper)) {
    faults.push(fault("schema.helper", `${at}: must be an object`));
    return;
  }
  strict(helper, ["id", "model", "agent", "permissions", "craft"], at, faults);
  string(helper.id, `${at}.id`, faults);
  string(helper.model, `${at}.model`, faults);
  if (helper.model !== undefined && typeof helper.model === "string") {
    const slash = helper.model.indexOf("/");
    if (slash <= 0 || slash === helper.model.length - 1) {
      faults.push(fault("schema.helper-model", `${at}.model: must be 'provider/model'`));
    }
  }
  if (helper.agent !== undefined) string(helper.agent, `${at}.agent`, faults);
  if (!Array.isArray(helper.permissions) || helper.permissions.length === 0) {
    faults.push(fault("schema.helper-permissions", `${at}.permissions: must be a non-empty array of action names`));
  } else {
    const seen = new Set();
    for (const [i, action] of helper.permissions.entries()) {
      if (typeof action !== "string" || action.trim() === "") {
        faults.push(fault("schema.helper-permissions", `${at}.permissions[${i}]: must be a non-empty string`));
      } else if (action === "*") {
        faults.push(fault("schema.helper-permissions", `${at}.permissions[${i}]: '*' is not allowed; list the actions`));
      } else if (seen.has(action)) {
        faults.push(fault("schema.helper-permissions", `${at}.permissions[${i}]: duplicate action '${action}'`));
      } else {
        seen.add(action);
      }
    }
  }
  if (helper.craft !== undefined) string(helper.craft, `${at}.craft`, faults);
}

function validateHandoff(handoff, at, nodeIds, faults) {
  if (!isObject(handoff)) {
    faults.push(fault("schema.handoff", `${at}: must be an object`));
    return;
  }
  if (!HANDOFF_MODES.has(handoff.mode)) {
    faults.push(fault("schema.handoff-mode", `${at}.mode: must be terminal, unconditional, or conditional`));
    return;
  }
  if (handoff.mode === "terminal") {
    strict(handoff, ["mode"], at, faults);
    return;
  }
  if (handoff.mode === "unconditional") {
    strict(handoff, ["mode", "to", "description"], at, faults);
    string(handoff.to, `${at}.to`, faults);
    if (handoff.to !== undefined && typeof handoff.to === "string" && !nodeIds.has(handoff.to)) {
      faults.push(fault("graph.dangling-handoff", `${at}.to: names no node '${handoff.to}'`));
    }
    if (handoff.description !== undefined) string(handoff.description, `${at}.description`, faults);
    return;
  }

  strict(handoff, ["mode", "labels"], at, faults);
  if (!Array.isArray(handoff.labels) || handoff.labels.length === 0) {
    faults.push(fault("schema.handoff-labels", `${at}.labels: must be a non-empty array`));
    return;
  }
  const labels = new Set();
  for (const [i, label] of handoff.labels.entries()) {
    const labelAt = `${at}.labels[${i}]`;
    if (!isObject(label)) {
      faults.push(fault("schema.label", `${labelAt}: must be an object`));
      continue;
    }
    strict(label, ["label", "to", "description"], labelAt, faults);
    string(label.label, `${labelAt}.label`, faults);
    string(label.to, `${labelAt}.to`, faults);
    string(label.description, `${labelAt}.description`, faults);
    if (typeof label.label === "string" && label.label.trim() !== "") {
      if (labels.has(label.label)) faults.push(fault("graph.duplicate-label", `${labelAt}.label: duplicate '${label.label}'`));
      labels.add(label.label);
    }
    if (typeof label.to === "string" && !nodeIds.has(label.to)) {
      faults.push(fault("graph.dangling-handoff", `${labelAt}.to: names no node '${label.to}'`));
    }
  }
}

function edgesOf(node) {
  if (!node || !node.handoff) return [];
  if (node.handoff.mode === "unconditional") return [node.handoff.to];
  if (node.handoff.mode === "conditional") return (node.handoff.labels ?? []).map((label) => label.to);
  return [];
}

function hasTerminalPath(nodeId, byId, terminalIds, seen = new Set()) {
  if (terminalIds.has(nodeId)) return true;
  if (seen.has(nodeId)) return false;
  seen.add(nodeId);
  for (const next of edgesOf(byId.get(nodeId))) {
    if (hasTerminalPath(next, byId, terminalIds, seen)) return true;
  }
  return false;
}

function stronglyConnected(ids, byId) {
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indices = new Map();
  const low = new Map();
  const components = [];

  function visit(id) {
    indices.set(id, index);
    low.set(id, index);
    index += 1;
    stack.push(id);
    onStack.add(id);
    for (const next of edgesOf(byId.get(id))) {
      if (!byId.has(next)) continue;
      if (!indices.has(next)) {
        visit(next);
        low.set(id, Math.min(low.get(id), low.get(next)));
      } else if (onStack.has(next)) {
        low.set(id, Math.min(low.get(id), indices.get(next)));
      }
    }
    if (low.get(id) === indices.get(id)) {
      const component = [];
      for (;;) {
        const member = stack.pop();
        onStack.delete(member);
        component.push(member);
        if (member === id) break;
      }
      components.push(component);
    }
  }

  for (const id of ids) if (!indices.has(id)) visit(id);
  return components;
}

function validateGraph(graph, at, helperIds, faults) {
  if (!isObject(graph)) {
    faults.push(fault("schema.graph", `${at}: must be an object`));
    return;
  }
  strict(graph, ["id", "outputRoot", "maxSteps", "nodes"], at, faults);
  string(graph.id, `${at}.id`, faults);
  if (graph.outputRoot !== undefined) relativePath(graph.outputRoot, `${at}.outputRoot`, faults);
  integer(graph.maxSteps, `${at}.maxSteps`, faults, { min: 1 });

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    faults.push(fault("schema.nodes", `${at}.nodes: must be a non-empty array`));
    return;
  }

  const nodeIds = new Set();
  for (const [i, node] of graph.nodes.entries()) {
    if (!isObject(node)) continue;
    if (typeof node.id === "string" && node.id.trim() !== "") {
      if (nodeIds.has(node.id)) faults.push(fault("graph.duplicate-node", `${at}.nodes[${i}].id: duplicate '${node.id}'`));
      nodeIds.add(node.id);
    }
  }

  for (const [i, node] of graph.nodes.entries()) {
    const nodeAt = `${at}.nodes[${i}]`;
    if (!isObject(node)) {
      faults.push(fault("schema.node", `${nodeAt}: must be an object`));
      continue;
    }
    strict(node, ["id", "helper", "objective", "output", "budgetMs", "maxVisits", "handoff"], nodeAt, faults);
    string(node.id, `${nodeAt}.id`, faults);
    string(node.helper, `${nodeAt}.helper`, faults);
    if (node.helper !== undefined && typeof node.helper === "string" && !helperIds.has(node.helper)) {
      faults.push(fault("graph.unknown-helper", `${nodeAt}.helper: names no helper '${node.helper}'`));
    }
    string(node.objective, `${nodeAt}.objective`, faults);
    relativePath(node.output, `${nodeAt}.output`, faults);
    integer(node.budgetMs, `${nodeAt}.budgetMs`, faults, { min: 1 });
    integer(node.maxVisits, `${nodeAt}.maxVisits`, faults, { min: 1 });
    if (node.maxVisits !== undefined && Number.isInteger(node.maxVisits) && node.maxVisits > 3) {
      faults.push(fault("schema.maxvisits", `${nodeAt}.maxVisits: the engine's hard ceiling is 3`));
    }
    if (node.handoff === undefined) {
      faults.push(fault("schema.handoff-missing", `${nodeAt}.handoff: required`));
    } else {
      validateHandoff(node.handoff, `${nodeAt}.handoff`, nodeIds, faults);
    }
  }

  const byId = new Map(graph.nodes.filter(isObject).map((node) => [node.id, node]));
  const terminalIds = new Set(graph.nodes.filter((node) => node?.handoff?.mode === "terminal").map((node) => node.id));
  if (terminalIds.size === 0) faults.push(fault("graph.no-terminal", `${at}: no terminal node`));

  for (const node of byId.values()) {
    if (node.id && !hasTerminalPath(node.id, byId, terminalIds)) {
      faults.push(fault("graph.no-terminal-path", `${at}: node '${node.id}' cannot reach a terminal`));
    }
  }

  for (const component of stronglyConnected([...byId.keys()], byId)) {
    const selfLoop = component.length === 1 && edgesOf(byId.get(component[0])).includes(component[0]);
    if (component.length > 1 || selfLoop) {
      for (const id of component) {
        if (byId.get(id)?.maxVisits === undefined) {
          faults.push(fault("graph.unbounded-cycle", `${at}: cycle through '${id}' has no maxVisits on that node`));
        }
      }
    }
  }
}

export function validateConfig(doc) {
  const faults = [];
  if (!isObject(doc)) return [fault("schema.config", "config must be an object")];
  strict(doc, ["version", "helpers", "graphs"], "config", faults);
  if (doc.version !== "2") faults.push(fault("schema.version", "config.version: must be the string '2'"));

  const helperIds = new Set();
  if (!Array.isArray(doc.helpers) || doc.helpers.length === 0) {
    faults.push(fault("schema.helpers", "config.helpers: must be a non-empty array"));
  } else {
    for (const [i, helper] of doc.helpers.entries()) {
      validateHelper(helper, `config.helpers[${i}]`, faults);
      if (isObject(helper) && typeof helper.id === "string" && helper.id.trim() !== "") {
        if (helperIds.has(helper.id)) faults.push(fault("schema.helper-id", `config.helpers[${i}].id: duplicate '${helper.id}'`));
        helperIds.add(helper.id);
      }
    }
  }

  const graphIds = new Set();
  if (!Array.isArray(doc.graphs) || doc.graphs.length === 0) {
    faults.push(fault("schema.graphs", "config.graphs: must be a non-empty array"));
  } else {
    for (const [i, graph] of doc.graphs.entries()) {
      validateGraph(graph, `config.graphs[${i}]`, helperIds, faults);
      if (isObject(graph) && typeof graph.id === "string" && graph.id.trim() !== "") {
        if (graphIds.has(graph.id)) faults.push(fault("schema.graph-id", `config.graphs[${i}].id: duplicate '${graph.id}'`));
        graphIds.add(graph.id);
      }
    }
  }

  return faults;
}

export async function loadConfig(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (e) {
    return { doc: null, faults: [fault("config.unreadable", `cannot read config ${path}: ${e.message}`)], path };
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    return { doc: null, faults: [fault("config.json", `config ${path} is not valid JSON: ${e.message}`)], path };
  }
  const faults = validateConfig(doc);
  return { doc: faults.length === 0 ? doc : null, faults, path };
}

export function findGraph(doc, id) {
  return doc?.graphs?.find((graph) => graph.id === id) ?? null;
}

export function findNode(graph, id) {
  return graph?.nodes?.find((node) => node.id === id) ?? null;
}

export function outputPathFor(graph, node, cwd) {
  return resolve(cwd, graph.outputRoot ?? ".", node.output);
}

export function handoffTarget(node, label) {
  if (!node?.handoff) return null;
  if (node.handoff.mode === "unconditional") return label === "next" ? node.handoff.to : null;
  if (node.handoff.mode === "conditional") {
    return node.handoff.labels.find((entry) => entry.label === label)?.to ?? null;
  }
  return null;
}

export function graphSummary(graph) {
  return {
    id: graph.id,
    maxSteps: graph.maxSteps ?? 100,
    outputRoot: graph.outputRoot ?? ".",
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      helper: node.helper,
      objective: node.objective,
      output: node.output,
      maxVisits: node.maxVisits ?? null,
      handoff:
        node.handoff.mode === "conditional"
          ? { mode: "conditional", labels: node.handoff.labels.map((entry) => entry.label) }
          : { mode: node.handoff.mode, to: node.handoff.to ?? null },
    })),
  };
}

export function configSummary(doc, path) {
  return { configPath: path, graphs: doc.graphs.map(graphSummary) };
}
