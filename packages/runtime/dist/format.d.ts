import { FormatOptions, ParsedWireSpecDocument, VariantBlock, WireNode } from "./types.js";
export declare function formatWireNode(node: WireNode, options?: FormatOptions): string;
export declare function formatVariantBlock(block: VariantBlock, options?: FormatOptions): string;
export declare function formatWireSpecDocument(document: ParsedWireSpecDocument, options?: FormatOptions): string;
