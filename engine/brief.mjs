// The brief is the whole input to a node: the graph agent's standing prompt, the
// dispatched prompt, the node's objective, the upstream context, the exact
// output path, and the generated handoff tools the node may use.

function handoffSection(node, hasOutput) {
  if (node.handoff.mode === "terminal") {
    const ending = hasOutput ? "Write the output, then end your turn." : "End your turn.";
    return [
      "## Ending",
      `This is the last node. Do not call a handoff tool. ${ending}`,
    ].join("\n\n");
  }

  const when = hasOutput
    ? "When the output exists and the objective is met"
    : "When the objective is met";

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

export function composeBrief({ graphAgent, node, prompt, previousOutput, previousMessage, outputAbs }) {
  const parts = [];
  if (graphAgent.prompt) parts.push(`# Your instructions\n\n${graphAgent.prompt}`);
  for (const skill of graphAgent.skillDocs ?? []) {
    parts.push(`# Skill: ${skill.id}\n\n${skill.instructions}`);
  }
  parts.push(`# Work\n\n${prompt}`);
  parts.push(`# Your objective\n\n${node.objective}`);

  const upstream = [];
  if (previousMessage) upstream.push(previousMessage);
  if (previousOutput) {
    upstream.push(`The previous node's verified output is at:\n\n\`${previousOutput}\``);
  }
  if (upstream.length > 0) {
    parts.push(`# Input from the previous node\n\n${upstream.join("\n\n")}`);
  } else {
    parts.push("# Input\n\nThis is the start node; the work above is your input.");
  }

  if (outputAbs) {
    parts.push(
      `# Output\n\nWrite your result to this exact path:\n\n\`${outputAbs}\`\n\n` +
        "The file must exist and be non-empty before you hand off. Create parent directories if needed. " +
        "Do not write to a different path and expect the engine to find it.",
    );
  }

  parts.push(handoffSection(node, Boolean(outputAbs)));

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
