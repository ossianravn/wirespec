import { ReviewMessage, ReviewStatus, ReviewStore, ReviewThread } from "./types.js";
export declare function createEmptyReviewStore(documentId: string, screenId: string): ReviewStore;
export declare function replaceThreads(store: ReviewStore, threads: ReviewThread[]): ReviewStore;
export declare function addThread(store: ReviewStore, thread: ReviewThread): ReviewStore;
export declare function upsertThread(store: ReviewStore, thread: ReviewThread): ReviewStore;
export declare function appendMessage(store: ReviewStore, threadId: string, message: ReviewMessage): ReviewStore;
export declare function updateThreadStatus(store: ReviewStore, threadId: string, status: ReviewStatus, options?: {
    resolutionNote?: string;
    updatedAt?: string;
}): ReviewStore;
export declare function activeThreadCount(store: ReviewStore): number;
export declare function targetThreadCount(store: ReviewStore, targetId: string, includeResolved?: boolean): number;
export declare function threadsForTarget(store: ReviewStore, targetId: string, options?: {
    includeResolved?: boolean;
    variantKey?: string;
}): ReviewThread[];
export declare function reviewCounts(store: ReviewStore): {
    total: number;
    active: number;
    resolved: number;
    wontfix: number;
};
