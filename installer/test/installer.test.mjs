import test from "node:test";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const suite = fileURLToPath(new URL("./install.test.sh", import.meta.url));

test("installer: the full install/uninstall suite passes", async () => {
  await new Promise((resolve, reject) => {
    execFile("sh", [suite], { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`installer suite failed (${error.code}):\n${stdout}\n${stderr}`));
      } else {
        resolve();
      }
    });
  });
});