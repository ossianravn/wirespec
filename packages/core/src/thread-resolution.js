const { resolveWorkspaceRelative, normalizePath, toWorkspaceRelative } = require("./path-utils");
const { ACTIVE_REVIEW_STATUSES, isActiveReviewStatus } = require("../../review-contract");

const ACTIVE_STATUSES = new Set(ACTIVE_REVIEW_STATUSES);

function nowIso() {
  return new Date().toISOString();
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function rangeIntersects(a, b) {
  return a.start <= b.end && b.start <= a.end;
}

function findSourceSpans(thread) {
  return (thread?.target?.anchors || []).filter((anchor) => anchor && anchor.type === "source-span");
}

function taskTargetsDocument(task, thread, workspaceRoot, savedPath) {
  for (const anchor of findSourceSpans(thread)) {
    if (resolveWorkspaceRelative(workspaceRoot, anchor.file) === normalizePath(savedPath)) {
      return true;
    }
  }

  if (task?.openInEditor?.file && resolveWorkspaceRelative(workspaceRoot, task.openInEditor.file) === normalizePath(savedPath)) {
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

  const matchingSpans = findSourceSpans(thread).filter((anchor) => resolveWorkspaceRelative(workspaceRoot, anchor.file) === normalizePath(savedPath));
  for (const anchor of matchingSpans) {
    const threadRange = { start: Number(anchor.lineStart || 1), end: Number(anchor.lineEnd || anchor.lineStart || 1) };
    if (changedRanges.some((range) => rangeIntersects(range, threadRange))) {
      return true;
    }
  }

  if (task?.openInEditor?.line && task?.openInEditor?.file && resolveWorkspaceRelative(workspaceRoot, task.openInEditor.file) === normalizePath(savedPath)) {
    const threadRange = {
      start: Number(task.openInEditor.line),
      end: Number(task.openInEditor.line),
    };
    return changedRanges.some((range) => rangeIntersects(range, threadRange));
  }

  return false;
}

function makeSystemResolutionMessage(filePath, changedRanges) {
  const relative = filePath.replace(/\\/g, "/");
  const rangeLabel = changedRanges && changedRanges.length
    ? changedRanges.map((range) => (range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`)).join(", ")
    : "saved";
  return `Auto-resolved after edits were saved in ${relative} at lines ${rangeLabel}.`;
}

function updateSidecarThread(thread, metadata) {
  const timestamp = metadata.timestamp || nowIso();
  const messageBody = metadata.message || makeSystemResolutionMessage(metadata.relativeFilePath, metadata.changedRanges);
  const messages = Array.isArray(thread.messages) ? [...thread.messages] : [];
  messages.push({
    id: metadata.messageId || `msg-${Math.random().toString(16).slice(2, 14)}`,
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
    return {
      pair: current,
      resolvedThreadIds: [],
      remainingOpenTasks: (current.tasks?.tasks || []).filter((task) => isActiveReviewStatus(task.status)).length,
    };
  }

  const threadById = new Map(current.sidecar.threads.map((thread) => [thread.id, thread]));
  const resolvedThreadIds = [];
  const absoluteSavedPath = normalizePath(savedPath);
  const relativeFilePath = toWorkspaceRelative(workspaceRoot, absoluteSavedPath);
  const nextTasks = [];

  for (const task of current.tasks.tasks || []) {
    const thread = threadById.get(task.threadId);
    const activeStatus = task.status || thread?.status;
    if (!thread || !isActiveReviewStatus(activeStatus)) {
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
    return {
      pair: current,
      resolvedThreadIds: [],
      remainingOpenTasks: nextTasks.filter((task) => isActiveReviewStatus(task.status)).length,
    };
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
      message: options.message,
      messageId: options.messageId,
      resolutionNote: options.resolutionNote,
    });
  });

  current.tasks.tasks = nextTasks;
  current.tasks.exportedAt = options.timestamp || nowIso();
  current.tasks.resolvedThreadIds = Array.from(new Set([...(current.tasks.resolvedThreadIds || []), ...resolvedThreadIds]));

  return {
    pair: current,
    resolvedThreadIds,
    remainingOpenTasks: nextTasks.filter((task) => isActiveReviewStatus(task.status)).length,
  };
}

module.exports = {
  ACTIVE_STATUSES,
  findSourceSpans,
  taskTargetsDocument,
  taskTouchedBySave,
  resolveThreadsForFile,
};
