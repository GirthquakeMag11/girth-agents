// The OpenCode plugin client adapter. It replaces the HTTP service driver:
// every session fact goes through the plugin server client passed in as `ctx`,
// never through fetch, a URL, or a token. The engine stays in-process.
//
// The `ctx.session` methods mirror the opencode server client. The one thing
// HTTP leased per call was the session location; here `forDirectory` returns a
// driver bound to a dispatching location so a graph session is created in the
// directory the dispatch came from.

import { modelRef } from "./driver.mjs";

const OUTCOMES = new Set(["succeeded", "failed", "interrupted"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function defect(kind, message) {
  const err = new Error(message);
  err.kind = kind;
  return err;
}

// The executor reads `outcome`, `cost`, and `tokens` straight off the session
// info; the V2 session already carries all three in the same shape the wire
// driver used to return, so no field adaptation is needed here.
export function createPluginDriver(ctx) {
  const base = {
    async createSession({ directory, title, model, permissions }) {
      const session = await ctx.session.create({
        title,
        // ctx.session.create wants a Model.Ref, not the graph's "provider/model" string.
        model: modelRef(model),
        location: { directory },
        permissions,
      });
      if (!session?.id) throw defect("session-create", "session create answered without a session id");
      return session;
    },

    async getSession(sessionID) {
      let info;
      try {
        info = await ctx.session.get({ sessionID });
      } catch (e) {
        throw defect("session-get", `session get failed: ${e?.message ?? String(e)}`);
      }
      if (!info?.id) throw defect("session-get", "session get answered without a session id");
      return info;
    },

    async prompt(sessionID, text, { budgetMs = 600000, pollMs = 250 } = {}) {
      try {
        await ctx.session.prompt({ sessionID, text });
      } catch (e) {
        throw defect("session-prompt", `session prompt failed: ${e?.message ?? String(e)}`);
      }

      // The experimental wait resolves to idle. It is never the completion
      // authority, so always fall through to the session state, exactly like
      // the wire driver did. Bound it with a clearable timer so a wait that
      // never settles cannot stall the poll loop below, and so losing the
      // race to the timer does not leak a timer.
      try {
        await new Promise((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve();
          };
          const timer = setTimeout(finish, budgetMs);
          Promise.resolve(ctx.session.wait({ sessionID })).then(finish, finish);
        });
      } catch {
        // a failed or absent wait is not a verdict; poll below
      }

      const deadline = Date.now() + budgetMs;
      for (;;) {
        const info = await this.getSession(sessionID);
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
      let result;
      try {
        result = await ctx.session.context({ sessionID });
      } catch (e) {
        throw defect("session-messages", `session context failed: ${e?.message ?? String(e)}`);
      }
      return Array.isArray(result) ? result : [];
    },

    async interrupt(sessionID) {
      await ctx.session.interrupt({ sessionID });
    },

    async deleteSession(sessionID) {
      try {
        await ctx.session.remove({ sessionID });
      } catch {
        // a finished session that cannot be removed is not a routing defect
      }
    },

    async plugins() {
      try {
        return await ctx.plugin.list();
      } catch {
        return [];
      }
    },
  };

  return {
    ...base,
    // A session client bound to one dispatching location. Records store this
    // driver; the engine serves every project through the one queue.
    forDirectory(directory) {
      return {
        ...base,
        // Bind only when the caller did not already name a directory; the
        // executor's explicit `record.directory` stays authoritative.
        createSession(options) {
          return base.createSession(options.directory != null ? options : { ...options, directory });
        },
      };
    },
  };
}