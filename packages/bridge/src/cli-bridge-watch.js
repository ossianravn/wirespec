#!/usr/bin/env node
import process from "node:process";
import { watchBridgeEvents } from "./bridge-watch.js";

function readFlag(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return process.argv[index + 1] || fallback;
}

const url = readFlag("--url", "http://127.0.0.1:4317/api/events");
const once = process.argv.includes("--once");

process.stdout.write(`Watching ${url}\n`);

await watchBridgeEvents({
  url,
  maxEvents: once ? 1 : Infinity,
  onEvent(event) {
    const parts = [
      `[${event.kind}]`,
      event.documentId || "document",
      event.annotationPath ? `annotations=${event.annotationPath}` : "",
      event.taskPath ? `tasks=${event.taskPath}` : "",
      typeof event.activeThreads === "number" ? `active=${event.activeThreads}` : "",
      event.status ? `status=${event.status}` : "",
    ].filter(Boolean);
    process.stdout.write(`${parts.join(" ")}\n`);
  },
});
