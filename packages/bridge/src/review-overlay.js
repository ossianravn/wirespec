import reviewContract from "../../review-contract/browser.mjs";

const {
  REVIEW_UI_COPY,
  isActiveReviewStatus,
  isClosedReviewStatus,
  reviewComposerHtml,
  reviewCountSummary,
  reviewDefaultDraftTitle,
  reviewDrawerEmptyHtml,
  reviewDrawerShellHtml,
  reviewPinTitle,
  reviewTargetContextText,
  reviewToolbarHtml,
  reviewThreadActionButtonHtml,
  reviewThreadCardHtml,
  reviewThreadStatusAction,
  reviewThreadSummary,
} = reviewContract;

const css = `
html.ws-review-drawer-open,
html.ws-review-drawer-open body,
html.ws-review-composer-open,
html.ws-review-composer-open body {
  overflow: hidden;
}
.ws-review-bar,
.ws-review-bar *,
.ws-review-scrim,
.ws-review-drawer,
.ws-review-drawer *,
.ws-review-composer,
.ws-review-composer *,
.ws-review-pin {
  box-sizing: border-box;
}
.ws-review-scrim {
  position: fixed;
  inset: 0;
  z-index: 10011;
  display: none;
  background: rgba(17,17,17,0.18);
}
.ws-review-scrim.is-open {
  display: block;
}
.ws-review-bar {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  max-width: min(40rem, calc(100vw - 24px));
  padding: 7px 8px;
  background: rgba(255,255,255,0.98);
  border: 1px solid rgba(17,17,17,0.10);
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(17,17,17,0.10);
  backdrop-filter: blur(8px);
  color: #111;
  font: 500 13px/1.2 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-bar button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.12);
  background: #fff;
  color: #111;
  border-radius: 7px;
  min-height: 31px;
  padding: 0 11px;
  cursor: pointer;
  font: inherit;
}
.ws-review-bar button:hover,
.ws-review-composer-actions button:hover,
.ws-review-drawer button:hover {
  border-color: rgba(17,17,17,0.24);
  background: #f5f5f3;
}
.ws-review-bar button:focus-visible,
.ws-review-composer-actions button:focus-visible,
.ws-review-drawer button:focus-visible,
.ws-review-composer input:focus-visible,
.ws-review-composer select:focus-visible,
.ws-review-composer textarea:focus-visible {
  outline: 2px solid rgba(17,17,17,0.62);
  outline-offset: 2px;
}
.ws-review-bar button[aria-pressed="true"] {
  border-color: rgba(17,17,17,0.30);
  background: #ededeb;
}
.ws-review-bar button[data-primary="true"],
.ws-review-composer-actions button[data-primary="true"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-bar button:disabled,
.ws-review-composer-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ws-review-hint {
  color: rgba(17,17,17,0.56);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}
.ws-review-active [data-ws-target] {
  cursor: crosshair;
}
.ws-review-active [data-ws-target]:hover {
  outline: 2px solid rgba(17,17,17,0.26);
  outline-offset: 2px;
}
.ws-review-bridge-status {
  margin-left: auto;
  min-width: 0;
  max-width: 10rem;
  overflow: hidden;
  color: rgba(17,17,17,0.56);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 400;
}
.ws-review-bridge-status[data-tone="good"] {
  color: rgba(31,102,61,0.92);
}
.ws-review-bridge-status[data-tone="warn"] {
  color: rgba(148,78,18,0.92);
}
.ws-review-composer,
.ws-review-drawer {
  position: fixed;
  right: 12px;
  width: min(24rem, calc(100vw - 24px));
  background: #fff;
  border: 1px solid rgba(17,17,17,0.10);
  color: #111;
  box-shadow: 0 18px 40px rgba(17,17,17,0.16);
  font: 400 14px/1.45 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-composer {
  bottom: 12px;
  z-index: 10020;
  max-height: min(36rem, calc(100vh - 92px));
  overflow: auto;
  padding: 18px;
  border-radius: 14px;
}
.ws-review-drawer {
  top: 66px;
  bottom: 12px;
  z-index: 10012;
  display: none;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
}
.ws-review-drawer.is-open {
  display: flex;
}
.ws-review-drawer-header,
.ws-review-drawer-footer {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(17,17,17,0.08);
  background: rgba(255,255,255,0.98);
}
.ws-review-drawer-footer {
  border-bottom: 0;
  border-top: 1px solid rgba(17,17,17,0.08);
}
.ws-review-drawer-title-row,
.ws-review-thread-actions,
.ws-review-thread-state {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.ws-review-drawer-title-row {
  justify-content: space-between;
}
.ws-review-drawer h2,
.ws-review-composer h2,
.ws-review-thread-card h3,
.ws-review-thread-card p {
  margin: 0;
}
.ws-review-drawer-title,
.ws-review-composer h2 {
  font-size: 16px;
  line-height: 1.25;
  font-weight: 700;
}
.ws-review-drawer-meta,
.ws-review-thread-target,
.ws-review-empty,
.ws-review-target-meta {
  color: rgba(17,17,17,0.56);
  font-size: 12px;
  line-height: 1.4;
}
.ws-review-drawer-body {
  flex: 1 1 auto;
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.ws-review-thread-card {
  border-bottom: 1px solid rgba(17,17,17,0.08);
  padding: 13px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
}
.ws-review-thread-card:last-child {
  border-bottom: 0;
}
.ws-review-thread-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.ws-review-thread-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ws-review-thread-title {
  max-width: 30rem;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 700;
}
.ws-review-thread-body {
  color: rgba(17,17,17,0.84);
  line-height: 1.5;
}
.ws-review-severity-pill,
.ws-review-status-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 7px;
  border-radius: 6px;
  border: 1px solid rgba(17,17,17,0.12);
  background: #f7f7f7;
  color: rgba(17,17,17,0.78);
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}
.ws-review-severity-pill[data-severity="must"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-severity-pill[data-severity="should"] {
  background: #f3f3f3;
}
.ws-review-severity-pill[data-severity="could"],
.ws-review-severity-pill[data-severity="question"] {
  color: rgba(17,17,17,0.72);
}
.ws-review-status-text {
  background: transparent;
}
.ws-review-composer-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
}
.ws-review-composer label {
  display: grid;
  gap: 6px;
  margin-top: 13px;
  color: rgba(17,17,17,0.78);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.ws-review-composer input,
.ws-review-composer select,
.ws-review-composer textarea {
  width: 100%;
  max-width: 100%;
  border: 1px solid rgba(17,17,17,0.14);
  border-radius: 8px;
  background: #fff;
  color: #111;
  padding: 10px 11px;
  font: 400 14px/1.35 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-composer textarea {
  min-height: 112px;
  resize: vertical;
}
.ws-review-composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
.ws-review-composer-actions button,
.ws-review-drawer button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.14);
  border-radius: 8px;
  background: #fff;
  color: #111;
  min-height: 31px;
  padding: 0 10px;
  cursor: pointer;
  font: 500 13px/1 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-pin {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10005;
  min-width: 18px;
  min-height: 18px;
  padding: 0 4px;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 999px;
  background: #111;
  color: #fff;
  font: 650 11px/1 ui-sans-serif, system-ui, sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ws-review-highlight {
  outline: 2px solid rgba(17,17,17,0.45) !important;
  outline-offset: 4px !important;
}
@media (max-width: 767px) {
  .ws-review-bar {
    left: 8px;
    right: 8px;
    top: 8px;
    width: auto;
    max-width: none;
  }
  .ws-review-hint,
  .ws-review-bridge-status {
    max-width: 7.5rem;
  }
  .ws-review-drawer {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: min(78vh, calc(100vh - 68px));
    border-radius: 18px 18px 0 0;
  }
  .ws-review-composer {
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    max-height: min(78vh, calc(100vh - 68px));
    padding: 18px 16px 16px;
    border-radius: 16px 16px 0 0;
  }
}
`;

