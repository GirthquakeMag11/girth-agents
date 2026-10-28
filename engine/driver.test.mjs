import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { discover, basicAuth, DEFAULT_SERVICE_FILE } from "./service.mjs";
import { createServerDriver, DispatchDefect } from "./driver.mjs";

// A fake OpenCode server: records everything it receives, answers from
// the script, and holds a session store the tests seed.
function fakeServer(script) {
  const records = [];
  const sessions = new Map();
  const server = createServer((req, res) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined;
      const record = { method: req.method, url: req.url, auth: req.headers.authorization, body };
      records.push(record);
      const route = script ?? {};
      const handler = route[req.method + " " + req.url] ?? route["*"] ?? (() => ({ status: 200, body: {} }));
      const reply = handler({ record, records, sessions, body });
      res.statusCode = reply.status ?? 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(reply.body ?? {}));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, records, sessions, url: `http://127.0.0.1:${port}` });
    });
  });
}

async function driverOn(fake, fittings = { builder: { model: "weight/heavy", capabilities: ["bash", "fs"], permissions: { allow: ["bash", "fs"], denyRest: true } } }) {
  const dir = mkdtempSync(join(tmpdir(), "svc-"));
  const file = join(dir, "service.json");
  writeFileSync(file, JSON.stringify({ id: "x", version: "2", url: fake.url, password: "sekrit" }));
  const driver = await createServerDriver({ serviceFile: file, fittings, fetchImpl: (url, init) => fetch(url, init) });
  return driver;
}

const INFO_ROUTE = {
  "GET /api/info": () => ({ status: 200, body: { pid: 1, version: "2.1.4" } }),
};

test("discovery: reads the registration file, checks health with Basic auth", async () => {
  const fake = await fakeServer(INFO_ROUTE);
  const dir = mkdtempSync(join(tmpdir(), "svc-"));
  const file = join(dir, "service.json");
  writeFileSync(file, JSON.stringify({ url: fake.url, password: "pw-" }));
  const endpoint = await discover(file);
  assert.equal(endpoint.url, fake.url);
  assert.equal(basicAuth("pw-"), "Basic " + Buffer.from("opencode:pw-").toString("base64"));
  assert.equal(fake.records[0].auth, basicAuth("pw-"));
  await fake.server.close();
});

test("discovery: a missing registration file and a failing health check are typed defects", async () => {
  await assert.rejects(discover("/nonexistent/service.json"), (e) => e.kind === "service-discovery");
  const fake = await fakeServer({ "GET /api/info": () => ({ status: 401, body: {} }) });
  const dir = mkdtempSync(join(tmpdir(), "svc-"));
  const file = join(dir, "service.json");
  writeFileSync(file, JSON.stringify({ url: fake.url, password: "wrong" }));
  await assert.rejects(discover(file), (e) => e.kind === "service-health");
  await fake.server.close();
});

test("driver spawn: creates the session with the live-verified wire — model ref, location ref, permission triples, data envelope", async () => {
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { data: { id: "sess-1" } } }),
  });
  const driver = await driverOn(fake);
  const idx = await driver.spawn({ nodeId: "build", helper: "builder", directory: "/proj", node: {} });
  const create = fake.records.find((r) => r.url === "/api/session");
  assert.ok(create, "session create must be sent");
  assert.equal(create.auth, basicAuth("sekrit"));
  assert.deepEqual(create.body.model, { id: "heavy", providerID: "weight" });
  assert.equal(create.body.agent, "build", "the session needs the coding agent — without it the helper has no tools");
  assert.deepEqual(create.body.location, { directory: "/proj" });
  assert.deepEqual(create.body.permissions, [
    { action: "bash", resource: "*", effect: "allow" },
    { action: "fs", resource: "*", effect: "allow" },
    { action: "*", resource: "*", effect: "deny" },
  ]);
  assert.equal(typeof idx, "number");
  await fake.server.close();
});

test("driver spawn: a model not in provider/model form is a loud dispatch defect", async () => {
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { data: { id: "sess-1" } } }),
  });
  const driver = await driverOn(fake, { reviewer: { model: "no-slash-here", capabilities: ["fs"], permissions: { allow: ["fs"], denyRest: true } } });
  await assert.rejects(
    driver.spawn({ nodeId: "review", helper: "reviewer", directory: "/proj", node: {} }),
    (e) => /provider\/model/.test(e.message),
  );
  assert.ok(!fake.records.some((r) => r.url === "/api/session"), "no session may be created for a malformed model ref");
  await fake.server.close();
});

