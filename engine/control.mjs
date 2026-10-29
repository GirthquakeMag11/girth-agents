// The loopback control endpoint. The handoff tool and the interactive tools
// speak to the engine here. The token is per boot; the endpoint is local.
// The handlers are the engine's state transitions, passed in from engine.mjs.

import http from "node:http";

const MAX_BODY = 1024 * 1024;

export class ControlError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new ControlError(413, "request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body === "" ? {} : JSON.parse(body));
      } catch {
        reject(new ControlError(400, "request body is not valid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const ROUTES = {
  "/handoff": "handoff",
  "/tool/dispatch": "dispatch",
  "/tool/dispatch/wait": "dispatchWait",
  "/tool/dispatch/status": "dispatchStatus",
  "/tool/reload": "reload",
  "/tool/graphs": "graphs",
  "/tool/graph-map": "graphMap",
};

export function startControlServer({ token, handlers, host = "127.0.0.1", port = 0 }) {
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST") {
      send(res, 405, { ok: false, error: "POST only" });
      return;
    }
    if (req.headers["x-engine-token"] !== token) {
      send(res, 403, { ok: false, error: "bad engine token" });
      return;
    }
    const handlerName = ROUTES[req.url];
    if (!handlerName) {
      send(res, 404, { ok: false, error: "not found" });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await handlers[handlerName](body);
      send(res, result?.status ?? 200, result?.body ?? { ok: true });
    } catch (e) {
      if (e instanceof ControlError) {
        send(res, e.status, { ok: false, error: e.message });
      } else {
        send(res, 500, { ok: false, error: e?.message ?? String(e) });
      }
    }
  });

  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      resolve({
        url: `http://${host}:${address.port}`,
        port: address.port,
        server,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
          }),
      });
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}
