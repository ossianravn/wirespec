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

function escapeReviewHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function reviewDefaultDraftTitle(target) {
  return `Review ${target?.label || "target"}`;
}

function reviewToolbarHtml(options = {}) {
  const commentMode = Boolean(options.commentMode);
  const segments = [
    `<button type="button" data-action="${options.commentAction || "comment"}" aria-pressed="${commentMode ? "true" : "false"}">${REVIEW_UI_COPY.comment}</button>`,
  ];
  if (options.includeRuntimeSlot) {
    segments.push(`<div data-ws-review-bar-actions></div>`);
  }
  if (options.includeThreads) {
    segments.push(`<button type="button" data-action="threads" aria-expanded="false">${REVIEW_UI_COPY.threads}</button>`);
  }
  if (options.includeSave) {
    segments.push(`<button type="button" data-action="save" data-primary="true">${REVIEW_UI_COPY.save}</button>`);
  }
  if (options.hintText) {
    segments.push(`<span class="ws-review-hint">${escapeReviewHtml(options.hintText)}</span>`);
  }
  return segments.join("\n");
}

function reviewComposerHtml(options) {
  const target = options.target;
  const headerClass = options.headerClass ? ` class="${escapeReviewHtml(options.headerClass)}"` : "";
  const metaClass = options.metaClass || "ws-review-target-meta";
  const actionsClass = options.actionsClass || "ws-review-composer-actions";
  return `
    <div${headerClass}>
      <h2>${REVIEW_UI_COPY.composerTitle}</h2>
      <p class="${escapeReviewHtml(metaClass)}">${escapeReviewHtml(target.scope)} · ${escapeReviewHtml(target.kind)} · ${escapeReviewHtml(target.label)}</p>
    </div>
    <label>
      <span>${REVIEW_UI_COPY.titleField}</span>
      <input name="title" type="text" placeholder="Summarize the change">
    </label>
    <label>
      <span>${REVIEW_UI_COPY.severityField}</span>
      <select name="severity">
        <option value="must">Must</option>
        <option value="should" selected>Should</option>
        <option value="could">Could</option>
        <option value="question">Question</option>
      </select>
    </label>
    <label>
      <span>${REVIEW_UI_COPY.commentField}</span>
      <textarea name="body" placeholder="Describe what should change and why."></textarea>
    </label>
    <div class="${escapeReviewHtml(actionsClass)}">
      <button type="button" data-action="cancel">${REVIEW_UI_COPY.cancel}</button>
      <button type="button" data-action="submit" data-primary="true" disabled>${REVIEW_UI_COPY.createNote}</button>
    </div>
  `;
}

function reviewLatestMessageBody(thread) {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  return messages[messages.length - 1]?.body ?? "";
}

function reviewThreadSummary(thread) {
  return thread?.title?.trim() || reviewLatestMessageBody(thread) || thread?.target?.targetId || "";
}

function reviewScopeLabel(scope) {
  switch (scope) {
    case "screen":
      return "page";
    case "section":
      return "section";
    case "element":
      return "element";
    case "prose":
      return "prose";
    case "acceptance":
      return "acceptance";
    case "region":
      return "region";
    default:
      return String(scope ?? "");
  }
}

function reviewClassAttribute(className) {
  return className ? ` class="${escapeReviewHtml(className)}"` : "";
}

function reviewSeverityBadgeHtml(severity, className = "ws-review-severity-pill") {
  return `<span${reviewClassAttribute(className)} data-severity="${escapeReviewHtml(severity)}">${escapeReviewHtml(severity)}</span>`;
}

function reviewStatusBadgeHtml(status, className = "ws-review-status-pill") {
  return `<span${reviewClassAttribute(className)}>${escapeReviewHtml(reviewStatusLabel(status))}</span>`;
}

