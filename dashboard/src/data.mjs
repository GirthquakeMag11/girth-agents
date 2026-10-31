import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function engineEndpoint(directory) {
  const source = await readFile(join(directory, ".opencode", "plugins", "engine-handoff", "index.ts"), "utf8");
  const url = /const ENGINE_URL = "([^"]+)"/.exec(source)?.[1];
  const token = /const TOKEN = "([^"]+)"/.exec(source)?.[1];
  if (!url || !token) throw new Error("engine endpoint is not installed in this workspace");
  return { url, token };
}

export async function post(url, token, path, body = {}) {
  const res = await fetch(url + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-engine-token": token },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(2500),
  });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error ?? `${path} failed`);
  return json;
}

export function runtimeFromMap(map) {
  if (!map?.runtime || typeof map.runtime !== "object") {
    throw new Error("graph-map did not return structured runtime");
  }
  return {
    paused: map.runtime.paused === true,
    active: map.runtime.active ?? null,
    queue: Array.isArray(map.runtime.queue) ? map.runtime.queue : [],
    lastDefect: map.runtime.lastDefect ?? null,
    lastEvent: map.runtime.lastEvent ?? null,
    history: Array.isArray(map.runtime.history) ? map.runtime.history : [],
    historyEpoch: typeof map.runtime.historyEpoch === "string" ? map.runtime.historyEpoch : "",
  };
}

export async function hydrateRuntime(runtime, fetchStatus) {
  const hydrate = async (record) => {
    if (!record?.dispatchId) return record;
    try {
      const live = await fetchStatus(record.dispatchId);
      if (!live?.ok) return record;
      const { ok, ...status } = live;
      return { ...record, ...status };
    } catch {
      return record;
    }
  };
  const [active, queue] = await Promise.all([
    runtime.active ? hydrate(runtime.active) : Promise.resolve(null),
    Promise.all(runtime.queue.map(hydrate)),
  ]);
  return { ...runtime, active, queue };
}

export async function loadDashboard(directory) {
  const { url, token } = await engineEndpoint(directory);
  const info = await post(url, token, "/tool/graph-info");
  const map = await post(url, token, "/tool/graph-map");
  const runtime = await hydrateRuntime(runtimeFromMap(map), (dispatchId) =>
    post(url, token, "/tool/dispatch/status", { dispatchId }),
  );
  const config = JSON.parse(await readFile(info.configPath, "utf8"));
  return { config, info, runtime, fetchedAt: new Date() };
}
