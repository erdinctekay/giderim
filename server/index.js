import SQLite from "better-sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import * as Exit from "effect/Exit";
import { flow } from "effect/Function";
import * as Match from "effect/Match";
import express from "express";
import { Kysely, SqliteDialect } from "kysely";
import path from "node:path";
import { createServer } from "node:http";
import { Server, ServerLive, Db } from "@evolu/server";
import { WebSocketServer } from "ws";

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------

/**
 * Comma-separated list of allowed origin domains.
 * Each entry is matched as an exact hostname or as a parent for subdomains.
 * Example: "example.com" allows both "example.com" and "*.example.com".
 * Defaults to "*" (allow all) when not set.
 */
const CORS_ALLOWED_DOMAINS = process.env.CORS_ALLOWED_DOMAINS || "*";

const allowedDomains = CORS_ALLOWED_DOMAINS === "*"
  ? null
  : CORS_ALLOWED_DOMAINS.split(",").map((d) => d.trim()).filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (!allowedDomains) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    // malformed origin
  }
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const createDb = (fileName) =>
  new Kysely({
    dialect: new SqliteDialect({
      database: new SQLite(path.join(process.cwd(), "/", fileName)),
    }),
  });

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const clients = [];
const socketUserMap = {};

async function main() {
  const server = await Effect.runPromise(
    Server.pipe(
      Effect.provide(ServerLive),
      Effect.provideService(Db, createDb("db.sqlite")),
    ),
  );

  await Effect.runPromise(server.initDatabase);

  const app = express();
  app.use(cors(corsOptions));
  app.use(bodyParser.raw({ limit: "20mb", type: "application/x-protobuf" }));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Sync endpoint (Protobuf over HTTP POST)
  app.post("/", (req, res) => {
    Effect.runCallback(server.sync(req.body, socketUserMap), {
      onExit: Exit.match({
        onFailure: flow(
          Cause.failureOrCause,
          Either.match({
            onLeft: flow(
              Match.value,
              Match.tagsExhaustive({
                BadRequestError: ({ error }) => {
                  res.status(400).send(JSON.stringify(error));
                },
              }),
            ),
            onRight: (error) => {
              console.error("server error", error);
              res.status(500).send("Internal Server Error");
            },
          }),
        ),
        onSuccess: (buffer) => {
          res.setHeader("Content-Type", "application/x-protobuf");
          res.send(buffer);
        },
      }),
    });
  });

  // HTTP + WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws) => {
    clients.push(ws);

    ws.on("message", (message) => {
      // Try parsing as JSON subscription first
      try {
        const json = JSON.parse(message.toString("utf-8"));
        if (json.channelId) {
          if (socketUserMap[json.channelId] !== undefined) {
            socketUserMap[json.channelId].push(ws);
          } else {
            socketUserMap[json.channelId] = [ws];
          }
          return;
        }
      } catch {
        // Not JSON — treat as binary sync message
      }

      // Handle binary sync message
      try {
        let uint8ArrayMessage;
        if (message instanceof Uint8Array) {
          uint8ArrayMessage = message;
        } else if (message instanceof ArrayBuffer) {
          uint8ArrayMessage = new Uint8Array(message);
        } else if (Array.isArray(message)) {
          uint8ArrayMessage = Buffer.concat(message);
        } else {
          uint8ArrayMessage = new Uint8Array(message);
        }

        Effect.runPromise(server.sync(uint8ArrayMessage, socketUserMap))
          .then((response) => ws.send(response))
          .catch((error) => {
            console.error("Error handling sync request:", error);
            ws.send(JSON.stringify({ error: "Failed to process sync request" }));
          });
      } catch (error) {
        console.error("Error handling sync request:", error);
        ws.send(JSON.stringify({ error: "Failed to process sync request" }));
      }
    });

    ws.on("close", () => {
      const idx = clients.indexOf(ws);
      if (idx !== -1) clients.splice(idx, 1);
      // Clean up socketUserMap
      for (const key in socketUserMap) {
        const sockets = socketUserMap[key];
        if (sockets) {
          const i = sockets.indexOf(ws);
          if (i !== -1) sockets.splice(i, 1);
          if (sockets.length === 0) delete socketUserMap[key];
        }
      }
    });
  });

  const PORT = Number.parseInt(process.env.PORT || "4000", 10);
  httpServer.listen(PORT, () => {
    console.log(`Evolu server started on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start Evolu server:", error);
  process.exit(1);
});
