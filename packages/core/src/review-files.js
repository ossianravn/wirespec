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
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
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

function ensureReviewRoot(workspaceRoot) {
  const reviewRoot = path.join(workspaceRoot, ".wirespec", "reviews");
  fs.mkdirSync(reviewRoot, { recursive: true });
  return normalizePath(reviewRoot);
}

function deriveAnnotationPath(taskFilePath) {
  return replaceSuffix(taskFilePath, ".agent-tasks.json", ".annotations.json");
}

function deriveTaskPath(annotationFilePath) {
  return replaceSuffix(annotationFilePath, ".annotations.json", ".agent-tasks.json");
}

function loadReviewPair(taskFilePath) {
  const absoluteTaskPath = normalizePath(taskFilePath);
  const annotationFilePath = normalizePath(deriveAnnotationPath(absoluteTaskPath));
  const tasks = readJson(absoluteTaskPath);
  const sidecar = fs.existsSync(annotationFilePath)
    ? readJson(annotationFilePath)
    : {
        schemaVersion: "0.3.0",
        documentId: tasks.documentId || path.basename(absoluteTaskPath, ".agent-tasks.json"),
        threads: [],
      };
  const stat = fs.statSync(absoluteTaskPath);
  return {
    documentId: tasks.documentId || sidecar.documentId || path.basename(absoluteTaskPath, ".agent-tasks.json"),
    taskFilePath: absoluteTaskPath,
    annotationFilePath,
    tasks,
    sidecar,
    mtimeMs: stat.mtimeMs,
  };
}

function discoverReviewPairs(workspaceRoot) {
  const reviewRoot = ensureReviewRoot(workspaceRoot);
  const taskFiles = findFiles(reviewRoot, (candidate) => candidate.endsWith(".agent-tasks.json"));
  return taskFiles.map(loadReviewPair).sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function writeReviewPair(pair) {
  writeJson(pair.annotationFilePath, pair.sidecar);
  writeJson(pair.taskFilePath, pair.tasks);
  return pair;
}

function appendAuditEvent(workspaceRoot, event) {
  const reviewRoot = ensureReviewRoot(workspaceRoot);
  const eventPath = path.join(reviewRoot, "ide.events.ndjson");
  fs.appendFileSync(eventPath, JSON.stringify(event) + "\n", "utf8");
  return normalizePath(eventPath);
}

module.exports = {
  readJson,
  writeJson,
  findFiles,
  ensureReviewRoot,
  deriveAnnotationPath,
  deriveTaskPath,
  loadReviewPair,
  discoverReviewPairs,
  writeReviewPair,
  appendAuditEvent,
};