function reviewVariantPillHtml(variantKey, className = "ws-review-pill") {
  return variantKey
    ? `<span${reviewClassAttribute(className)}>${escapeReviewHtml(variantKey)}</span>`
    : "";
}

function reviewThreadActionButtonHtml(options) {
  const actionAttribute = options.actionAttribute === "data-thread-action"
    ? "data-thread-action"
    : "data-action";
  return `<button type="button" ${actionAttribute}="${escapeReviewHtml(options.action)}" data-thread-id="${escapeReviewHtml(options.threadId)}">${escapeReviewHtml(options.label)}</button>`;
}

function reviewThreadActionLinkHtml(options) {
  if (!options.href) {
    return "";
  }
  return `<a href="${escapeReviewHtml(options.href)}">${escapeReviewHtml(options.label)}</a>`;
}

function reviewThreadCardHtml(options) {
  const thread = options.thread;
  const title = options.title ?? reviewThreadSummary(thread);
  const targetMeta = options.targetMeta ?? thread?.target?.targetId ?? "";
  const body = options.body ?? reviewLatestMessageBody(thread);
  const articleAttributes = [
    `class="${escapeReviewHtml(options.articleClass || "ws-review-thread-card")}"`,
    `data-thread-id="${escapeReviewHtml(thread.id)}"`,
  ];
  if (options.dataOrphaned !== undefined) {
    articleAttributes.push(`data-orphaned="${options.dataOrphaned ? "true" : "false"}"`);
  }

  const severityHtml = reviewSeverityBadgeHtml(
    thread.severity,
    options.severityClass || "ws-review-severity-pill",
  );
  const topMetaHtml = options.topMetaClass
    ? `<div class="${escapeReviewHtml(options.topMetaClass)}">${severityHtml}</div>`
    : severityHtml;
  const statusSegments = [
    reviewStatusBadgeHtml(thread.status, options.statusClass || "ws-review-status-pill"),
  ];
  if (options.variantHtml) {
    statusSegments.push(options.variantHtml);
  }
  const targetClass = reviewClassAttribute(options.targetClass);
  const titleClass = reviewClassAttribute(options.titleClass);
  const bodyClass = reviewClassAttribute(options.bodyClass);
  const statusContainerClass = options.statusContainerClass || "ws-review-thread-meta";
  const actionsClass = options.actionsClass || "ws-review-thread-actions";

  return `
      <article ${articleAttributes.join(" ")}>
        <div class="${escapeReviewHtml(options.headClass || "ws-review-thread-head")}">
          <div>
            <h3${titleClass}>${escapeReviewHtml(title)}</h3>
            <p${targetClass}>${escapeReviewHtml(targetMeta)}</p>
          </div>
          ${topMetaHtml}
        </div>
        <p${bodyClass}>${escapeReviewHtml(body)}</p>
        <div class="${escapeReviewHtml(statusContainerClass)}">
          ${statusSegments.join("\n          ")}
        </div>
        ${options.trailingHtml || ""}
        <div class="${escapeReviewHtml(actionsClass)}">
          ${options.actionsHtml || ""}
        </div>
      </article>
    `;
}

function reviewRoleAttribute(role) {
  return role ? ` data-role="${escapeReviewHtml(role)}"` : "";
}

function reviewDrawerEmptyHtml(options = {}) {
  const className = options.className || "ws-review-empty";
  const message = options.message ?? REVIEW_UI_COPY.emptyThreads;
  if (options.container === "div") {
    return `<div class="${escapeReviewHtml(className)}"><p>${escapeReviewHtml(message)}</p></div>`;
  }
  return `<p class="${escapeReviewHtml(className)}">${escapeReviewHtml(message)}</p>`;
}

