const severityRank = {
    must: 0,
    should: 1,
    could: 2,
    question: 3,
};
const activeStatuses = new Set(["open", "accepted", "in-progress"]);
function sortThreads(threads) {
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
export function createEmptyReviewStore(documentId, screenId) {
    return {
        version: "0.2",
        documentId,
        screenId,
        threads: [],
    };
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
export function upsertThread(store, thread) {
    const existingIndex = store.threads.findIndex((entry) => entry.id === thread.id);
    if (existingIndex === -1) {
        return addThread(store, thread);
    }
    const threads = [...store.threads];
    threads[existingIndex] = thread;
    return replaceThreads(store, threads);
}
export function appendMessage(store, threadId, message) {
    return replaceThreads(store, store.threads.map((thread) => thread.id === threadId
        ? {
            ...thread,
            messages: [...thread.messages, message],
            updatedAt: message.createdAt,
        }
        : thread));
}
export function updateThreadStatus(store, threadId, status, options = {}) {
    const updatedAt = options.updatedAt ?? new Date().toISOString();
    return replaceThreads(store, store.threads.map((thread) => thread.id === threadId
        ? {
            ...thread,
            status,
            updatedAt,
            resolutionNote: options.resolutionNote ?? thread.resolutionNote,
        }
        : thread));
}
export function activeThreadCount(store) {
    return store.threads.filter((thread) => activeStatuses.has(thread.status)).length;
}
export function targetThreadCount(store, targetId, includeResolved = false) {
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
export function threadsForTarget(store, targetId, options = {}) {
    const includeResolved = options.includeResolved ?? false;
    const requestedVariant = options.variantKey;
    return sortThreads(store.threads.filter((thread) => {
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
    }));
}
export function reviewCounts(store) {
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
