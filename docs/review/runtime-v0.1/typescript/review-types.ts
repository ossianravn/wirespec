export type ReviewScope =
  | "screen"
  | "section"
  | "element"
  | "prose"
  | "acceptance"
  | "region";

export type ReviewStatus =
  | "open"
  | "accepted"
  | "in-progress"
  | "resolved"
  | "wontfix";

export type ReviewSeverity = "must" | "should" | "could" | "question";

export type ReviewMotivation =
  | "note"
  | "question"
  | "change-request"
  | "issue"
  | "approval"
  | "blocking";

export interface SourceSpan {
  file: string;
  lineStart: number;
  columnStart: number;
  lineEnd: number;
  columnEnd: number;
}

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VariantRef {
  key: string;
  state?: string;
  breakpoint?: string;
  theme?: string;
  mode?: string;
}

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
  lastKnownRect?: NormalizedRect;
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

export interface ThreadTargetRef {
  targetId: string;
  screenId: string;
  scope: ReviewScope;
  wireId?: string;
  variantKey?: string;
  region?: NormalizedRect;
}

export interface ReviewMessage {
  messageId: string;
  authorId: string;
  body: string;
  createdAt: string;
  kind?: "comment" | "resolution" | "system";
}

export interface SuggestedOp {
  op: "patch" | "show" | "hide" | "remove" | "insert";
  target: string;
  props?: Record<string, unknown>;
  position?: "before" | "after" | "inside-start" | "inside-end";
  ref?: string;
  node?: Record<string, unknown>;
}

export interface ReviewThread {
  id: string;
  title?: string;
  status: ReviewStatus;
  severity: ReviewSeverity;
  motivation: ReviewMotivation;
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
  version: "0.1";
  documentId: string;
  screenId: string;
  threads: ReviewThread[];
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

export interface ActorRef {
  id: string;
  kind: "human" | "agent" | "system";
  name?: string;
}

export interface ReviewEventEnvelope<TPayload = Record<string, unknown>> {
  version: "0.1";
  type:
    | "wirespec.review.thread.created"
    | "wirespec.review.thread.messageAdded"
    | "wirespec.review.thread.statusChanged"
    | "wirespec.review.thread.retargeted"
    | "wirespec.review.editor.openRequested"
    | "wirespec.review.agent.exportRequested"
    | "wirespec.review.preview.stale";
  occurredAt: string;
  actor: ActorRef;
  screenId: string;
  payload: TPayload;
}
