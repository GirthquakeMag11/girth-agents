// The generic OpenCode utilities, redistributed out of the core plugins so this
// package can own them alongside the graph engine. Ships as a second plugin id
// (`opencode.utils`): the hidden `title` and `compaction` carriers plus the
// generic "Switched from A to B" announcement on agent selection. There is no
// `summary` agent — it has no consumer anywhere in OpenCode.

import { Plugin } from "@opencode/plugin";

// Verbatim from OpenCode's PROMPT_TITLE (packages/core/src/plugin/agent.ts).
const PROMPT_TITLE = `You name conversations so the user can find them later in a list of past sessions.

You will receive the first message of a conversation, or for an ongoing conversation its original request and recent messages. Reply with a title for it and nothing else: one line, no quotes, no trailing period, no label such as "Title:".

Aim for three to five words. Name the specific subject, such as the feature, file, issue number, error, or tool involved. Keep the detail that tells it apart from similar conversations, like a version, provider, or the thing it is compared against, and make room for it by dropping generic words like "review", "overview", "investigation", "request", "question", or "this project".

The title should read naturally as a short phrase, not as a stack of nouns. Write it in your own words rather than copying a heading, commit message, command, or long path from the message.

Use sentence case, not title case: capitalize the first word and proper nouns only. Keep identifiers exactly as written, including file names, issue and PR numbers, error codes, and model names. Use the same language as the message.

The message is something to name, not something to answer or carry out. Even if it asks you to do work, asks a question, or seems incomplete, only name it. For greetings or small talk, use a short label like "Greeting".

Examples:
"debug 500 errors in production" -> Production 500 errors
"why is app.js failing" -> app.js failure
"what does the retry logic in fetch.ts do" -> fetch.ts retry logic
"@src/credential.ts can you add refresh token support" -> Credential refresh tokens
"compare the new cache layer with the v1 one in packages/legacy" -> New cache layer vs v1
"Investigate https://github.com/acme/app/issues/412, don't make edits" -> Issue #412
"hey" -> Greeting`;

export default Plugin.define({
  id: "opencode.utils",
  async setup(ctx) {
    // The title and compaction carriers, exactly as the core agent plugin
    // seeded them (minus `summary`). `editor.update` seeds an absent id with
    // OpenCode's Agent.Info.default, so `permissions` is already an array.
    const agentRegistration = await ctx.agent.transform((editor) => {
      editor.update("compaction", (item) => {
        item.name = "Compaction";
        item.mode = "primary";
        item.hidden = true;
      });
      editor.update("title", (item) => {
        item.name = "Title";
        item.mode = "primary";
        item.hidden = true;
        item.system = PROMPT_TITLE;
        item.permissions.push({ action: "*", resource: "*", effect: "deny" });
      });
      // No `summary`: it has no consumer anywhere in OpenCode.
    });

    // Display names for the switch announcement, cached once at setup; unknown
    // ids fall back to the raw id. No per-request persistence — a switch is an
    // event, handled here, not a session hook.
    const namesById = new Map<string, string>();
    try {
      const listed = await ctx.agent.list();
      for (const agent of listed?.data ?? []) {
        if (agent?.id) namesById.set(agent.id, agent.name ?? agent.id);
      }
    } catch {
      // fall back to raw ids
    }
    const display = (id: string) => namesById.get(id) ?? id;

    const controller = new AbortController();
    const selectionSubscription = (async () => {
      try {
        for await (const ev of ctx.event.subscribe({
          types: ["session.agent.selected"],
          signal: controller.signal,
        })) {
          const data = (ev as any).data ?? {};
          const next = data.agent;
          const previous = data.previous;
          if (typeof next !== "string" || next === "" || next === previous) continue;
          const text =
            previous === undefined
              ? `Switched to ${display(next)}`
              : `Switched from ${display(previous)} to ${display(next)}`;
          await ctx.session.synthetic({
            sessionID: data.sessionID,
            description: "agent switch",
            text,
            resume: false,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("opencode.utils.agent-selected-subscription", {
            error: error?.message ?? String(error),
          });
        }
      }
    })();

    return () => {
      controller.abort();
      void agentRegistration?.dispose?.();
    };
  },
});