function ensureStyle() {
  if (document.getElementById("ws-review-overlay-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "ws-review-overlay-style";
  style.textContent = css;
  document.head.append(style);
}

function lookupTarget(sourceMap, targetId, element) {
  const match = sourceMap?.targets?.find((entry) => entry.targetId === targetId);
  if (match) {
    return {
      targetId,
      label: match.label || match.wireId || match.kind,
      scope: match.scope,
      kind: match.kind,
    };
  }
  return {
    targetId,
    label: element?.getAttribute("data-ws-id") || element?.getAttribute("data-ws-kind") || targetId,
    scope: element?.getAttribute("data-ws-id") ? "element" : "section",
    kind: element?.getAttribute("data-ws-kind") || "node",
  };
}

function closestTarget(element) {
  let current = element;
  while (current) {
    if (current.hasAttribute?.("data-ws-target")) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function parentTarget(element) {
  const current = closestTarget(element);
  if (!current) {
    return null;
  }
  return closestTarget(current.parentElement);
}

function selectorForTarget(targetId) {
  return `[data-ws-target="${CSS.escape(targetId)}"]`;
}

export function mountReviewOverlay(options) {
  ensureStyle();

  let commentMode = !!options.commentModeDefault;
  let threads = options.getThreads ? options.getThreads() : [];
  let bridgeLabel = "bridge off";
  let bridgeTone = "muted";
  let activeHighlight = null;
  let highlightTimer = null;
  let composer = null;
  let drawerTargetId;

  const bar = document.createElement("aside");
  bar.className = "ws-review-bar";
  bar.setAttribute("aria-label", REVIEW_UI_COPY.toolbarLabel);
  bar.innerHTML = reviewToolbarHtml({
    commentMode,
    includeThreads: true,
    includeSave: true,
    hintText: options.hintText || "Alt-click targets a parent section",
  });
  const bridgeStatus = document.createElement("span");
  bridgeStatus.className = "ws-review-bridge-status";
  bridgeStatus.setAttribute("aria-live", "polite");
  bar.append(bridgeStatus);
  document.body.append(bar);

  const scrim = document.createElement("div");
  scrim.className = "ws-review-scrim";
  document.body.append(scrim);

  const drawer = document.createElement("aside");
  drawer.id = "ws-review-drawer";
  drawer.className = "ws-review-drawer";
  drawer.setAttribute("aria-label", REVIEW_UI_COPY.drawerLabel);
  document.body.append(drawer);
  bar.querySelector('[data-action="threads"]')?.setAttribute("aria-controls", drawer.id);

  function syncBridgeState() {
    bridgeStatus.textContent = bridgeLabel;
    bridgeStatus.dataset.tone = bridgeTone;
  }

  function syncCommentMode() {
    document.documentElement.classList.toggle("ws-review-active", commentMode);
    bar
      .querySelector('[data-action="comment"]')
      ?.setAttribute("aria-pressed", commentMode ? "true" : "false");
  }

  function syncLayers() {
    const drawerOpen = drawer.classList.contains("is-open");
    const composerOpen = Boolean(composer);
    scrim.classList.toggle("is-open", drawerOpen || composerOpen);
    document.documentElement.classList.toggle("ws-review-drawer-open", drawerOpen);
    document.documentElement.classList.toggle("ws-review-composer-open", composerOpen);
    bar
      .querySelector('[data-action="threads"]')
      ?.setAttribute("aria-expanded", drawerOpen ? "true" : "false");
  }

  function clearHighlight() {
    if (highlightTimer) {
      window.clearTimeout(highlightTimer);
      highlightTimer = null;
    }
    if (activeHighlight) {
      activeHighlight.classList.remove("ws-review-highlight");
      activeHighlight = null;
    }
  }

  function setHighlight(targetElement) {
    clearHighlight();
    activeHighlight = targetElement || null;
    activeHighlight?.classList.add("ws-review-highlight");
  }

  function focusTarget(targetId, temporary = true) {
    const targetElement = document.querySelector(selectorForTarget(targetId));
    if (!targetElement) {
      clearHighlight();
      return;
    }
    targetElement.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlight(targetElement);
    if (!temporary) {
      return;
    }
    highlightTimer = window.setTimeout(() => {
      if (activeHighlight === targetElement) {
        clearHighlight();
      }
    }, 1200);
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawerTargetId = undefined;
    syncLayers();
  }

  function labelForTarget(targetId) {
    const target = options.sourceMap?.targets?.find((entry) => entry.targetId === targetId);
    return target?.label || target?.wireId || target?.kind || targetId;
  }

  function renderDrawer() {
    const filtered = drawerTargetId
      ? threads.filter((thread) => thread.target.targetId === drawerTargetId)
      : threads;

    const cards = filtered.length
      ? filtered
          .map((thread) => {
            const statusAction = reviewThreadStatusAction(thread.status);
            const statusButtons = isClosedReviewStatus(thread.status)
              ? reviewThreadActionButtonHtml({
                  action: "toggle-status",
                  actionAttribute: "data-thread-action",
                  threadId: thread.id,
                  label: statusAction.label,
                })
              : `${reviewThreadActionButtonHtml({
                  action: "toggle-status",
                  actionAttribute: "data-thread-action",
                  threadId: thread.id,
                  label: statusAction.label,
                })}
                ${reviewThreadActionButtonHtml({
                  action: "wontfix",
                  actionAttribute: "data-thread-action",
                  threadId: thread.id,
                  label: REVIEW_UI_COPY.wontfix,
                })}`;

            return reviewThreadCardHtml({
              thread,
              articleClass: "ws-review-thread-card",
              title: reviewThreadSummary(thread),
              titleClass: "ws-review-thread-title",
              targetMeta: reviewTargetContextText(
                thread.target,
                labelForTarget(thread.target.targetId),
              ),
              targetClass: "ws-review-thread-target",
              topMetaClass: "ws-review-thread-meta",
              severityClass: "ws-review-severity-pill",
              bodyClass: "ws-review-thread-body",
              statusContainerClass: "ws-review-thread-state",
              statusClass: "ws-review-status-text",
              actionsClass: "ws-review-thread-actions",
              actionsHtml: `
                ${reviewThreadActionButtonHtml({
                  action: "focus-target",
                  threadId: thread.id,
                  label: REVIEW_UI_COPY.focusTarget,
                })}
                ${statusButtons}
              `,
            });
          })
          .join("")
      : reviewDrawerEmptyHtml();

    drawer.innerHTML = reviewDrawerShellHtml({
      titleClass: "ws-review-drawer-title",
      titleRowClass: "ws-review-drawer-title-row",
      metaClass: "ws-review-drawer-meta",
      metaText: reviewCountSummary({
        active: threads.filter((thread) => isActiveReviewStatus(thread.status)).length,
        total: threads.length,
      }),
      includeHeaderClose: true,
      closeAction: "close-drawer",
      bodyRole: "body",
      bodyHtml: cards,
    });
  }

  function openDrawer(targetId) {
    drawerTargetId = targetId;
    closeComposer();
    drawer.classList.add("is-open");
    renderDrawer();
    syncLayers();
  }

  function closeComposer() {
    composer?.remove();
    composer = null;
    clearHighlight();
    syncLayers();
  }

  function renderPins() {
    document.querySelectorAll(".ws-review-pin").forEach((node) => node.remove());
    const counts = new Map();
    for (const thread of threads) {
      if (isClosedReviewStatus(thread.status)) {
        continue;
      }
      counts.set(thread.target.targetId, (counts.get(thread.target.targetId) || 0) + 1);
    }
    for (const [targetId, count] of counts.entries()) {
      const element = document.querySelector(selectorForTarget(targetId));
      if (!element) {
        continue;
      }
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "ws-review-pin";
      pin.textContent = String(count);
      pin.title = reviewPinTitle(count);
      pin.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDrawer(targetId);
        focusTarget(targetId);
      });
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === "static") {
        element.style.position = "relative";
      }
      element.append(pin);
    }
  }

  function showComposer(target, targetElement) {
    closeComposer();
    closeDrawer();
    setHighlight(targetElement);
    composer = document.createElement("section");
    composer.className = "ws-review-composer";
    composer.setAttribute("role", "dialog");
    composer.setAttribute("aria-modal", "true");
    composer.setAttribute("aria-label", REVIEW_UI_COPY.newNoteLabel);
    composer.innerHTML = reviewComposerHtml({
      target,
      headerClass: "ws-review-composer-header",
      metaClass: "ws-review-target-meta",
      actionsClass: "ws-review-composer-actions",
    });
    document.body.append(composer);

    const title = composer.querySelector('input[name="title"]');
    const severity = composer.querySelector('select[name="severity"]');
    const body = composer.querySelector('textarea[name="body"]');
    const submit = composer.querySelector('[data-action="submit"]');

    const syncValidity = () => {
      submit.disabled = !body.value.trim();
    };

    composer.querySelector('[data-action="cancel"]')?.addEventListener("click", closeComposer);
    body?.addEventListener("input", syncValidity);
    submit?.addEventListener("click", () => {
      if (!body.value.trim()) {
        return;
      }
      options.onDraftSubmitted?.({
        targetId: target.targetId,
        title: title.value.trim() || reviewDefaultDraftTitle(target),
        severity: severity.value,
        category: "ux",
        body: body.value.trim(),
      });
      closeComposer();
      openDrawer(target.targetId);
    });

    syncValidity();
    title?.focus();
    syncLayers();
  }

  function onDrawerClick(event) {
    const rawTarget = event.target instanceof HTMLElement ? event.target : null;
    if (!rawTarget) {
      return;
    }

    const action = rawTarget.getAttribute("data-action");
    if (action === "close-drawer") {
      closeDrawer();
      return;
    }
    if (action === "focus-target") {
      const threadId = rawTarget.getAttribute("data-thread-id");
      const thread = threads.find((entry) => entry.id === threadId);
      if (thread) {
        focusTarget(thread.target.targetId);
      }
      return;
    }

    const threadAction = rawTarget.getAttribute("data-thread-action");
    const threadId = rawTarget.getAttribute("data-thread-id");
    if (!threadAction || !threadId) {
      return;
    }
    const thread = threads.find((entry) => entry.id === threadId);
    if (!thread) {
      return;
    }
    options.onStatusChange?.({
      threadId,
      status: threadAction === "wontfix"
        ? "wontfix"
        : reviewThreadStatusAction(thread.status).nextStatus,
    });
  }

  function onDocumentClick(event) {
    if (!commentMode) {
      return;
    }
    if (bar.contains(event.target) || drawer.contains(event.target) || composer?.contains(event.target)) {
      return;
    }
    const targetElement = event.altKey ? parentTarget(event.target) : closestTarget(event.target);
    if (!targetElement) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const targetId = targetElement.getAttribute("data-ws-target");
    const target = lookupTarget(options.sourceMap, targetId, targetElement);
    showComposer(target, targetElement);
  }

  const onKeydown = (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (composer) {
      closeComposer();
      return;
    }
    if (drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  };

  bar.querySelector('[data-action="comment"]')?.addEventListener("click", () => {
    commentMode = !commentMode;
    syncCommentMode();
    if (!commentMode) {
      closeComposer();
    }
  });

  bar.querySelector('[data-action="threads"]')?.addEventListener("click", () => {
    if (drawer.classList.contains("is-open")) {
      closeDrawer();
      return;
    }
    openDrawer();
  });

  bar.querySelector('[data-action="save"]')?.addEventListener("click", async () => {
    const button = bar.querySelector('[data-action="save"]');
    const previous = button.textContent;
    button.textContent = "Saving…";
    button.disabled = true;
    try {
      await options.onSaveRequested?.();
    } finally {
      button.textContent = previous;
      button.disabled = false;
    }
  });

  drawer.addEventListener("click", onDrawerClick);
  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("keydown", onKeydown);
  scrim.addEventListener("click", () => {
    if (composer) {
      closeComposer();
      return;
    }
    if (drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  syncCommentMode();
  syncBridgeState();
  syncLayers();
  renderDrawer();
  renderPins();

  return {
    setThreads(nextThreads) {
      threads = nextThreads;
      renderPins();
      if (drawer.classList.contains("is-open")) {
        renderDrawer();
      }
    },
    setBridgeState(nextState) {
      bridgeLabel = nextState.label || bridgeLabel;
      bridgeTone = nextState.tone || bridgeTone;
      syncBridgeState();
    },
    flashMessage(message) {
      bridgeLabel = message;
      syncBridgeState();
    },
    openDrawer,
    closeDrawer,
    dispose() {
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("keydown", onKeydown);
      drawer.removeEventListener("click", onDrawerClick);
      closeComposer();
      closeDrawer();
      drawer.remove();
      scrim.remove();
      bar.remove();
      document.querySelectorAll(".ws-review-pin").forEach((node) => node.remove());
      clearHighlight();
      document.documentElement.classList.remove("ws-review-active");
      document.documentElement.classList.remove("ws-review-drawer-open");
      document.documentElement.classList.remove("ws-review-composer-open");
    },
  };
}
