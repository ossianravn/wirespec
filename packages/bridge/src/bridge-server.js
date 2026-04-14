import http from "node:http";
import { ReviewBridgeService } from "./bridge-service.js";
import { allowedOrigin } from "./shared.js";

function jsonResponse(res, statusCode, payload, origin) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...(origin ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString("utf8");
  }
  return body ? JSON.parse(body) : {};
}

function createSseClient(res, origin) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    ...(origin ? { "access-control-allow-origin": origin } : {}),
  });
  res.write(": connected\n\n");
  return {
    send(event) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    },
    close() {
      res.end();
    },
  };
}

export function startReviewBridgeServer(options) {
  const service = new ReviewBridgeService(options);
  const clients = new Set();

  service.on("event", (event) => {
    for (const client of clients) {
      client.send(event);
    }
  });

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!allowedOrigin(origin)) {
      jsonResponse(res, 403, { ok: false, error: "Origin not allowed." });
      return;
    }

    if (req.method === "OPTIONS") {
      jsonResponse(res, 204, { ok: true }, origin || "*");
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    try {
      if (req.method === "GET" && url.pathname === "/health") {
        jsonResponse(
          res,
          200,
          {
            ok: true,
            workspaceRoot: service.workspaceRoot,
            reviewDir: service.reviewDir,
          },
          origin || "*",
        );
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/events") {
        const client = createSseClient(res, origin || "*");
        clients.add(client);
        req.on("close", () => {
          clients.delete(client);
          client.close();
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/reviews/load") {
        const result = await service.loadReview({
          documentId: url.searchParams.get("documentId"),
          annotationPath: url.searchParams.get("annotationPath") || undefined,
        });
        jsonResponse(res, 200, result, origin || "*");
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/reviews/save") {
        const body = await readJsonBody(req);
        const result = await service.saveReview(body);
        jsonResponse(res, 200, result, origin || "*");
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/reviews/status") {
        const body = await readJsonBody(req);
        const result = await service.setThreadStatus(body);
        jsonResponse(res, 200, result, origin || "*");
        return;
      }

      jsonResponse(res, 404, { ok: false, error: "Not found." }, origin || "*");
    } catch (error) {
      jsonResponse(
        res,
        400,
        {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown bridge error",
        },
        origin || "*",
      );
    }
  });

  return {
    service,
    server,
    async listen(port = 4317, host = "127.0.0.1") {
      await new Promise((resolve) => server.listen(port, host, resolve));
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      return {
        port: actualPort,
        host,
        url: `http://${host}:${actualPort}`,
      };
    },
    async close() {
      for (const client of clients) {
        client.close();
      }
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}
