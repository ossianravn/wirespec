import { ReviewDraft, SourceMapDocument } from "./types.js";
import reviewContract from "../../review-contract/index.js";

const { REVIEW_UI_COPY } = reviewContract;

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
  composer.innerHTML = `
    <div class="ws-review-composer-header">
      <h2>${REVIEW_UI_COPY.composerTitle}</h2>
      <p class="ws-review-target-meta">${target.scope} · ${target.kind} · ${target.label}</p>
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
    <div class="ws-review-composer-actions">
      <button type="button" data-action="cancel">${REVIEW_UI_COPY.cancel}</button>
      <button type="button" data-action="submit" data-primary="true" disabled>${REVIEW_UI_COPY.createNote}</button>
    </div>
  `;

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
      title: titleInput?.value.trim() || `Review ${target.label}`,
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
  bar.innerHTML = `
    <button type="button" data-action="toggle" aria-pressed="${options.commentModeDefault ? "true" : "false"}">${REVIEW_UI_COPY.comment}</button>
    <div data-ws-review-bar-actions></div>
    <span class="ws-review-hint">${options.hintText ?? "Alt-click targets a parent section"}</span>
  `;
  document.body.append(bar);

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
  };

  const openComposer = (target: TargetMeta) => {
    closeComposer();
    composer = createComposer(target, closeComposer);
    document.body.append(composer);
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
  syncActive();

  return () => {
    closeComposer();
    document.removeEventListener("click", onDocumentClick, true);
    document.removeEventListener("keydown", onKeydown);
    bar.remove();
    document.documentElement.classList.remove("ws-review-active");
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
