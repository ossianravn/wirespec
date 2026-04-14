import { AnnotationSidecar, ReviewDraft, ReviewStore, ReviewThread, SourceMapDocument, SourceTarget, ThreadAnchor } from "./types.js";
export interface CreateThreadOptions {
    authorId?: string;
    authorRole?: "human" | "agent" | "system";
    now?: string;
    variantKey?: string;
}
export interface SidecarOptions {
    wireFile?: string;
    astFile?: string;
    component?: string;
}
export declare function buildAnchorsForTarget(target: SourceTarget): ThreadAnchor[];
export declare function createReviewThreadFromDraft(draft: ReviewDraft, sourceMap: SourceMapDocument, options?: CreateThreadOptions): ReviewThread;
export declare function reviewStoreToSidecar(store: ReviewStore, sourceMap: SourceMapDocument, options?: SidecarOptions): AnnotationSidecar;
export declare function sidecarToReviewStore(sidecar: AnnotationSidecar, sourceMap?: SourceMapDocument): ReviewStore;
export declare function relinkStoreAgainstSourceMap(store: ReviewStore, sourceMap: SourceMapDocument): ReviewStore;
export declare function summarizeThread(thread: ReviewThread): string;
