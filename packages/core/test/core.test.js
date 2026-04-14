const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { workspaceSnapshot, handleTaskFileChange, openNextTask, resolveOnSave } = require("../src/core-service");

function copyFixtureWorkspace() {
  const fixtureRoot = path.resolve(__dirname, "../../../demo-workspace");
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wirespec-core-test-"));
  const workspaceRoot = path.join(tempRoot, "demo-workspace");
  fs.cpSync(fixtureRoot, workspaceRoot, { recursive: true });
  return workspaceRoot;
}

test("summary finds the latest review state", () => {
  const workspaceRoot = copyFixtureWorkspace();
  const snapshot = workspaceSnapshot(workspaceRoot);
  assert.equal(snapshot.summary.openTasks, 2);
  assert.equal(snapshot.latestDocumentId, "login");
  assert.equal(snapshot.nextTask.threadId, "ann-login-submit-fold");
});

test("task-change and open-next pick the highest priority task", () => {
  const workspaceRoot = copyFixtureWorkspace();
  const taskFile = path.join(workspaceRoot, ".wirespec", "reviews", "login.agent-tasks.json");
  const changed = handleTaskFileChange(workspaceRoot, taskFile, { writeAudit: false });
  const next = openNextTask(workspaceRoot);
  assert.equal(changed.nextTask.threadId, "ann-login-submit-fold");
  assert.equal(next.nextTask.threadId, "ann-login-submit-fold");
});

test("resolve-on-save resolves touched threads and writes audit events", () => {
  const workspaceRoot = copyFixtureWorkspace();
  const targetFile = path.join(workspaceRoot, "src", "features", "auth", "LoginCard.tsx");

  const first = resolveOnSave(workspaceRoot, targetFile, [{ start: 21, end: 23 }], {
    author: "WireSpec Test Companion",
    messageId: "msg-test-submit",
  });
  assert.deepEqual(first.resolvedThreadIds, ["ann-login-submit-fold"]);
  assert.equal(first.summary.openTasks, 1);

  const second = resolveOnSave(workspaceRoot, targetFile, [{ start: 17, end: 20 }], {
    author: "WireSpec Test Companion",
  });
  assert.deepEqual(second.resolvedThreadIds, ["ann-login-error-copy"]);
  assert.equal(second.summary.openTasks, 0);

  const eventLog = fs.readFileSync(path.join(workspaceRoot, ".wirespec", "reviews", "ide.events.ndjson"), "utf8").trim().split("\n");
  assert.equal(eventLog.length, 2);

  const sidecar = JSON.parse(fs.readFileSync(path.join(workspaceRoot, ".wirespec", "reviews", "login.annotations.json"), "utf8"));
  const submitThread = sidecar.threads.find((thread) => thread.id === "ann-login-submit-fold");
  assert.equal(submitThread.messages.at(-1).id, "msg-test-submit");
});
