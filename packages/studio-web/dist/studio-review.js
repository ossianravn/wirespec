import {
  mountReviewRuntime,
  relinkStoreAgainstSourceMap,
  reviewCounts,
  reviewStoreToSidecar,
  sidecarToReviewStore,
} from "../../runtime/dist/index.js";
import {
  listenToBridgeEvents,
  loadReviewFromBridge,
  pingBridge,
  saveReviewToBridge,
} from "../../bridge/src/bridge-client.js";

const EMPTY_COUNTS = {
  total: 0,
  active: 0,
  resolved: 0,
  wontfix: 0,
};

function reviewErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeBridgeUrl(value) {
  const trimmed = String(value || "").trim();
  return trimmed || undefined;
}

function queueMicrotaskSafe(callback) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }
  Promise.resolve().then(callback);
}

export function studioVariantKey(scope) {
  const parts = [];
  if (scope.breakpointName && scope.breakpointName !== "desktop") {
    parts.push(scope.breakpointName);
  }
  if (scope.stateName && scope.stateName !== "base") {
    parts.push(scope.stateName);
  }
  return parts.join("+") || "base";
}

export function defaultStudioReviewPaths(sourceMap) {
  const documentId = sourceMap?.documentId || "document";
  return {
    annotationPath: `.wirespec/reviews/${documentId}.annotations.json`,
    taskPath: `.wirespec/reviews/${documentId}.agent-tasks.json`,
  };
}

function normalizeContext(options) {
  const defaults = defaultStudioReviewPaths(options.sourceMap);
  return {
    sourceMap: options.sourceMap,
    variantKey: options.variantKey || "base",
    bridgeUrl: normalizeBridgeUrl(options.bridgeUrl),
    annotationPath: String(options.annotationPath || defaults.annotationPath),
    taskPath: String(options.taskPath || defaults.taskPath),
    wireFile: options.wireFile || options.sourceMap?.entryFile,
    initialStore: options.initialStore,
  };
}