test("driver spawn: unmet requirements are a dispatch defect before any session", async () => {
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { id: "sess-1" } }),
  });
  const driver = await driverOn(fake);
  await assert.rejects(
    driver.spawn({ nodeId: "build", helper: "builder", directory: "/proj", node: { requires: ["network"] } }),
    (e) => e instanceof DispatchDefect && /network/.test(e.message),
  );
  assert.ok(!fake.records.some((r) => r.url === "/api/session"), "no session may be created after the defect");
  await fake.server.close();
});

test("driver spawn: a helper without pre-granted capabilities is a dispatch defect", async () => {
  const fake = await fakeServer(INFO_ROUTE);
  const driver = await driverOn(fake, { ghost: { model: "m", permissions: {} } });
  await assert.rejects(
    driver.spawn({ nodeId: "x", helper: "ghost", directory: "/p", node: {} }),
    (e) => e instanceof DispatchDefect,
  );
  await fake.server.close();
});

test("driver prompt: sends the brief, waits, and returns the outcome", async () => {
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { data: { id: "sess-1" } } }),
    "POST /api/session/sess-1/prompt": () => ({ status: 200, body: {} }),
    "POST /api/experimental/session/sess-1/wait": () => ({ status: 200, body: { data: { outcome: "succeeded" } } }),
  });
  const driver = await driverOn(fake);
  const idx = await driver.spawn({ nodeId: "build", helper: "builder", directory: "/proj", node: {} });
  const outcome = await driver.prompt(idx, "grade this piece");
  assert.deepEqual(outcome, { outcome: "succeeded" });
  const prompt = fake.records.find((r) => r.url === "/api/session/sess-1/prompt");
  assert.equal(prompt.body.text, "grade this piece");
  await fake.server.close();
});

test("driver prompt: an empty wait — the live 204 — is never a silent success; polling decides", async () => {
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { data: { id: "sess-1" } } }),
    "POST /api/session/sess-1/prompt": () => ({ status: 200, body: {} }),
    "POST /api/experimental/session/sess-1/wait": () => ({ status: 204, body: {} }),
    "GET /api/session/sess-1": () => ({ status: 200, body: { data: { outcome: "succeeded" } } }),
  });
  const driver = await driverOn(fake);
  const idx = await driver.spawn({ nodeId: "build", helper: "builder", directory: "/proj", node: {} });
  const outcome = await driver.prompt(idx, "implement this");
  assert.deepEqual(outcome, { outcome: "succeeded" });
  const get = fake.records.filter((r) => r.method === "GET" && r.url === "/api/session/sess-1");
  assert.equal(get.length, 1, "the empty wait must fall through to the session-state poll");
  await fake.server.close();
});

test("driver prompt: when the experimental wait fails, outcome polling is the backstop", async () => {
  let polls = 0;
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { data: { id: "sess-1" } } }),
    "POST /api/session/sess-1/prompt": () => ({ status: 200, body: {} }),
    "POST /api/experimental/session/sess-1/wait": () => ({ status: 404, body: {} }),
    "GET /api/session/sess-1": () => {
      polls += 1;
      return { status: 200, body: { data: { outcome: polls < 3 ? "pending" : "failed" } } };
    },
  });
  const driver = await driverOn(fake);
  const idx = await driver.spawn({ nodeId: "build", helper: "builder", directory: "/proj", node: {} });
  const outcome = await driver.prompt(idx, "go");
  assert.deepEqual(outcome, { outcome: "failed" });
  assert.ok(polls >= 3);
  await fake.server.close();
});

test("driver interrupt: stops the wait loop and posts the interrupt", async () => {
  const fake = await fakeServer({
    ...INFO_ROUTE,
    "POST /api/session": () => ({ status: 200, body: { data: { id: "sess-1" } } }),
    "POST /api/session/sess-1/prompt": () => ({ status: 200, body: {} }),
    "POST /api/experimental/session/sess-1/wait": () => ({ status: 404, body: {} }),
    "GET /api/session/sess-1": () => ({ status: 200, body: { data: { outcome: "pending" } } }),
    "POST /api/session/sess-1/interrupt": () => ({ status: 200, body: {} }),
  });
  const driver = await driverOn(fake);
  const idx = await driver.spawn({ nodeId: "build", helper: "builder", directory: "/proj", node: {} });
  const pending = driver.prompt(idx, "take forever");
  await driver.interrupt(idx);
  const outcome = await pending;
  assert.deepEqual(outcome, { outcome: "interrupted" });
  assert.ok(fake.records.some((r) => r.url === "/api/session/sess-1/interrupt"));
  await fake.server.close();
});