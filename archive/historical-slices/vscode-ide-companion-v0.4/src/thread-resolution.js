const path = require("path");
const { resolveWorkspaceRelative, normalizePath, toWorkspaceRelative } = require("./path-utils");

const ACTIVE_STATUSES = new Set(["open", "in_progress", "accepted", "in-progress"]);

function nowIso() {
  return new Date().toISOString();
}

function rangeIntersects(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

function findSourceSpan(thread) {
  const anchors = thread?.target?.anchors || [];
  return anchors.find((anchor) => anchor && anchor.type === "source-span") || null;
}

function fileMatches(workspaceRoot, candidate, savedPath) {
  if (!candidate || !savedPath) {
    return false;
  }
  return resolveWorkspaceRelative(workspaceRoot, candidate) === normalizePath(savedPath);
}

function taskTargetsDocument(task, thread, workspaceRoot, savedPath) {
  const span = findSourceSpan(thread);
  if (span && fileMatches(workspaceRoot, span.file, savedPath)) {
    return true;
  }
  if (task?.openInEditor?.file && fileMatches(workspaceRoot, task.openInEditor.file, savedPath)) {
    return true;
  }
  return false;
}

function taskTouchedBySave(task, thread, workspaceRoot, savedPath, changedRanges) {
  if (!taskTargetsDocument(task, thread, workspaceRoot, savedPath)) {
    return false;
  }

  if (!changedRanges || !changedRanges.length) {
    return true;
  }

  const span = findSourceSpan(thread);
  if (span && fileMatches(workspaceRoot, span.file, savedPath)) {
    const threadRange = { start: span.lineStart, end: span.lineEnd };
    return changedRanges.some((range) => rangeIntersects(range, threadRange));
  }

  if (task?.openInEditor?.line && fileMatches(workspaceRoot, task.openInEditor.file, savedPath)) {
    const threadRange = { start: task.openInEditor.line, end: task.openInEditor.line };
    return changedRanges.some((range) => rangeIntersects(range, threadRange));
  }

  return true;
}

function makeSystemResolutionMessage(filePath, changedRanges) {
  const relative = filePath.replace(/\\/g, "/");
  const rangeLabel = changedRanges && changedRanges.length
    ? changedRanges.map((range) => range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`).join(", ")
    : "saved";
  return `Auto-resolved after edits were saved in ${relative} at lines ${rangeLabel}.`;
}

function updateSidecarThread(thread, metadata) {
  const timestamp = metadata.timestamp || nowIso();
  const messageBody = metadata.message || makeSystemResolutionMessage(metadata.relativeFilePath, metadata.changedRanges);
  const messages = Array.isArray(thread.messages) ? [...thread.messages] : [];
  messages.push({
    id: `msg-${Math.random().toString(16).slice(2, 14)}`,
    author: metadata.author || "WireSpec IDE Companion",
    authorRole: "system",
    body: messageBody,
    createdAt: timestamp,
  });

  return {
    ...thread,
    status: "resolved",
    resolutionNote: metadata.resolutionNote || messageBody,
    updatedAt: timestamp,
    messages,
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveThreadsForFile(pair, workspaceRoot, savedPath, changedRanges, options = {}) {
  const current = {
    documentId: pair.documentId,
    annotationFilePath: pair.annotationFilePath,
    taskFilePath: pair.taskFilePath,
    sidecar: cloneJson(pair.sidecar),
    tasks: cloneJson(pair.tasks),
    mtimeMs: pair.mtimeMs,
  };

  if (!current.sidecar || !Array.isArray(current.sidecar.threads)) {
    return { pair: current, resolvedThreadIds: [], remainingOpenTasks: current.tasks?.tasks?.length || 0 };
  }

  const threadById = new Map(current.sidecar.threads.map((thread) => [thread.id, thread]));
  const resolvedThreadIds = [];
  const absoluteSavedPath = normalizePath(savedPath);
  const relativeFilePath = toWorkspaceRelative(workspaceRoot, absoluteSavedPath);

  const nextTasks = [];
  for (const task of current.tasks.tasks || []) {
    const thread = threadById.get(task.threadId);
    if (!thread || !ACTIVE_STATUSES.has(task.status || thread.status)) {
      nextTasks.push(task);
      continue;
    }

    const touched = taskTouchedBySave(task, thread, workspaceRoot, absoluteSavedPath, changedRanges);
    if (!touched) {
      nextTasks.push(task);
      continue;
    }

    resolvedThreadIds.push(task.threadId);
    if (options.keepResolvedTasksInTaskFile) {
      nextTasks.push({
        ...task,
        status: "resolved",
        resolvedAt: options.timestamp || nowIso(),
      });
    }
  }

  if (!resolvedThreadIds.length) {
    return { pair: current, resolvedThreadIds: [], remainingOpenTasks: nextTasks.filter((task) => ACTIVE_STATUSES.has(task.status)).length };
  }

  current.sidecar.threads = current.sidecar.threads.map((thread) => {
    if (!resolvedThreadIds.includes(thread.id)) {
      return thread;
    }
    return updateSidecarThread(thread, {
      timestamp: options.timestamp || nowIso(),
      author: options.author,
      changedRanges,
      relativeFilePath,
      resolutionNote: options.resolutionNote,
      message: options.message,
    });
  });

  current.tasks.tasks = nextTasks;
  current.tasks.exportedAt = options.timestamp || nowIso();
  current.tasks.resolvedThreadIds = Array.from(new Set([...(current.tasks.resolvedThreadIds || []), ...resolvedThreadIds]));

  return {
    pair: current,
    resolvedThreadIds,
    remainingOpenTasks: nextTasks.filter((task) => ACTIVE_STATUSES.has(task.status)).length,
  };
}

function summarizePairs(pairs) {
  const taskFiles = pairs.length;
  const openTasks = pairs.reduce((sum, pair) => sum + ((pair.tasks?.tasks || []).filter((task) => ACTIVE_STATUSES.has(task.status)).length), 0);
  const documents = Array.from(new Set(pairs.map((pair) => pair.documentId)));
  return { taskFiles, openTasks, documents };
}

module.exports = {
  ACTIVE_STATUSES,
  findSourceSpan,
  taskTargetsDocument,
  taskTouchedBySave,
  resolveThreadsForFile,
  summarizePairs,
};
