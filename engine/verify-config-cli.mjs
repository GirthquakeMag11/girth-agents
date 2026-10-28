// The config gate, run by hand: node engine/verify-config-cli.mjs <path>
// Sound config: "config sound", exit 0. Anything the verifier names is
// the config's own fault; exit 1.

import { readFileSync } from "node:fs";
import { verifyConfig } from "./verify-config.mjs";

const [path] = process.argv.slice(2);
if (!path) {
  console.error("usage: node engine/verify-config-cli.mjs <config.json>");
  process.exit(2);
}
let text;
try {
  text = readFileSync(path, "utf8");
} catch (e) {
  console.error(`cannot read ${path}: ${e.message}`);
  process.exit(2);
}
const result = await verifyConfig(text);
if (result.valid) {
  console.log("config sound");
  process.exit(0);
}
for (const fault of result.configFaults) {
  console.log(`config fault [${fault.code}] ${fault.message}`);
}
console.log(`${result.configFaults.length} config fault(s)`);
process.exit(1);