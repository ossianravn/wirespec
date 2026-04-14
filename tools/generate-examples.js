const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const fixtureRoot = path.join(repoRoot, "demo-workspace");
const outputRoot = path.join(repoRoot, "outputs");
const cliPath = path.join(repoRoot, "packages", "core", "bin", "wirespec-ide-core.js");

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
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

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wirespec-cross-ide-"));
  const workspaceRoot = path.join(tempRoot, "demo-workspace");
  fs.cpSync(fixtureRoot, workspaceRoot, { recursive: true });

  const taskFile = path.join(workspaceRoot, ".wirespec", "reviews", "login.agent-tasks.json");
  const targetFile = path.join(workspaceRoot, "src", "features", "auth", "LoginCard.tsx");

  const transcript = [];

  const initialSummary = run(workspaceRoot, "summary", ["summary"]);
  transcript.push(`[core] summary -> ${initialSummary.summary.openTasks} open`);

  const taskChange = run(workspaceRoot, "task-change", ["task-change", "--task-file", taskFile]);
  transcript.push(`[vscode] task-change -> latest=${taskChange.latestDocumentId} next=${taskChange.nextTask?.threadId || "none"}`);

  const openNext = run(workspaceRoot, "open-next", ["open-next"]);
  transcript.push(`[jetbrains] open-next -> ${openNext.nextTask?.openInEditor?.file}:${openNext.nextTask?.openInEditor?.line}`);

  const resolveSubmit = run(workspaceRoot, "resolve-submit", ["resolve-on-save", "--saved-file", targetFile, "--ranges", "21-23", "--author", "WireSpec JetBrains Companion"]);
  transcript.push(`[jetbrains] resolve-on-save 21-23 -> resolved=${resolveSubmit.resolvedThreadIds.join(",") || "none"} remaining=${resolveSubmit.summary.openTasks}`);

  const openNextAfterFirstSave = run(workspaceRoot, "open-next-after-first-save", ["open-next"]);
  transcript.push(`[vscode] open-next -> ${openNextAfterFirstSave.nextTask?.threadId || "none"}`);

  const resolveCopy = run(workspaceRoot, "resolve-copy", ["resolve-on-save", "--saved-file", targetFile, "--ranges", "17-20", "--author", "WireSpec VS Code Companion"]);
  transcript.push(`[vscode] resolve-on-save 17-20 -> resolved=${resolveCopy.resolvedThreadIds.join(",") || "none"} remaining=${resolveCopy.summary.openTasks}`);

  const finalSummary = run(workspaceRoot, "final-summary", ["summary"]);
  transcript.push(`[core] summary -> ${finalSummary.summary.openTasks} open`);

  writeJson(path.join(outputRoot, "core.summary.initial.json"), initialSummary);
  writeJson(path.join(outputRoot, "core.task-change.json"), taskChange);
  writeJson(path.join(outputRoot, "core.open-next.json"), openNext);
  writeJson(path.join(outputRoot, "core.resolve-on-save.submit.json"), resolveSubmit);
  writeJson(path.join(outputRoot, "core.open-next.after-first-save.json"), openNextAfterFirstSave);
  writeJson(path.join(outputRoot, "core.resolve-on-save.copy.json"), resolveCopy);
  writeJson(path.join(outputRoot, "core.summary.final.json"), finalSummary);

  fs.copyFileSync(
    path.join(workspaceRoot, ".wirespec", "reviews", "login.annotations.json"),
    path.join(outputRoot, "login.annotations.after.json")
  );
  fs.copyFileSync(
    path.join(workspaceRoot, ".wirespec", "reviews", "login.agent-tasks.json"),
    path.join(outputRoot, "login.agent-tasks.after.json")
  );
  fs.copyFileSync(
    path.join(workspaceRoot, ".wirespec", "reviews", "ide.events.ndjson"),
    path.join(outputRoot, "ide.events.ndjson")
  );
  fs.writeFileSync(path.join(outputRoot, "cross-ide-simulation.transcript.txt"), transcript.join("\n") + "\n", "utf8");
}

main();
