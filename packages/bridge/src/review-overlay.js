import reviewContract from "../../review-contract/browser.mjs";

const {
  REVIEW_UI_COPY,
  isActiveReviewStatus,
  isClosedReviewStatus,
  reviewCountSummary,
  reviewComposerHtml,
  reviewDefaultDraftTitle,
  reviewDrawerEmptyHtml,
  reviewDrawerFooterHtml,
  reviewDrawerShellHtml,
  reviewPinTitle,
  reviewToolbarHtml,
  reviewThreadActionButtonHtml,
  reviewThreadCardHtml,
  reviewThreadStatusAction,
  reviewThreadSummary,
} = reviewContract;

const css = `
.ws-review-bar,
.ws-review-bar *,
.ws-review-drawer,
.ws-review-drawer *,
.ws-review-composer,
.ws-review-composer * {
  box-sizing: border-box;
}
.ws-review-bar {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  max-width: min(560px, calc(100vw - 32px));
  padding: 6px;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 8px;
  background: #fff;
  color: #111;
  box-shadow: 0 2px 8px rgba(17,17,17,0.10);
  font: 500 13px/1.25 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-bar button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.16);
  background: #fff;
  color: #111;
  border-radius: 6px;
  min-height: 32px;
  padding: 0 10px;
  font: inherit;
  cursor: pointer;
}
.ws-review-bar button:hover,
.ws-review-actions button:hover,
.ws-review-drawer button:hover {
  border-color: rgba(17,17,17,0.32);
  background: #f7f7f7;
}
.ws-review-bar button:focus-visible,
.ws-review-actions button:focus-visible,
.ws-review-drawer button:focus-visible,
.ws-review-composer input:focus-visible,
.ws-review-composer select:focus-visible,
.ws-review-composer textarea:focus-visible {
  outline: 2px solid rgba(17,17,17,0.70);
  outline-offset: 2px;
}
.ws-review-bar button[aria-pressed="true"] {
  border-color: rgba(17,17,17,0.40);
  background: #eeeeee;
}
.ws-review-bar button[data-primary="true"],
.ws-review-actions button[data-primary="true"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-bar button[data-primary="true"]:hover,
.ws-review-actions button[data-primary="true"]:hover {
  background: #2a2a2a;
}
.ws-review-bar button:disabled,
.ws-review-actions button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
.ws-review-bar-meta {
  display: none;
}
.ws-review-active [data-ws-target] {
  cursor: crosshair;
}
.ws-review-active [data-ws-target]:hover {
  outline: 2px solid rgba(17,17,17,0.34);
  outline-offset: 2px;
}
.ws-review-composer,
.ws-review-drawer {
  position: fixed;
  right: 16px;
  width: min(420px, calc(100vw - 32px));
  z-index: 10001;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 8px;
  background: #fff;
  color: #111;
  box-shadow: 0 2px 10px rgba(17,17,17,0.12);
  font: 400 14px/1.45 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-composer {
  bottom: 16px;
  z-index: 10002;
  max-height: calc(100vh - 88px);
  overflow: auto;
  padding: 16px;
}
.ws-review-drawer {
  top: 64px;
  bottom: 16px;
  display: none;
  overflow: hidden;
  flex-direction: column;
}
.ws-review-drawer.is-open {
  display: flex;
}
.ws-review-drawer-header,
.ws-review-drawer-footer {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(17,17,17,0.08);
}
.ws-review-drawer-footer {
  border-top: 1px solid rgba(17,17,17,0.08);
  border-bottom: 0;
  display: flex;
  justify-content: flex-end;
}
.ws-review-drawer-body {
  padding: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.ws-review-drawer h2,
.ws-review-composer h2,
.ws-review-thread h3,
.ws-review-thread p,
.ws-review-composer p,
.ws-review-empty p {
  margin: 0;
}
.ws-review-drawer h2,
.ws-review-composer h2 {
  font-size: 17px;
  line-height: 1.25;
  font-weight: 650;
}
.ws-review-label,
.ws-review-meta,
.ws-review-status,
.ws-review-empty {
  color: rgba(17,17,17,0.62);
}
.ws-review-label {
  margin-top: 4px;
  font-size: 13px;
}
.ws-review-thread {
  border-bottom: 1px solid rgba(17,17,17,0.08);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  background: #fff;
}
.ws-review-thread:last-child {
  border-bottom: 0;
}
.ws-review-thread-head,
.ws-review-thread-actions,
.ws-review-thread-state {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ws-review-thread-head {
  justify-content: space-between;
  align-items: flex-start;
}
.ws-review-thread h3 {
  max-width: 30rem;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 650;
}
.ws-review-thread-body {
  color: rgba(17,17,17,0.84);
  line-height: 1.5;
}
.ws-review-badge {
  display: inline-flex;
  align-items: center;
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
.ws-review-badge[data-severity="must"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-composer label {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  color: rgba(17,17,17,0.82);
  font-size: 13px;
  font-weight: 600;
}
.ws-review-composer input,
.ws-review-composer select,
.ws-review-composer textarea {
  width: 100%;
  max-width: 100%;
  border: 1px solid rgba(17,17,17,0.14);
  border-radius: 6px;
  padding: 9px 10px;
  background: #fff;
  color: #111;
  font: 400 14px/1.35 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-composer textarea {
  min-height: 104px;
  resize: vertical;
}
.ws-review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.ws-review-actions button,
.ws-review-drawer button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.16);
  background: #fff;
  color: #111;
  border-radius: 6px;
  min-height: 32px;
  padding: 0 10px;
  font: 500 13px/1 ui-sans-serif, system-ui, sans-serif;
  cursor: pointer;
}
.ws-review-pin {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 6;
  min-width: 20px;
  min-height: 20px;
  border-radius: 10px;
  border: 1px solid rgba(17,17,17,0.12);
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
    width: auto;
    max-width: none;
  }
  .ws-review-bar-meta {
    display: none;
  }
  .ws-review-drawer {
    left: 8px;
    right: 8px;
    width: auto;
    top: 72px;
    bottom: 8px;
    max-height: none;
  }
  .ws-review-composer {
    left: 8px;
    right: 8px;
    bottom: 8px;
    width: auto;
    max-height: calc(100vh - 88px);
  }
  .ws-review-thread-head {
    display: block;
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

export function mountReviewOverlay(options) {
  ensureStyle();

  let commentMode = !!options.commentModeDefault;
  let threads = options.getThreads ? options.getThreads() : [];
  let bridgeLabel = "bridge off";
  let bridgeTone = "muted";
  let activeHighlight = null;
  let composer = null;

  const bar = document.createElement("aside");
  bar.className = "ws-review-bar";
  bar.setAttribute("aria-label", REVIEW_UI_COPY.toolbarLabel);
  bar.innerHTML = reviewToolbarHtml({
    commentMode,
    includeThreads: true,
    includeSave: true,
  });
  document.body.append(bar);

  const drawer = document.createElement("aside");
  drawer.className = "ws-review-drawer";
  drawer.setAttribute("aria-label", REVIEW_UI_COPY.drawerLabel);
  document.body.append(drawer);

  function setHighlight(targetElement) {
    if (activeHighlight) {
      activeHighlight.classList.remove("ws-review-highlight");
    }
    activeHighlight = targetElement || null;
    activeHighlight?.classList.add("ws-review-highlight");
  }

  function openDrawer(focusTargetId) {
    drawer.classList.add("is-open");
    bar.querySelector('[data-action="threads"]')?.setAttribute("aria-expanded", "true");
    renderDrawer(focusTargetId);
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    bar.querySelector('[data-action="threads"]')?.setAttribute("aria-expanded", "false");
  }

  function closeComposer() {
    composer?.remove();
    composer = null;
    setHighlight(null);
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
      const element = document.querySelector(`[data-ws-target="${CSS.escape(targetId)}"]`);
      if (!element) {
        continue;
      }
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "ws-review-pin";
      pin.textContent = String(count);
      pin.title = reviewPinTitle(count);
      pin.addEventListener("click", (event) => {
        event.stopPropagation();
        openDrawer(targetId);
      });
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === "static") {
        element.style.position = "relative";
      }
      element.append(pin);
    }
  }

  function renderDrawer(focusTargetId) {
    const filtered = focusTargetId
      ? threads.filter((thread) => thread.target.targetId === focusTargetId)
      : threads;

    const cards = filtered.length
      ? filtered
          .map((thread) => {
            const targetLabel = thread.target.wireId || thread.target.targetId;
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
              articleClass: "ws-review-thread",
              title: reviewThreadSummary(thread),
              targetMeta: `${targetLabel}${thread.target.variantKey ? ` · ${thread.target.variantKey}` : ""}`,
              targetClass: "ws-review-meta",
              severityClass: "ws-review-badge",
              bodyClass: "ws-review-thread-body",
              statusContainerClass: "ws-review-thread-state",
              statusClass: "ws-review-status",
              actionsHtml: statusButtons,
            });
          })
          .join("")
      : reviewDrawerEmptyHtml({
        container: "div",
        message: "No review notes yet.",
      });

    drawer.innerHTML = reviewDrawerShellHtml({
      metaClass: "ws-review-label",
      metaText: reviewCountSummary({
        active: threads.filter((thread) => isActiveReviewStatus(thread.status)).length,
        total: threads.length,
      }),
      bodyHtml: cards,
      footerHtml: reviewDrawerFooterHtml({
        actions: [{ action: "close-drawer", label: REVIEW_UI_COPY.close }],
      }),
    });

    drawer.querySelector('[data-action="close-drawer"]')?.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("[data-thread-action]").forEach((button) => {
      button.addEventListener("click", () => {
        options.onStatusChange?.({
          threadId: button.getAttribute("data-thread-id"),
          status: button.getAttribute("data-thread-action") === "wontfix"
            ? "wontfix"
            : reviewThreadStatusAction(
              threads.find((thread) => thread.id === button.getAttribute("data-thread-id"))?.status || "open",
            ).nextStatus,
        });
      });
    });
  }

  function showComposer(target) {
    closeComposer();
    closeDrawer();
    composer = document.createElement("section");
    composer.className = "ws-review-composer";
    composer.setAttribute("role", "dialog");
    composer.setAttribute("aria-modal", "true");
    composer.setAttribute("aria-label", REVIEW_UI_COPY.newNoteLabel);
    composer.innerHTML = reviewComposerHtml({
      target,
      metaClass: "ws-review-label",
      actionsClass: "ws-review-actions",
    });
    document.body.append(composer);

    const title = composer.querySelector('input[name="title"]');
    const severity = composer.querySelector('select[name="severity"]');
    const body = composer.querySelector('textarea[name="body"]');
    const submit = composer.querySelector('[data-action="submit"]');

    const sync = () => {
      submit.disabled = !body.value.trim();
    };

    composer.querySelector('[data-action="cancel"]')?.addEventListener("click", closeComposer);
    body?.addEventListener("input", sync);
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
    title?.focus();
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
    setHighlight(targetElement);
    showComposer(target);
  }

  document.body.classList.toggle("ws-review-active", commentMode);
  document.addEventListener("click", onDocumentClick, true);

  bar.querySelector('[data-action="comment"]')?.addEventListener("click", () => {
    commentMode = !commentMode;
    document.body.classList.toggle("ws-review-active", commentMode);
    bar.querySelector('[data-action="comment"]')?.setAttribute("aria-pressed", commentMode ? "true" : "false");
    if (!commentMode) {
      closeComposer();
    }
  });

  bar.querySelector('[data-action="threads"]')?.addEventListener("click", () => {
    if (drawer.classList.contains("is-open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

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

  document.addEventListener("keydown", onKeydown);

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
    },
    flashMessage(message) {
      bridgeLabel = message;
    },
    openDrawer,
    closeDrawer,
    dispose() {
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("keydown", onKeydown);
      closeComposer();
      drawer.remove();
      bar.remove();
      document.querySelectorAll(".ws-review-pin").forEach((node) => node.remove());
      if (activeHighlight) {
        activeHighlight.classList.remove("ws-review-highlight");
      }
    },
  };
}