function reviewDrawerFilterHtml(options = {}) {
  const showClosed = Boolean(options.showClosed);
  const filterClass = options.filterClass || "ws-review-drawer-filter";
  const buttonClass = options.buttonClass || "ws-review-filter-chip";
  const metaClass = options.metaClass || "ws-review-drawer-meta";
  return `
      <div class="${escapeReviewHtml(filterClass)}" data-role="filter">
        <button type="button" class="${escapeReviewHtml(buttonClass)}" data-filter="active" aria-pressed="${showClosed ? "false" : "true"}">${REVIEW_UI_COPY.activeFilter}</button>
        <button type="button" class="${escapeReviewHtml(buttonClass)}" data-filter="all" aria-pressed="${showClosed ? "true" : "false"}">${REVIEW_UI_COPY.allFilter}</button>
        <span class="${escapeReviewHtml(metaClass)}" data-role="filter-target">${escapeReviewHtml(options.filterTargetText || "")}</span>
      </div>
    `;
}

function reviewDrawerFooterHtml(options = {}) {
  const footerClass = options.footerClass || "ws-review-drawer-footer";
  const actions = Array.isArray(options.actions) ? options.actions : [];
  const buttons = actions
    .map((action) => {
      const primary = action.primary ? ' data-primary="true"' : "";
      return `<button type="button" data-action="${escapeReviewHtml(action.action)}"${primary}>${escapeReviewHtml(action.label)}</button>`;
    })
    .join("\n        ");
  const content = options.actionsClass
    ? `<div class="${escapeReviewHtml(options.actionsClass)}">${buttons}</div>`
    : buttons;
  return `
      <div class="${escapeReviewHtml(footerClass)}">
        ${content}
      </div>
    `;
}

function reviewDrawerShellHtml(options = {}) {
  const headerClass = options.headerClass || "ws-review-drawer-header";
  const bodyClass = options.bodyClass || "ws-review-drawer-body";
  const titleClass = reviewClassAttribute(options.titleClass);
  const metaClass = options.metaClass ? ` class="${escapeReviewHtml(options.metaClass)}"` : "";
  const metaRole = reviewRoleAttribute(options.metaRole);
  const titleHtml = `<h2${titleClass}>${escapeReviewHtml(options.title || REVIEW_UI_COPY.drawerTitle)}</h2>`;
  const metaHtml = `<p${metaClass}${metaRole}>${escapeReviewHtml(options.metaText || "")}</p>`;
  const closeAction = options.closeAction || "close";
  const closeButton = options.includeHeaderClose
    ? `<button type="button" data-action="${escapeReviewHtml(closeAction)}">${REVIEW_UI_COPY.close}</button>`
    : "";
  const headerInner = options.titleRowClass
    ? `<div class="${escapeReviewHtml(options.titleRowClass)}">
        <div>
          ${titleHtml}
          ${metaHtml}
        </div>
        ${closeButton}
      </div>
      ${options.filterHtml || ""}`
    : `${titleHtml}
      ${metaHtml}
      ${options.filterHtml || ""}`;
  return `
    <div class="${escapeReviewHtml(headerClass)}">
      ${headerInner}
    </div>
    <div class="${escapeReviewHtml(bodyClass)}"${reviewRoleAttribute(options.bodyRole)}>${options.bodyHtml || ""}</div>
    ${options.footerHtml || ""}
  `;
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
  reviewComposerHtml,
  reviewDefaultDraftTitle,
  reviewDrawerEmptyHtml,
  reviewDrawerFilterHtml,
  reviewDrawerFooterHtml,
  reviewDrawerShellHtml,
  escapeReviewHtml,
  reviewLatestMessageBody,
  reviewPinTitle,
  reviewScopeLabel,
  reviewSeverityRank,
  reviewSeverityBadgeHtml,
  reviewStatusLabel,
  reviewStatusBadgeHtml,
  reviewToolbarHtml,
  reviewThreadActionButtonHtml,
  reviewThreadActionLinkHtml,
  reviewThreadCardHtml,
  reviewThreadStatusAction,
  reviewThreadSummary,
  reviewThreadsButtonLabel,
  reviewVariantPillHtml,
};
