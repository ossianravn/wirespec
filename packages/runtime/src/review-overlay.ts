import { ReviewDraft, SourceMapDocument } from "./types.js";
import reviewContract from "../../review-contract/browser.mjs";

const {
  REVIEW_UI_COPY,
  reviewComposerHtml,
  reviewDefaultDraftTitle,
  reviewToolbarHtml,
} = reviewContract;

export interface ReviewOverlayOptions {
  sourceMap?: SourceMapDocument;
  commentModeDefault?: boolean;
  hintText?: string;
}

interface TargetMeta {
  targetId: string;
  label: string;
  scope: string;
  kind: string;
}

const overlayCss = `
.ws-review-bar,
.ws-review-bar *,
.ws-review-scrim,
.ws-review-composer,
.ws-review-composer * {
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
  max-width: min(34rem, calc(100vw - 24px));
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
.ws-review-composer-actions button:hover {
  border-color: rgba(17,17,17,0.24);
  background: #f5f5f3;
}
.ws-review-bar button:focus-visible,
.ws-review-composer-actions button:focus-visible,
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
.ws-review-bar [data-ws-review-bar-actions] {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ws-review-hint {
  display: none;
  color: rgba(17,17,17,0.56);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}
.ws-review-active .ws-review-hint {
  display: inline-block;
}
.ws-review-active [data-ws-target] {
  cursor: crosshair;
}
.ws-review-active [data-ws-target]:hover {
  outline: 2px solid rgba(17,17,17,0.26);
  outline-offset: 2px;
}
.ws-review-composer {
  position: fixed;
  right: 12px;
  bottom: 12px;
  width: min(24rem, calc(100vw - 24px));
  z-index: 10020;
  max-height: min(36rem, calc(100vh - 92px));
  overflow: auto;
  padding: 18px;
  background: #fff;
  border: 1px solid rgba(17,17,17,0.10);
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(17,17,17,0.16);
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
  gap: 5px;
  margin-bottom: 14px;
}
.ws-review-composer h2 {
  font-size: 16px;
  line-height: 1.25;
  font-weight: 700;
}
.ws-review-target-meta {
  color: rgba(17,17,17,0.56);
  font-size: 12px;
  line-height: 1.4;
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
.ws-review-composer-actions button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.14);
  border-radius: 8px;
  background: #fff;
  color: #111;
  min-height: 34px;
  padding: 0 12px;
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
    top: 8px;
    width: auto;
    max-width: none;
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

function ensureStyle(): void {
  if (document.getElementById("ws-review-overlay-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "ws-review-overlay-style";
  style.textContent = overlayCss;
  document.head.append(style);
}

function lookupTarget(
  sourceMap: SourceMapDocument | undefined,
  targetId: string,
  element: HTMLElement,
): TargetMeta {
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
    label:
      element.getAttribute("data-ws-id") ??
      element.getAttribute("data-ws-kind") ??
      targetId,
    scope: element.getAttribute("data-ws-id") ? "element" : "section",
    kind: element.getAttribute("data-ws-kind") ?? "node",
  };
}

function closestTarget(element: HTMLElement | null): HTMLElement | null {
  let current = element;
  while (current) {
    if (current.hasAttribute("data-ws-target")) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function parentTarget(element: HTMLElement | null): HTMLElement | null {
  const current = closestTarget(element);
  if (!current) {
    return null;
  }
  return closestTarget(current.parentElement);
}

function dispatch(name: string, detail: unknown): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function createComposer(target: TargetMeta, onClose: () => void): HTMLElement {
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

  const titleInput = composer.querySelector('input[name="title"]') as HTMLInputElement | null;
  const severitySelect = composer.querySelector('select[name="severity"]') as HTMLSelectElement | null;
  const bodyInput = composer.querySelector('textarea[name="body"]') as HTMLTextAreaElement | null;
  const submitButton = composer.querySelector('[data-action="submit"]') as HTMLButtonElement | null;

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
    const draft: ReviewDraft = {
      targetId: target.targetId,
      title: titleInput?.value.trim() || reviewDefaultDraftTitle(target),
      category: "ux",
      severity: (severitySelect?.value as ReviewDraft["severity"]) || "should",
      body: bodyInput.value.trim(),
    };
    dispatch("wirespec.review.draftSubmitted", draft);
    onClose();
  });

  syncValidity();
  titleInput?.focus();
  return composer;
}

export function mountReviewOverlay(options: ReviewOverlayOptions = {}): () => void {
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
  const scrim = document.createElement("div");
  scrim.className = "ws-review-scrim";
  document.body.append(scrim);

  const toggleButton = bar.querySelector('[data-action="toggle"]') as HTMLButtonElement | null;
  let active = Boolean(options.commentModeDefault);
  let composer: HTMLElement | null = null;

  const syncActive = () => {
    document.documentElement.classList.toggle("ws-review-active", active);
    if (toggleButton) {
      toggleButton.setAttribute("aria-pressed", active ? "true" : "false");
    }
  };

  const closeComposer = () => {
    composer?.remove();
    composer = null;
    scrim.classList.remove("is-open");
    document.documentElement.classList.remove("ws-review-composer-open");
  };

  const openComposer = (target: TargetMeta) => {
    closeComposer();
    composer = createComposer(target, closeComposer);
    document.body.append(composer);
    scrim.classList.add("is-open");
    document.documentElement.classList.add("ws-review-composer-open");
    dispatch("wirespec.review.targetSelected", target);
  };

  const onDocumentClick = (event: MouseEvent) => {
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

  const onKeydown = (event: KeyboardEvent) => {
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
  scrim.addEventListener("click", closeComposer);
  syncActive();

  return () => {
    closeComposer();
    document.removeEventListener("click", onDocumentClick, true);
    document.removeEventListener("keydown", onKeydown);
    scrim.removeEventListener("click", closeComposer);
    bar.remove();
    scrim.remove();
    document.documentElement.classList.remove("ws-review-active");
    document.documentElement.classList.remove("ws-review-composer-open");
  };
}

export function targetFromEvent(
  event: MouseEvent,
  sourceMap?: SourceMapDocument,
): TargetMeta | null {
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
