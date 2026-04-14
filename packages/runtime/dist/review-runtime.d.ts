import { AnnotationSidecar, AgentTaskExport, ReviewStore, SourceMapDocument } from "./types.js";
export interface ReviewRuntimeOptions {
    sourceMap: SourceMapDocument;
    variantKey?: string;
    workspaceRoot?: string;
    authorId?: string;
    authorRole?: "human" | "agent" | "system";
    initialStore?: ReviewStore;
    initialSidecar?: AnnotationSidecar;
    storageKey?: string | false;
    commentModeDefault?: boolean;
}
export interface ReviewRuntimeController {
    dispose: () => void;
    getStore: () => ReviewStore;
    getSidecar: () => AnnotationSidecar;
    getAgentTasks: () => AgentTaskExport;
    openDrawer: (targetId?: string) => void;
    closeDrawer: () => void;
    replaceStore: (store: ReviewStore) => void;
}
export declare function mountReviewRuntime(options: ReviewRuntimeOptions): ReviewRuntimeController;
