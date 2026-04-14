const crypto = require("crypto");
const path = require("path");
const { discoverReviewPairs, loadReviewPair, writeReviewPair, appendAuditEvent } = require("./review-files");
const { buildSummary, pickNextOpenTask, sortPairsByMtime } = require("./task-selection");
const { resolveThreadsForFile } = require("./thread-resolution");
const { normalizePath, resolveWorkspaceRelative, toWorkspaceRelative } = require("./path-utils");
const { normalizeChangedRanges } = require("./changed-ranges");

function eventId(options = {}) {
  if (options.eventId) {
    return options.eventId;
  }
  return `evt-${crypto.randomUUID()}`;
}

function loadPairs(workspaceRoot) {
  return sortPairsByMtime(discoverReviewPairs(workspaceRoot));
}

function workspaceSnapshot(workspaceRoot) {
  const pairs = loadPairs(workspaceRoot);
  const latestPair = pairs[0] || null;
  return {
    summary: buildSummary(pairs),
    latestTaskFile: latestPair?.taskFilePath || null,
    latestDocumentId: latestPair?.documentId || null,
    nextTask: latestPair ? pickNextOpenTask(latestPair) : null,
    pairs,
  };
}

function handleTaskFileChange(workspaceRoot, taskFilePath, options = {}) {
  const absoluteTaskFile = normalizePath(taskFilePath);
  const pairs = loadPairs(workspaceRoot);
  const pair = pairs.find((candidate) => candidate.taskFilePath === absoluteTaskFile) || loadReviewPair(absoluteTaskFile);
  const result = {
    latestTaskFile: pair.taskFilePath,
    latestDocumentId: pair.documentId,
    nextTask: pickNextOpenTask(pair),
    summary: buildSummary(pairs),
  };

  if (options.writeAudit !== false) {
    appendAuditEvent(workspaceRoot, {
      eventId: eventId(options),
      kind: "task-file-changed",
      documentId: pair.documentId,
      taskFile: toWorkspaceRelative(workspaceRoot, pair.taskFilePath),
      openTasks: (pair.tasks?.tasks || []).filter((task) => ["open", "accepted", "in_progress", "in-progress"].includes(task.status)).length,
      createdAt: options.timestamp || new Date().toISOString(),
    });
  }

  return result;
}

function openLatestTaskFile(workspaceRoot) {
  const { summary, latestTaskFile, latestDocumentId } = workspaceSnapshot(workspaceRoot);
  return { summary, latestTaskFile, latestDocumentId };
}

function openNextTask(workspaceRoot, taskFilePath) {
  const pairs = loadPairs(workspaceRoot);
  const targetPair = taskFilePath
    ? pairs.find((pair) => pair.taskFilePath === normalizePath(taskFilePath)) || loadReviewPair(taskFilePath)
    : pairs[0] || null;
  return {
    summary: buildSummary(pairs),
    latestTaskFile: targetPair?.taskFilePath || null,
    latestDocumentId: targetPair?.documentId || null,
    nextTask: targetPair ? pickNextOpenTask(targetPair) : null,
  };
}

function collectRelevantPairs(pairs, workspaceRoot, savedPath) {
  const absoluteSavedPath = normalizePath(savedPath);
  return pairs.filter((pair) => {
    const byThread = (pair.sidecar?.threads || []).some((thread) => {
      return (thread?.target?.anchors || []).some((anchor) => anchor.type === "source-span" && resolveWorkspaceRelative(workspaceRoot, anchor.file) === absoluteSavedPath);
    });
    const byTask = (pair.tasks?.tasks || []).some((task) => task?.openInEditor?.file && resolveWorkspaceRelative(workspaceRoot, task.openInEditor.file) === absoluteSavedPath);
    return byThread || byTask;
  });
}

function resolveOnSave(workspaceRoot, savedFile, changedRanges, options = {}) {
  const absoluteSavedFile = normalizePath(savedFile);
  const normalizedRanges = normalizeChangedRanges(changedRanges);
  const pairs = loadPairs(workspaceRoot);
  const relevantPairs = collectRelevantPairs(pairs, workspaceRoot, absoluteSavedFile);
  const affectedDocumentIds = [];
  const resolvedThreadIds = [];
  const updatedTaskFiles = [];
  let eventPath = null;

  for (const pair of relevantPairs) {
    const resolution = resolveThreadsForFile(pair, workspaceRoot, absoluteSavedFile, normalizedRanges, {
      keepResolvedTasksInTaskFile: Boolean(options.keepResolvedTasksInTaskFile),
      author: options.author || "WireSpec IDE Companion",
      timestamp: options.timestamp,
      message: options.message,
      resolutionNote: options.resolutionNote,
    });

    if (!resolution.resolvedThreadIds.length) {
      continue;
    }

    writeReviewPair(resolution.pair);
    affectedDocumentIds.push(resolution.pair.documentId);
    resolvedThreadIds.push(...resolution.resolvedThreadIds);
    updatedTaskFiles.push(toWorkspaceRelative(workspaceRoot, resolution.pair.taskFilePath));

    eventPath = appendAuditEvent(workspaceRoot, {
      eventId: eventId(options),
      kind: "threads-resolved",
      documentId: resolution.pair.documentId,
      threadIds: resolution.resolvedThreadIds,
      file: toWorkspaceRelative(workspaceRoot, absoluteSavedFile),
      changedRanges: normalizedRanges,
      remainingOpenTasks: resolution.remainingOpenTasks,
      createdAt: options.timestamp || new Date().toISOString(),
    });
  }

  const refreshed = workspaceSnapshot(workspaceRoot);

  return {
    savedFile: absoluteSavedFile,
    changedRanges: normalizedRanges,
    affectedDocumentIds: Array.from(new Set(affectedDocumentIds)),
    resolvedThreadIds: Array.from(new Set(resolvedThreadIds)),
    updatedTaskFiles: Array.from(new Set(updatedTaskFiles)),
    eventPath,
    summary: refreshed.summary,
    latestTaskFile: refreshed.latestTaskFile,
    latestDocumentId: refreshed.latestDocumentId,
    nextTask: refreshed.nextTask,
  };
}

module.exports = {
  workspaceSnapshot,
  handleTaskFileChange,
  openLatestTaskFile,
  openNextTask,
  resolveOnSave,
  collectRelevantPairs,
};
