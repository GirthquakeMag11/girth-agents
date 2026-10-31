// The graph config: one JSON file, strict schema, named faults, and a
// structural verifier. Any node may be a dispatch entry point; every node
// must reach a terminal, and every cycle must carry a visit bound.

import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const HANDOFF_MODES = new Set(["terminal", "unconditional", "conditional"]);

// The engine's backstop, not the workflow's policy. A graph may set any
// maxVisits up to this; the shipped build-review graph uses 20.
export const MAX_VISITS = 100;

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

function boolean(value, at, faults) {
  if (value === undefined) return;
  if (typeof value !== "boolean") faults.push(fault("schema.boolean", `${at}: must be a boolean`));
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
    strict(handoff, ["mode", "to", "description", "resume"], at, faults);
    string(handoff.to, `${at}.to`, faults);
    if (handoff.to !== undefined && typeof handoff.to === "string" && !nodeIds.has(handoff.to)) {
      faults.push(fault("graph.dangling-handoff", `${at}.to: names no node '${handoff.to}'`));
    }
    if (handoff.description !== undefined) string(handoff.description, `${at}.description`, faults);
    boolean(handoff.resume, `${at}.resume`, faults);
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
    strict(label, ["label", "to", "description", "resume"], labelAt, faults);
    string(label.label, `${labelAt}.label`, faults);
    string(label.to, `${labelAt}.to`, faults);
    string(label.description, `${labelAt}.description`, faults);
    boolean(label.resume, `${labelAt}.resume`, faults);
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

function workflowPath(start, target, byId, allowed) {
  if (start === target) return true;
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length > 0) {
    const id = stack.pop();
    for (const next of edgesOf(byId.get(id))) {
      if (!allowed.has(next) || seen.has(next)) continue;
      if (next === target) return true;
      seen.add(next);
      stack.push(next);
    }
  }
  return false;
}

function validateWorkflows(workflows, at, byId, nodeIds, faults) {
  if (workflows === undefined) return;
  if (!Array.isArray(workflows)) {
    faults.push(fault("schema.workflows", `${at}: must be an array`));
    return;
  }
  const workflowIds = new Set(
    workflows
      .filter((workflow) => isObject(workflow) && typeof workflow.id === "string" && workflow.id.trim() !== "")
      .map((workflow) => workflow.id),
  );
  const ids = new Set();
  for (const [i, workflow] of workflows.entries()) {
    const wfAt = `${at}[${i}]`;
    if (!isObject(workflow)) {
      faults.push(fault("schema.workflow", `${wfAt}: must be an object`));
      continue;
    }
    strict(workflow, ["id", "entry", "exit", "nodes", "connections", "strict"], wfAt, faults);
    string(workflow.id, `${wfAt}.id`, faults);
    string(workflow.entry, `${wfAt}.entry`, faults);
    string(workflow.exit, `${wfAt}.exit`, faults);
    boolean(workflow.strict, `${wfAt}.strict`, faults);
    if (workflow.connections !== undefined) {
      if (!Array.isArray(workflow.connections)) {
        faults.push(fault("schema.workflow-connections", `${wfAt}.connections: must be an array of workflow ids`));
      } else {
        const seen = new Set();
        for (const [j, id] of workflow.connections.entries()) {
          const at = `${wfAt}.connections[${j}]`;
          if (typeof id !== "string" || id.trim() === "") {
            faults.push(fault("schema.workflow-connections", `${at}: must be a non-empty workflow id`));
          } else if (id === workflow.id) {
            faults.push(fault("graph.self-connection", `${at}: workflow '${id}' cannot connect to itself`));
          } else if (seen.has(id)) {
            faults.push(fault("graph.duplicate-connection", `${at}: duplicate '${id}'`));
          } else if (!workflowIds.has(id)) {
            faults.push(fault("graph.unknown-connection", `${at}: names no workflow '${id}'`));
          }
          seen.add(id);
        }
      }
    }
    if (typeof workflow.id === "string" && workflow.id.trim() !== "") {
      if (ids.has(workflow.id)) faults.push(fault("graph.duplicate-workflow", `${wfAt}.id: duplicate '${workflow.id}'`));
      ids.add(workflow.id);
    }
    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      faults.push(fault("schema.workflow-nodes", `${wfAt}.nodes: must be a non-empty array`));
      continue;
    }
    const subset = new Set();
    for (const [j, id] of workflow.nodes.entries()) {
      if (typeof id !== "string" || id.trim() === "") {
        faults.push(fault("schema.workflow-nodes", `${wfAt}.nodes[${j}]: must be a non-empty node id`));
        continue;
      }
      if (subset.has(id)) faults.push(fault("graph.duplicate-workflow-node", `${wfAt}.nodes[${j}]: duplicate '${id}'`));
      subset.add(id);
      if (!nodeIds.has(id)) faults.push(fault("graph.workflow-unknown-node", `${wfAt}.nodes[${j}]: names no node '${id}'`));
    }
    if (typeof workflow.entry === "string" && !nodeIds.has(workflow.entry)) {
      faults.push(fault("graph.workflow-entry", `${wfAt}.entry: names no node '${workflow.entry}'`));
    } else if (typeof workflow.entry === "string" && !subset.has(workflow.entry)) {
      faults.push(fault("graph.workflow-entry", `${wfAt}.entry: '${workflow.entry}' is not in the workflow's nodes`));
    }
    if (typeof workflow.exit === "string" && !nodeIds.has(workflow.exit)) {
      faults.push(fault("graph.workflow-exit", `${wfAt}.exit: names no node '${workflow.exit}'`));
    } else if (typeof workflow.exit === "string" && !subset.has(workflow.exit)) {
      faults.push(fault("graph.workflow-exit", `${wfAt}.exit: '${workflow.exit}' is not in the workflow's nodes`));
    }
    if (subset.size === 0 || typeof workflow.entry !== "string" || typeof workflow.exit !== "string") continue;
    for (const id of subset) {
      if (!workflowPath(workflow.entry, id, byId, subset)) {
        faults.push(fault("graph.workflow-unreachable", `${wfAt}: '${id}' is not reachable from entry '${workflow.entry}'`));
      }
      if (!workflowPath(id, workflow.exit, byId, subset)) {
        faults.push(fault("graph.workflow-unreachable", `${wfAt}: '${id}' cannot reach exit '${workflow.exit}'`));
      }
    }
  }
}

