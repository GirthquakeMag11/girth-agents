// The mount publisher. Given the loaded graph, it produces the plan of what to
// register in OpenCode's live registries:
//
//   - an agent mounted `primary` or `subagent` becomes an OpenCode agent with
//     its body as the system prompt, its model, description, and permission
//     rules;
//   - the skills such an agent references are published into the skill
//     registry (they auto-follow the mount).
//
// A graph-only mount is never published — its node sessions are provisioned by
// the engine directly, and nothing graph-side enters the OpenCode catalog.
export function materializationPlan(config) {
  const agents = [];
  const skills = new Map();
  for (const graphAgent of config.agents ?? []) {
    const mounts = graphAgent.mounts ?? [];
    // One registry entry per agent; a dual mount collapses to `primary`, and a
    // subagent launch of such an agent rides on that primary entry.
    const mode = mounts.includes("primary") ? "primary" : mounts.includes("subagent") ? "subagent" : null;
    if (mode === null) continue;
    agents.push({
      id: graphAgent.id,
      mode,
      system: graphAgent.prompt ?? "",
      model: graphAgent.model,
      description: graphAgent.description ?? "",
      // Self-contained copy: the plan must not alias live engine state.
      permissions: (graphAgent.permissions ?? []).map((rule) => ({ ...rule })),
    });
    for (const skill of graphAgent.skillDocs ?? []) {
      skills.set(skill.id, {
        id: skill.id,
        name: skill.name ?? skill.id,
        description: skill.description ?? "",
        content: skill.instructions,
      });
    }
  }
  return { agents, skills: [...skills.values()] };
}