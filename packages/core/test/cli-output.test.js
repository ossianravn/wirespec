const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("node:child_process");

const cliPath = path.resolve(__dirname, "../bin/wirespec-ide-core.js");

function copyFixtureWorkspace() {
  const fixtureRoot = path.resolve(__dirname, "../../../demo-workspace");
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wirespec-core-cli-"));
  const workspaceRoot = path.join(tempRoot, "demo-workspace");
  fs.cpSync(fixtureRoot, workspaceRoot, { recursive: true });
  return workspaceRoot;
}

function runCli(workspaceRoot, args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: workspaceRoot,
    encoding: "utf8",
  });
}

function parseJsonOutput(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test("core cli summary/open-latest/open-next emit stable JSON envelopes", () => {
  const workspaceRoot = copyFixtureWorkspace();

  const summary = parseJsonOutput(runCli(workspaceRoot, ["summary", "--workspace", workspaceRoot]));
  assert.equal(summary.ok, true);
  assert.equal(summary.command, "summary");
  assert.equal(typeof summary.summary.openTasks, "number");
  assert.equal(typeof summary.summary.taskFiles, "number");
  assert.equal(typeof summary.latestDocumentId, "string");
  assert.equal(typeof summary.latestTaskFile, "string");
  assert.equal(typeof summary.nextTask.threadId, "string");

  const latest = parseJsonOutput(runCli(workspaceRoot, ["open-latest", "--workspace", workspaceRoot]));
  assert.equal(latest.ok, true);
  assert.equal(latest.command, "open-latest");
  assert.equal(typeof latest.summary.openTasks, "number");
  assert.equal(typeof latest.latestDocumentId, "string");
  assert.equal(typeof latest.latestTaskFile, "string");

  const next = parseJsonOutput(runCli(workspaceRoot, ["open-next", "--workspace", workspaceRoot]));
  assert.equal(next.ok, true);
  assert.equal(next.command, "open-next");
  assert.equal(typeof next.summary.openTasks, "number");
  assert.equal(typeof next.latestDocumentId, "string");
  assert.equal(typeof next.latestTaskFile, "string");
  assert.equal(typeof next.nextTask.threadId, "string");
});

test("core cli task-change emits a stable JSON envelope", () => {
  const workspaceRoot = copyFixtureWorkspace();
  const taskFile = path.join(workspaceRoot, ".wirespec", "reviews", "login.agent-tasks.json");
  const result = parseJsonOutput(runCli(workspaceRoot, [
    "task-change",
    "--workspace",
    workspaceRoot,
    "--task-file",
    taskFile,
  ]));

  assert.equal(result.ok, true);
  assert.equal(result.command, "task-change");
  assert.equal(typeof result.summary.openTasks, "number");
  assert.equal(typeof result.latestDocumentId, "string");
  assert.equal(typeof result.latestTaskFile, "string");
  assert.equal(typeof result.nextTask.threadId, "string");
});

test("core cli resolve-on-save emits a stable JSON envelope", () => {
  const workspaceRoot = copyFixtureWorkspace();
  const savedFile = path.join(workspaceRoot, "src", "features", "auth", "LoginCard.tsx");
  const result = parseJsonOutput(runCli(workspaceRoot, [
    "resolve-on-save",
    "--workspace",
    workspaceRoot,
    "--saved-file",
    savedFile,
    "--ranges",
    "21-23",
    "--author",
    "WireSpec Test Companion",
  ]));

  assert.equal(result.ok, true);
  assert.equal(result.command, "resolve-on-save");
  assert.equal(Array.isArray(result.changedRanges), true);
  assert.equal(Array.isArray(result.affectedDocumentIds), true);
  assert.equal(Array.isArray(result.resolvedThreadIds), true);
  assert.equal(Array.isArray(result.updatedTaskFiles), true);
  assert.equal(typeof result.summary.openTasks, "number");
  assert.equal(typeof result.latestDocumentId, "string");
  assert.equal(typeof result.latestTaskFile, "string");
});

test("core cli emits JSON errors for IDE-facing commands", () => {
  const workspaceRoot = copyFixtureWorkspace();
  const result = runCli(workspaceRoot, ["resolve-on-save", "--workspace", workspaceRoot]);

  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.command, "resolve-on-save");
  assert.equal(typeof payload.error.message, "string");
  assert.match(payload.error.message, /--saved-file is required/);
});
