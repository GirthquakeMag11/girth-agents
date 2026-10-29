// The brief is the whole input to a node: the helper's standing craft, the
// dispatched prompt, the node's objective, the upstream output path, the
// exact output path, and the labels the helper may use to hand off.

function handoffSection(node) {
  if (node.handoff.mode === "terminal") {
    return [
      "## Ending",
      "This is the last node. Do not call the handoff tool. Write the output, then end your turn.",
    ].join("\n\n");
  }

  if (node.handoff.mode === "unconditional") {
    const description = node.handoff.description ? ` — ${node.handoff.description}` : "";
    return [
      "## Handoff",
      `When the output exists and the objective is met, call the \`handoff\` tool exactly once with label \`next\`${description}.`,
      "Do not call it before the output exists. Do not call it more than once. Stop after the call.",
    ].join("\n\n");
  }

  const labels = node.handoff.labels
    .map((entry) => `- \`${entry.label}\` — ${entry.description}`)
    .join("\n");
  return [
    "## Handoff",
    "When the output exists and the objective is met, call the `handoff` tool exactly once with one of these labels:",
    labels,
    "Do not call it before the output exists. Do not call it more than once. Do not use any other label. Stop after the call.",
  ].join("\n\n");
}

export function composeBrief({ helper, node, prompt, previousOutput, outputAbs }) {
  const parts = [];
  if (helper.craft) parts.push(`# Your craft\n\n${helper.craft}`);
  parts.push(`# Work\n\n${prompt}`);
  parts.push(`# Your objective\n\n${node.objective}`);

  if (previousOutput) {
    parts.push(
      `# Input from the previous node\n\nRead this file if your objective needs it:\n\n\`${previousOutput}\`\n\nIt is the previous node's verified output.`,
    );
  } else {
    parts.push("# Input\n\nThis is the start node; the work above is your input.");
  }

  parts.push(
    `# Output\n\nWrite your result to this exact path:\n\n\`${outputAbs}\`\n\n` +
      "The file must exist and be non-empty before you hand off. Create parent directories if needed. " +
      "Do not write to a different path and expect the engine to find it.",
  );

  parts.push(handoffSection(node));

  parts.push(
    [
      "## Rules",
      "",
      "- Do not write after you hand off.",
      "- Do not call a control tool; you have only the handoff lever and your work tools.",
      "- If you cannot complete the work and no declared label fits, let the session fail and say what blocked you.",
    ].join("\n"),
  );

  return parts.join("\n\n") + "\n";
}
