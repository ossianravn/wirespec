const fs = require("fs");
const path = require("path");
const { loadReviewPair, writeReviewPair, appendIdeEvent, writeJson } = require("./review-files");
const { resolveThreadsForFile } = require("./thread-resolution");
const { normalizePath } = require("./path-utils");

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function main() {
  const packageRoot = path.resolve(__dirname, "..");
  const fixtureWorkspace = path.join(packageRoot, "fixtures", "demo-workspace");
  const outputWorkspace = path.join(packageRoot, "outputs", "demo-workspace");
  fs.rmSync(outputWorkspace, { recursive: true, force: true });
  copyDir(fixtureWorkspace, outputWorkspace);

  const transcript = [];
  const taskFilePath = path.join(outputWorkspace, ".wirespec", "reviews", "login.agent-tasks.json");
  transcript.push(`Watching ${normalizePath(path.join(outputWorkspace, '.wirespec', 'reviews'))}`);
  transcript.push(`[task-file-changed] ${normalizePath(taskFilePath)}`);
  transcript.push(`[auto-opened] ${normalizePath(taskFilePath)}`);
  transcript.push(`[jump-next] fixtures/login.wirespec.md:27:9`);

  const pair = loadReviewPair(taskFilePath);
  const savedFile = path.join(outputWorkspace, "fixtures", "login.wirespec.md");
  const changedRanges = [{ start: 26, end: 27 }];
  const resolution = resolveThreadsForFile(pair, outputWorkspace, savedFile, changedRanges, {
    author: "WireSpec IDE Companion",
    timestamp: "2026-04-12T09:30:00.000Z",
  });

  writeReviewPair(resolution.pair);
  const ideEvent = {
    eventId: `evt-${Math.random().toString(16).slice(2, 14)}`,
    kind: "threads-resolved",
    documentId: resolution.pair.documentId,
    threadIds: resolution.resolvedThreadIds,
    file: "fixtures/login.wirespec.md",
    changedRanges,
    remainingOpenTasks: resolution.remainingOpenTasks,
    createdAt: "2026-04-12T09:30:00.000Z",
  };
  const eventLogPath = appendIdeEvent(outputWorkspace, ideEvent);
  transcript.push(`[resolved] ${resolution.resolvedThreadIds.join(', ')} remaining=${resolution.remainingOpenTasks}`);
  transcript.push(`[ide-events] ${eventLogPath}`);

  const outputDir = path.join(packageRoot, "outputs");
  writeJson(path.join(outputDir, "login.annotations.after.json"), resolution.pair.sidecar);
  writeJson(path.join(outputDir, "login.agent-tasks.after.json"), resolution.pair.tasks);
  fs.copyFileSync(path.join(outputWorkspace, ".wirespec", "reviews", "ide.events.ndjson"), path.join(outputDir, "ide.events.ndjson"));
  fs.writeFileSync(path.join(outputDir, "ide-companion.transcript.txt"), transcript.join("\n") + "\n", "utf8");
}

if (require.main === module) {
  main();
}
