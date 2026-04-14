const SOURCE_MAP_VERSION = "0.1";
const REVIEW_STORE_VERSION = "0.2";
const ANNOTATION_SIDECAR_SCHEMA_VERSION = "0.3.0";
const AGENT_TASK_EXPORT_VERSION = "0.1";

const REVIEW_STATUSES = Object.freeze([
  "open",
  "accepted",
  "in-progress",
  "resolved",
  "wontfix",
]);

const REVIEW_STATUS_ALIASES = Object.freeze({
  in_progress: "in-progress",
});

const ACTIVE_REVIEW_STATUSES = Object.freeze([
  "open",
  "accepted",
  "in-progress",
]);

const REVIEW_SEVERITIES = Object.freeze([
  "must",
  "should",
  "could",
  "question",
]);

const REVIEW_SEVERITY_RANK = Object.freeze({
  must: 0,
  should: 1,
  could: 2,
  question: 3,
});

const REVIEW_MOTIVATIONS = Object.freeze([
  "note",
  "question",
  "change-request",
  "issue",
  "approval",
  "blocking",
]);

const REVIEW_SCOPES = Object.freeze([
  "screen",
  "section",
  "element",
  "prose",
  "acceptance",
  "region",
]);

const THREAD_ANCHOR_TYPES = Object.freeze([
  "node-id",
  "selector",
  "source-span",
  "wire-source-span",
  "text-quote",
  "render-region",
]);

function normalizeReviewStatus(status) {
  return REVIEW_STATUS_ALIASES[status] || status;
}

function isActiveReviewStatus(status) {
  return ACTIVE_REVIEW_STATUSES.includes(normalizeReviewStatus(status));
}

function isClosedReviewStatus(status) {
  const normalized = normalizeReviewStatus(status);
  return normalized === "resolved" || normalized === "wontfix";
}

function reviewSeverityRank(severity) {
  return REVIEW_SEVERITY_RANK[severity] ?? 99;
}

function activeReviewStatusSet() {
  return new Set(ACTIVE_REVIEW_STATUSES);
}

const REVIEW_UI_COPY = Object.freeze({
  toolbarLabel: "Review tools",
  comment: "Comment",
  threads: "Threads",
  save: "Save",
  drawerLabel: "Review threads",
  drawerTitle: "Review threads",
  close: "Close",
  activeFilter: "Active",
  allFilter: "All",
  newNoteLabel: "New review note",
  composerTitle: "New review note",
  createNote: "Create note",
  titleField: "Title",
  severityField: "Severity",
  commentField: "Comment",
  cancel: "Cancel",
  resolve: "Resolve",
  reopen: "Reopen",
  wontfix: "Won't fix",
  focusTarget: "Focus target",
  openSource: "Open source",
  exportAnnotations: "Export annotations",
  exportTasks: "Agent tasks",
  importAnnotations: "Import",
  resetLocal: "Reset local",
  emptyThreads: "No threads in this view.",
});

function reviewStatusLabel(status) {
  const normalized = normalizeReviewStatus(status);
  if (normalized === "wontfix") {
    return "Won't fix";
  }
  if (normalized === "in-progress") {
    return "In progress";
  }
  return normalized;
}

function reviewThreadStatusAction(status) {
  return isClosedReviewStatus(status)
    ? { label: REVIEW_UI_COPY.reopen, nextStatus: "open" }
    : { label: REVIEW_UI_COPY.resolve, nextStatus: "resolved" };
}

function reviewThreadsButtonLabel(activeCount) {
  return `${REVIEW_UI_COPY.threads} ${activeCount}`;
}

function reviewCountSummary(counts) {
  return `${counts.active} active · ${counts.total} total`;
}

function reviewPinTitle(count) {
  return `${count} active review ${count === 1 ? "thread" : "threads"}`;
}

const lineSpanAnchorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["type", "file", "lineStart", "lineEnd"],
  properties: {
    type: { enum: ["source-span", "wire-source-span"] },
    file: { type: "string" },
    lineStart: { type: "integer", minimum: 1 },
    lineEnd: { type: "integer", minimum: 1 },
    columnStart: { type: "integer", minimum: 1 },
    columnEnd: { type: "integer", minimum: 1 },
  },
};

