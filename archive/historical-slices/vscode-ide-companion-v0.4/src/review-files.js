const fs = require("fs");
const path = require("path");
const { normalizePath, replaceSuffix } = require("./path-utils");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function findFiles(root, predicate, acc = []) {
  if (!fs.existsSync(root)) {
    return acc;
  }
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, predicate, acc);
      continue;
    }
    if (predicate(fullPath)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function deriveAnnotationPath(taskFilePath) {
  return replaceSuffix(taskFilePath, ".agent-tasks.json", ".annotations.json");
}

function loadReviewPair(taskFilePath) {
  const absoluteTaskPath = normalizePath(taskFilePath);
  const annotationFilePath = normalizePath(deriveAnnotationPath(absoluteTaskPath));
  const tasks = readJson(absoluteTaskPath);
  const sidecar = fs.existsSync(annotationFilePath) ? readJson(annotationFilePath) : null;
  const stat = fs.statSync(absoluteTaskPath);
  return {
    documentId: tasks.documentId || sidecar?.documentId || path.basename(taskFilePath, ".agent-tasks.json"),
    taskFilePath: absoluteTaskPath,
    annotationFilePath,
    tasks,
    sidecar,
    mtimeMs: stat.mtimeMs,
  };
}

function discoverReviewPairs(workspaceRoot) {
  const reviewRoot = path.join(workspaceRoot, ".wirespec", "reviews");
  const taskFiles = findFiles(reviewRoot, (filePath) => filePath.endsWith(".agent-tasks.json"));
  return taskFiles.map(loadReviewPair).sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function writeReviewPair(pair) {
  writeJson(pair.annotationFilePath, pair.sidecar);
  writeJson(pair.taskFilePath, pair.tasks);
}

function appendIdeEvent(workspaceRoot, event) {
  const eventPath = path.join(workspaceRoot, ".wirespec", "reviews", "ide.events.ndjson");
  fs.mkdirSync(path.dirname(eventPath), { recursive: true });
  fs.appendFileSync(eventPath, JSON.stringify(event) + "\n", "utf8");
  return normalizePath(eventPath);
}

module.exports = {
  readJson,
  writeJson,
  findFiles,
  deriveAnnotationPath,
  loadReviewPair,
  discoverReviewPairs,
  writeReviewPair,
  appendIdeEvent,
};
