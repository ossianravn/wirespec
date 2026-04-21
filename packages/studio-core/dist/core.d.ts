import { StudioAdapters, StudioCommand, StudioDocument, StudioNotice, StudioProjection, StudioSemanticInsertIntent, StudioSemanticInsertPlan, StudioSession, StudioSourceSpan, StudioWireNode, StudioWireValue } from "./types.js";
export declare class StudioCommandError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare function syntheticSpan(file?: string): StudioSourceSpan;
export declare function canInsertSemanticChild(parentKind: string, childKind: string): boolean;
export declare function createStudioNode(kind: string, options?: {
    id?: string;
    props?: Record<string, StudioWireValue>;
    children?: StudioWireNode[];
    sourceFile?: string;
}): StudioWireNode;
export declare function planSemanticInsert(document: StudioDocument, intent: StudioSemanticInsertIntent): StudioSemanticInsertPlan;
export declare function createStudioSession<VariantRef = unknown, SourceMap = unknown>(document: StudioDocument, adapters?: StudioAdapters<VariantRef, SourceMap>): StudioSession<VariantRef, SourceMap>;
export declare function applyStudioCommand(document: StudioDocument, command: StudioCommand): {
    document: StudioDocument;
    notices: StudioNotice[];
};
export declare function applyStudioCommandToSession<VariantRef = unknown, SourceMap = unknown>(session: StudioSession<VariantRef, SourceMap>, command: StudioCommand): StudioSession<VariantRef, SourceMap>;
export declare function undoStudioSession<VariantRef = unknown, SourceMap = unknown>(session: StudioSession<VariantRef, SourceMap>): StudioSession<VariantRef, SourceMap>;
export declare function redoStudioSession<VariantRef = unknown, SourceMap = unknown>(session: StudioSession<VariantRef, SourceMap>): StudioSession<VariantRef, SourceMap>;
export declare function formatStudioDocument<VariantRef = unknown, SourceMap = unknown>(session: StudioSession<VariantRef, SourceMap>): string;
export declare function projectStudioDocument<VariantRef = unknown, SourceMap = unknown>(document: StudioDocument, adapters: StudioAdapters<VariantRef, SourceMap>): StudioProjection<VariantRef, SourceMap>;
