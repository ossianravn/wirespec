import { SourceMapDocument } from "./types.js";
export interface ReviewOverlayOptions {
    sourceMap?: SourceMapDocument;
    commentModeDefault?: boolean;
    hintText?: string;
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
