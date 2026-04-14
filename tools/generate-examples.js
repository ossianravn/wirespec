const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRoot = path.join(repoRoot, "demo-workspace");
const outputRoot = path.join(repoRoot, "outputs");
const cliPath = path.join(repoRoot, "packages", "core", "bin", "wirespec-ide-core.js");

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalizeForOutput(value, workspaceRoot) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForOutput(entry, workspaceRoot));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeForOutput(entry, workspaceRoot)])
    );
  }
  if (typeof value === "string") {
    return value.replaceAll(workspaceRoot, "<workspace>");
  }
  return value;
}

function normalizeNdjson(text, workspaceRoot) {
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line, index) => {
      const event = normalizeForOutput(JSON.parse(line), workspaceRoot);
      event.eventId = `evt-core-example-${String(index + 1).padStart(2, "0")}`;
      event.createdAt = `2026-04-14T10:${String(index + 20).padStart(2, "0")}:00.000Z`;
      return JSON.stringify(event);
    })
    .join("\n") + "\n";
}

function run(workspaceRoot, label, args) {
  const result = cp.spawnSync(process.execPath, [cliPath, ...args, "--workspace", workspaceRoot], {
    cwd: workspaceRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function main() {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  const workspaceRoot = path.join(outputRoot, "demo-workspace");
  fs.cpSync(fixtureRoot, workspaceRoot, { recursive: true });

  const taskFile = path.join(workspaceRoot, ".wirespec", "reviews", "login.agent-tasks.json");
  const targetFile = path.join(workspaceRoot, "src", "features", "auth", "LoginCard.tsx");

  const transcript = [];

  const initialSummary = run(workspaceRoot, "summary", ["summary"]);
  transcript.push(`[core] summary -> ${initialSummary.summary.openTasks} open`);

  const taskChange = run(workspaceRoot, "task-change", [
    "task-change",
    "--task-file",
    taskFile,
    "--timestamp",
    "2026-04-14T10:20:00.000Z",
    "--event-id",
    "evt-core-example-01",
  ]);
  transcript.push(`[vscode] task-change -> latest=${taskChange.latestDocumentId} next=${taskChange.nextTask?.threadId || "none"}`);

  const openNext = run(workspaceRoot, "open-next", ["open-next"]);
  transcript.push(`[jetbrains] open-next -> ${openNext.nextTask?.openInEditor?.file}:${openNext.nextTask?.openInEditor?.line}`);

  const resolveSubmit = run(workspaceRoot, "resolve-submit", [
    "resolve-on-save",
    "--saved-file",
    targetFile,
    "--ranges",
    "21-23",
    "--author",
    "WireSpec JetBrains Companion",
    "--timestamp",
    "2026-04-14T10:21:00.000Z",
    "--event-id",
    "evt-core-example-02",
    "--message-id",
    "msg-core-resolve-submit",
  ]);
  transcript.push(`[jetbrains] resolve-on-save 21-23 -> resolved=${resolveSubmit.resolvedThreadIds.join(",") || "none"} remaining=${resolveSubmit.summary.openTasks}`);

  const openNextAfterFirstSave = run(workspaceRoot, "open-next-after-first-save", ["open-next"]);
  transcript.push(`[vscode] open-next -> ${openNextAfterFirstSave.nextTask?.threadId || "none"}`);

  const resolveCopy = run(workspaceRoot, "resolve-copy", [
    "resolve-on-save",
    "--saved-file",
    targetFile,
    "--ranges",
    "17-20",
    "--author",
    "WireSpec VS Code Companion",
    "--timestamp",
    "2026-04-14T10:22:00.000Z",
    "--event-id",
    "evt-core-example-03",
    "--message-id",
    "msg-core-resolve-copy",
  ]);
  transcript.push(`[vscode] resolve-on-save 17-20 -> resolved=${resolveCopy.resolvedThreadIds.join(",") || "none"} remaining=${resolveCopy.summary.openTasks}`);

  const finalSummary = run(workspaceRoot, "final-summary", ["summary"]);
  transcript.push(`[core] summary -> ${finalSummary.summary.openTasks} open`);

  writeJson(path.join(outputRoot, "core.summary.initial.json"), normalizeForOutput(initialSummary, workspaceRoot));
  writeJson(path.join(outputRoot, "core.task-change.json"), normalizeForOutput(taskChange, workspaceRoot));
  writeJson(path.join(outputRoot, "core.open-next.json"), normalizeForOutput(openNext, workspaceRoot));
  writeJson(path.join(outputRoot, "core.resolve-on-save.submit.json"), normalizeForOutput(resolveSubmit, workspaceRoot));
  writeJson(path.join(outputRoot, "core.open-next.after-first-save.json"), normalizeForOutput(openNextAfterFirstSave, workspaceRoot));
  writeJson(path.join(outputRoot, "core.resolve-on-save.copy.json"), normalizeForOutput(resolveCopy, workspaceRoot));
  writeJson(path.join(outputRoot, "core.summary.final.json"), normalizeForOutput(finalSummary, workspaceRoot));

  fs.copyFileSync(path.join(workspaceRoot, ".wirespec", "reviews", "login.annotations.json"), path.join(outputRoot, "login.annotations.after.json"));
  fs.copyFileSync(path.join(workspaceRoot, ".wirespec", "reviews", "login.agent-tasks.json"), path.join(outputRoot, "login.agent-tasks.after.json"));
  fs.writeFileSync(
    path.join(outputRoot, "ide.events.ndjson"),
    normalizeNdjson(fs.readFileSync(path.join(workspaceRoot, ".wirespec", "reviews", "ide.events.ndjson"), "utf8"), workspaceRoot),
    "utf8"
  );
  fs.writeFileSync(path.join(outputRoot, "cross-ide-simulation.transcript.txt"), transcript.join("\n") + "\n", "utf8");
  fs.rmSync(workspaceRoot, { recursive: true, force: true });
}

main();
