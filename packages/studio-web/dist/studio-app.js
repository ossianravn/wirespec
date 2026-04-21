import {
  EDIT_SCOPES,
  PALETTE_GROUPS,
  TEMPLATE_CATALOG,
  addAcceptanceCriterion,
  applyScopedNodeProp,
  canRemoveScopeVariant,
  createStudioWorkspaceFromSource,
  deleteActiveVariant,
  fieldValueForScope,
  fieldsForNode,
  getBreakpointOptions,
  getBreakpointWidth,
  getCanonicalSource,
  getDiagnostics,
  getNodeEntry,
  getStateOptions,
  getTemplateMeta,
  insertPaletteNode,
  insertPaletteNodeAtTarget,
  listOutlineRows,
  moveNodeRelative,
  nodeSummary,
  redoSessionState,
  renderStudioPreview,
  resetFromTemplateSource,
  selectFallbackNodeId,
  undoSession,
  variantSummary,
} from "./studio-model.js";
import {
  createStudioReviewController,
  defaultStudioReviewPaths,
  studioVariantKey,
} from "./studio-review.js";
import {
  compareImplementationHtml,
  inferWireSpecFromHtml,
} from "./studio-import-dom.js";

const templateLibrary = globalThis.__WS_STUDIO_TEMPLATE_LIBRARY__ ?? {};
const appRoot = document.getElementById("app");

const EMPTY_REVIEW_COUNTS = {
  total: 0,
  active: 0,
  resolved: 0,
  wontfix: 0,
};

