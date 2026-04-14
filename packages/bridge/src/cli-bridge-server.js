#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { startReviewBridgeServer } from "./bridge-server.js";

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] || fallback;
}

const workspace = path.resolve(readFlag("--workspace", process.cwd()));
const port = Number(readFlag("--port", "4317"));
const host = readFlag("--host", "127.0.0.1");
const bridge = startReviewBridgeServer({ workspaceRoot: workspace });

const { url } = await bridge.listen(port, host);
process.stdout.write(`WireSpec bridge running at ${url}\n`);
process.stdout.write(`Workspace root: ${workspace}\n`);

const shutdown = async () => {
  await bridge.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
