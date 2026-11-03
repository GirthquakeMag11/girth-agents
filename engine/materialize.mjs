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
import { modelRef, permissionsFor } from "./driver.mjs";

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
      model: modelRef(graphAgent.model),
      description: graphAgent.description ?? "",
      // Mounts are deny-by-default, exactly like graph node sessions: tools
      // acquire by name, explicit permission triples win (appended later), and
      // `subagents` becomes the launch allowlist. `@GRAPH_DIR@` in a rule's
      // resource expands to this graph's directory, so a mount can scope a
      // permission to its own graph without knowing the install path.
      permissions: permissionsFor({
        rules: [
          ...(graphAgent.tools ?? []).map((name) => ({ action: name, resource: "*", effect: "allow" })),
          ...(graphAgent.permissions ?? []).map((rule) =>
            typeof rule.resource === "string"
              ? { ...rule, resource: rule.resource.replaceAll("@GRAPH_DIR@", baseDir) }
              : rule,
          ),
        ],
        subagents: graphAgent.subagents ?? [],
      }),
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