// Service discovery and attach: a second process becomes an OpenCode
// server client exactly the way the TUI does — read the registration
// file the server writes, authenticate with its Basic credentials, and
// verify health and identity before trusting it. Failure is a typed
// defect, never a guess: the password and the port are never hardcoded.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export const DEFAULT_SERVICE_FILE = join(homedir(), ".local", "state", "opencode", "service.json");

export function basicAuth(password) {
  return "Basic " + Buffer.from(`opencode:${password}`).toString("base64");
}

export async function discover(serviceFile = process.env.OPENCODE_SERVICE_FILE || DEFAULT_SERVICE_FILE, fetchImpl = fetch) {
  let registration;
  try {
    registration = JSON.parse(await readFile(serviceFile, "utf8"));
  } catch (e) {
    const err = new Error(`cannot read the service registration file ${serviceFile}: ${e.message}`);
    err.kind = "service-discovery";
    throw err;
  }
  const { url, password } = registration;
  if (!url || !password) {
    const err = new Error(`service registration file ${serviceFile} lacks url or password`);
    err.kind = "service-discovery";
    throw err;
  }
  let info;
  try {
    const res = await fetchImpl(`${url}/api/info`, {
      headers: { authorization: basicAuth(password) },
    });
    if (!res.ok) {
      const err = new Error(`service health check returned ${res.status}`);
      err.kind = "service-health";
      throw err;
    }
    info = await res.json();
  } catch (e) {
    if (e.kind) throw e;
    const err = new Error(`service health check failed: ${e.message}`);
    err.kind = "service-health";
    throw err;
  }
  return { url, password, info };
}