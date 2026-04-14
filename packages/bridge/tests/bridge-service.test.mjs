import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import { ReviewBridgeService } from "../src/bridge-service.js";

test("ReviewBridgeService saves sidecar, tasks, and an event log", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "wirespec-bridge-"));
  try {
    const service = new ReviewBridgeService({ workspaceRoot: workspace });
    const sourceMap = JSON.parse(await readFile(new URL("../fixtures/login.targets.json", import.meta.url), "utf8"));
    const sidecar = JSON.parse(await readFile(new URL("../fixtures/login.seed.annotations.json", import.meta.url), "utf8"));

    const result = await service.saveReview({
      documentId: "login",
      sidecar,
      sourceMap,
      wireFile: sourceMap.entryFile,
    });

    assert.equal(result.ok, true);
    assert.equal(result.counts.total, 2);

    const annotationText = await readFile(path.join(workspace, result.paths.annotationPath), "utf8");
    const taskText = await readFile(path.join(workspace, result.paths.taskPath), "utf8");
    const eventLogText = await readFile(path.join(workspace, result.paths.eventLogPath), "utf8");

    assert.match(annotationText, /"documentId": "login"/);
    assert.match(taskText, /"taskId": "task:/);
    assert.match(eventLogText, /"kind":"review-saved"/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("ReviewBridgeService rejects paths outside the workspace root", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "wirespec-bridge-"));
  try {
    const service = new ReviewBridgeService({ workspaceRoot: workspace });
    const sourceMap = JSON.parse(await readFile(new URL("../fixtures/login.targets.json", import.meta.url), "utf8"));
    const sidecar = JSON.parse(await readFile(new URL("../fixtures/login.seed.annotations.json", import.meta.url), "utf8"));

    await assert.rejects(
      service.saveReview({
        documentId: "login",
        sidecar,
        sourceMap,
        annotationPath: "../escape.json",
      }),
      /outside the workspace root/,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
