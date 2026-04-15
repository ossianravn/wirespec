export const SOURCE_MAP_VERSION: "0.1";
export const REVIEW_STORE_VERSION: "0.2";
export const ANNOTATION_SIDECAR_SCHEMA_VERSION: "0.3.0";
export const AGENT_TASK_EXPORT_VERSION: "0.1";

export const REVIEW_STATUSES: readonly [
  "open",
  "accepted",
  "in-progress",
  "resolved",
  "wontfix",
];
export const REVIEW_STATUS_ALIASES: Readonly<Record<string, string>>;
export const ACTIVE_REVIEW_STATUSES: readonly ["open", "accepted", "in-progress"];
export const REVIEW_SEVERITIES: readonly ["must", "should", "could", "question"];
export const REVIEW_SEVERITY_RANK: Readonly<Record<string, number>>;
export const REVIEW_MOTIVATIONS: readonly [
  "note",
  "question",
  "change-request",
  "issue",
  "approval",
  "blocking",
];
export const REVIEW_SCOPES: readonly [
  "screen",
  "section",
  "element",
  "prose",
  "acceptance",
  "region",
];
export const THREAD_ANCHOR_TYPES: readonly [
  "node-id",
  "selector",
  "source-span",
  "wire-source-span",
  "text-quote",
  "render-region",
];

export const REVIEW_UI_COPY: Readonly<Record<string, string>>;
export const annotationSidecarSchema: Readonly<Record<string, unknown>>;
export interface ReviewThreadLike {
  id: string;
  title?: string;
  status: string;
  severity: string;
  target?: {
    targetId?: string;
    variantKey?: string;
  };
  messages?: Array<{
    body?: string;
  }>;
}
export interface ReviewThreadCardHtmlOptions {
  thread: ReviewThreadLike;
  title?: string;
  targetMeta?: string;
  body?: string;
  articleClass?: string;
  headClass?: string;
  titleClass?: string;
  targetClass?: string;
  topMetaClass?: string;
  severityClass?: string;
  bodyClass?: string;
  statusContainerClass?: string;
  statusClass?: string;
  variantHtml?: string;
  trailingHtml?: string;
  actionsClass?: string;
  actionsHtml?: string;
  dataOrphaned?: boolean;
}
export interface ReviewDrawerAction {
  action: string;
  label: string;
  primary?: boolean;
}
export interface ReviewDrawerEmptyHtmlOptions {
  className?: string;
  message?: string;
  container?: "p" | "div";
}
export interface ReviewDrawerFilterHtmlOptions {
  showClosed?: boolean;
  filterTargetText?: string;
  filterClass?: string;
  buttonClass?: string;
  metaClass?: string;
}
export interface ReviewDrawerFooterHtmlOptions {
  footerClass?: string;
  actionsClass?: string;
  actions?: ReviewDrawerAction[];
}
export interface ReviewDrawerShellHtmlOptions {
  title?: string;
  metaText?: string;
  headerClass?: string;
  titleRowClass?: string;
  titleClass?: string;
  metaClass?: string;
  metaRole?: string;
  includeHeaderClose?: boolean;
  closeAction?: string;
  filterHtml?: string;
  bodyClass?: string;
  bodyRole?: string;
  bodyHtml?: string;
  footerHtml?: string;
}
export function activeReviewStatusSet(): Set<string>;
export function isClosedReviewStatus(status: string): boolean;
export function isActiveReviewStatus(status: string): boolean;
export function normalizeReviewStatus(status: string): string;
export function reviewCountSummary(counts: { active: number; total: number }): string;
export function escapeReviewHtml(value: unknown): string;
export function reviewComposerHtml(options: {
  target: { scope: string; kind: string; label: string };
  headerClass?: string;
  metaClass?: string;
  actionsClass?: string;
}): string;
export function reviewDefaultDraftTitle(target: { label?: string } | null | undefined): string;
export function reviewDrawerEmptyHtml(options?: ReviewDrawerEmptyHtmlOptions): string;
export function reviewDrawerFilterHtml(options?: ReviewDrawerFilterHtmlOptions): string;
export function reviewDrawerFooterHtml(options?: ReviewDrawerFooterHtmlOptions): string;
export function reviewDrawerShellHtml(options?: ReviewDrawerShellHtmlOptions): string;
export function reviewLatestMessageBody(thread: ReviewThreadLike | null | undefined): string;
export function reviewPinTitle(count: number): string;
export function reviewScopeLabel(scope: string | null | undefined): string;
export function reviewSeverityRank(severity: string): number;
export function reviewSeverityBadgeHtml(severity: string, className?: string): string;
export function reviewStatusLabel(status: string): string;
export function reviewStatusBadgeHtml(status: string, className?: string): string;
export function reviewToolbarHtml(options?: {
  commentMode?: boolean;
  commentAction?: string;
  includeRuntimeSlot?: boolean;
  includeThreads?: boolean;
  includeSave?: boolean;
  hintText?: string;
}): string;
export function reviewThreadActionButtonHtml(options: {
  action: string;
  threadId: string;
  label: string;
  actionAttribute?: "data-action" | "data-thread-action";
}): string;
export function reviewThreadActionLinkHtml(options: {
  href?: string;
  label: string;
}): string;
export function reviewThreadCardHtml(options: ReviewThreadCardHtmlOptions): string;
export function reviewThreadStatusAction(status: string): {
  label: string;
  nextStatus: "open" | "resolved";
};
export function reviewThreadSummary(thread: ReviewThreadLike | null | undefined): string;
export function reviewThreadsButtonLabel(activeCount: number): string;
export function reviewVariantPillHtml(variantKey: string | null | undefined, className?: string): string;

