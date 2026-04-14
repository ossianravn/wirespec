import reviewContract from "../../review-contract/browser.mjs";
const { REVIEW_UI_COPY, reviewComposerHtml, reviewDefaultDraftTitle, reviewToolbarHtml, } = reviewContract;
const overlayCss = `
.ws-review-bar,
.ws-review-bar *,
.ws-review-composer,
.ws-review-composer * {
  box-sizing: border-box;
}
.ws-review-bar {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 44px;
  max-width: min(560px, calc(100vw - 32px));
  padding: 6px;
  background: #fff;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(17,17,17,0.10);
  color: #111;
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
  cursor: pointer;
  font: inherit;
}
.ws-review-bar button:hover,
.ws-review-composer-actions button:hover {
  border-color: rgba(17,17,17,0.32);
  background: #f7f7f7;
}
.ws-review-bar button:focus-visible,
.ws-review-composer-actions button:focus-visible,
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
.ws-review-bar [data-ws-review-bar-actions] {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ws-review-hint {
  color: rgba(17,17,17,0.68);
  white-space: nowrap;
  font-weight: 400;
}
.ws-review-active [data-ws-target] {
  cursor: crosshair;
}
.ws-review-active [data-ws-target]:hover {
  outline: 2px solid rgba(17,17,17,0.34);
  outline-offset: 2px;
}
.ws-review-composer {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: min(420px, calc(100vw - 32px));
  z-index: 10000;
  max-height: calc(100vh - 88px);
  overflow: auto;
  padding: 16px;
  background: #fff;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(17,17,17,0.12);
  font: 400 14px/1.45 ui-sans-serif, system-ui, sans-serif;
  color: #111;
}
.ws-review-composer h2,
.ws-review-composer p {
  margin: 0;
}
.ws-review-composer-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.ws-review-composer h2 {
  font-size: 17px;
  line-height: 1.25;
  font-weight: 650;
}
.ws-review-target-meta {
  color: rgba(17,17,17,0.62);
  font-size: 13px;
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
  border: 1px solid rgba(17,17,17,0.16);
  border-radius: 6px;
  background: #fff;
  color: #111;
  padding: 9px 10px;
  font: 400 14px/1.35 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-composer textarea {
  min-height: 96px;
  resize: vertical;
}
.ws-review-composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.ws-review-composer-actions button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.16);
  border-radius: 6px;
  background: #fff;
  color: #111;
  min-height: 32px;
  padding: 0 10px;
  cursor: pointer;
  font: 500 13px/1 ui-sans-serif, system-ui, sans-serif;
}
.ws-review-composer-actions button[data-primary="true"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-composer-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
@media (max-width: 767px) {
  .ws-review-bar {
    left: 8px;
    right: 8px;
    width: auto;
    max-width: none;
  }
  .ws-review-hint {
    display: none;
  }
  .ws-review-composer {
    left: 8px;
    right: 8px;
    bottom: 8px;
    width: auto;
    max-height: calc(100vh - 88px);
  }
}
`;
function ensureStyle() {
    if (document.getElementById("ws-review-overlay-style")) {
        return;
    }
    const style = document.createElement("style");
    style.id = "ws-review-overlay-style";
    style.textContent = overlayCss;
    document.head.append(style);
}
function lookupTarget(sourceMap, targetId, element) {
    const target = sourceMap?.targets.find((entry) => entry.targetId === targetId);
    if (target) {
        return {
            targetId,
            label: target.label ?? target.wireId ?? target.kind,
            scope: target.scope,
            kind: target.kind,
        };
    }
    return {
        targetId,
        label: element.getAttribute("data-ws-id") ??
            element.getAttribute("data-ws-kind") ??
            targetId,
        scope: element.getAttribute("data-ws-id") ? "element" : "section",
        kind: element.getAttribute("data-ws-kind") ?? "node",
    };
}
function closestTarget(element) {
    let current = element;
    while (current) {
        if (current.hasAttribute("data-ws-target")) {
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
function dispatch(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}
function createComposer(target, onClose) {
    const composer = document.createElement("section");
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
    const titleInput = composer.querySelector('input[name="title"]');
    const severitySelect = composer.querySelector('select[name="severity"]');
    const bodyInput = composer.querySelector('textarea[name="body"]');
    const submitButton = composer.querySelector('[data-action="submit"]');
    const syncValidity = () => {
        if (!submitButton) {
            return;
        }
        submitButton.disabled = !(bodyInput?.value.trim());
    };
    composer.querySelector('[data-action="cancel"]')?.addEventListener("click", onClose);
    bodyInput?.addEventListener("input", syncValidity);
    submitButton?.addEventListener("click", () => {
        if (!bodyInput?.value.trim()) {
            return;
        }
        const draft = {
            targetId: target.targetId,
            title: titleInput?.value.trim() || reviewDefaultDraftTitle(target),
            category: "ux",
            severity: severitySelect?.value || "should",
            body: bodyInput.value.trim(),
        };
        dispatch("wirespec.review.draftSubmitted", draft);
        onClose();
    });
    syncValidity();
    titleInput?.focus();
    return composer;
}
export function mountReviewOverlay(options = {}) {
    ensureStyle();
    const bar = document.createElement("div");
    bar.className = "ws-review-bar";
    bar.setAttribute("aria-label", REVIEW_UI_COPY.toolbarLabel);
    bar.innerHTML = reviewToolbarHtml({
        commentMode: options.commentModeDefault,
        commentAction: "toggle",
        includeRuntimeSlot: true,
        hintText: options.hintText ?? "Alt-click targets a parent section",
    });
    document.body.append(bar);
    const toggleButton = bar.querySelector('[data-action="toggle"]');
    let active = Boolean(options.commentModeDefault);
    let composer = null;
    const syncActive = () => {
        document.documentElement.classList.toggle("ws-review-active", active);
        if (toggleButton) {
            toggleButton.setAttribute("aria-pressed", active ? "true" : "false");
        }
    };
    const closeComposer = () => {
        composer?.remove();
        composer = null;
    };
    const openComposer = (target) => {
        closeComposer();
        composer = createComposer(target, closeComposer);
        document.body.append(composer);
        dispatch("wirespec.review.targetSelected", target);
    };
    const onDocumentClick = (event) => {
        if (!active) {
            return;
        }
        const rawTarget = event.target instanceof HTMLElement ? event.target : null;
        if (!rawTarget) {
            return;
        }
        if (bar.contains(rawTarget) || composer?.contains(rawTarget)) {
            return;
        }
        const targetElement = event.altKey ? parentTarget(rawTarget) : closestTarget(rawTarget);
        if (!targetElement) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const targetId = targetElement.getAttribute("data-ws-target");
        if (!targetId) {
            return;
        }
        openComposer(lookupTarget(options.sourceMap, targetId, targetElement));
    };
    const onKeydown = (event) => {
        if (event.key === "Escape") {
            closeComposer();
        }
    };
    toggleButton?.addEventListener("click", () => {
        active = !active;
        syncActive();
        dispatch("wirespec.review.modeChanged", { active });
    });
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("keydown", onKeydown);
    syncActive();
    return () => {
        closeComposer();
        document.removeEventListener("click", onDocumentClick, true);
        document.removeEventListener("keydown", onKeydown);
        bar.remove();
        document.documentElement.classList.remove("ws-review-active");
    };
}
export function targetFromEvent(event, sourceMap) {
    const rawTarget = event.target instanceof HTMLElement ? event.target : null;
    const targetElement = event.altKey ? parentTarget(rawTarget) : closestTarget(rawTarget);
    if (!targetElement) {
        return null;
    }
    const targetId = targetElement.getAttribute("data-ws-target");
    if (!targetId) {
        return null;
    }
    return lookupTarget(sourceMap, targetId, targetElement);
}
