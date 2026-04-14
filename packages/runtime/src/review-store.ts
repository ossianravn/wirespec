import {
  ReviewMessage,
  ReviewStatus,
  ReviewStore,
  ReviewThread,
} from "./types.js";

const severityRank: Record<ReviewThread["severity"], number> = {
  must: 0,
  should: 1,
  could: 2,
  question: 3,
};

const activeStatuses = new Set<ReviewStatus>(["open", "accepted", "in-progress"]);

function sortThreads(threads: ReviewThread[]): ReviewThread[] {
  return [...threads].sort((left, right) => {
    const severityDiff = severityRank[left.severity] - severityRank[right.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    if (left.updatedAt !== right.updatedAt) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }
    return left.id.localeCompare(right.id);
  });
}

export function createEmptyReviewStore(
  documentId: string,
  screenId: string,
): ReviewStore {
  return {
    version: "0.2",
    documentId,
    screenId,
    threads: [],
  };
}

export function replaceThreads(
  store: ReviewStore,
  threads: ReviewThread[],
): ReviewStore {
  return {
    ...store,
    threads: sortThreads(threads),
  };
}

export function addThread(
  store: ReviewStore,
  thread: ReviewThread,
): ReviewStore {
  return replaceThreads(store, [...store.threads, thread]);
}

export function upsertThread(
  store: ReviewStore,
  thread: ReviewThread,
): ReviewStore {
  const existingIndex = store.threads.findIndex((entry) => entry.id === thread.id);
  if (existingIndex === -1) {
    return addThread(store, thread);
  }
  const threads = [...store.threads];
  threads[existingIndex] = thread;
  return replaceThreads(store, threads);
}

export function appendMessage(
  store: ReviewStore,
  threadId: string,
  message: ReviewMessage,
): ReviewStore {
  return replaceThreads(
    store,
    store.threads.map((thread) =>
      thread.id === threadId
        ? {
            ...thread,
            messages: [...thread.messages, message],
            updatedAt: message.createdAt,
          }
        : thread,
    ),
  );
}

export function updateThreadStatus(
  store: ReviewStore,
  threadId: string,
  status: ReviewStatus,
  options: { resolutionNote?: string; updatedAt?: string } = {},
): ReviewStore {
  const updatedAt = options.updatedAt ?? new Date().toISOString();
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

export function activeThreadCount(store: ReviewStore): number {
  return store.threads.filter((thread) => activeStatuses.has(thread.status)).length;
}

export function targetThreadCount(
  store: ReviewStore,
  targetId: string,
  includeResolved = false,
): number {
  return store.threads.filter((thread) => {
    if (thread.target.targetId !== targetId) {
      return false;
    }
    if (includeResolved) {
      return true;
    }
    return activeStatuses.has(thread.status);
  }).length;
}

export function threadsForTarget(
  store: ReviewStore,
  targetId: string,
  options: { includeResolved?: boolean; variantKey?: string } = {},
): ReviewThread[] {
  const includeResolved = options.includeResolved ?? false;
  const requestedVariant = options.variantKey;
  return sortThreads(
    store.threads.filter((thread) => {
      if (thread.target.targetId !== targetId) {
        return false;
      }
      if (!includeResolved && !activeStatuses.has(thread.status)) {
        return false;
      }
      if (!requestedVariant) {
        return true;
      }
      return !thread.target.variantKey || thread.target.variantKey === requestedVariant;
    }),
  );
}

export function reviewCounts(store: ReviewStore): {
  total: number;
  active: number;
  resolved: number;
  wontfix: number;
} {
  const active = store.threads.filter((thread) => activeStatuses.has(thread.status)).length;
  const resolved = store.threads.filter((thread) => thread.status === "resolved").length;
  const wontfix = store.threads.filter((thread) => thread.status === "wontfix").length;
  return {
    total: store.threads.length,
    active,
    resolved,
    wontfix,
  };
}
