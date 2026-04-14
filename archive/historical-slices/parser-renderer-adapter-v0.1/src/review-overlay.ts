import { SourceMapDocument, SourceTarget } from "./types.js";

export interface ReviewDraft {
  targetId: string;
  title: string;
  body: string;
  category: string;
  severity: "must" | "should" | "could" | "question";
}

export interface ReviewOverlayOptions {
  sourceMap?: SourceMapDocument;
  commentModeDefault?: boolean;
}

interface TargetMeta {
  targetId: string;
  label: string;
  scope: string;
  kind: string;
}

const overlayCss = `
.ws-review-bar {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(17,17,17,0.08);
  color: #111;
  font: 500 14px/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
}
.ws-review-bar button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.16);
  background: #fff;
  color: #111;
  border-radius: 999px;
  min-height: 34px;
  padding: 0 12px;
  cursor: pointer;
  font: inherit;
}
.ws-review-bar button[aria-pressed="true"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-hint {
  color: rgba(17,17,17,0.68);
  white-space: nowrap;
}
.ws-review-active [data-ws-target] {
  cursor: crosshair;
}
.ws-review-active [data-ws-target]:hover {
  outline: 2px solid rgba(17,17,17,0.32);
  outline-offset: 2px;
}
.ws-review-composer {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: min(360px, calc(100vw - 32px));
  z-index: 10000;
  padding: 12px;
  background: rgba(255,255,255,0.98);
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(17,17,17,0.1);
  font: 400 14px/1.4 Inter, ui-sans-serif, system-ui, sans-serif;
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
  margin-bottom: 10px;
}
.ws-review-target-meta {
  color: rgba(17,17,17,0.68);
}
.ws-review-composer label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.ws-review-composer input,
.ws-review-composer select,
.ws-review-composer textarea {
  width: 100%;
  border: 1px solid rgba(17,17,17,0.16);
  border-radius: 10px;
  background: #fff;
  color: #111;
  padding: 10px 12px;
  font: inherit;
}
.ws-review-composer textarea {
  min-height: 96px;
  resize: vertical;
}
.ws-review-composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.ws-review-composer-actions button {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.16);
  border-radius: 10px;
  background: #fff;
  color: #111;
  min-height: 38px;
  padding: 0 12px;
  cursor: pointer;
  font: inherit;
}
.ws-review-composer-actions button[data-primary="true"] {
  background: #111;
  border-color: #111;
  color: #fff;
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
      label:
        target.label ??
        target.wireId ??
        target.kind,
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
  if (!current) return null;
  return closestTarget(current.parentElement);
}

function dispatch(name: string, detail: unknown): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function createComposer(
  target: TargetMeta,
  onClose: () => void,
): HTMLElement {
  const composer = document.createElement("section");
  composer.className = "ws-review-composer";
  composer.innerHTML = `
    <div class="ws-review-composer-header">
      <h2>New review note</h2>
      <p class="ws-review-target-meta">${target.scope} · ${target.kind} · ${target.label}</p>
    </div>
    <label>
      <span>Title</span>
      <input name="title" type="text" placeholder="Summarize the change">
    </label>
    <label>
      <span>Category</span>
      <input name="category" type="text" value="ux">
    </label>
    <label>
      <span>Severity</span>
      <select name="severity">
        <option value="must">Must</option>
        <option value="should" selected>Should</option>
        <option value="could">Could</option>
        <option value="question">Question</option>
      </select>
    </label>
    <label>
      <span>Comment</span>
      <textarea name="body" placeholder="Describe what should change and why."></textarea>
    </label>
    <div class="ws-review-composer-actions">
      <button type="button" data-action="cancel">Cancel</button>
      <button type="button" data-action="submit" data-primary="true">Create draft</button>
    </div>
  `;

  const titleInput = composer.querySelector('input[name="title"]') as HTMLInputElement | null;
  const categoryInput = composer.querySelector('input[name="category"]') as HTMLInputElement | null;
  const severitySelect = composer.querySelector('select[name="severity"]') as HTMLSelectElement | null;
  const bodyInput = composer.querySelector('textarea[name="body"]') as HTMLTextAreaElement | null;

  composer.querySelector('[data-action="cancel"]')?.addEventListener("click", () => {
    onClose();
  });

  composer.querySelector('[data-action="submit"]')?.addEventListener("click", () => {
    const draft: ReviewDraft = {
      targetId: target.targetId,
      title: titleInput?.value.trim() || `Review ${target.label}`,
      category: categoryInput?.value.trim() || "ux",
      severity: (severitySelect?.value as ReviewDraft["severity"]) || "should",
      body: bodyInput?.value.trim() || "",
    };
    dispatch("wirespec.review.draftSubmitted", draft);
    onClose();
  });

  titleInput?.focus();

  return composer;
}

export function mountReviewOverlay(options: ReviewOverlayOptions = {}): () => void {
  ensureStyle();

  const bar = document.createElement("div");
  bar.className = "ws-review-bar";
  bar.innerHTML = `
    <button type="button" data-action="toggle" aria-pressed="${options.commentModeDefault ? "true" : "false"}">Comment mode</button>
    <span class="ws-review-hint">Alt-click targets a parent section</span>
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

  toggleButton?.addEventListener("click", () => {
    active = !active;
    syncActive();
    dispatch("wirespec.review.modeChanged", { active });
  });

  document.addEventListener("click", onDocumentClick, true);
  syncActive();

  return () => {
    closeComposer();
    document.removeEventListener("click", onDocumentClick, true);
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
