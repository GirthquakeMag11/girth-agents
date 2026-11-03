// The mount publisher. Given the loaded graph and its base directory, it
// produces the plan of what to register in OpenCode's live registries,
// shaped for the real SDK (verified against the OpenCode source, not the
// in-process harness):
//
//   - an agent mounted `primary` or `subagent` becomes an OpenCode agent whose
//     `update` upsert receives OpenCode's `Agent.Info` shape: mode
//     ("primary" | "subagent" | "all"), a `Model.Ref` (`{ providerID, id,
//     variant? }`), system, description, and permission rules;
//   - the skills such an agent references are published into the skill
//     registry as `Skill.Info` (`{ id, name, path, content, ... }`), where
//     `path` is the absolute path of the graph skill document.
//
// A graph-only mount is never published — its node sessions are provisioned by
// the engine directly, and nothing graph-side enters the OpenCode catalog.
import { resolve } from "node:path";

export function materializationPlan(config, baseDir) {
  const agents = [];
  const skills = new Map();
  for (const graphAgent of config.agents ?? []) {
    const mounts = graphAgent.mounts ?? [];
    // OpenCode's Agent.Info mode is a three-way: "primary" (selectable, not
    // subagent-launchable), "subagent" (launchable, not selectable), and "all"
    // (both). A graph agent mounted both ways maps to "all", not a collapse.
    const primary = mounts.includes("primary");
    const subagent = mounts.includes("subagent");
    const mode = primary && subagent ? "all" : primary ? "primary" : subagent ? "subagent" : null;
    if (mode === null) continue;
    agents.push({
      id: graphAgent.id,
      mode,
      system: graphAgent.prompt ?? "",
      model: parseModelRef(graphAgent.model),
      description: graphAgent.description ?? "",
      // Self-contained copy: the plan must not alias live engine state.
      permissions: (graphAgent.permissions ?? []).map((rule) => ({ ...rule })),
    });
    for (const skill of graphAgent.skillDocs ?? []) {
      skills.set(skill.id, {
        id: skill.id,
        name: skill.name ?? skill.id,
        description: skill.description ?? "",
        path: resolve(baseDir, skill.path ?? `skills/${skill.id}.md`),
        content: skill.instructions,
      });
    }
  }
  return { agents, skills: [...skills.values()] };
}

// `"provider/id#variant"` -> `{ providerID, id, variant? }`, mirroring the
// SDK's Model.Ref.parse (split on the first "/", then on "#").
function parseModelRef(model) {
  const slash = model.indexOf("/");
  if (slash <= 0) return { providerID: "", id: model };
  const providerID = model.slice(0, slash);
  const rest = model.slice(slash + 1);
  const hash = rest.indexOf("#");
  if (hash === -1) return { providerID, id: rest };
  return { providerID, id: rest.slice(0, hash), variant: rest.slice(hash + 1) };
}