const HOOKED_IMPLEMENTATION_SAMPLES = {
  login: `
    <div class="auth-screen" data-ws-id="login">
      <main data-ws-id="content">
        <section data-ws-id="auth-card">
          <h1 data-ws-id="title">Welcome back</h1>
          <p data-ws-id="intro">Use your work email and password.</p>
          <form data-ws-id="login-form">
            <label>
              Work account email
              <input data-ws-id="email" type="email" name="email" />
            </label>
            <label>
              Password
              <input data-ws-id="password" type="password" name="password" aria-invalid="true" />
            </label>
            <div data-ws-id="assistive-row">
              <a data-ws-id="forgot" href="/forgot-password">Forgot your password?</a>
              <label>
                <input data-ws-id="remember" type="checkbox" name="remember" />
                Remember me
              </label>
            </div>
            <div data-ws-id="primary-actions">
              <button data-ws-id="submit" hidden>Continue</button>
              <button>Contact support</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  `.trim(),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function variantLabel(name) {
  if (name === "base") {
    return "Base";
  }
  if (name === "desktop") {
    return "Desktop";
  }
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveInitialTemplateId() {
  const requested = new URLSearchParams(globalThis.location.search).get("template");
  if (requested && templateLibrary[requested]) {
    return requested;
  }
  return templateLibrary.login ? "login" : TEMPLATE_CATALOG[0]?.id;
}

function resolveInitialBridgeUrl() {
  const requested = new URLSearchParams(globalThis.location.search).get("bridge");
  return requested?.trim() || "http://127.0.0.1:4317";
}

function implementationSampleForTemplate(templateId, mode = "hooks") {
  const sample = HOOKED_IMPLEMENTATION_SAMPLES[templateId];
  if (!sample) {
    return "";
  }
  if (mode === "hooks") {
    return sample;
  }
  return sample.replace(/\sdata-ws-(?:id|target|kind)="[^"]*"/g, "");
}

function createDormantReviewSnapshot(paths = {}, counts = EMPTY_REVIEW_COUNTS, label = "Review mode off", tone = "muted") {
  return {
    bridge: {
      connected: false,
      tone,
      label,
      annotationPath: paths.annotationPath || "",
      taskPath: paths.taskPath || "",
      lastSavedAt: undefined,
    },
    counts: {
      ...EMPTY_REVIEW_COUNTS,
      ...counts,
    },
    store: null,
  };
}

function normalizeCustomStateName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const state = {
  templateId: resolveInitialTemplateId(),
  session: null,
  selectedNodeId: undefined,
  editScope: "base",
  stateName: "base",
  breakpointName: "desktop",
  acceptanceText: "",
  acceptanceLevel: "should",
  customStateName: "",
  stageMode: "edit",
  reviewBridgeUrl: resolveInitialBridgeUrl(),
  reviewAnnotationPath: "",
  reviewTaskPath: "",
  reviewDefaultPaths: {
    annotationPath: "",
    taskPath: "",
  },
  reviewSnapshot: createDormantReviewSnapshot(),
  reviewController: null,
  reviewUnsubscribe: null,
  reviewCachedStore: null,
  reviewSyncToken: 0,
  reviewSyncPromise: Promise.resolve(),
  implementationHtml: "",
  implementationComparison: null,
  inferredImport: null,
  banner: null,
  dragging: null,
};

function currentScope() {
  return {
    editScope: state.editScope,
    stateName: state.stateName,
    breakpointName: state.breakpointName,
  };
}

function activeTemplate() {
  return templateLibrary[state.templateId];
}

function activeSourceMap() {
  return state.session?.projection?.sourceMap;
}

function syncUrl() {
  const url = new URL(globalThis.location.href);
  url.searchParams.set("template", state.templateId);
  globalThis.history.replaceState({}, "", url);
}

function setBanner(text, tone = "info") {
  state.banner = { text, tone };
}

function clearBanner() {
  state.banner = null;
}

function syncReviewPaths(sourceMap) {
  if (!sourceMap) {
    return;
  }
  const nextDefaults = defaultStudioReviewPaths(sourceMap);
  const previousDefaults = state.reviewDefaultPaths;
  if (
    !state.reviewAnnotationPath ||
    state.reviewAnnotationPath === previousDefaults.annotationPath
  ) {
    state.reviewAnnotationPath = nextDefaults.annotationPath;
  }
  if (!state.reviewTaskPath || state.reviewTaskPath === previousDefaults.taskPath) {
    state.reviewTaskPath = nextDefaults.taskPath;
  }
  state.reviewDefaultPaths = nextDefaults;
  state.reviewSnapshot = {
    ...state.reviewSnapshot,
    bridge: {
      ...state.reviewSnapshot.bridge,
      annotationPath: state.reviewAnnotationPath,
      taskPath: state.reviewTaskPath,
    },
  };
}

function resetReviewState(sourceMap) {
  syncReviewPaths(sourceMap);
  state.reviewCachedStore = null;
  state.reviewSnapshot = createDormantReviewSnapshot({
    annotationPath: state.reviewAnnotationPath,
    taskPath: state.reviewTaskPath,
  });
}

function resetImplementationState(options = {}) {
  if (!options.preserveHtml) {
    state.implementationHtml = "";
  }
  state.implementationComparison = null;
  state.inferredImport = null;
}

function disposeReviewController(options = {}) {
  const preserveStore = options.preserveStore !== false;
  const label = options.label || "Review mode off";
  const tone = options.tone || "muted";

  state.reviewUnsubscribe?.();
  state.reviewUnsubscribe = null;

  let snapshot = state.reviewSnapshot;
  if (state.reviewController) {
    snapshot = state.reviewController.getSnapshot();
    if (preserveStore) {
      state.reviewCachedStore = snapshot.store ?? state.reviewController.getStore();
    }
    state.reviewController.dispose();
    state.reviewController = null;
  } else if (!preserveStore) {
    state.reviewCachedStore = null;
  }

  state.reviewSnapshot = {
    bridge: {
      connected: false,
      tone,
      label,
      annotationPath: state.reviewAnnotationPath,
      taskPath: state.reviewTaskPath,
      lastSavedAt: snapshot?.bridge?.lastSavedAt,
    },
    counts: snapshot?.counts ?? EMPTY_REVIEW_COUNTS,
    store: preserveStore ? state.reviewCachedStore : null,
  };
  syncReviewPanelState();
}

function scheduleReviewSync() {
  const requestId = ++state.reviewSyncToken;
  state.reviewSyncPromise = state.reviewSyncPromise
    .catch(() => {})
    .then(() => syncReviewController(requestId));
}

async function syncReviewController(requestId) {
  const sourceMap = activeSourceMap();
  if (!sourceMap) {
    return;
  }

  if (state.stageMode !== "review") {
    disposeReviewController({
      preserveStore: true,
      label: "Review mode off",
      tone: "muted",
    });
    return;
  }

  const options = {
    sourceMap,
    variantKey: studioVariantKey(currentScope()),
    bridgeUrl: state.reviewBridgeUrl,
    annotationPath: state.reviewAnnotationPath,
    taskPath: state.reviewTaskPath,
  };

  try {
    if (!state.reviewController) {
      const controller = await createStudioReviewController({
        ...options,
        initialStore: state.reviewCachedStore || undefined,
      });
      if (requestId !== state.reviewSyncToken || state.stageMode !== "review") {
        controller.dispose();
        return;
      }
      state.reviewController = controller;
      state.reviewCachedStore = null;
      state.reviewUnsubscribe = controller.subscribe((snapshot) => {
        state.reviewSnapshot = snapshot;
        state.reviewCachedStore = snapshot.store ?? state.reviewCachedStore;
        syncReviewPanelState();
      });
      state.reviewSnapshot = controller.getSnapshot();
      syncReviewPanelState();
      return;
    }

    await state.reviewController.updateContext(options);
    if (requestId !== state.reviewSyncToken) {
      return;
    }
    state.reviewSnapshot = state.reviewController.getSnapshot();
    syncReviewPanelState();
  } catch (error) {
    if (requestId !== state.reviewSyncToken) {
      return;
    }
    state.reviewSnapshot = {
      ...createDormantReviewSnapshot(
        {
          annotationPath: state.reviewAnnotationPath,
          taskPath: state.reviewTaskPath,
        },
        state.reviewSnapshot.counts,
        error instanceof Error ? error.message : "Review bridge failed",
        "warn",
      ),
      store: state.reviewCachedStore ?? state.reviewSnapshot.store,
    };
    syncReviewPanelState();
  }
}

function applySession(nextSession, options = {}) {
  state.session = nextSession;
  state.selectedNodeId = selectFallbackNodeId(nextSession, options.focusId ?? state.selectedNodeId);
  syncReviewPaths(nextSession.projection?.sourceMap);
  if (options.bannerText) {
    setBanner(options.bannerText, options.bannerTone);
  } else {
    clearBanner();
  }
  render();
}

function loadTemplate(templateId) {
  const template = templateLibrary[templateId];
  if (!template) {
    return;
  }
  disposeReviewController({
    preserveStore: false,
    label: "Review mode off",
    tone: "muted",
  });
  state.templateId = templateId;
  state.session = resetFromTemplateSource(template.source, template.sourceFile);
  state.selectedNodeId = state.session.document.root.id;
  state.editScope = "base";
  state.stateName = "base";
  state.breakpointName = "desktop";
  state.customStateName = "";
  resetReviewState(state.session.projection?.sourceMap);
  resetImplementationState();
  syncUrl();
  setBanner(`Loaded ${template.label}.`, "success");
  render();
}

function initialize() {
  const template = activeTemplate();
  if (!template) {
    appRoot.innerHTML = '<div class="ws-studio-shell"><div class="ws-studio-card ws-studio-pane-section">No template library was embedded for WireSpec Studio.</div></div>';
    return;
  }
  state.session = createStudioWorkspaceFromSource(template.source, template.sourceFile);
  state.selectedNodeId = state.session.document.root.id;
  resetReviewState(state.session.projection?.sourceMap);
  syncUrl();
  render();
}

function selectedNode() {
  return getNodeEntry(state.session.document, state.selectedNodeId)?.node;
}

function previewFlags() {
  const parts = [];
  if (state.breakpointName !== "desktop") {
    parts.push(`${variantLabel(state.breakpointName)} width`);
  }
  if (state.stateName !== "base") {
    parts.push(`${variantLabel(state.stateName)} state`);
  }
  return parts;
}

function previewSummary() {
  const parts = previewFlags();
  if (parts.length === 0) {
    return "base desktop";
  }
  return parts.join(" + ");
}

function previewDescription() {
  const parts = previewFlags();
  if (parts.length === 0) {
    return "Base desktop preview with stable semantic target ids.";
  }
  return `Previewing ${parts.join(" + ")} with stable semantic target ids.`;
}

function editScopeDescription() {
  const detail =
    state.editScope === "base"
      ? "Editing the base tree."
      : state.editScope === "state"
        ? `Writing ops to state:${variantLabel(state.stateName)}.`
        : `Writing ops to breakpoint:${variantLabel(state.breakpointName)}.`;
  return `${detail} Preview is showing ${previewSummary()}.`;
}

function visibleStateOptions() {
  const options = getStateOptions(state.session.document);
  if (state.stateName !== "base" && !options.includes(state.stateName)) {
    options.push(state.stateName);
  }
  return options;
}

function reviewStatusText() {
  const bridge = state.reviewSnapshot.bridge;
  const pieces = [bridge.label];
  if (bridge.lastSavedAt) {
    pieces.push(
      `Saved ${new Date(bridge.lastSavedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    );
  }
  return pieces.join(" · ");
}

function reviewGuidanceText() {
  if (state.stageMode === "review") {
    return "Use Add note in the floating review bar, then click page, section, or element. Alt-click climbs to the parent section.";
  }
  return "Switch the canvas to review mode to save annotations and agent tasks through the same bridge flow as the browser runtime.";
}

function implementationStatusText() {
  const report = state.implementationComparison;
  if (!state.implementationHtml.trim()) {
    return "Paste actual implementation HTML or load a sample to compare it against the current WireSpec selection.";
  }
  if (!report) {
    return `Ready to compare against ${studioVariantKey(currentScope())}.`;
  }
  if (!report.hooksFound) {
    return "No WireSpec hooks were found. Direct comparison is low-confidence; infer a draft instead.";
  }
  if (report.ok) {
    return `Implementation matches the current ${report.variantKey} selection.`;
  }
  return `${report.summary.total} drift items across ${report.summary.linked} linked nodes.`;
}

function implementationPreviewDocument(html) {
  const body = html?.trim()
    ? html
    : '<section style="font: 500 14px/1.5 ui-sans-serif, system-ui; color: #6f685f; padding: 16px;">Paste or load implementation HTML to preview it here.</section>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;color:#1f1c17;font:400 14px/1.45 ui-sans-serif,system-ui,sans-serif}body{padding:16px}*{box-sizing:border-box}</style></head><body>${body}</body></html>`;
}

function driftItemById(itemId) {
  return state.implementationComparison?.items.find((item) => item.id === itemId);
}

function targetById(targetId) {
  return activeSourceMap()?.targets.find((target) => target.targetId === targetId);
}

function nodeIdForTarget(targetId) {
  return targetById(targetId)?.wireId;
}

function renderImplementationStats() {
  const report = state.implementationComparison;
  if (!report) {
    return "";
  }
  const cards = [
    { label: "Linked", value: report.summary.linked },
    { label: "Missing", value: report.summary.missing },
    { label: "Unexpected", value: report.summary.unexpected },
    { label: "Mismatched", value: report.summary.mismatched },
  ];
  return cards.map((entry) => `
    <div class="ws-studio-review-stat">
      <strong>${escapeHtml(entry.value)}</strong>
      <span>${escapeHtml(entry.label)}</span>
    </div>
  `).join("");
}

function renderDriftItems() {
  const report = state.implementationComparison;
  if (!report) {
    return "";
  }
  if (report.items.length === 0) {
    return '<div class="ws-studio-empty">No drift items. The implementation is aligned with the current semantic selection.</div>';
  }
  return report.items.map((item) => {
    const focusTargetId = item.targetId || item.preferredTargetId;
    const focusNodeId = focusTargetId ? nodeIdForTarget(focusTargetId) : undefined;
    return `
      <article class="ws-studio-drift-card" data-severity="${escapeHtml(item.severity)}">
        <div class="ws-studio-drift-head">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="ws-studio-chip">${escapeHtml(variantLabel(item.severity))}</span>
        </div>
        <p class="ws-studio-note">${escapeHtml(item.message)}</p>
        <div class="ws-studio-action-row">
          ${focusNodeId ? `<button type="button" class="ws-studio-ghost" data-drift-focus="${escapeHtml(item.id)}">Focus spec node</button>` : ""}
          ${focusTargetId ? `<button type="button" class="ws-studio-solid" data-drift-note="${escapeHtml(item.id)}">Turn into note</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function renderInferredImportSection() {
  if (!state.inferredImport) {
    return "";
  }
  return `
    <div class="ws-studio-import-result">
      <div class="ws-studio-section-head">
        <div>
          <h4>Inferred draft</h4>
          <p>Review the warnings, then explicitly load the inferred baseline if it is close enough.</p>
        </div>
      </div>
      <div class="ws-studio-summary-list">
        ${state.inferredImport.warnings.map((warning) => `
          <div class="ws-studio-summary-item">${escapeHtml(warning)}</div>
        `).join("")}
      </div>
      <textarea class="ws-studio-source ws-studio-import-source" readonly>${escapeHtml(state.inferredImport.source)}</textarea>
      <div class="ws-studio-action-row" style="margin-top:12px;">
        <button type="button" class="ws-studio-solid" data-load-inferred>Load inferred draft into Studio</button>
      </div>
    </div>
  `;
}

function renderTemplateButtons() {
  return TEMPLATE_CATALOG.map((entry) => {
    const selected = entry.id === state.templateId;
    const fallback = templateLibrary[entry.id] ? "" : " (Missing)";
    return `
      <button
        type="button"
        class="ws-studio-template-button ${selected ? "is-selected" : ""}"
        data-template-id="${escapeHtml(entry.id)}"
      >
        <strong>${escapeHtml(entry.label)}${fallback}</strong>
        <span class="ws-studio-status-line">${escapeHtml(entry.category)} · ${escapeHtml(entry.summary)}</span>
      </button>
    `;
  }).join("");
}

function renderPaletteGroups() {
  return PALETTE_GROUPS.map((group) => `
    <section class="ws-studio-pane-section ws-studio-card">
      <div class="ws-studio-section-head">
        <div>
          <h3>${escapeHtml(group.label)}</h3>
          <p>${escapeHtml(group.label)} tools for the current screen.</p>
        </div>
      </div>
      <div class="ws-studio-palette-grid">
        ${group.items.map((item) => `
          <button
            type="button"
            class="ws-studio-palette-button"
            data-palette-kind="${escapeHtml(item.kind)}"
            draggable="true"
            data-drag-kind="${escapeHtml(item.kind)}"
          >
            <strong>${escapeHtml(item.label)}</strong>
            <span class="ws-studio-status-line">${escapeHtml(item.hint)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderScopeButtons() {
  return EDIT_SCOPES.map((option) => `
    <button
      type="button"
      class="ws-studio-chip ${state.editScope === option.id ? "is-active" : ""}"
      data-edit-scope="${escapeHtml(option.id)}"
    >
      ${escapeHtml(option.label)}
    </button>
  `).join("");
}

function renderStageModeButtons() {
  return [
    { id: "edit", label: "Edit canvas" },
    { id: "review", label: "Review mode" },
  ].map((option) => `
    <button
      type="button"
      class="ws-studio-chip ${state.stageMode === option.id ? "is-active" : ""}"
      data-stage-mode="${escapeHtml(option.id)}"
    >
      ${escapeHtml(option.label)}
    </button>
  `).join("");
}

function renderStateChips() {
  return visibleStateOptions().map((name) => `
    <button
      type="button"
      class="ws-studio-chip ${state.stateName === name ? "is-active" : ""}"
      data-state-chip="${escapeHtml(name)}"
    >
      ${escapeHtml(variantLabel(name))}
    </button>
  `).join("");
}

function renderBreakpointChips() {
  return getBreakpointOptions(state.session.document).map((name) => `
    <button
      type="button"
      class="ws-studio-chip ${state.breakpointName === name ? "is-active" : ""}"
      data-breakpoint-chip="${escapeHtml(name)}"
    >
      ${escapeHtml(variantLabel(name))}
    </button>
  `).join("");
}

function renderCustomStateComposer() {
  if (state.editScope !== "state") {
    return "";
  }
  return `
    <form class="ws-studio-inline-form" id="custom-state-form">
      <div class="ws-studio-field ws-studio-inline-field">
        <label for="custom-state-name">Custom state</label>
        <input
          id="custom-state-name"
          type="text"
          name="custom-state-name"
          placeholder="pending-approval"
          value="${escapeHtml(state.customStateName)}"
        />
      </div>
      <button type="submit" class="ws-studio-ghost">Use custom state</button>
    </form>
    <p class="ws-studio-note">First scoped change creates the state block; the base tree stays untouched.</p>
  `;
}

function renderOutline() {
  return listOutlineRows(state.session.document).map((row) => `
    <div class="ws-studio-node-row ${row.id === state.selectedNodeId ? "is-selected" : ""}" style="--ws-depth:${row.depth};">
      <button
        type="button"
        class="ws-studio-node-button"
        data-node-select="${escapeHtml(row.id)}"
        draggable="true"
        data-drag-node-id="${escapeHtml(row.id)}"
        style="padding-left: ${10 + row.depth * 14}px;"
      >
        <span class="ws-studio-node-copy">
          <span class="ws-studio-node-kind">${escapeHtml(row.kind)}</span>
          <span class="ws-studio-node-title">${escapeHtml(row.label)}</span>
        </span>
      </button>
      <div class="ws-studio-dropzones">
        <button type="button" class="ws-studio-dropzone" data-drop-target="${escapeHtml(row.id)}" data-drop-placement="before">Before</button>
        <button type="button" class="ws-studio-dropzone" data-drop-target="${escapeHtml(row.id)}" data-drop-placement="inside">Inside</button>
        <button type="button" class="ws-studio-dropzone" data-drop-target="${escapeHtml(row.id)}" data-drop-placement="after">After</button>
      </div>
    </div>
  `).join("");
}

function renderInspector() {
  const node = selectedNode();
  if (!node) {
    return '<div class="ws-studio-empty">Select a node from the outline or the preview to edit its semantic props.</div>';
  }
  const fields = fieldsForNode(node);
  const summary = nodeSummary(node);
  return `
    <div class="ws-studio-meta-grid">
      <div class="ws-studio-meta-pair">
        <span class="ws-studio-meta-label">Kind</span>
        <span class="ws-studio-meta-value">${escapeHtml(node.kind)}</span>
      </div>
      <div class="ws-studio-meta-pair">
        <span class="ws-studio-meta-label">Stable id</span>
        <span class="ws-studio-meta-value">${escapeHtml(node.id || "Generated on insert")}</span>
      </div>
      <div class="ws-studio-meta-pair">
        <span class="ws-studio-meta-label">Context</span>
        <span class="ws-studio-meta-value">${escapeHtml(summary)}</span>
      </div>
    </div>
    ${fields.length === 0 ? '<div class="ws-studio-empty">This node has no editable semantic props in the MVP inspector.</div>' : `
      <form class="ws-studio-inspector-form">
        ${fields.map((field) => {
          const value = fieldValueForScope(state.session.document, node, currentScope(), field);
          if (field.type === "boolean") {
            return `
              <div class="ws-studio-toggle-row">
                <input
                  id="field-${escapeHtml(field.key)}"
                  type="checkbox"
                  data-field-key="${escapeHtml(field.key)}"
                  ${value ? "checked" : ""}
                />
                <label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
              </div>
            `;
          }
          if (field.type === "select") {
            return `
              <div class="ws-studio-field">
                <label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
                <select id="field-${escapeHtml(field.key)}" data-field-key="${escapeHtml(field.key)}">
                  ${field.options.map((option) => `
                    <option value="${escapeHtml(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>
                  `).join("")}
                </select>
              </div>
            `;
          }
          return `
            <div class="ws-studio-field">
              <label for="field-${escapeHtml(field.key)}">${escapeHtml(field.label)}</label>
              <input
                id="field-${escapeHtml(field.key)}"
                type="${field.type === "number" ? "number" : "text"}"
                value="${escapeHtml(value ?? "")}"
                data-field-key="${escapeHtml(field.key)}"
              />
            </div>
          `;
        }).join("")}
      </form>
    `}
  `;
}

function renderDiagnosticsList() {
  const lines = getDiagnostics(state.session.document).diagnostics.filter((diagnostic) => diagnostic.level !== "info");
  return lines.slice(0, 6).map((diagnostic) => `
    <div class="ws-studio-diagnostic-item" data-level="${escapeHtml(diagnostic.level)}">
      <strong>${escapeHtml(diagnostic.message)}</strong>
      <div class="ws-studio-status-line">${escapeHtml(diagnostic.code)}</div>
    </div>
  `).join("");
}

function renderCanvasPreview() {
  try {
    return renderStudioPreview(state.session, currentScope());
  } catch (error) {
    return `<div class="ws-studio-empty">Preview could not render: ${escapeHtml(error.message)}</div>`;
  }
}

function renderReviewStats() {
  const counts = state.reviewSnapshot.counts;
  return [
    { label: "Open", value: counts.active },
    { label: "Total", value: counts.total },
    { label: "Resolved", value: counts.resolved },
    { label: "Won't fix", value: counts.wontfix },
  ].map((entry) => `
    <div class="ws-studio-review-stat">
      <strong>${escapeHtml(entry.value)}</strong>
      <span>${escapeHtml(entry.label)}</span>
    </div>
  `).join("");
}

function renderReviewSection() {
  const reviewReady = state.stageMode === "review" && Boolean(state.reviewController);
  return `
    <section class="ws-studio-sidebar-section ws-studio-card">
      <div class="ws-studio-section-head">
        <div>
          <h3>Review loop</h3>
          <p>Reuse the runtime note drawer, sidecars, and agent-task export without leaving Studio.</p>
        </div>
      </div>
      <div class="ws-studio-review-stats" data-review-stats>${renderReviewStats()}</div>
      <div class="ws-studio-review-status" data-review-status data-tone="${escapeHtml(state.reviewSnapshot.bridge.tone)}">${escapeHtml(reviewStatusText())}</div>
      <div class="ws-studio-inspector-form">
        <div class="ws-studio-field">
          <label for="review-bridge-url">Bridge URL</label>
          <input id="review-bridge-url" type="text" name="review-bridge-url" value="${escapeHtml(state.reviewBridgeUrl)}" />
        </div>
        <div class="ws-studio-field">
          <label for="review-annotation-path">Annotation sidecar</label>
          <input id="review-annotation-path" type="text" name="review-annotation-path" value="${escapeHtml(state.reviewAnnotationPath)}" />
        </div>
        <div class="ws-studio-field">
          <label for="review-task-path">Agent task export</label>
          <input id="review-task-path" type="text" name="review-task-path" value="${escapeHtml(state.reviewTaskPath)}" />
        </div>
      </div>
      <div class="ws-studio-action-row">
        <button type="button" class="ws-studio-ghost" data-review-save-now ${reviewReady ? "" : "disabled"}>Save now</button>
        <button type="button" class="ws-studio-ghost" data-review-reload ${reviewReady ? "" : "disabled"}>Reload</button>
        <button type="button" class="ws-studio-solid" data-review-drawer ${reviewReady ? "" : "disabled"}>Open notes</button>
      </div>
      <p class="ws-studio-note" data-review-note>${escapeHtml(reviewGuidanceText())}</p>
    </section>
  `;
}

function renderImplementationSection() {
  const sampleAvailable = Boolean(implementationSampleForTemplate(state.templateId, "hooks"));
  return `
    <section class="ws-studio-sidebar-section ws-studio-card">
      <div class="ws-studio-section-head">
        <div>
          <h3>Implementation compare</h3>
          <p>Compare the current WireSpec selection against actual implementation HTML, then turn drift into notes or an inferred draft.</p>
        </div>
      </div>
      <div class="ws-studio-review-status" data-tone="${escapeHtml(state.implementationComparison?.hooksFound ? "good" : "muted")}">
        ${escapeHtml(implementationStatusText())}
      </div>
      <div class="ws-studio-field">
        <label for="implementation-html">Implementation HTML</label>
        <textarea id="implementation-html" name="implementation-html" placeholder="Paste rendered implementation HTML or a component snapshot here.">${escapeHtml(state.implementationHtml)}</textarea>
      </div>
      <div class="ws-studio-action-row">
        ${sampleAvailable ? '<button type="button" class="ws-studio-ghost" data-load-implementation-sample="hooks">Load hooked sample</button>' : ""}
        ${sampleAvailable ? '<button type="button" class="ws-studio-ghost" data-load-implementation-sample="inferred">Load no-hook sample</button>' : ""}
        <button type="button" class="ws-studio-ghost" data-compare-implementation ${state.implementationHtml.trim() ? "" : "disabled"}>Compare</button>
        <button type="button" class="ws-studio-solid" data-infer-implementation ${state.implementationHtml.trim() ? "" : "disabled"}>Infer draft</button>
      </div>
      <div class="ws-studio-import-preview-shell">
        <div class="ws-studio-section-head" style="margin-bottom:8px;">
          <div>
            <h4>Sandbox preview</h4>
            <p>Local iframe render of the imported HTML. This does not change the spec.</p>
          </div>
        </div>
        <iframe id="implementation-preview" class="ws-studio-implementation-preview" sandbox=""></iframe>
      </div>
      ${state.implementationComparison ? `
        <div class="ws-studio-review-stats" style="margin-top:12px;">${renderImplementationStats()}</div>
        <div class="ws-studio-drift-list">${renderDriftItems()}</div>
      ` : ""}
      ${renderInferredImportSection()}
    </section>
  `;
}

function renderAppShell() {
  const templateMeta = getTemplateMeta(state.templateId) ?? { label: state.templateId, summary: "" };
  const currentNode = selectedNode();
  const diagnostics = getDiagnostics(state.session.document);
  const canRemoveVariant = canRemoveScopeVariant(state.session.document, currentScope());
  const activeVariantLines = variantSummary(state.session.document, currentScope());
  return `
    <div class="ws-studio-shell">
      <aside class="ws-studio-pane">
        <section class="ws-studio-pane-section ws-studio-card">
          <div class="ws-studio-section-head">
            <div>
              <h2>Templates</h2>
              <p>Start from the canonical reference screens instead of a blank canvas.</p>
            </div>
          </div>
          <div class="ws-studio-template-grid">${renderTemplateButtons()}</div>
        </section>
        ${renderPaletteGroups()}
      </aside>
      <main class="ws-studio-stage">
        <section class="ws-studio-card ws-studio-stage-header">
          <div class="ws-studio-topline">
            <span class="ws-studio-chip">Template · ${escapeHtml(templateMeta.label)}</span>
            <span class="ws-studio-chip">Selection · ${escapeHtml(currentNode ? nodeSummary(currentNode) : "None")}</span>
            <span class="ws-studio-chip">Preview · ${escapeHtml(previewSummary())}</span>
            <span class="ws-studio-chip" data-tone="${diagnostics.ok ? "success" : "warn"}">${diagnostics.diagnostics.length} diagnostics</span>
          </div>
          <h1>WireSpec Studio</h1>
          <p>${escapeHtml(templateMeta.summary)}</p>
          <div class="ws-studio-toolbar" style="margin-top:12px;">
            <span class="ws-studio-meta-label">Write edits to</span>
            ${renderScopeButtons()}
            <button type="button" class="ws-studio-ghost" data-undo>Undo</button>
            <button type="button" class="ws-studio-ghost" data-redo>Redo</button>
            ${canRemoveVariant ? '<button type="button" class="ws-studio-chip" data-remove-variant data-tone="warn">Remove active variant</button>' : ""}
          </div>
          <div class="ws-studio-chip-row" style="margin-top:10px;">
            <span class="ws-studio-meta-label">State</span>
            ${renderStateChips()}
          </div>
          ${renderCustomStateComposer()}
          <div class="ws-studio-chip-row" style="margin-top:8px;">
            <span class="ws-studio-meta-label">Viewport</span>
            ${renderBreakpointChips()}
          </div>
          ${state.banner ? `<div class="ws-studio-banner" data-tone="${escapeHtml(state.banner.tone)}">${escapeHtml(state.banner.text)}</div>` : ""}
        </section>
        <section class="ws-studio-stage-main">
          <div class="ws-studio-card ws-studio-canvas-card">
            <div class="ws-studio-canvas-head">
              <div>
                <h2>Preview</h2>
                <p class="ws-studio-note">${escapeHtml(previewDescription())}</p>
              </div>
              <div class="ws-studio-action-row">
                ${renderStageModeButtons()}
                <span class="ws-studio-chip">Canvas width · ${getBreakpointWidth(state.breakpointName)}px</span>
              </div>
            </div>
            <div class="ws-studio-canvas-shell">
              <div class="ws-studio-canvas-frame" style="--ws-preview-width:${getBreakpointWidth(state.breakpointName)}px;">
                <div id="preview-surface"></div>
              </div>
            </div>
          </div>
        </section>
        <section class="ws-studio-card ws-studio-source-card">
          <div class="ws-studio-source-head">
            <div>
              <h2>Canonical WireSpec</h2>
              <p class="ws-studio-note">Every browser edit round-trips back to formatter-stable Markdown.</p>
            </div>
            <div class="ws-studio-action-row">
              <button type="button" class="ws-studio-ghost" data-copy-source>Copy source</button>
            </div>
          </div>
          <textarea class="ws-studio-source" readonly id="canonical-source"></textarea>
        </section>
      </main>
      <aside class="ws-studio-sidebar">
        <section class="ws-studio-sidebar-section ws-studio-card">
          <div class="ws-studio-section-head">
            <div>
              <h3>Outline</h3>
              <p>Drag within the semantic tree. Drops use parent/position, never x/y coordinates.</p>
            </div>
          </div>
          <div class="ws-studio-outline-list">${renderOutline()}</div>
        </section>
        <section class="ws-studio-sidebar-section ws-studio-card">
          <div class="ws-studio-section-head">
            <div>
              <h3>Inspector</h3>
              <p>${escapeHtml(editScopeDescription())}</p>
            </div>
          </div>
          ${renderInspector()}
        </section>
        <section class="ws-studio-sidebar-section ws-studio-card">
          <div class="ws-studio-section-head">
            <div>
              <h3>Acceptance</h3>
              <p>Add lightweight outcomes that an implementation must preserve.</p>
            </div>
          </div>
          <form class="ws-studio-acceptance-form" id="acceptance-form">
            <div class="ws-studio-field">
              <label for="acceptance-level">Level</label>
              <select id="acceptance-level" name="acceptance-level">
                <option value="must" ${state.acceptanceLevel === "must" ? "selected" : ""}>Must</option>
                <option value="should" ${state.acceptanceLevel === "should" ? "selected" : ""}>Should</option>
                <option value="could" ${state.acceptanceLevel === "could" ? "selected" : ""}>Could</option>
                <option value="question" ${state.acceptanceLevel === "question" ? "selected" : ""}>Question</option>
              </select>
            </div>
            <div class="ws-studio-field">
              <label for="acceptance-text">Criterion</label>
              <textarea id="acceptance-text" name="acceptance-text" placeholder="Describe the user-visible outcome that should hold after implementation.">${escapeHtml(state.acceptanceText)}</textarea>
            </div>
            <button type="submit" class="ws-studio-solid">Add acceptance criterion</button>
          </form>
        </section>
        ${renderReviewSection()}
        ${renderImplementationSection()}
        <section class="ws-studio-sidebar-section ws-studio-card">
          <div class="ws-studio-section-head">
            <div>
              <h3>Diagnostics</h3>
              <p>Lint stays visible while you edit, so sloppy output is harder than good output.</p>
            </div>
          </div>
          ${activeVariantLines.length > 0 ? `
            <div class="ws-studio-summary-list" style="margin-bottom:12px;">
              ${activeVariantLines.map((line) => `
                <div class="ws-studio-summary-item">${escapeHtml(line)}</div>
              `).join("")}
            </div>
          ` : ""}
          <div class="ws-studio-diagnostic-list">
            ${diagnostics.diagnostics.length === 0 ? '<div class="ws-studio-empty">No diagnostics. The current spec is structurally clean.</div>' : renderDiagnosticsList()}
          </div>
        </section>
      </aside>
    </div>
  `;
}

function syncReviewPanelState() {
  const statsNode = appRoot.querySelector("[data-review-stats]");
  if (statsNode) {
    statsNode.innerHTML = renderReviewStats();
  }

  const statusNode = appRoot.querySelector("[data-review-status]");
  if (statusNode) {
    statusNode.textContent = reviewStatusText();
    statusNode.dataset.tone = state.reviewSnapshot.bridge.tone;
  }

  const noteNode = appRoot.querySelector("[data-review-note]");
  if (noteNode) {
    noteNode.textContent = reviewGuidanceText();
  }

  const reviewReady = state.stageMode === "review" && Boolean(state.reviewController);
  for (const selector of ["[data-review-save-now]", "[data-review-reload]", "[data-review-drawer]"]) {
    const button = appRoot.querySelector(selector);
    if (button instanceof HTMLButtonElement) {
      button.disabled = !reviewReady;
    }
  }
}

function render() {
  document.body.dataset.wsStudioDragging = state.dragging ? "true" : "false";
  appRoot.innerHTML = renderAppShell();
  const preview = appRoot.querySelector("#preview-surface");
  const source = appRoot.querySelector("#canonical-source");
  const implementationPreview = appRoot.querySelector("#implementation-preview");
  preview.innerHTML = renderCanvasPreview();
  source.value = getCanonicalSource(state.session);
  if (implementationPreview instanceof HTMLIFrameElement) {
    implementationPreview.srcdoc = implementationPreviewDocument(state.implementationHtml);
  }
  if (state.selectedNodeId) {
    const selected = preview.querySelector(`[data-ws-id="${CSS.escape(state.selectedNodeId)}"]`);
    if (selected) {
      selected.setAttribute("data-ws-studio-selected", "true");
    }
  }
  preview.addEventListener("click", (event) => {
    if (state.stageMode === "review" && document.documentElement.classList.contains("ws-review-active")) {
      return;
    }
    const rawTarget = event.target instanceof Element ? event.target : null;
    const target = rawTarget?.closest("[data-ws-id]");
    if (!target) {
      return;
    }
    event.preventDefault();
    state.selectedNodeId = target.getAttribute("data-ws-id");
    render();
  });
  preview.addEventListener("submit", (event) => event.preventDefault());
  syncReviewPanelState();
  scheduleReviewSync();
}

function handlePaletteInsert(kind) {
  try {
    const result = insertPaletteNode(state.session, state.selectedNodeId, kind);
    applySession(result.session, {
      focusId: result.focusIdHint,
      bannerText: `Inserted ${kind} near the current semantic context.`,
      bannerTone: "success",
    });
  } catch (error) {
    setBanner(error.message, "error");
    render();
  }
}

function runImplementationCompare() {
  try {
    const report = compareImplementationHtml(activeSourceMap(), state.implementationHtml, {
      variantKey: studioVariantKey(currentScope()),
    });
    state.implementationComparison = report;
    if (!report.hooksFound) {
      setBanner("Compared the HTML, but no WireSpec hooks were found. Use inference to build a draft baseline.", "error");
    } else if (report.ok) {
      setBanner("Implementation is aligned with the current WireSpec selection.", "success");
    } else {
      setBanner(`Found ${report.summary.total} implementation drift items.`, "error");
    }
  } catch (error) {
    setBanner(`Implementation compare failed: ${error.message}`, "error");
  }
  render();
}

function runImplementationInference() {
  try {
    state.inferredImport = inferWireSpecFromHtml(state.implementationHtml, {
      documentId: state.session.document.root.id,
      documentTitle: `${state.session.document.documentTitle || "Imported"} inferred draft`,
      sourceFile: "inferred-dom.wirespec.md",
    });
    setBanner("Built an inferred WireSpec draft. Review the warnings before loading it.", "success");
  } catch (error) {
    setBanner(`DOM inference failed: ${error.message}`, "error");
  }
  render();
}

async function ensureReviewControllerReady() {
  if (!state.reviewController) {
    state.stageMode = "review";
    render();
  }
  await state.reviewSyncPromise;
  return state.reviewController;
}

async function convertDriftItemToNote(itemId) {
  const item = driftItemById(itemId);
  if (!item) {
    return;
  }
  const targetId = item.targetId || item.preferredTargetId;
  if (!targetId) {
    setBanner("This drift item has no stable spec target, so it cannot become a note.", "error");
    render();
    return;
  }
  const controller = await ensureReviewControllerReady();
  if (!controller) {
    setBanner("Review mode could not start, so the drift item was not converted.", "error");
    render();
    return;
  }
  window.dispatchEvent(new CustomEvent("wirespec.review.draftSubmitted", {
    detail: {
      targetId,
      title: item.title,
      category: "implementation-drift",
      severity: item.severity,
      body: item.message,
    },
  }));
  try {
    await controller.saveNow();
    setBanner("Turned the drift item into a review note and saved it through the current review flow.", "success");
  } catch (error) {
    setBanner(`Created a local review note, but bridge save failed: ${error.message}`, "error");
  }
  render();
}

function focusDriftItemTarget(itemId) {
  const item = driftItemById(itemId);
  if (!item) {
    return;
  }
  const nodeId = nodeIdForTarget(item.targetId || item.preferredTargetId);
  if (!nodeId) {
    setBanner("This drift item does not map to a focusable spec node.", "error");
    render();
    return;
  }
  state.selectedNodeId = nodeId;
  setBanner(`Focused ${nodeId} in the semantic tree.`, "success");
  render();
}

function loadInferredDraftIntoStudio() {
  if (!state.inferredImport) {
    return;
  }
  disposeReviewController({
    preserveStore: false,
    label: "Review mode off",
    tone: "muted",
  });
  state.session = createStudioWorkspaceFromSource(
    state.inferredImport.source,
    state.inferredImport.document.sourceFile,
  );
  state.selectedNodeId = state.session.document.root.id;
  state.editScope = "base";
  state.stateName = "base";
  state.breakpointName = "desktop";
  resetReviewState(state.session.projection?.sourceMap);
  state.implementationComparison = null;
  state.inferredImport = null;
  setBanner("Loaded the inferred DOM import as the active Studio draft.", "success");
  render();
}

function activateCustomState() {
  const normalized = normalizeCustomStateName(state.customStateName);
  if (!normalized) {
    setBanner("Custom state names need letters or numbers.", "error");
    render();
    return;
  }
  state.editScope = "state";
  state.stateName = normalized;
  state.customStateName = "";
  setBanner(`Scoped edits to custom state ${variantLabel(normalized)}.`, "success");
  render();
}

appRoot.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) {
    return;
  }
  if (target.dataset.templateId) {
    loadTemplate(target.dataset.templateId);
    return;
  }
  if (target.dataset.paletteKind) {
    handlePaletteInsert(target.dataset.paletteKind);
    return;
  }
  if (target.dataset.loadImplementationSample) {
    state.implementationHtml = implementationSampleForTemplate(state.templateId, target.dataset.loadImplementationSample);
    state.implementationComparison = null;
    state.inferredImport = null;
    setBanner(
      target.dataset.loadImplementationSample === "hooks"
        ? "Loaded a hooked implementation sample for semantic drift comparison."
        : "Loaded an implementation sample without hooks for inference fallback.",
      "success",
    );
    render();
    return;
  }
  if (target.hasAttribute("data-compare-implementation")) {
    runImplementationCompare();
    return;
  }
  if (target.hasAttribute("data-infer-implementation")) {
    runImplementationInference();
    return;
  }
  if (target.hasAttribute("data-load-inferred")) {
    loadInferredDraftIntoStudio();
    return;
  }
  if (target.dataset.driftFocus) {
    focusDriftItemTarget(target.dataset.driftFocus);
    return;
  }
  if (target.dataset.driftNote) {
    await convertDriftItemToNote(target.dataset.driftNote);
    return;
  }
  if (target.dataset.nodeSelect) {
    state.selectedNodeId = target.dataset.nodeSelect;
    render();
    return;
  }
  if (target.dataset.editScope) {
    state.editScope = target.dataset.editScope;
    if (state.editScope === "state" && state.stateName === "base") {
      state.stateName = "loading";
    }
    if (state.editScope === "breakpoint" && state.breakpointName === "desktop") {
      state.breakpointName = "mobile";
    }
    render();
    return;
  }
  if (target.dataset.stageMode) {
    state.stageMode = target.dataset.stageMode;
    render();
    return;
  }
  if (target.dataset.stateChip) {
    state.stateName = target.dataset.stateChip;
    render();
    return;
  }
  if (target.dataset.breakpointChip) {
    state.breakpointName = target.dataset.breakpointChip;
    render();
    return;
  }
  if (target.hasAttribute("data-undo")) {
    applySession(undoSession(state.session), { bannerText: "Reverted the latest Studio command.", bannerTone: "success" });
    return;
  }
  if (target.hasAttribute("data-redo")) {
    applySession(redoSessionState(state.session), { bannerText: "Reapplied the reverted Studio command.", bannerTone: "success" });
    return;
  }
  if (target.hasAttribute("data-remove-variant")) {
    applySession(deleteActiveVariant(state.session, currentScope()), {
      bannerText: "Removed the active variant block.",
      bannerTone: "success",
    });
    return;
  }
  if (target.hasAttribute("data-copy-source")) {
    try {
      await navigator.clipboard.writeText(getCanonicalSource(state.session));
      setBanner("Copied canonical WireSpec to the clipboard.", "success");
    } catch (error) {
      setBanner(`Copy failed: ${error.message}`, "error");
    }
    render();
    return;
  }
  if (target.hasAttribute("data-review-save-now")) {
    try {
      await state.reviewController?.saveNow();
    } catch {
      // status surfaces in the review panel
    }
    return;
  }
  if (target.hasAttribute("data-review-reload")) {
    try {
      await state.reviewController?.reload();
    } catch {
      // status surfaces in the review panel
    }
    return;
  }
  if (target.hasAttribute("data-review-drawer")) {
    state.reviewController?.openDrawer();
  }
});

appRoot.addEventListener("change", (event) => {
  const target = event.target;
  if (target.name === "acceptance-level") {
    state.acceptanceLevel = target.value;
    return;
  }
  if (target.name === "acceptance-text") {
    state.acceptanceText = target.value;
    return;
  }
  if (target.name === "review-bridge-url") {
    state.reviewBridgeUrl = target.value.trim();
    scheduleReviewSync();
    return;
  }
  if (target.name === "review-annotation-path") {
    state.reviewAnnotationPath = target.value.trim();
    state.reviewSnapshot = {
      ...state.reviewSnapshot,
      bridge: {
        ...state.reviewSnapshot.bridge,
        annotationPath: state.reviewAnnotationPath,
      },
    };
    syncReviewPanelState();
    scheduleReviewSync();
    return;
  }
  if (target.name === "review-task-path") {
    state.reviewTaskPath = target.value.trim();
    state.reviewSnapshot = {
      ...state.reviewSnapshot,
      bridge: {
        ...state.reviewSnapshot.bridge,
        taskPath: state.reviewTaskPath,
      },
    };
    syncReviewPanelState();
    scheduleReviewSync();
    return;
  }
  const fieldKey = target.dataset.fieldKey;
  if (!fieldKey) {
    return;
  }
  const node = selectedNode();
  if (!node) {
    return;
  }
  const field = fieldsForNode(node).find((entry) => entry.key === fieldKey);
  if (!field) {
    return;
  }
  const rawValue = target.type === "checkbox" ? target.checked : target.value;
  try {
    applySession(applyScopedNodeProp(state.session, node.id, currentScope(), field, rawValue), {
      bannerText:
        state.editScope === "base"
          ? `Updated ${field.label.toLowerCase()} on ${node.id}.`
          : `Wrote a ${state.editScope} diff for ${node.id}.`,
      bannerTone: "success",
    });
  } catch (error) {
    setBanner(error.message, "error");
    render();
  }
});

appRoot.addEventListener("submit", (event) => {
  if (event.target.id === "acceptance-form") {
    event.preventDefault();
    const text = state.acceptanceText.trim();
    if (!text) {
      setBanner("Acceptance criteria need user-visible text.", "error");
      render();
      return;
    }
    try {
      applySession(addAcceptanceCriterion(state.session, text, state.acceptanceLevel), {
        bannerText: "Added a new acceptance criterion.",
        bannerTone: "success",
      });
      state.acceptanceText = "";
    } catch (error) {
      setBanner(error.message, "error");
      render();
    }
    return;
  }

  if (event.target.id === "custom-state-form") {
    event.preventDefault();
    activateCustomState();
  }
});

appRoot.addEventListener("input", (event) => {
  const target = event.target;
  if (target.name === "acceptance-text") {
    state.acceptanceText = target.value;
    return;
  }
  if (target.name === "custom-state-name") {
    state.customStateName = target.value;
    return;
  }
  if (target.name === "implementation-html") {
    state.implementationHtml = target.value;
    state.implementationComparison = null;
    state.inferredImport = null;
    return;
  }
  if (target.name === "review-bridge-url") {
    state.reviewBridgeUrl = target.value;
    return;
  }
  if (target.name === "review-annotation-path") {
    state.reviewAnnotationPath = target.value;
    return;
  }
  if (target.name === "review-task-path") {
    state.reviewTaskPath = target.value;
  }
});

appRoot.addEventListener("dragstart", (event) => {
  const paletteKind = event.target.dataset.dragKind;
  const nodeId = event.target.dataset.dragNodeId;
  if (!paletteKind && !nodeId) {
    return;
  }
  state.dragging = paletteKind ? { source: "palette", kind: paletteKind } : { source: "tree", nodeId };
  event.dataTransfer.setData("application/json", JSON.stringify(state.dragging));
  event.dataTransfer.effectAllowed = paletteKind ? "copy" : "move";
  document.body.dataset.wsStudioDragging = "true";
});

appRoot.addEventListener("dragover", (event) => {
  if (!event.target.closest("[data-drop-target]")) {
    return;
  }
  event.preventDefault();
});

appRoot.addEventListener("drop", (event) => {
  const zone = event.target.closest("[data-drop-target]");
  if (!zone) {
    return;
  }
  event.preventDefault();
  const payload = state.dragging || JSON.parse(event.dataTransfer.getData("application/json"));
  const targetId = zone.dataset.dropTarget;
  const placement = zone.dataset.dropPlacement;
  try {
    if (payload.source === "palette") {
      const result = insertPaletteNodeAtTarget(state.session, payload.kind, targetId, placement);
      applySession(result.session, {
        focusId: result.focusIdHint,
        bannerText: `Inserted ${payload.kind} ${placement} ${targetId}.`,
        bannerTone: "success",
      });
    } else {
      applySession(moveNodeRelative(state.session, payload.nodeId, targetId, placement), {
        focusId: payload.nodeId,
        bannerText: `Moved ${payload.nodeId} ${placement} ${targetId}.`,
        bannerTone: "success",
      });
    }
  } catch (error) {
    setBanner(error.message, "error");
    render();
  } finally {
    state.dragging = null;
    document.body.dataset.wsStudioDragging = "false";
  }
});

appRoot.addEventListener("dragend", () => {
  state.dragging = null;
  document.body.dataset.wsStudioDragging = "false";
});

initialize();
