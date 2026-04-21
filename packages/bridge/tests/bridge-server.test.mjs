import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import { startReviewBridgeServer } from "../src/bridge-server.js";
import { watchBridgeEvents } from "../src/bridge-watch.js";

test("bridge server serves health, save, load, and SSE events", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "wirespec-bridge-"));
  const bridge = startReviewBridgeServer({ workspaceRoot: workspace });
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error("Timed out waiting for bridge SSE events."));
  }, 5000);
  try {
    const listener = await bridge.listen(0);
    const sourceMap = JSON.parse(await readFile(new URL("../fixtures/login.targets.json", import.meta.url), "utf8"));
    const sidecar = JSON.parse(await readFile(new URL("../fixtures/login.seed.annotations.json", import.meta.url), "utf8"));

    const health = await fetch(`${listener.url}/health`).then((response) => response.json());
    assert.equal(health.ok, true);

    const received = [];
    let resolveConnected;
    let rejectConnected;
    const connected = new Promise((resolve, reject) => {
      resolveConnected = resolve;
      rejectConnected = reject;
    });
    const watchPromise = watchBridgeEvents({
      url: `${listener.url}/api/events`,
      signal: abortController.signal,
      maxEvents: 1,
      async onConnected() {
        resolveConnected();
      },
      onEvent(event) {
        received.push(event);
      },
    });
    const watchedConnection = watchPromise.catch((error) => {
      rejectConnected(error);
      throw error;
    });
    await connected;

    const save = await fetch(`${listener.url}/api/reviews/save`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        documentId: "login",
        sidecar,
        sourceMap,
      }),
    }).then((response) => response.json());

    assert.equal(save.ok, true);
    await watchedConnection;
    assert.equal(received.length, 1);
    assert.equal(received[0].kind, "review-saved");

    const load = await fetch(`${listener.url}/api/reviews/load?documentId=login`).then((response) => response.json());
    assert.equal(load.ok, true);
    assert.equal(load.found, true);
    assert.equal(load.sidecar.documentId, "login");
  } finally {
    clearTimeout(timeoutId);
    await bridge.close();
    await rm(workspace, { recursive: true, force: true });
  }
});

test("bridge server returns 400 with an error for malformed JSON payloads", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "wirespec-bridge-"));
  const bridge = startReviewBridgeServer({ workspaceRoot: workspace });
  try {
    const listener = await bridge.listen(0);
    const response = await fetch(`${listener.url}/api/reviews/save`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: '{"documentId":',
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.ok, false);
    assert.equal(typeof payload.error, "string");
    assert.ok(payload.error.length > 0);
  } finally {
    await bridge.close();
    await rm(workspace, { recursive: true, force: true });
  }
});
