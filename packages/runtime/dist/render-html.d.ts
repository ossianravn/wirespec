import { ParsedWireSpecDocument, ResolvedDocument, VariantSelection } from "./types.js";
export interface RenderOptions {
    includeDocumentShell?: boolean;
    includeAcceptance?: boolean;
    titleSuffix?: string;
}
export declare function wireframeCss(): string;
export declare function renderResolvedDocument(document: ResolvedDocument, options?: RenderOptions): string;
export declare function renderDocumentSelection(document: ParsedWireSpecDocument, selection?: VariantSelection, options?: RenderOptions): string;
