const { ACTIVE_STATUSES } = require("./thread-resolution");
const { isActiveReviewStatus, reviewSeverityRank } = require("../../review-contract");

function severityRank(task) {
  return typeof task?.severityRank === "number"
    ? task.severityRank
    : reviewSeverityRank(task?.severity);
}

function sortPairsByMtime(pairs) {
  return [...pairs].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function pickNextOpenTask(pair) {
  const active = (pair?.tasks?.tasks || []).filter((task) => isActiveReviewStatus(task.status));
  if (!active.length) {
    return null;
  }
  return active.sort((a, b) => {
    if (severityRank(a) !== severityRank(b)) {
      return severityRank(a) - severityRank(b);
    }
    return String(a.threadId).localeCompare(String(b.threadId));
  })[0];
}

function buildSummary(pairs) {
  const normalized = sortPairsByMtime(pairs);
  const documents = Array.from(new Set(normalized.map((pair) => pair.documentId)));
  const openTasks = normalized.reduce((sum, pair) => sum + (pair.tasks?.tasks || []).filter((task) => isActiveReviewStatus(task.status)).length, 0);
  return {
    taskFiles: normalized.length,
    documents,
    openTasks,
    latestDocumentId: normalized[0]?.documentId || null,
    latestTaskFile: normalized[0]?.taskFilePath || null,
  };
}

module.exports = {
  severityRank,
  sortPairsByMtime,
  pickNextOpenTask,
  buildSummary,
};
