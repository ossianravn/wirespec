import reviewContract from "../../review-contract/browser.mjs";

const { REVIEW_STORE_VERSION, isActiveReviewStatus, reviewSeverityRank } = reviewContract;

export function createEmptyReviewStore(documentId) {
  return {
    version: REVIEW_STORE_VERSION,
    documentId,
    threads: [],
  };
}

function sortThreads(threads) {
  return [...threads].sort((a, b) => {
    const aRank = reviewSeverityRank(a.severity);
    const bRank = reviewSeverityRank(b.severity);
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
}

export function replaceThreads(store, threads) {
  return {
    ...store,
    threads: sortThreads(threads),
  };
}

export function addThread(store, thread) {
  return replaceThreads(store, [...store.threads, thread]);
}

export function updateThreadStatus(store, threadId, status, options = {}) {
  const updatedAt = options.updatedAt || new Date().toISOString();
  return replaceThreads(
    store,
    store.threads.map((thread) =>
      thread.id === threadId
        ? {
            ...thread,
            status,
            updatedAt,
            resolutionNote: options.resolutionNote ?? thread.resolutionNote,
          }
        : thread,
    ),
  );
}

export function activeThreadCount(store) {
  return store.threads.filter((thread) => isActiveReviewStatus(thread.status)).length;
}

export function reviewCounts(store) {
  return {
    total: store.threads.length,
    active: activeThreadCount(store),
    resolved: store.threads.filter((thread) => thread.status === "resolved").length,
    wontfix: store.threads.filter((thread) => thread.status === "wontfix").length,
  };
}

export function threadsForTarget(store, targetId, variantKey) {
  return store.threads.filter((thread) => {
    if (thread.target.targetId !== targetId) {
      return false;
    }
    if (!variantKey) {
      return true;
    }
    return !thread.target.variantKey || thread.target.variantKey === variantKey;
  });
}