export async function createStudioReviewController(options) {
  let context = normalizeContext(options);
  let runtimeController = null;
  let bridgeSubscription = { close() {} };
  let destroyed = false;
  let suppressBridgeSync = 0;
  let latestSaveRevision = 0;
  let lastPersistedSignature = null;
  const listeners = new Set();

  let bridgeState = {
    connected: false,
    tone: "muted",
    label: context.bridgeUrl ? "Bridge checking…" : "Bridge off",
    annotationPath: context.annotationPath,
    taskPath: context.taskPath,
    lastSavedAt: undefined,
  };

  function currentStore() {
    return runtimeController?.getStore?.() ?? null;
  }

  function currentCounts() {
    const store = currentStore();
    return store ? reviewCounts(store) : EMPTY_COUNTS;
  }

  function snapshot() {
    return {
      bridge: { ...bridgeState },
      counts: currentCounts(),
      store: currentStore(),
    };
  }

  function emit() {
    const nextSnapshot = snapshot();
    listeners.forEach((listener) => listener(nextSnapshot));
  }

  function setBridgeState(patch) {
    bridgeState = {
      ...bridgeState,
      ...patch,
      annotationPath: context.annotationPath,
      taskPath: context.taskPath,
    };
    emit();
  }

  function currentSidecar() {
    const store = currentStore();
    if (!store) {
      return null;
    }
    return reviewStoreToSidecar(store, context.sourceMap, {
      wireFile: context.wireFile,
    });
  }

  function mountRuntime(initialStore) {
    suppressBridgeSync += 1;
    runtimeController = mountReviewRuntime({
      sourceMap: context.sourceMap,
      variantKey: context.variantKey,
      initialStore,
      storageKey: false,
      commentModeDefault: false,
    });
    queueMicrotaskSafe(() => {
      suppressBridgeSync = Math.max(0, suppressBridgeSync - 1);
      emit();
    });
  }

  function replaceRuntimeStore(nextStore) {
    if (!runtimeController) {
      return;
    }
    suppressBridgeSync += 1;
    runtimeController.replaceStore(nextStore);
    queueMicrotaskSafe(() => {
      suppressBridgeSync = Math.max(0, suppressBridgeSync - 1);
      emit();
    });
  }

  async function hydrateFromBridge() {
    if (!context.bridgeUrl) {
      setBridgeState({
        connected: false,
        tone: "muted",
        label: "Bridge off",
      });
      return { ok: false };
    }

    try {
      setBridgeState({
        connected: true,
        tone: "muted",
        label: "Loading review…",
      });
      const payload = await loadReviewFromBridge(context.bridgeUrl, {
        documentId: context.sourceMap.documentId,
        annotationPath: context.annotationPath,
      });
      if (payload.found && payload.sidecar) {
        replaceRuntimeStore(sidecarToReviewStore(payload.sidecar, context.sourceMap));
        lastPersistedSignature = JSON.stringify(payload.sidecar);
        setBridgeState({
          connected: true,
          tone: "good",
          label: "Review loaded",
        });
        return payload;
      }
      setBridgeState({
        connected: true,
        tone: "good",
        label: "Bridge ready",
      });
      return payload;
    } catch (error) {
      setBridgeState({
        connected: false,
        tone: "warn",
        label: reviewErrorMessage(error, "Bridge unavailable"),
      });
      return { ok: false, error };
    }
  }

  async function persistSidecar(sidecar) {
    if (!context.bridgeUrl || !sidecar) {
      setBridgeState({
        connected: false,
        tone: "muted",
        label: "Bridge off",
      });
      return null;
    }

    const signature = JSON.stringify(sidecar);
    if (signature === lastPersistedSignature) {
      return null;
    }

    const revision = ++latestSaveRevision;
    setBridgeState({
      connected: true,
      tone: "muted",
      label: "Saving review…",
    });

    try {
      const result = await saveReviewToBridge(context.bridgeUrl, {
        documentId: context.sourceMap.documentId,
        sidecar,
        sourceMap: context.sourceMap,
        wireFile: context.wireFile,
        annotationPath: context.annotationPath,
        taskPath: context.taskPath,
      });
      if (destroyed) {
        return result;
      }
      lastPersistedSignature = JSON.stringify(result.sidecar ?? sidecar);
      if (revision === latestSaveRevision && result.sidecar) {
        replaceRuntimeStore(sidecarToReviewStore(result.sidecar, context.sourceMap));
      }
      setBridgeState({
        connected: true,
        tone: "good",
        label: "Review saved",
        annotationPath: result.paths?.annotationPath || context.annotationPath,
        taskPath: result.paths?.taskPath || context.taskPath,
        lastSavedAt: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      setBridgeState({
        connected: false,
        tone: "warn",
        label: reviewErrorMessage(error, "Could not save review"),
      });
      throw error;
    }
  }

  async function connectBridge(loadInitial) {
    bridgeSubscription.close();
    bridgeSubscription = { close() {} };

    if (!context.bridgeUrl) {
      setBridgeState({
        connected: false,
        tone: "muted",
        label: "Bridge off",
      });
      return;
    }

    try {
      await pingBridge(context.bridgeUrl);
      setBridgeState({
        connected: true,
        tone: "good",
        label: "Bridge ready",
      });
      bridgeSubscription = listenToBridgeEvents(context.bridgeUrl, async (event) => {
        if (destroyed || event.documentId !== context.sourceMap.documentId) {
          return;
        }
        if (event.kind === "review-saved" || event.kind === "thread-status-updated") {
          await hydrateFromBridge();
        }
      });
      if (loadInitial) {
        await hydrateFromBridge();
      }
    } catch (error) {
      setBridgeState({
        connected: false,
        tone: "warn",
        label: reviewErrorMessage(error, "Bridge unavailable"),
      });
    }
  }

  const onStoreChanged = (event) => {
    if (destroyed || !runtimeController) {
      return;
    }
    emit();
    if (suppressBridgeSync > 0) {
      return;
    }
    const detail = event.detail;
    void persistSidecar(detail.sidecar);
  };

  window.addEventListener("wirespec.review.storeChanged", onStoreChanged);

  const initialStore = context.initialStore
    ? relinkStoreAgainstSourceMap(context.initialStore, context.sourceMap)
    : undefined;
  mountRuntime(initialStore);
  await connectBridge(!initialStore);

  return {
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => {
        listeners.delete(listener);
      };
    },
    async updateContext(nextOptions) {
      const nextContext = normalizeContext(nextOptions);
      const remoteChanged =
        context.bridgeUrl !== nextContext.bridgeUrl ||
        context.annotationPath !== nextContext.annotationPath ||
        context.taskPath !== nextContext.taskPath ||
        context.sourceMap.documentId !== nextContext.sourceMap.documentId;
      const preservedStore = currentStore()
        ? relinkStoreAgainstSourceMap(currentStore(), nextContext.sourceMap)
        : nextContext.initialStore
          ? relinkStoreAgainstSourceMap(nextContext.initialStore, nextContext.sourceMap)
          : undefined;

      runtimeController?.dispose?.();
      context = nextContext;
      if (remoteChanged) {
        lastPersistedSignature = null;
      }
      mountRuntime(preservedStore);
      if (remoteChanged) {
        await connectBridge(!nextContext.initialStore);
        return;
      }
      setBridgeState({
        annotationPath: context.annotationPath,
        taskPath: context.taskPath,
      });
    },
    async saveNow() {
      return persistSidecar(currentSidecar());
    },
    async reload() {
      return hydrateFromBridge();
    },
    openDrawer(targetId) {
      runtimeController?.openDrawer?.(targetId);
    },
    getStore() {
      return currentStore();
    },
    getSnapshot() {
      return snapshot();
    },
    dispose() {
      destroyed = true;
      bridgeSubscription.close();
      runtimeController?.dispose?.();
      window.removeEventListener("wirespec.review.storeChanged", onStoreChanged);
      listeners.clear();
    },
  };
}
