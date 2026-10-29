// The live OpenCode session client. Every fact here is wire-level:
// create a session with an agent, a model ref, a location, and a permission
// ruleset; prompt it; wait for idle; then poll the session's own outcome.
// The wait endpoint's 204 is an idle signal, never a verdict.

import { basicAuth, discover } from "./service.mjs";

const OUTCOMES = new Set(["succeeded", "failed", "interrupted"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function defect(kind, message) {
  const err = new Error(message);
  err.kind = kind;
  return err;
}

export function modelRef(model) {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1) {
    throw defect("model-ref", `model '${model}' is not a 'provider/model' reference`);
  }
  return { id: model.slice(slash + 1), providerID: model.slice(0, slash) };
}

// A leading deny is the deny-rest. An allow-only list is not deny-rest:
// unlisted tools stay visible and default to ask on the live wire.
export function permissionsFor({ handoff = false, allow = [] } = {}) {
  const actions = [];
  if (handoff) actions.push("handoff");
  for (const action of allow) {
    if (typeof action === "string" && action.trim() !== "" && !actions.includes(action)) actions.push(action);
  }
  return [
    { action: "*", resource: "*", effect: "deny" },
    ...actions.map((action) => ({ action, resource: "*", effect: "allow" })),
  ];
}

export async function createDriver({ serviceFile, fetchImpl = fetch } = {}) {
  const endpoint = await discover(serviceFile, fetchImpl);
  const auth = basicAuth(endpoint.password);

  async function req(path, { method = "GET", body, timeoutMs = 60000 } = {}) {
    let res;
    try {
      res = await fetchImpl(endpoint.url + path, {
        method,
        headers: {
          authorization: auth,
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      throw defect("http", `${method} ${path} failed: ${e.message}`);
    }
    const text = await res.text();
    let json = null;
    if (text !== "") {
      try {
        json = JSON.parse(text);
      } catch {
        // non-JSON bodies are reported as text by the caller
      }
    }
    return { res, text, json };
  }

  async function getSession(sessionID) {
    const { res, text, json } = await req(`/api/session/${encodeURIComponent(sessionID)}`);
    if (!res.ok) throw defect("session-get", `session get returned ${res.status}: ${text.slice(0, 300)}`);
    const info = json?.data;
    if (!info) throw defect("session-get", "session get answered without data");
    return info;
  }

  return {
    endpoint,
    async createSession({ directory, title, agent = "build", model, permissions }) {
      const { res, text, json } = await req("/api/session", {
        method: "POST",
        body: {
          agent,
          model: modelRef(model),
          location: { directory },
          ...(title ? { title } : {}),
          permissions,
        },
      });
      if (!res.ok) throw defect("session-create", `session create returned ${res.status}: ${text.slice(0, 500)}`);
      const session = json?.data;
      if (!session?.id) throw defect("session-create", "session create answered without a session id");
      return session;
    },

    async prompt(sessionID, text, { budgetMs = 600000, pollMs = 250 } = {}) {
      const admitted = await req(`/api/session/${encodeURIComponent(sessionID)}/prompt`, {
        method: "POST",
        body: { text },
        timeoutMs: Math.min(Math.max(budgetMs, 1000), 120000),
      });
      if (!admitted.res.ok) {
        throw defect("session-prompt", `session prompt returned ${admitted.res.status}: ${admitted.text.slice(0, 500)}`);
      }

      // Fast path: the experimental wait resolves to idle. It is never the
      // completion authority, so always fall through to the session state.
      try {
        const waited = await req(`/api/experimental/session/${encodeURIComponent(sessionID)}/wait`, {
          method: "POST",
          timeoutMs: Math.max(budgetMs, 1000),
        });
        if (!waited.res.ok && ![404, 503].includes(waited.res.status)) {
          throw defect("session-wait", `session wait returned ${waited.res.status}`);
        }
      } catch (e) {
        if (e.kind === "session-wait") throw e;
        // A failed or absent wait is not a verdict; poll below.
      }

      const deadline = Date.now() + budgetMs;
      for (;;) {
        const info = await getSession(sessionID);
        if (OUTCOMES.has(info.outcome)) return info;
        if (Date.now() >= deadline) {
          try {
            await this.interrupt(sessionID);
          } catch {
            // the timeout is still the verdict
          }
          throw defect("session-timeout", `session ${sessionID} did not reach an outcome within ${budgetMs}ms`);
        }
        await sleep(pollMs);
      }
    },

    async messages(sessionID) {
      let r = await req(`/api/session/${encodeURIComponent(sessionID)}/message`);
      if (!r.res.ok) {
        r = await req(`/api/session/${encodeURIComponent(sessionID)}/context`);
      }
      if (!r.res.ok) {
        throw defect("session-messages", `session history returned ${r.res.status}: ${r.text.slice(0, 300)}`);
      }
      return r.json?.data ?? [];
    },

    async command(sessionID, name, text = "") {
      const { res, text: body } = await req(`/api/session/${encodeURIComponent(sessionID)}/command`, {
        method: "POST",
        body: { name, text },
      });
      if (!res.ok) throw defect("session-command", `session command returned ${res.status}: ${body.slice(0, 300)}`);
    },

    async plugins(directory) {
      const qs = new URLSearchParams({ "location[directory]": directory });
      const { res, text, json } = await req(`/api/plugin?${qs}`);
      if (!res.ok) throw defect("plugin-list", `plugin list returned ${res.status}: ${text.slice(0, 300)}`);
      return json?.data ?? [];
    },

    async interrupt(sessionID) {
      const { res, json } = await req(`/api/session/${encodeURIComponent(sessionID)}/interrupt`, { method: "POST" });
      return res.ok ? json : null;
    },

    async deleteSession(sessionID) {
      try {
        await req(`/api/session/${encodeURIComponent(sessionID)}`, { method: "DELETE" });
      } catch {
        // a finished session that cannot be deleted is not a routing defect
      }
    },

    getSession,
    get info() {
      return endpoint.info;
    },
  };
}