function validateGraph(graph, at, helperIds, faults) {
  if (!isObject(graph)) {
    faults.push(fault("schema.graph", `${at}: must be an object`));
    return;
  }
  strict(graph, ["outputRoot", "maxSteps", "workflows", "nodes"], at, faults);
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
    if (node.maxVisits !== undefined && Number.isInteger(node.maxVisits) && node.maxVisits > MAX_VISITS) {
      faults.push(fault("schema.maxvisits", `${nodeAt}.maxVisits: the engine's hard ceiling is ${MAX_VISITS}`));
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

  validateWorkflows(graph.workflows, `${at}.workflows`, byId, nodeIds, faults);
}

export function validateConfig(doc) {
  const faults = [];
  if (!isObject(doc)) return [fault("schema.config", "config must be an object")];
  strict(doc, ["version", "helpers", "graph"], "config", faults);
  if (doc.version !== "3") faults.push(fault("schema.version", "config.version: must be the string '3'"));

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

  if (!isObject(doc.graph)) {
    faults.push(fault("schema.graph", "config.graph: must be an object"));
  } else {
    validateGraph(doc.graph, "config.graph", helperIds, faults);
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

export function findNode(graph, id) {
  return graph?.nodes?.find((node) => node.id === id) ?? null;
}

export function outputPathFor(graph, node, cwd) {
  return resolve(cwd, graph.outputRoot ?? ".", node.output);
}

export function handoffResume(node, label) {
  if (!node?.handoff) return false;
  if (node.handoff.mode === "unconditional") return node.handoff.resume === true;
  if (node.handoff.mode === "conditional") {
    return node.handoff.labels.find((entry) => entry.label === label)?.resume === true;
  }
  return false;
}

export function resumableNodes(graph) {
  const ids = new Set();
  for (const node of graph.nodes ?? []) {
    if (node.handoff?.mode === "unconditional" && node.handoff.resume === true) ids.add(node.handoff.to);
    if (node.handoff?.mode === "conditional") {
      for (const label of node.handoff.labels ?? []) {
        if (label.resume === true) ids.add(label.to);
      }
    }
  }
  return ids;
}

export function handoffTarget(node, label) {
  if (!node?.handoff) return null;
  if (node.handoff.mode === "unconditional") return label === "next" ? node.handoff.to : null;
  if (node.handoff.mode === "conditional") {
    return node.handoff.labels.find((entry) => entry.label === label)?.to ?? null;
  }
  return null;
}

export function workflowById(graph, id) {
  return (graph.workflows ?? []).find((workflow) => workflow.id === id) ?? null;
}

export function workflowsForNode(graph, nodeId) {
  return (graph.workflows ?? [])
    .filter((workflow) => workflow.nodes.includes(nodeId))
    .map((workflow) => workflow.id);
}

export function allowedWorkflows(graph, workflowId) {
  const byId = new Map((graph.workflows ?? []).map((workflow) => [workflow.id, workflow]));
  const allowed = new Set();
  if (!byId.has(workflowId)) return allowed;
  allowed.add(workflowId);
  const stack = [workflowId];
  while (stack.length > 0) {
    const workflow = byId.get(stack.pop());
    for (const next of workflow?.connections ?? []) {
      if (!allowed.has(next) && byId.has(next)) {
        allowed.add(next);
        stack.push(next);
      }
    }
  }
  return allowed;
}

export function graphSummary(graph) {
  return {
    maxSteps: graph.maxSteps ?? 100,
    outputRoot: graph.outputRoot ?? ".",
    workflows: graph.workflows ?? [],
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

export function graphInfoResponse(doc, path, version) {
  return { ok: true, version, valid: true, ...configSummary(doc, path) };
}

export function configSummary(doc, path) {
  return {
    configPath: path,
    graph: graphSummary(doc.graph),
    helpers: doc.helpers.map((helper) => ({
      id: helper.id,
      model: helper.model,
      agent: helper.agent ?? "build",
      permissions: helper.permissions,
      craft: helper.craft ?? null,
    })),
  };
}