declare const contract: {
  SOURCE_MAP_VERSION: typeof SOURCE_MAP_VERSION;
  REVIEW_STORE_VERSION: typeof REVIEW_STORE_VERSION;
  ANNOTATION_SIDECAR_SCHEMA_VERSION: typeof ANNOTATION_SIDECAR_SCHEMA_VERSION;
  AGENT_TASK_EXPORT_VERSION: typeof AGENT_TASK_EXPORT_VERSION;
  REVIEW_STATUSES: typeof REVIEW_STATUSES;
  REVIEW_STATUS_ALIASES: typeof REVIEW_STATUS_ALIASES;
  ACTIVE_REVIEW_STATUSES: typeof ACTIVE_REVIEW_STATUSES;
  REVIEW_SEVERITIES: typeof REVIEW_SEVERITIES;
  REVIEW_SEVERITY_RANK: typeof REVIEW_SEVERITY_RANK;
  REVIEW_MOTIVATIONS: typeof REVIEW_MOTIVATIONS;
  REVIEW_SCOPES: typeof REVIEW_SCOPES;
  THREAD_ANCHOR_TYPES: typeof THREAD_ANCHOR_TYPES;
  REVIEW_UI_COPY: typeof REVIEW_UI_COPY;
  annotationSidecarSchema: typeof annotationSidecarSchema;
  activeReviewStatusSet: typeof activeReviewStatusSet;
  isClosedReviewStatus: typeof isClosedReviewStatus;
  isActiveReviewStatus: typeof isActiveReviewStatus;
  normalizeReviewStatus: typeof normalizeReviewStatus;
  reviewCountSummary: typeof reviewCountSummary;
  reviewComposerHtml: typeof reviewComposerHtml;
  reviewDefaultDraftTitle: typeof reviewDefaultDraftTitle;
  reviewDrawerEmptyHtml: typeof reviewDrawerEmptyHtml;
  reviewDrawerFilterHtml: typeof reviewDrawerFilterHtml;
  reviewDrawerFooterHtml: typeof reviewDrawerFooterHtml;
  reviewDrawerShellHtml: typeof reviewDrawerShellHtml;
  escapeReviewHtml: typeof escapeReviewHtml;
  reviewLatestMessageBody: typeof reviewLatestMessageBody;
  reviewPinTitle: typeof reviewPinTitle;
  reviewScopeLabel: typeof reviewScopeLabel;
  reviewSeverityRank: typeof reviewSeverityRank;
  reviewSeverityBadgeHtml: typeof reviewSeverityBadgeHtml;
  reviewStatusLabel: typeof reviewStatusLabel;
  reviewStatusBadgeHtml: typeof reviewStatusBadgeHtml;
  reviewToolbarHtml: typeof reviewToolbarHtml;
  reviewThreadActionButtonHtml: typeof reviewThreadActionButtonHtml;
  reviewThreadActionLinkHtml: typeof reviewThreadActionLinkHtml;
  reviewThreadCardHtml: typeof reviewThreadCardHtml;
  reviewThreadStatusAction: typeof reviewThreadStatusAction;
  reviewThreadSummary: typeof reviewThreadSummary;
  reviewThreadsButtonLabel: typeof reviewThreadsButtonLabel;
  reviewVariantPillHtml: typeof reviewVariantPillHtml;
};

export default contract;
