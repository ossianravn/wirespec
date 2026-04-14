import {
  ReviewMessage,
  ReviewStatus,
  ReviewStore,
  ReviewThread,
} from "./types.js";
import reviewContract from "../../review-contract/browser.mjs";

const { REVIEW_STORE_VERSION, isActiveReviewStatus, reviewSeverityRank } = reviewContract;

function sortThreads(threads: ReviewThread[]): ReviewThread[] {
  return [...threads].sort((left, right) => {
    const severityDiff = reviewSeverityRank(left.severity) - reviewSeverityRank(right.severity);
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
    version: REVIEW_STORE_VERSION,
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
  return store.threads.filter((thread) => isActiveReviewStatus(thread.status)).length;
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
    return isActiveReviewStatus(thread.status);
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
      if (!includeResolved && !isActiveReviewStatus(thread.status)) {
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
  const active = store.threads.filter((thread) => isActiveReviewStatus(thread.status)).length;
  const resolved = store.threads.filter((thread) => thread.status === "resolved").length;
  const wontfix = store.threads.filter((thread) => thread.status === "wontfix").length;
  return {
    total: store.threads.length,
    active,
    resolved,
    wontfix,
  };
}
