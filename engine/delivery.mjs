// Delivery: the engine's hands on git. One commit per meaningful unit,
// pushed as it goes, pull-first. An unreachable remote holds commits
// locally and retries next pass; genuine divergence holds everything
// intact — no merge, no rewrite, no force — for the user to reconcile.
// There is no remote branch yet? Nothing to pull; just push.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const DIVERGED = /not possible to fast-forward|non-fast-forward|rejected|fetch first|failed to push some refs/i;
const NOTHING_TO_PULL = /couldn't find remote ref|does not exist on the remote/i;

async function runGit(repoPath, args) {
  try {
    const { stdout, stderr } = await run("git", args, {
      cwd: repoPath,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    return { ok: true, stdout, stderr };
  } catch (e) {
    return { ok: false, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

export function createDelivery({ repoPath, branch = "main" }) {
  return {
    async commitUnit({ files, message }) {
      const add = await runGit(repoPath, ["add", "--", ...files]);
      if (!add.ok) return { state: "failed", detail: add.stderr.trim() || "add failed" };
      const commit = await runGit(repoPath, ["commit", "-q", "-m", message]);
      if (!commit.ok) return { state: "failed", detail: commit.stderr.trim() || "commit failed" };
      return { state: "committed" };
    },

    async sync() {
      const pull = await runGit(repoPath, ["pull", "-q", "--ff-only", "origin", branch]);
      if (!pull.ok) {
        if (DIVERGED.test(pull.stderr)) return { state: "held-diverged", detail: pull.stderr.trim() };
        if (NOTHING_TO_PULL.test(pull.stderr)) {
          // the remote has no such branch yet: nothing to integrate, never an error
        } else {
          return { state: "local-held", detail: pull.stderr.trim() || "pull failed" };
        }
      }
      const push = await runGit(repoPath, ["push", "-q", "origin", `HEAD:${branch}`]);
      if (!push.ok) {
        if (DIVERGED.test(push.stderr)) return { state: "held-diverged", detail: push.stderr.trim() };
        return { state: "local-held", detail: push.stderr.trim() || "push failed" };
      }
      return { state: "synced" };
    },
  };
}