const annotationSidecarSchema = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://wirespec.dev/schemas/wirespec-annotation-sidecar-v0.3.schema.json",
  title: "WireSpec Annotation Sidecar v0.3",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "documentId", "threads"],
  properties: {
    schemaVersion: { const: ANNOTATION_SIDECAR_SCHEMA_VERSION },
    documentId: { type: "string" },
    source: {
      type: "object",
      additionalProperties: false,
      properties: {
        wireFile: { type: "string" },
        astFile: { type: "string" },
        component: { type: "string" },
      },
    },
    threads: {
      type: "array",
      items: { $ref: "#/$defs/thread" },
    },
  },
  $defs: {
    thread: {
      type: "object",
      additionalProperties: false,
      required: [
        "id",
        "status",
        "severity",
        "motivation",
        "category",
        "target",
        "messages",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        id: { type: "string", pattern: "^ann-[A-Za-z0-9][A-Za-z0-9-]*$" },
        title: { type: "string" },
        status: { enum: REVIEW_STATUSES },
        severity: { enum: REVIEW_SEVERITIES },
        motivation: { enum: REVIEW_MOTIVATIONS },
        category: { type: "string" },
        taxonomy: {
          type: "array",
          items: { type: "string" },
        },
        orphaned: { type: "boolean" },
        target: { $ref: "#/$defs/target" },
        messages: {
          type: "array",
          minItems: 1,
          items: { $ref: "#/$defs/message" },
        },
        suggestedOps: {
          type: "array",
          items: { $ref: "#/$defs/op" },
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        resolvedBy: { type: "string" },
        resolutionNote: { type: "string" },
      },
    },
    target: {
      type: "object",
      additionalProperties: false,
      required: ["targetId", "screenId", "scope", "anchors"],
      properties: {
        targetId: { type: "string" },
        screenId: { type: "string" },
        scope: { enum: REVIEW_SCOPES },
        wireId: { type: "string" },
        variantKey: { type: "string" },
        anchors: {
          type: "array",
          items: { $ref: "#/$defs/anchor" },
        },
      },
    },
    anchor: {
      oneOf: [
        { $ref: "#/$defs/nodeIdAnchor" },
        { $ref: "#/$defs/selectorAnchor" },
        { $ref: "#/$defs/lineSpanAnchor" },
        { $ref: "#/$defs/textQuoteAnchor" },
        { $ref: "#/$defs/renderRegionAnchor" },
      ],
    },
    nodeIdAnchor: {
      type: "object",
      additionalProperties: false,
      required: ["type", "value"],
      properties: {
        type: { const: "node-id" },
        value: { type: "string" },
      },
    },
    selectorAnchor: {
      type: "object",
      additionalProperties: false,
      required: ["type", "value"],
      properties: {
        type: { const: "selector" },
        value: { type: "string" },
      },
    },
    lineSpanAnchor: lineSpanAnchorSchema,
    textQuoteAnchor: {
      type: "object",
      additionalProperties: false,
      required: ["type", "exact"],
      properties: {
        type: { const: "text-quote" },
        exact: { type: "string" },
        prefix: { type: "string" },
        suffix: { type: "string" },
      },
    },
    renderRegionAnchor: {
      type: "object",
      additionalProperties: false,
      required: ["type", "x", "y", "width", "height"],
      properties: {
        type: { const: "render-region" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number", minimum: 0 },
        height: { type: "number", minimum: 0 },
      },
    },
    message: {
      type: "object",
      additionalProperties: false,
      required: ["id", "author", "body", "createdAt"],
      properties: {
        id: { type: "string", pattern: "^msg-[A-Za-z0-9][A-Za-z0-9-]*$" },
        author: { type: "string" },
        authorRole: { enum: ["human", "agent", "system"] },
        body: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    op: {
      oneOf: [
        { $ref: "#/$defs/patchOp" },
        { $ref: "#/$defs/showHideRemoveOp" },
        { $ref: "#/$defs/insertOp" },
      ],
    },
    patchOp: {
      type: "object",
      additionalProperties: false,
      required: ["op", "target", "props"],
      properties: {
        op: { const: "patch" },
        target: { type: "string" },
        props: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    showHideRemoveOp: {
      type: "object",
      additionalProperties: false,
      required: ["op", "target"],
      properties: {
        op: { enum: ["show", "hide", "remove"] },
        target: { type: "string" },
      },
    },
    insertOp: {
      type: "object",
      additionalProperties: false,
      required: ["op", "position", "ref", "node"],
      properties: {
        op: { const: "insert" },
        position: { enum: ["before", "after", "inside-start", "inside-end"] },
        ref: { type: "string" },
        node: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
  },
});

module.exports = {
  SOURCE_MAP_VERSION,
  REVIEW_STORE_VERSION,
  ANNOTATION_SIDECAR_SCHEMA_VERSION,
  AGENT_TASK_EXPORT_VERSION,
  REVIEW_STATUSES,
  REVIEW_STATUS_ALIASES,
  ACTIVE_REVIEW_STATUSES,
  REVIEW_SEVERITIES,
  REVIEW_SEVERITY_RANK,
  REVIEW_MOTIVATIONS,
  REVIEW_SCOPES,
  THREAD_ANCHOR_TYPES,
  REVIEW_UI_COPY,
  annotationSidecarSchema,
  activeReviewStatusSet,
  isClosedReviewStatus,
  isActiveReviewStatus,
  normalizeReviewStatus,
  reviewCountSummary,
  reviewPinTitle,
  reviewSeverityRank,
  reviewStatusLabel,
  reviewThreadStatusAction,
  reviewThreadsButtonLabel,
};
