// The brief is the whole input to a node: the dispatched prompt, the node's
// objective, the upstream message, the resolved skills, and the generated
// handoff tools the node may use. The graph agent's body is NOT here — it is
// injected as the session's system prompt by the plugin (see runtime.mjs
// sessionSystem); skills stay in the brief.

function handoffSection(node) {
  if (node.handoff.mode === "terminal") {
    return [
      "## Ending",
      "This is the last node. Do not call a handoff tool. End your turn.",
    ].join("\n\n");
  }

  const when = "When the objective is met";

  if (node.handoff.mode === "unconditional") {
    const description = node.handoff.description ? ` — ${node.handoff.description}` : "";
    return [
      "## Handoff",
      `${when}, call the \`next\` tool exactly once with a message${description}.`,
      "Do not call more than one handoff tool. Stop after the call.",
    ].join("\n\n");
  }

  const labels = node.handoff.labels
    .map((entry) => `- \`${entry.label}\` — ${entry.description}`)
    .join("\n");
  return [
    "## Handoff",
    `${when}, call exactly one of these tools with a message:`,
    labels,
    "Do not call more than one handoff tool. Stop after the call.",
  ].join("\n\n");
}

export function composeBrief({ graphAgent, node, prompt, previousMessage, inputSource = "node" }) {
  const parts = [];
  for (const skill of graphAgent.skillDocs ?? []) {
    parts.push(`# Skill: ${skill.id}\n\n${skill.instructions}`);
  }
  parts.push(`# Work\n\n${prompt}`);
  parts.push(`# Your objective\n\n${node.objective}`);

  if (previousMessage) {
    const heading = inputSource === "dispatcher" ? "# Input from the dispatcher" : "# Input from the previous node";
    parts.push(`${heading}\n\n${previousMessage}`);
  } else {
    parts.push("# Input\n\nThis is the start node; the work above is your input.");
  }

  parts.push(handoffSection(node));

  parts.push(
    [
      "## Rules",
      "",
      "- Do not write after you hand off.",
      "- Do not call a control tool; you have only your handoff tools and your work tools.",
      "- If you cannot complete the work and no declared label fits, let the session fail and say what blocked you.",
    ].join("\n"),
  );

  return parts.join("\n\n") + "\n";
}
