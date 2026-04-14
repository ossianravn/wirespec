import { createReviewThreadFromDraft, relinkStoreAgainstSourceMap, reviewStoreToSidecar, sidecarToReviewStore, } from "./annotation-sidecar.js";
import { buildEditorOpenRequest } from "./editor-links.js";
import { mountReviewOverlay } from "./review-overlay.js";
import { addThread, activeThreadCount, createEmptyReviewStore, reviewCounts, updateThreadStatus, } from "./review-store.js";
import { exportAgentTasks } from "./task-export.js";
import reviewContract from "../../review-contract/browser.mjs";
const { REVIEW_UI_COPY, isClosedReviewStatus, reviewCountSummary, reviewPinTitle, reviewScopeLabel, reviewThreadActionButtonHtml, reviewThreadActionLinkHtml, reviewThreadCardHtml, reviewThreadStatusAction, reviewThreadSummary, reviewThreadsButtonLabel, reviewVariantPillHtml, } = reviewContract;
const runtimeCss = `
.ws-review-drawer,
.ws-review-drawer *,
.ws-review-pin {
  box-sizing: border-box;
}
.ws-review-drawer {
  position: fixed;
  top: 64px;
  right: 16px;
  bottom: 16px;
  width: min(420px, calc(100vw - 32px));
  z-index: 10001;
  display: none;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(17,17,17,0.12);
  color: #111;
  overflow: hidden;
  font: 400 14px/1.45 ui-sans-serif, system-ui, sans-serif;
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
  border-bottom: 0;
  border-top: 1px solid rgba(17,17,17,0.08);
}
.ws-review-drawer-title-row,
.ws-review-drawer-filter,
.ws-review-export-actions,
.ws-review-thread-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.ws-review-drawer-title-row {
  justify-content: space-between;
}
.ws-review-drawer-title {
  margin: 0;
  font-size: 17px;
  line-height: 1.25;
  font-weight: 650;
}
.ws-review-drawer-meta,
.ws-review-thread-meta,
.ws-review-thread-target,
.ws-review-empty,
.ws-review-thread-orphaned {
  color: rgba(17,17,17,0.68);
}
.ws-review-drawer-header p,
.ws-review-thread-card p,
.ws-review-thread-card h3 {
  margin: 0;
}
.ws-review-drawer-body {
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.ws-review-thread-card {
  border-bottom: 1px solid rgba(17,17,17,0.08);
  padding: 14px 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.ws-review-thread-card:last-child {
  border-bottom: 0;
}
.ws-review-thread-card[data-orphaned="true"] {
  background: #fafafa;
  border-style: dashed;
}
.ws-review-thread-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}
.ws-review-thread-title {
  font-size: 14px;
  line-height: 1.35;
  font-weight: 650;
}
.ws-review-pill,
.ws-review-severity-pill,
.ws-review-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 7px;
  border-radius: 6px;
  border: 1px solid rgba(17,17,17,0.12);
  background: #f7f7f7;
  color: rgba(17,17,17,0.78);
  white-space: nowrap;
  font-size: 12px;
  line-height: 1;
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
.ws-review-drawer button,
.ws-review-drawer a,
.ws-review-bar [data-ws-review-runtime-button] {
  appearance: none;
  border: 1px solid rgba(17,17,17,0.16);
  background: #fff;
  color: #111;
  border-radius: 6px;
  min-height: 32px;
  padding: 0 10px;
  font: 500 13px/1 ui-sans-serif, system-ui, sans-serif;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.ws-review-drawer button:hover,
.ws-review-drawer a:hover,
.ws-review-bar [data-ws-review-runtime-button]:hover {
  border-color: rgba(17,17,17,0.32);
  background: #f7f7f7;
}
.ws-review-drawer button:focus-visible,
.ws-review-drawer a:focus-visible,
.ws-review-bar [data-ws-review-runtime-button]:focus-visible {
  outline: 2px solid rgba(17,17,17,0.70);
  outline-offset: 2px;
}
.ws-review-drawer button[data-primary="true"] {
  background: #111;
  border-color: #111;
  color: #fff;
}
.ws-review-filter-chip[aria-pressed="true"] {
  border-color: rgba(17,17,17,0.40);
  background: #eeeeee;
  color: #111;
}
.ws-review-pin {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  min-width: 20px;
  min-height: 20px;
  padding: 0 5px;
  border: 1px solid rgba(17,17,17,0.12);
  border-radius: 10px;
  background: #111;
  color: #fff;
  font: 650 11px/1 ui-sans-serif, system-ui, sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ws-review-target-highlight {
  outline: 2px solid rgba(17,17,17,0.45) !important;
  outline-offset: 4px !important;
}
@media (max-width: 767px) {
  .ws-review-drawer {
    inset: 72px 8px 8px 8px;
    width: auto;
    max-height: none;
  }
  .ws-review-thread-head {
    display: block;
  }
}
`;
function ensureRuntimeStyle() {
    if (document.getElementById("ws-review-runtime-style")) {
        return;
    }
    const style = document.createElement("style");
    style.id = "ws-review-runtime-style";
    style.textContent = runtimeCss;
    document.head.append(style);
}
function storageFor(key) {
    if (!key) {
        return null;
    }
    try {
        return window.localStorage;
    }
    catch {
        return null;
    }
}
function makeButton(label) {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = label;
    return element;
}
function selectorForTarget(targetId) {
    const safe = targetId.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    return `[data-ws-target="${safe}"]`;
}
function downloadJson(filename, payload) {
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
        type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 0);
}
function editorUri(sourceMap, thread, workspaceRoot) {
    const target = sourceMap.targets.find((entry) => entry.targetId === thread.target.targetId);
    if (!target) {
        return undefined;
    }
    return buildEditorOpenRequest(target.span, workspaceRoot).location.uri;
}
function labelForTarget(sourceMap, targetId) {
    const target = sourceMap.targets.find((entry) => entry.targetId === targetId);
    return target?.label ?? target?.wireId ?? target?.kind ?? targetId;
}
export function mountReviewRuntime(options) {
    ensureRuntimeStyle();
    const variantKey = options.variantKey ?? "base";
    const storageKey = options.storageKey === false
        ? false
        : options.storageKey ?? `wirespec.review.${options.sourceMap.documentId}`;
    const storage = storageFor(storageKey);
    const screenId = options.sourceMap.targets.find((target) => target.scope === "screen")?.screenId ??
        options.sourceMap.documentId;
    const readInitialStore = () => {
        if (storage && storageKey) {
            try {
                const raw = storage.getItem(storageKey);
                if (raw) {
                    return sidecarToReviewStore(JSON.parse(raw), options.sourceMap);
                }
            }
            catch {
                // ignore invalid persisted data
            }
        }
        if (options.initialSidecar) {
            return sidecarToReviewStore(options.initialSidecar, options.sourceMap);
        }
        if (options.initialStore) {
            return relinkStoreAgainstSourceMap(options.initialStore, options.sourceMap);
        }
        return createEmptyReviewStore(options.sourceMap.documentId, screenId);
    };
    let store = readInitialStore();
    let filterTargetId;
    let showClosed = false;
    let drawerOpen = false;
    let highlightedElement = null;
    const cleanupOverlay = mountReviewOverlay({
        sourceMap: options.sourceMap,
        commentModeDefault: options.commentModeDefault,
    });
    const bar = document.querySelector(".ws-review-bar");
    const actionSlot = bar?.querySelector("[data-ws-review-bar-actions]");
    const threadsButton = makeButton(reviewThreadsButtonLabel(activeThreadCount(store)));
    threadsButton.setAttribute("data-ws-review-runtime-button", "threads");
    threadsButton.setAttribute("aria-expanded", "false");
    actionSlot?.append(threadsButton);
    const drawer = document.createElement("aside");
    drawer.className = "ws-review-drawer";
    drawer.setAttribute("aria-label", REVIEW_UI_COPY.drawerLabel);
    drawer.innerHTML = `
    <div class="ws-review-drawer-header">
      <div class="ws-review-drawer-title-row">
        <div>
          <h2 class="ws-review-drawer-title">${REVIEW_UI_COPY.drawerTitle}</h2>
          <p class="ws-review-drawer-meta" data-role="meta"></p>
        </div>
        <button type="button" data-action="close">${REVIEW_UI_COPY.close}</button>
      </div>
      <div class="ws-review-drawer-filter">
        <button type="button" class="ws-review-filter-chip" data-filter="active" aria-pressed="true">${REVIEW_UI_COPY.activeFilter}</button>
        <button type="button" class="ws-review-filter-chip" data-filter="all" aria-pressed="false">${REVIEW_UI_COPY.allFilter}</button>
        <span class="ws-review-drawer-meta" data-role="filter-target"></span>
      </div>
    </div>
    <div class="ws-review-drawer-body" data-role="body"></div>
    <div class="ws-review-drawer-footer">
      <div class="ws-review-export-actions">
        <button type="button" data-action="export-annotations" data-primary="true">${REVIEW_UI_COPY.exportAnnotations}</button>
        <button type="button" data-action="export-tasks">${REVIEW_UI_COPY.exportTasks}</button>
        <button type="button" data-action="import">${REVIEW_UI_COPY.importAnnotations}</button>
        <button type="button" data-action="clear-local">${REVIEW_UI_COPY.resetLocal}</button>
      </div>
    </div>
  `;
    document.body.append(drawer);
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "application/json";
    importInput.hidden = true;
    document.body.append(importInput);
    const metaNode = drawer.querySelector('[data-role="meta"]');
    const filterNode = drawer.querySelector('[data-role="filter-target"]');
    const bodyNode = drawer.querySelector('[data-role="body"]');
    const closeButton = drawer.querySelector('[data-action="close"]');
    const activeFilterButton = drawer.querySelector('[data-filter="active"]');
    const allFilterButton = drawer.querySelector('[data-filter="all"]');
    const sidecar = () => reviewStoreToSidecar(store, options.sourceMap, {
        wireFile: options.sourceMap.entryFile,
    });
    const tasks = () => exportAgentTasks(store, options.sourceMap, {
        workspaceRoot: options.workspaceRoot,
    });
    const persist = () => {
        if (storage && storageKey) {
            storage.setItem(storageKey, JSON.stringify(sidecar()));
        }
        window.dispatchEvent(new CustomEvent("wirespec.review.storeChanged", {
            detail: {
                store,
                sidecar: sidecar(),
                tasks: tasks(),
            },
        }));
    };
    const setStore = (nextStore) => {
        store = relinkStoreAgainstSourceMap(nextStore, options.sourceMap);
        render();
        persist();
    };
    const focusTarget = (targetId) => {
        highlightedElement?.classList.remove("ws-review-target-highlight");
        const target = document.querySelector(selectorForTarget(targetId));
        if (!target) {
            highlightedElement = null;
            return;
        }
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        target.classList.add("ws-review-target-highlight");
        highlightedElement = target;
        window.setTimeout(() => {
            target.classList.remove("ws-review-target-highlight");
            if (highlightedElement === target) {
                highlightedElement = null;
            }
        }, 1200);
    };
    const currentThreads = () => store.threads.filter((thread) => {
        if (filterTargetId && thread.target.targetId !== filterTargetId) {
            return false;
        }
        if (!showClosed && isClosedReviewStatus(thread.status)) {
            return false;
        }
        return true;
    });
    const renderThreadCard = (thread) => {
        const uri = editorUri(options.sourceMap, thread, options.workspaceRoot);
        const targetLabel = labelForTarget(options.sourceMap, thread.target.targetId);
        const orphaned = thread.orphaned
            ? `<p class="ws-review-thread-orphaned">Target needs relinking.</p>`
            : "";
        const statusAction = reviewThreadStatusAction(thread.status);
        return reviewThreadCardHtml({
            thread,
            articleClass: "ws-review-thread-card",
            dataOrphaned: Boolean(thread.orphaned),
            title: reviewThreadSummary(thread),
            titleClass: "ws-review-thread-title",
            targetMeta: `${reviewScopeLabel(thread.target.scope)} · ${targetLabel}`,
            targetClass: "ws-review-thread-target",
            topMetaClass: "ws-review-thread-meta",
            severityClass: "ws-review-severity-pill",
            statusContainerClass: "ws-review-thread-meta",
            statusClass: "ws-review-status-pill",
            variantHtml: reviewVariantPillHtml(thread.target.variantKey, "ws-review-pill"),
            trailingHtml: orphaned,
            actionsClass: "ws-review-thread-actions",
            actionsHtml: `
          ${reviewThreadActionButtonHtml({
                action: "focus-target",
                threadId: thread.id,
                label: REVIEW_UI_COPY.focusTarget,
            })}
          ${reviewThreadActionLinkHtml({ href: uri, label: REVIEW_UI_COPY.openSource })}
          ${reviewThreadActionButtonHtml({
                action: "toggle-status",
                threadId: thread.id,
                label: statusAction.label,
            })}
        `,
        });
    };
    const renderDrawer = () => {
        if (!metaNode || !filterNode || !bodyNode || !activeFilterButton || !allFilterButton) {
            return;
        }
        const counts = reviewCounts(store);
        metaNode.textContent = reviewCountSummary(counts);
        filterNode.textContent = filterTargetId
            ? `Filtered to ${labelForTarget(options.sourceMap, filterTargetId)}`
            : "";
        activeFilterButton.setAttribute("aria-pressed", showClosed ? "false" : "true");
        allFilterButton.setAttribute("aria-pressed", showClosed ? "true" : "false");
        const entries = currentThreads();
        bodyNode.innerHTML = entries.length
            ? entries.map(renderThreadCard).join("")
            : `<p class="ws-review-empty">${REVIEW_UI_COPY.emptyThreads}</p>`;
    };
    const clearPins = () => {
        document.querySelectorAll(".ws-review-pin").forEach((node) => node.remove());
    };
    const renderPins = () => {
        clearPins();
        const counts = new Map();
        for (const thread of store.threads) {
            if (isClosedReviewStatus(thread.status)) {
                continue;
            }
            const previous = counts.get(thread.target.targetId) ?? 0;
            counts.set(thread.target.targetId, previous + 1);
        }
        for (const [targetId, count] of counts.entries()) {
            const target = document.querySelector(selectorForTarget(targetId));
            if (!target) {
                continue;
            }
            const pin = makeButton(String(count));
            pin.className = "ws-review-pin";
            pin.title = reviewPinTitle(count);
            pin.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                controller.openDrawer(targetId);
                focusTarget(targetId);
            });
            target.append(pin);
        }
    };
    const render = () => {
        threadsButton.textContent = reviewThreadsButtonLabel(activeThreadCount(store));
        threadsButton.setAttribute("aria-expanded", drawerOpen ? "true" : "false");
        drawer.classList.toggle("is-open", drawerOpen);
        renderDrawer();
        renderPins();
    };
    const onDraftSubmitted = (event) => {
        const detail = event.detail;
        const thread = createReviewThreadFromDraft(detail, options.sourceMap, {
            authorId: options.authorId,
            authorRole: options.authorRole,
            variantKey,
        });
        setStore(addThread(store, thread));
        controller.openDrawer(detail.targetId);
        focusTarget(detail.targetId);
    };
    const onDrawerBodyClick = (event) => {
        const rawTarget = event.target instanceof HTMLElement ? event.target : null;
        const action = rawTarget?.getAttribute("data-action");
        const threadId = rawTarget?.getAttribute("data-thread-id");
        if (!action || !threadId) {
            return;
        }
        const thread = store.threads.find((entry) => entry.id === threadId);
        if (!thread) {
            return;
        }
        if (action === "focus-target") {
            focusTarget(thread.target.targetId);
            return;
        }
        if (action === "toggle-status") {
            setStore(updateThreadStatus(store, thread.id, reviewThreadStatusAction(thread.status).nextStatus));
        }
    };
    const onImportChange = async () => {
        const file = importInput.files?.[0];
        if (!file) {
            return;
        }
        try {
            const parsed = JSON.parse(await file.text());
            setStore(sidecarToReviewStore(parsed, options.sourceMap));
            drawerOpen = true;
            render();
        }
        catch {
            // ignore invalid imports in the reference runtime
        }
        finally {
            importInput.value = "";
        }
    };
    const onDrawerClick = (event) => {
        const rawTarget = event.target instanceof HTMLElement ? event.target : null;
        const action = rawTarget?.getAttribute("data-action");
        if (!action) {
            return;
        }
        if (action === "close") {
            controller.closeDrawer();
            return;
        }
        if (action === "export-annotations") {
            downloadJson(`${options.sourceMap.documentId}.annotations.json`, sidecar());
            return;
        }
        if (action === "export-tasks") {
            downloadJson(`${options.sourceMap.documentId}.agent-tasks.json`, tasks());
            return;
        }
        if (action === "import") {
            importInput.click();
            return;
        }
        if (action === "clear-local") {
            if (storage && storageKey) {
                storage.removeItem(storageKey);
            }
            setStore(createEmptyReviewStore(options.sourceMap.documentId, screenId));
        }
    };
    const onTargetSelected = () => {
        drawerOpen = false;
        render();
    };
    threadsButton.addEventListener("click", () => {
        drawerOpen = !drawerOpen;
        if (drawerOpen && !filterTargetId) {
            filterTargetId = undefined;
        }
        render();
    });
    closeButton?.addEventListener("click", () => controller.closeDrawer());
    activeFilterButton?.addEventListener("click", () => {
        showClosed = false;
        render();
    });
    allFilterButton?.addEventListener("click", () => {
        showClosed = true;
        render();
    });
    bodyNode?.addEventListener("click", onDrawerBodyClick);
    drawer.addEventListener("click", onDrawerClick);
    const onImportInputChange = () => {
        void onImportChange();
    };
    const onKeydown = (event) => {
        if (event.key === "Escape" && drawerOpen) {
            controller.closeDrawer();
        }
    };
    importInput.addEventListener("change", onImportInputChange);
    window.addEventListener("wirespec.review.draftSubmitted", onDraftSubmitted);
    window.addEventListener("wirespec.review.targetSelected", onTargetSelected);
    document.addEventListener("keydown", onKeydown);
    const controller = {
        dispose: () => {
            cleanupOverlay();
            clearPins();
            drawer.remove();
            importInput.remove();
            threadsButton.remove();
            bodyNode?.removeEventListener("click", onDrawerBodyClick);
            drawer.removeEventListener("click", onDrawerClick);
            importInput.removeEventListener("change", onImportInputChange);
            window.removeEventListener("wirespec.review.draftSubmitted", onDraftSubmitted);
            window.removeEventListener("wirespec.review.targetSelected", onTargetSelected);
            document.removeEventListener("keydown", onKeydown);
            const runtimeWindow = window;
            if (runtimeWindow.__WIRESPEC_REVIEW__ === controller) {
                delete runtimeWindow.__WIRESPEC_REVIEW__;
            }
        },
        getStore: () => store,
        getSidecar: () => sidecar(),
        getAgentTasks: () => tasks(),
        openDrawer: (targetId) => {
            filterTargetId = targetId;
            drawerOpen = true;
            render();
        },
        closeDrawer: () => {
            drawerOpen = false;
            render();
        },
        replaceStore: (nextStore) => {
            setStore(nextStore);
        },
    };
    const runtimeWindow = window;
    runtimeWindow.__WIRESPEC_REVIEW__ = controller;
    render();
    persist();
    return controller;
}
