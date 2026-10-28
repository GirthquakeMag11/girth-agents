// The config gate, run by hand: node engine/verify-config-cli.mjs <manifest.json>
// Sound config: "config sound", exit 0. Anything the loader or the
// verifier names is the config's own fault; exit 1.

import { loadConfig } from "./config-loader.mjs";
import { verifyConfig } from "./verify-config.mjs";

const [path] = process.argv.slice(2);
if (!path) {
  console.error("usage: node engine/verify-config-cli.mjs <manifest.json>");
  process.exit(2);
}

const loaded = await loadConfig(path);
if (loaded.faults.length > 0) {
  for (const fault of loaded.faults) {
    console.log(`config fault [${fault.code}] ${fault.message}`);
  }
  console.log(`${loaded.faults.length} config fault(s)`);
  process.exit(1);
}

const result = await verifyConfig(loaded.doc);
if (result.valid) {
  console.log("config sound");
  process.exit(0);
}
for (const fault of result.configFaults) {
  console.log(`config fault [${fault.code}] ${fault.message}`);
}
console.log(`${result.configFaults.length} config fault(s)`);
process.exit(1);