import { SourceMapDocument } from "./types.js";
export interface ReviewDraft {
    targetId: string;
    title: string;
    body: string;
    category: string;
    severity: "must" | "should" | "could" | "question";
}
export interface ReviewOverlayOptions {
    sourceMap?: SourceMapDocument;
    commentModeDefault?: boolean;
}
interface TargetMeta {
    targetId: string;
    label: string;
    scope: string;
    kind: string;
}
export declare function mountReviewOverlay(options?: ReviewOverlayOptions): () => void;
export declare function targetFromEvent(event: MouseEvent, sourceMap?: SourceMapDocument): TargetMeta | null;
export {};
