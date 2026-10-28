// The config seam: a config string in, a verdict out. Invalid config
// refuses loudly — every reason names the constraint it broke.

export function validateConfig(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { valid: false, reasons: [`config: not valid JSON (${e.message})`] };
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { valid: false, reasons: ["config: must be a JSON object"] };
  }
  const reasons = [];
  if (typeof doc.version !== "string" || !/^\d+$/.test(doc.version)) {
    reasons.push("config.version: must be a numeric-version string");
  }
  if (doc.helpers === undefined || doc.helpers === null || typeof doc.helpers !== "object" || Array.isArray(doc.helpers)) {
    reasons.push("config.helpers: required, an object");
  } else {
    for (const [id, fitting] of Object.entries(doc.helpers)) {
      if (fitting === null || typeof fitting !== "object") {
        reasons.push(`config.helpers.${id}: must be an object`);
      } else if (typeof fitting.job !== "string" || fitting.job.trim() === "") {
        reasons.push(`config.helpers.${id}.job: required, a non-empty string`);
      }
    }
  }
  if (doc.graph === undefined || doc.graph === null || typeof doc.graph !== "object") {
    reasons.push("config.graph: required, an object");
  } else {
    if (!Array.isArray(doc.graph.nodes)) reasons.push("config.graph.nodes: must be an array");
    if (!Array.isArray(doc.graph.links)) reasons.push("config.graph.links: must be an array");
  }
  return { valid: reasons.length === 0, reasons };
}