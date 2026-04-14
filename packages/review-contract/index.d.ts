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
export function activeReviewStatusSet(): Set<string>;
export function isClosedReviewStatus(status: string): boolean;
export function isActiveReviewStatus(status: string): boolean;
export function normalizeReviewStatus(status: string): string;
export function reviewCountSummary(counts: { active: number; total: number }): string;
export function reviewPinTitle(count: number): string;
export function reviewSeverityRank(severity: string): number;
export function reviewStatusLabel(status: string): string;
export function reviewThreadStatusAction(status: string): {
  label: string;
  nextStatus: "open" | "resolved";
};
export function reviewThreadsButtonLabel(activeCount: number): string;

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
  reviewPinTitle: typeof reviewPinTitle;
  reviewSeverityRank: typeof reviewSeverityRank;
  reviewStatusLabel: typeof reviewStatusLabel;
  reviewThreadStatusAction: typeof reviewThreadStatusAction;
  reviewThreadsButtonLabel: typeof reviewThreadsButtonLabel;
};

export default contract;
