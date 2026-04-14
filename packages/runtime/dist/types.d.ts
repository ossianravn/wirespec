export type WireScalar = string | number | boolean;
export type WireValue = WireScalar | WireScalar[];
export interface SourceSpan {
    file: string;
    lineStart: number;
    columnStart: number;
    lineEnd: number;
    columnEnd: number;
}
export interface InfoString {
    v?: number;
    kind: "base" | "state" | "breakpoint" | "theme" | "mode";
    name?: string;
    min?: number;
    max?: number;
    [key: string]: WireValue | undefined;
}
export interface ProseSection {
    id: string;
    title: string;
    kind: "intent" | "acceptance" | "notes" | "other";
    body: string;
    span: SourceSpan;
}
export interface AcceptanceCriterion {
    id: string;
    text: string;
    level: "must" | "should" | "could" | "question";
    tags: string[];
    span: SourceSpan;
}
export interface WireNode {
    kind: string;
    id?: string;
    props: Record<string, WireValue>;
    children: WireNode[];
    span: SourceSpan;
}
export type VariantKind = "state" | "breakpoint" | "theme" | "mode";
export interface VariantWhen {
    minWidth?: number;
    maxWidth?: number;
}
export interface PatchOp {
    op: "patch";
    target: string;
    props: Record<string, WireValue>;
    span: SourceSpan;
}
export interface ShowHideRemoveOp {
    op: "show" | "hide" | "remove";
    target: string;
    span: SourceSpan;
}
export interface InsertOp {
    op: "insert";
    position: "before" | "after" | "inside-start" | "inside-end";
    ref: string;
    node: WireNode;
    span: SourceSpan;
}
export type VariantOp = PatchOp | ShowHideRemoveOp | InsertOp;
export interface VariantBlock {
    kind: VariantKind;
    name: string;
    when?: VariantWhen;
    ops: VariantOp[];
    span: SourceSpan;
}
export interface ParsedWireSpecDocument {
    schemaVersion: "1.0.0-rc0";
    sourceFormat: "markdown+wirespec";
    sourceFile: string;
    metadata: Record<string, string>;
    documentTitle: string;
    intent?: string;
    notes?: string;
    sections: ProseSection[];
    acceptance: AcceptanceCriterion[];
    root: WireNode;
    variants: VariantBlock[];
}
export interface VariantSelection {
    state?: string;
    breakpoint?: string;
    theme?: string;
    mode?: string;
}
export interface ResolvedDocument {
    schemaVersion: "1.0.0-rc0";
    sourceFormat: "markdown+wirespec";
    sourceFile: string;
    metadata: Record<string, string>;
    documentTitle: string;
    selection: VariantSelection;
    root: WireNode;
    sections: ProseSection[];
    acceptance: AcceptanceCriterion[];
}
export interface VariantRef {
    key: string;
    state?: string;
    breakpoint?: string;
    theme?: string;
    mode?: string;
}
export type ReviewScope = "screen" | "section" | "element" | "prose" | "acceptance" | "region";
export interface DomAnchor {
    selector: string;
    screenId: string;
    wireId?: string;
    kind?: string;
    path?: string;
    variantKey?: string;
}
export interface TargetSignature {
    text?: string;
    role?: string;
    kind?: string;
}
export interface SourceTarget {
    targetId: string;
    scope: ReviewScope;
    screenId: string;
    wireId?: string;
    kind: string;
    label?: string;
    parentTargetId?: string;
    semanticPath: string[];
    span: SourceSpan;
    dom?: DomAnchor;
    variants?: string[];
    signature?: TargetSignature;
}
export interface RenameEntry {
    fromTargetId: string;
    toTargetId: string;
    reason?: string;
}
export interface SourceMapDocument {
    version: "0.1";
    documentId: string;
    entryFile: string;
    generatedAt: string;
    contentHash?: string;
    variants: VariantRef[];
    targets: SourceTarget[];
    renames?: RenameEntry[];
}
export interface NodeIdAnchor {
    type: "node-id";
    value: string;
}
export interface SelectorAnchor {
    type: "selector";
    value: string;
}
export interface SourceSpanAnchor {
    type: "source-span";
    file: string;
    lineStart: number;
    lineEnd: number;
    columnStart?: number;
    columnEnd?: number;
}
export interface TextQuoteAnchor {
    type: "text-quote";
    exact: string;
    prefix?: string;
    suffix?: string;
}
export interface RenderRegionAnchor {
    type: "render-region";
    x: number;
    y: number;
    width: number;
    height: number;
}
export type ThreadAnchor = NodeIdAnchor | SelectorAnchor | SourceSpanAnchor | TextQuoteAnchor | RenderRegionAnchor;
export interface ThreadTargetRef {
    targetId: string;
    screenId: string;
    scope: ReviewScope;
    wireId?: string;
    variantKey?: string;
    anchors?: ThreadAnchor[];
}
export interface TargetResolution {
    status: "matched" | "renamed" | "missing-variant" | "orphaned";
    target?: SourceTarget;
    messages: string[];
}
export interface OpenInEditorLocation {
    file: string;
    line: number;
    column: number;
    uri?: string;
}
export interface OpenInEditorRequest {
    kind: "open-in-editor";
    location: OpenInEditorLocation;
}
export type ReviewStatus = "open" | "accepted" | "in-progress" | "resolved" | "wontfix";
export type ReviewSeverity = "must" | "should" | "could" | "question";
export interface SuggestedOp {
    op: "patch" | "show" | "hide" | "remove" | "insert";
    target: string;
    props?: Record<string, unknown>;
    position?: "before" | "after" | "inside-start" | "inside-end";
    ref?: string;
    node?: Record<string, unknown>;
}
export interface ReviewMessage {
    messageId: string;
    authorId: string;
    authorRole?: "human" | "agent" | "system";
    body: string;
    createdAt: string;
    kind?: "comment" | "resolution" | "system";
}
export interface ReviewThread {
    id: string;
    title?: string;
    status: ReviewStatus;
    severity: ReviewSeverity;
    motivation: "note" | "question" | "change-request" | "issue" | "approval" | "blocking";
    category: string;
    taxonomy?: string[];
    target: ThreadTargetRef;
    messages: ReviewMessage[];
    suggestedOps?: SuggestedOp[];
    createdAt: string;
    updatedAt: string;
    orphaned?: boolean;
    resolutionNote?: string;
}
export interface ReviewStore {
    version: "0.2";
    documentId: string;
    screenId: string;
    threads: ReviewThread[];
}
export interface ReviewDraft {
    targetId: string;
    title: string;
    body: string;
    category: string;
    severity: ReviewSeverity;
    motivation?: ReviewThread["motivation"];
    taxonomy?: string[];
}
export interface AnnotationSidecarSource {
    wireFile?: string;
    astFile?: string;
    component?: string;
}
export interface AnnotationSidecarMessage {
    id: string;
    author: string;
    authorRole?: "human" | "agent" | "system";
    body: string;
    createdAt: string;
}
export interface AnnotationSidecarThread {
    id: string;
    title?: string;
    status: ReviewStatus;
    severity: ReviewSeverity;
    motivation: ReviewThread["motivation"];
    category: string;
    taxonomy?: string[];
    orphaned?: boolean;
    target: ThreadTargetRef;
    messages: AnnotationSidecarMessage[];
    suggestedOps?: SuggestedOp[];
    createdAt: string;
    updatedAt: string;
    resolvedBy?: string;
    resolutionNote?: string;
}
export interface AnnotationSidecar {
    schemaVersion: "0.2.0";
    documentId: string;
    source?: AnnotationSidecarSource;
    threads: AnnotationSidecarThread[];
}
export interface AgentTask {
    taskId: string;
    threadId: string;
    status: ReviewStatus;
    severity: ReviewSeverity;
    severityRank: number;
    screenId: string;
    scope: ReviewScope;
    targetId: string;
    wireId?: string;
    variantKey?: string;
    summary: string;
    requestedChange: string;
    taxonomy?: string[];
    suggestedOps?: SuggestedOp[];
    openInEditor?: OpenInEditorLocation;
    orphaned: boolean;
}
export interface AgentTaskExport {
    version: "0.1";
    documentId: string;
    exportedAt: string;
    tasks: AgentTask[];
}
