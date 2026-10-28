// The live session driver: the engine's own OpenCode server client,
// implementing the same spawn/prompt/interrupt contract the executor was
// built around. Sessions are created with the helper's model and its
// pre-granted permissions — deny-rest by construction — and the
// dispatch-time check fails a mismatch before anything spawns.

import { basicAuth, discover } from "./service.mjs";

const OTHER = ["succeeded", "failed", "interrupted"];
const POLL_EVERY_MS = 200;

// The live-verified wire contract (OpenCode 2.1.4, probed against the
// running service on 2026-10-28): session creation takes a Model.Ref
// { id, providerID }, a Location.PublicRef { directory }, and a
// Permission.Ruleset array of { action, resource, effect } triples;
// every response is wrapped in { data: … }. The fakes mirror exactly
// this envelope so a wire drift can never hide behind a stand-in again.
export function modelRef(fittingModel) {
  const slash = fittingModel.indexOf("/");
  if (slash <= 0) {
    const err = new Error(`helper model '${fittingModel}' is not a 'provider/model' reference`);
    err.kind = "model-ref";
    throw err;
  }
  return { id: fittingModel.slice(slash + 1), providerID: fittingModel.slice(0, slash) };
}

function rules(fitting) {
  // Live-verified against the running service: a wildcard deny shadows
  // every allow and leaves the helper with no tools at all. The rule
  // set is the deny-rest itself — only the allowed actions are listed;
  // anything unlisted is not granted.
  return (fitting.allow ?? []).map((entry) => ({ action: entry, resource: "*", effect: "allow" }));
}

export class DispatchDefect extends Error {
  constructor(message) {
    super(message);
    this.kind = "dispatch-defect";
  }
}

export async function createServerDriver({ serviceFile, fittings = {}, fetchImpl = fetch } = {}) {
  const endpoint = await discover(serviceFile, fetchImpl);
  const headers = { authorization: basicAuth(endpoint.password) };

  const req = async (path, { method = "GET", body } = {}) => {
    const res = await fetchImpl(endpoint.url + path, {
      method,
      headers: { ...headers, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return res;
  };

  const sessions = new Map(); // idx -> { id, stopped }

  function fittingFor(helper, nodeId) {
    const fitting = fittings[helper];
    if (!fitting) {
      throw new DispatchDefect(`node ${nodeId}: no fitting for helper '${helper}'`);
    }
    if (!Array.isArray(fitting.capabilities) || fitting.capabilities.length === 0) {
      throw new DispatchDefect(`node ${nodeId}: helper '${helper}' carries no pre-granted capabilities`);
    }
    if (fitting.permissions === undefined) {
      throw new DispatchDefect(`node ${nodeId}: helper '${helper}' carries no permissions ruleset`);
    }
    return fitting;
  }

  return {
    endpoint,
    async spawn({ nodeId, helper, directory, node }) {
      const fitting = fittingFor(helper, nodeId);
      if (node?.requires) {
        const missing = node.requires.filter((r) => !fitting.capabilities.includes(r));
        if (missing.length > 0) {
          throw new DispatchDefect(`node ${nodeId}: '${helper}' lacks ${missing.join(", ")}`);
        }
      }
      const res = await req("/api/session", {
        method: "POST",
        body: {
          // the OpenCode coding agent: without an agent the session has
          // no tools, and a helper without hands can only narrate
          agent: fitting.agent ?? "build",
          model: modelRef(fitting.model),
          location: { directory },
          permissions: rules(fitting.permissions),
        },
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        const err = new Error(`session create returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
        err.kind = "session-create";
        throw err;
      }
      const session = (await res.json()).data;
      if (!session?.id) {
        const err = new Error("session create answered without a session id");
        err.kind = "session-create";
        throw err;
      }
      const idx = sessions.size;
      sessions.set(idx, { id: session.id, stopped: false });
      return idx;
    },
    async prompt(idx, brief) {
      const session = sessions.get(idx);
      if (!session) throw new Error(`no live session for handle ${idx}`);
      const admitted = await req(`/api/session/${session.id}/prompt`, {
        method: "POST",
        body: { text: brief },
      });
      if (!admitted.ok) {
        const err = new Error(`session prompt returned ${admitted.status}`);
        err.kind = "session-prompt";
        throw err;
      }
      // The prompt resolves on admission; completion is a separate
      // signal: the experimental wait, with outcome polling as the
      // backstop (its semantics are the thinnest documented surface).
      let waited;
      try {
        waited = await req(`/api/experimental/session/${session.id}/wait`, { method: "POST" });
      } catch {
        waited = null;
      }
      if (waited?.ok) {
        // the wait resolves to idle — 204 No Content on the live wire.
        // An idle signal without a typed outcome is never a verdict:
        // fall through to polling the session's own state.
        const body = (await waited.json().catch(() => null))?.data ?? null;
        if (body?.outcome && OTHER.includes(body.outcome)) return { outcome: body.outcome };
      }
      for (;;) {
        if (session.stopped) return { outcome: "interrupted" };
        const res = await req(`/api/session/${session.id}`);
        if (!res.ok) {
          const err = new Error(`session poll returned ${res.status}`);
          err.kind = "session-poll";
          throw err;
        }
        const info = (await res.json()).data ?? {};
        if (info.outcome && OTHER.includes(info.outcome)) return { outcome: info.outcome };
        if (info.outcome && info.outcome !== "pending") {
          // unknown outcome — never a silent pass
          const err = new Error(`session ${session.id} reported unknown outcome ${info.outcome}`);
          err.kind = "session-outcome";
          throw err;
        }
        await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
      }
    },
    async interrupt(idx) {
      const session = sessions.get(idx);
      if (!session) return;
      session.stopped = true;
      try {
        await req(`/api/session/${session.id}/interrupt`, { method: "POST" });
      } catch {
        // a dying session is already a stopped session
      }
    },
    describeSession(idx) {
      const session = sessions.get(idx);
      return session ? { id: session.id, stopped: session.stopped } : null;
    },
  };
}