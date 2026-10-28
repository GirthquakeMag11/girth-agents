// The graph executor core: hardcoded flow structure, config-driven
// everything else. It walks a schema-valid graph — dispatch through the
// session driver, read only the node's configured artifact, route by
// the stamp fields its conditions parse — and halts on any defect.
// It knows no particular workflow.

const DEFAULT_BUDGET_MS = 30000;
const MAX_STEPS = 1000;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createExecutor({ graph, driver, readFile, artifactPath, writeExitRecord, onStep, agents = {} }) {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));

  const composeBrief = (node, previousStamps) => {
    const fitting = agents[node.helper];
    const parts = [];
    if (fitting?.body) parts.push(fitting.body);
    for (const skill of fitting?.skills ?? []) {
      parts.push(`# Skill: ${skill.id}\n\n${skill.instructions}`);
    }
    if (node.objective) parts.push(`# Objective\n\n${node.objective}`);
    if (node.body) parts.push(node.body);
    if (node.artifact) parts.push(`Produce your output artifact at: ${node.artifact}`);
    if (previousStamps) {
      parts.push(`# The reviewer's report\n\n${JSON.stringify(previousStamps, null, 2)}`);
    }
    return parts.join("\n\n");
  };
  const linksFrom = new Map();
  for (const link of graph.links) {
    const list = linksFrom.get(link.from) ?? [];
    list.push(link);
    linksFrom.set(link.from, list);
  }

  function route(nodeId, stamps) {
    const links = linksFrom.get(nodeId) ?? [];
    if (links.length === 0) return null;
    for (const link of links) {
      if (link.condition && stamps[link.condition.field] === link.condition.equals) return link.to;
    }
    return links.find((l) => !l.condition)?.to ?? null;
  }

  async function run({ projectId, entryNode, directory }) {
    const steps = [];
    const pushStep = (step) => {
      steps.push(step);
      if (onStep) onStep({ projectId, ...step });
    };
    const sessionByNode = new Map();
    const visitCount = new Map();
    let lastStamps = undefined;
    let current = entryNode;
    const start = nodes.get(entryNode);
    if (!start) {
      return { projectId, steps, failure: { kind: "unknown-entry", message: `no node named ${entryNode}` } };
    }

    for (let guard = 0; guard < MAX_STEPS; guard++) {
      const node = nodes.get(current);
      if (!node) {
        return { projectId, steps, failure: { kind: "no-node", message: `graph names no node ${current}` } };
      }

      if (node.type === "exit") {
        let exit;
        if (node.record && writeExitRecord) {
          exit = await writeExitRecord({ projectId, node, steps });
        }
        return { projectId, terminal: node.id, steps, failure: undefined, exit };
      }

      if (node.type === "entry") {
        pushStep({ nodeId: node.id, projectId, outcome: "entered" });
        const next = route(node.id, {});
        if (next === null) {
          return { projectId, steps, failure: { kind: "no-link", message: `entry ${node.id} has no outbound link` } };
        }
        current = next;
        continue;
      }

      if (node.type !== "task") {
        return { projectId, steps, failure: { kind: "bad-node", message: `node ${node.id} has unknown type ${node.type}` } };
      }

      const visits = (visitCount.get(node.id) ?? 0) + 1;
      if (node.maxVisits !== undefined && visits > node.maxVisits) {
        const exhausted = (linksFrom.get(node.id) ?? []).find((l) => l.exhausted);
        if (exhausted) {
          pushStep({ nodeId: node.id, projectId, outcome: "exhausted" });
          current = exhausted.to;
          continue;
        }
        return {
          projectId,
          steps,
          failure: { kind: "retry-limit", message: `node ${node.id} exceeded its maxVisits of ${node.maxVisits} with no exhausted link` },
        };
      }
      visitCount.set(node.id, visits);

      let sessionIdx;
      if (node.resume) {
        sessionIdx = sessionByNode.get(node.resume);
        if (sessionIdx === undefined) {
          pushStep({ nodeId: node.id, projectId, outcome: "resume-missing" });
          return {
            projectId,
            steps,
            failure: { kind: "resume-missing", message: `node ${node.id} resumes ${node.resume}, whose session is not in this run` },
          };
        }
      } else {
        try {
          sessionIdx = await driver.spawn({ nodeId: node.id, helper: node.helper, projectId, directory, node });
        } catch (e) {
          pushStep({ nodeId: node.id, projectId, outcome: "dispatch-defect" });
          return { projectId, steps, failure: { kind: "dispatch-defect", message: e.message } };
        }
        sessionByNode.set(node.id, sessionIdx);
      }
      if (onStep) onStep({ projectId, nodeId: node.id, outcome: "dispatched", sessionIdx, at: new Date().toISOString() });
      const brief = composeBrief(node, node.resume ? lastStamps : undefined);
      const promptPromise = driver.prompt(sessionIdx, brief);
      const budgetMs = node.budgetMs ?? DEFAULT_BUDGET_MS;
      let timer;
      const budget = new Promise((resolve) => {
        timer = setTimeout(() => resolve("TIME"), budgetMs);
      });

      const raced = await Promise.race([promptPromise, budget]);
      clearTimeout(timer);
      if (raced === "TIME") {
        driver.interrupt(sessionIdx);
        await promptPromise;
        pushStep({ nodeId: node.id, projectId, outcome: "interrupted" });
        return {
          projectId,
          steps,
          failure: { kind: "time-budget", message: `step ${node.id} breached its ${budgetMs}ms budget` },
        };
      }

      if (raced.outcome === "failed") {
        pushStep({ nodeId: node.id, projectId, outcome: "failed" });
        return { projectId, steps, failure: { kind: "session-failed", message: `step ${node.id}'s session failed` } };
      }

      if (raced.outcome === "interrupted") {
        pushStep({ nodeId: node.id, projectId, outcome: "interrupted" });
        return { projectId, steps, failure: { kind: "session-interrupted", message: `step ${node.id} was interrupted` } };
      }

      // Succeeded: read exactly the configured artifact — nothing else is output.
      const path = artifactPath(projectId, node);
      let stamps;
      try {
        const content = await readFile(path);
        if (content === null) {
          pushStep({ nodeId: node.id, projectId, outcome: "artifact-missing" });
          return { projectId, steps, failure: { kind: "artifact-missing", message: `step ${node.id}: no artifact at ${path}` } };
        }
        stamps = JSON.parse(content);
        if (stamps === null || typeof stamps !== "object") {
          throw new Error("artifact is not a JSON object");
        }
      } catch (e) {
        pushStep({ nodeId: node.id, projectId, outcome: "artifact-malformed" });
        return {
          projectId,
          steps,
          failure: { kind: "artifact-malformed", message: `step ${node.id}: artifact at ${path} is malformed (${e.message})` },
        };
      }

      pushStep({ nodeId: node.id, projectId, outcome: "succeeded", stamps });
      lastStamps = stamps;

      const next = route(node.id, stamps);
      if (next === null) {
        return {
          projectId,
          steps,
          failure: { kind: "no-link", message: `step ${node.id}: no routable outbound link` },
        };
      }
      current = next;
    }

    return { projectId, steps, failure: { kind: "step-overflow", message: `more than ${MAX_STEPS} steps` } };
  }

  return { run };
}