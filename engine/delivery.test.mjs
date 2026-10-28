import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDelivery } from "./delivery.mjs";

const run = promisify(execFile);
const git = (args, cwd) =>
  run("git", args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "repo-"));
  return dir;
}

async function initRepo(dir) {
  await git(["init", "-q", "-b", "main"], dir);
  await git(["config", "user.email", "engine@test"], dir);
  await git(["config", "user.name", "Engine Test"], dir);
  await git(["config", "commit.gpgsign", "false"], dir);
}

async function bareOrigin() {
  const dir = repo();
  await git(["init", "--bare", "-q", "-b", "main"], dir);
  return dir;
}

test("delivery: a unit of work lands as its own conventional commit", async () => {
  const dir = repo();
  await initRepo(dir);
  writeFileSync(join(dir, "stamped.json"), JSON.stringify({ state: "ready" }));
  const delivery = createDelivery({ repoPath: dir });
  const result = await delivery.commitUnit({ files: ["stamped.json"], message: "feat(engine): the piece is built" });
  assert.equal(result.state, "committed", JSON.stringify(result));
  const log = (await git(["log", "--format=%s"], dir)).stdout.trim();
  assert.equal(log, "feat(engine): the piece is built");
});

test("delivery: sync pulls first and pushes as it goes", async () => {
  const origin = await bareOrigin();
  const dir = repo();
  await initRepo(dir);
  await git(["remote", "add", "origin", origin], dir);
  writeFileSync(join(dir, "stamped.json"), "{}");
  const delivery = createDelivery({ repoPath: dir, branch: "main" });
  await delivery.commitUnit({ files: ["stamped.json"], message: "feat(engine): first unit" });
  const result = await delivery.sync();
  assert.equal(result.state, "synced", JSON.stringify(result));
  const originLog = (await git(["log", "--format=%s", "main"], origin)).stdout.trim();
  assert.ok(originLog.includes("first unit"));
});

test("delivery: an offline push holds commits locally and the next pass retries them", async () => {
  const origin = await bareOrigin();
  const dir = repo();
  await initRepo(dir);
  await git(["remote", "add", "origin", join(dir, "no-such-remote-nothing")], dir);
  writeFileSync(join(dir, "stamped.json"), "{}");
  const delivery = createDelivery({ repoPath: dir, branch: "main" });
  await delivery.commitUnit({ files: ["stamped.json"], message: "feat(engine): held unit" });
  const held = await delivery.sync();
  assert.equal(held.state, "local-held", JSON.stringify(held));
  assert.ok(held.detail, "the hold must say why");
  const localLog = (await git(["log", "--format=%s"], dir)).stdout.trim();
  assert.ok(localLog.includes("held unit"), "the ledger loses nothing while offline");

  await git(["remote", "set-url", "origin", origin], dir); // the network returns
  const retried = await delivery.sync();
  assert.equal(retried.state, "synced", JSON.stringify(retried));
});

test("delivery: non-fast-forward divergence holds everything intact, never merging or rewriting", async () => {
  const origin = await bareOrigin();
  const dir = repo();
  await initRepo(dir);
  await git(["remote", "add", "origin", origin], dir);
  writeFileSync(join(dir, "stamped.json"), "{}");
  const delivery = createDelivery({ repoPath: dir, branch: "main" });
  await delivery.commitUnit({ files: ["stamped.json"], message: "feat(engine): engine's unit" });
  await git(["push", "-q", "-u", "origin", "HEAD:main"], dir);

  // a second checkout advances the remote while the engine's local commit exists
  const other = mkdtempSync(join(tmpdir(), "other-"));
  await git(["clone", "-q", "-b", "main", origin, other]);
  writeFileSync(join(other, "user-work.md"), "# the user's own commit");
  await git(["config", "user.email", "user@test"], other);
  await git(["config", "user.name", "User"], other);
  await git(["config", "commit.gpgsign", "false"], other);
  await git(["add", "user-work.md"], other);
  const otherCommit = await run("git", ["commit", "-q", "-m", "docs: user work"], { cwd: other }).catch((e) => e);
  assert.ok(!(otherCommit instanceof Error), `the advance-side commit must land: ${otherCommit?.stderr}`);
  const otherPush = await run("git", ["push", "-q", "origin", "HEAD:main"], { cwd: other }).catch((e) => e);
  assert.ok(!(otherPush instanceof Error), `the advance-side push must land: ${otherPush?.stderr}`);
  assert.equal((await git(["log", "--format=%s", "main"], origin)).stdout.trim().split("\n").length, 2, "remote must be ahead before the engine syncs");

  writeFileSync(join(dir, "engine-work.md"), "# engine's new unit");
  await delivery.commitUnit({ files: ["engine-work.md"], message: "feat(engine): second unit" });

  const diverged = await delivery.sync();
  assert.equal(diverged.state, "held-diverged", JSON.stringify(diverged));

  const contents = readFileSync(join(dir, "engine-work.md"), "utf8");
  assert.ok(contents.includes("engine's new unit"), "the working tree is left alone");
  const messages = (await git(["log", "--format=%s"], dir)).stdout.trim().split("\n");
  assert.equal(messages.length, 2, "no merge commit may appear in the engine's history");
  const originMessages = (await git(["log", "--format=%s", "main"], origin)).stdout.trim().split("\n");
  assert.deepEqual(originMessages, ["docs: user work", "feat(engine): engine's unit"], "the held push must not reach the remote — no merge, no force-push");
});