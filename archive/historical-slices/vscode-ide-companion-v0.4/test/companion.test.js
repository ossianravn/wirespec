const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ChangedLineTracker, rangesFromContentChanges } = require("../src/changed-line-tracker");
const { discoverReviewPairs, loadReviewPair, writeReviewPair } = require("../src/review-files");
const { resolveThreadsForFile, summarizePairs } = require("../src/thread-resolution");

const fixtureWorkspace = path.resolve(__dirname, "../fixtures/demo-workspace");

function makeTempWorkspace(testContext) {
  const tempRoot = path.resolve(__dirname, `../outputs/test-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);
  fs.mkdirSync(tempRoot, { recursive: true });
  fs.cpSync(fixtureWorkspace, tempRoot, { recursive: true });
  testContext.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  return tempRoot;
}

test("rangesFromContentChanges merges edits into 1-based ranges", () => {
  const ranges = rangesFromContentChanges([
    {
      range: {
        start: { line: 25 },
        end: { line: 25 },
      },
      text: "alert id=form-error tone=error text=\"Try again.\"",
    },
    {
      range: {
        start: { line: 26 },
        end: { line: 27 },
      },
      text: "actions id=primary-actions layout=sticky\nbutton id=submit variant=primary action=submit label=\"Sign in\"",
    },
  ]);
  assert.deepEqual(ranges, [{ start: 26, end: 28 }]);
});

test("ChangedLineTracker accumulates and clears ranges", () => {
  const tracker = new ChangedLineTracker();
  tracker.noteChange("doc", [
    { range: { start: { line: 25 }, end: { line: 25 } }, text: "x" },
  ]);
  tracker.noteChange("doc", [
    { range: { start: { line: 26 }, end: { line: 27 } }, text: "a\nb" },
  ]);
  assert.deepEqual(tracker.peek("doc"), [{ start: 26, end: 28 }]);
  assert.deepEqual(tracker.take("doc"), [{ start: 26, end: 28 }]);
  assert.deepEqual(tracker.peek("doc"), []);
});

test("discoverReviewPairs finds the demo task pair", () => {
  const pairs = discoverReviewPairs(fixtureWorkspace);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].documentId, "login");
  assert.equal(pairs[0].tasks.tasks.length, 2);
});

test("resolveThreadsForFile resolves only matching spans and removes open tasks", (t) => {
  const workspace = makeTempWorkspace(t);
  const taskFile = path.join(workspace, ".wirespec", "reviews", "login.agent-tasks.json");
  const pair = loadReviewPair(taskFile);
  const saveTarget = path.join(workspace, "fixtures", "login.wirespec.md");
  const result = resolveThreadsForFile(pair, workspace, saveTarget, [{ start: 26, end: 27 }], {
    timestamp: "2026-04-12T09:30:00.000Z",
  });
  assert.deepEqual(result.resolvedThreadIds.sort(), ["ann-0a9fa3ed2a17", "ann-fa94e2410f77"].sort());
  assert.equal(result.pair.tasks.tasks.length, 0);
  const resolvedStatuses = result.pair.sidecar.threads.map((thread) => thread.status);
  assert.deepEqual(resolvedStatuses, ["resolved", "resolved"]);
  writeReviewPair(result.pair);
  const reloaded = loadReviewPair(taskFile);
  assert.equal(reloaded.tasks.tasks.length, 0);
});

test("summarizePairs counts active tasks", () => {
  const pairs = discoverReviewPairs(fixtureWorkspace);
  const summary = summarizePairs(pairs);
  assert.deepEqual(summary, {
    taskFiles: 1,
    openTasks: 2,
    documents: ["login"],
  });
});
