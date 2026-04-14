import { ParsedWireSpecDocument, SourceMapDocument, TargetResolution, ThreadTargetRef, VariantRef } from "./types.js";
export interface BuildSourceMapOptions {
    entryFile?: string;
    generatedAt?: string;
    contentHash?: string;
    variantRefs?: VariantRef[];
}
export declare function buildVariantRefs(document: ParsedWireSpecDocument): VariantRef[];
export declare function buildSourceMap(document: ParsedWireSpecDocument, options?: BuildSourceMapOptions): SourceMapDocument;
export declare function resolveTarget(sourceMap: SourceMapDocument, ref: ThreadTargetRef): TargetResolution;
