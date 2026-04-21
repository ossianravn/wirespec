export type StudioWireScalar = string | number | boolean;
export type StudioWireValue = StudioWireScalar | StudioWireScalar[];
export interface StudioSourceSpan {
    file: string;
    lineStart: number;
    columnStart: number;
    lineEnd: number;
    columnEnd: number;
}
export interface StudioInfoString {
    v?: number;
    kind: "base" | "state" | "breakpoint" | "theme" | "mode";
    name?: string;
    min?: number;
    max?: number;
    [key: string]: StudioWireValue | undefined;
}
export interface StudioProseSection {
    id: string;
    title: string;
    kind: "intent" | "acceptance" | "notes" | "other";
    body: string;
    span: StudioSourceSpan;
}
export interface StudioAcceptanceCriterion {
    id: string;
    text: string;
    level: "must" | "should" | "could" | "question";
    tags: string[];
    span: StudioSourceSpan;
}
export interface StudioWireNode {
    kind: string;
    id?: string;
    props: Record<string, StudioWireValue>;
    children: StudioWireNode[];
    span: StudioSourceSpan;
}
export type StudioVariantKind = "state" | "breakpoint" | "theme" | "mode";
export interface StudioVariantWhen {
    minWidth?: number;
    maxWidth?: number;
}
export interface StudioPatchOp {
    op: "patch";
    target: string;
    props: Record<string, StudioWireValue>;
    span: StudioSourceSpan;
}
export interface StudioShowHideRemoveOp {
    op: "show" | "hide" | "remove";
    target: string;
    span: StudioSourceSpan;
}
export interface StudioInsertOp {
    op: "insert";
    position: "before" | "after" | "inside-start" | "inside-end";
    ref: string;
    node: StudioWireNode;
    span: StudioSourceSpan;
}
export type StudioVariantOp = StudioPatchOp | StudioShowHideRemoveOp | StudioInsertOp;
export interface StudioVariantBlock {
    kind: StudioVariantKind;
    name: string;
    when?: StudioVariantWhen;
    ops: StudioVariantOp[];
    span: StudioSourceSpan;
}
export interface StudioDocument {
    schemaVersion: "1.0.0-rc0";
    sourceFormat: "markdown+wirespec";
    sourceFile: string;
    metadata: Record<string, string>;
    documentTitle: string;
    intent?: string;
    notes?: string;
    sections: StudioProseSection[];
    acceptance: StudioAcceptanceCriterion[];
    root: StudioWireNode;
    variants: StudioVariantBlock[];
}
export interface StudioInsertNodeCommand {
    type: "insert-node";
    parentId: string;
    position?: number;
    node: StudioWireNode;
}
export interface StudioRemoveNodeCommand {
    type: "remove-node";
    nodeId: string;
}
export interface StudioMoveNodeCommand {
    type: "move-node";
    nodeId: string;
    newParentId: string;
    position?: number;
}
export interface StudioPatchNodeCommand {
    type: "patch-node";
    nodeId: string;
    props: Record<string, StudioWireValue>;
}
export interface StudioWrapNodeCommand {
    type: "wrap-node";
    nodeId: string;
    wrapper: StudioWireNode;
}
export interface StudioUnwrapNodeCommand {
    type: "unwrap-node";
    nodeId: string;
}
export interface StudioVariantRefInput {
    kind: StudioVariantKind;
    name: string;
    when?: StudioVariantWhen;
}
export interface StudioAddVariantOpCommand {
    type: "add-variant-op";
    variant: StudioVariantRefInput;
    op: StudioVariantOp;
}
export interface StudioReplaceVariantCommand {
    type: "replace-variant";
    variant: StudioVariantRefInput;
    ops: StudioVariantOp[];
}
export interface StudioRemoveVariantCommand {
    type: "remove-variant";
    variant: StudioVariantRefInput;
}
export interface StudioAddAcceptanceCommand {
    type: "add-acceptance";
    text: string;
    level: StudioAcceptanceCriterion["level"];
    tags?: string[];
}
export type StudioCommand = StudioInsertNodeCommand | StudioRemoveNodeCommand | StudioMoveNodeCommand | StudioPatchNodeCommand | StudioWrapNodeCommand | StudioUnwrapNodeCommand | StudioAddVariantOpCommand | StudioReplaceVariantCommand | StudioRemoveVariantCommand | StudioAddAcceptanceCommand;
export interface StudioNotice {
    code: string;
    level: "info" | "warning";
    message: string;
}
export interface StudioProjection<VariantRef = unknown, SourceMap = unknown> {
    canonicalSource?: string;
    variantRefs?: VariantRef[];
    sourceMap?: SourceMap;
}
export interface StudioAdapters<VariantRef = unknown, SourceMap = unknown> {
    entryFile?: string;
    formatDocument?: (document: StudioDocument) => string;
    buildVariantRefs?: (document: StudioDocument) => VariantRef[];
    buildSourceMap?: (document: StudioDocument, options: {
        entryFile?: string;
        variantRefs?: VariantRef[];
    }) => SourceMap;
}
export interface StudioSession<VariantRef = unknown, SourceMap = unknown> {
    document: StudioDocument;
    past: StudioDocument[];
    future: StudioDocument[];
    lastCommand?: StudioCommand;
    lastNotices: StudioNotice[];
    adapters?: StudioAdapters<VariantRef, SourceMap>;
    projection?: StudioProjection<VariantRef, SourceMap>;
}
export interface StudioSemanticInsertIntent {
    parentId: string;
    nodeKind: string;
    position?: number;
}
export interface StudioSemanticInsertPlan {
    parentId: string;
    position: number;
    direct: boolean;
    notice?: StudioNotice;
}
