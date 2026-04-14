import { SourceSpan, WireNode, WireScalar, WireValue } from "./types.js";
export declare class WireSpecParseError extends Error {
    readonly span?: SourceSpan | undefined;
    constructor(message: string, span?: SourceSpan | undefined);
}
export declare function stripQuotes(value: string): string;
export declare function escapeHtml(value: string): string;
export declare function deepCloneNode(node: WireNode): WireNode;
export declare function sourceSpan(file: string, lineStart: number, columnStart: number, lineEnd: number, columnEnd: number): SourceSpan;
export declare function countLeadingSpaces(value: string): number;
export declare function normalizeSectionId(title: string): string;
export declare function parseScalar(raw: string): WireScalar;
export declare function parseValue(raw: string): WireValue;
export declare function unescapeQuoted(value: string): string;
export declare function formatValue(value: WireValue): string;
export declare function nodeLabel(node: WireNode): string | undefined;
export declare function isTruthy(value: WireValue | undefined): boolean;
export declare function isVisible(node: WireNode): boolean;
export declare function screenIdFromNode(node: WireNode): string;
export declare function toKebab(input: string): string;
export declare function roleForNode(node: WireNode): string | undefined;
export declare function classifyScope(kind: string, hasChildren: boolean): "screen" | "section" | "element";
export declare function semanticTargetId(scope: "screen" | "section" | "element", node: WireNode): string;
