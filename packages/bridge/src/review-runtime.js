import {
  createReviewThreadFromDraft,
  reviewStoreToSidecar,
  sidecarToReviewStore,
} from "./annotation-sidecar.js";
import { saveReviewToBridge, loadReviewFromBridge, pingBridge, updateReviewStatusInBridge, listenToBridgeEvents } from "./bridge-client.js";
import { mountReviewOverlay } from "./review-overlay.js";
import { addThread, createEmptyReviewStore, updateThreadStatus } from "./review-store.js";

export async function createReviewRuntime(options) {
  let store = options.initialSidecar
    ? sidecarToReviewStore(options.initialSidecar)
    : createEmptyReviewStore(options.documentId || options.sourceMap?.documentId);

  const bridgeState = {
    connected: false,
    label: options.bridgeUrl ? "bridge checking…" : "bridge off",
    tone: "muted",
  };

  const overlay = mountReviewOverlay({
    sourceMap: options.sourceMap,
    commentModeDefault: options.commentModeDefault,
    getThreads: () => store.threads,
    async onDraftSubmitted(draft) {
      const thread = createReviewThreadFromDraft(draft, options.sourceMap, {
        authorId: options.authorId || "reviewer",
        authorRole: "human",
        variantKey: options.variantKey,
      });
      store = addThread(store, thread);
      overlay.setThreads(store.threads);
    },
    async onSaveRequested() {
      return save();
    },
    async onStatusChange(change) {
      store = updateThreadStatus(store, change.threadId, change.status);
      overlay.setThreads(store.threads);
      if (options.bridgeUrl) {
        try {
          const result = await updateReviewStatusInBridge(options.bridgeUrl, {
            documentId: store.documentId,
            threadId: change.threadId,
            status: change.status,
            annotationPath: options.annotationPath,
            sourceMap: options.sourceMap,
          });
          if (result.sidecar) {
            store = sidecarToReviewStore(result.sidecar);
            overlay.setThreads(store.threads);
          }
          overlay.flashMessage(`Saved ${result.paths.annotationPath}`);
        } catch (error) {
          overlay.flashMessage(error instanceof Error ? error.message : "Could not sync status.");
        }
      }
    },
  });

  async function loadFromBridge() {
    if (!options.bridgeUrl) {
      return null;
    }
    const payload = await loadReviewFromBridge(options.bridgeUrl, {
      documentId: store.documentId,
      annotationPath: options.annotationPath,
    });
    if (payload.found && payload.sidecar) {
      store = sidecarToReviewStore(payload.sidecar);
      overlay.setThreads(store.threads);
      overlay.flashMessage(`Loaded ${payload.paths.annotationPath}`);
      return payload;
    }
    return payload;
  }

  async function save() {
    const sidecar = reviewStoreToSidecar(store, {
      wireFile: options.wireFile || options.sourceMap?.entryFile,
      component: options.componentFile,
      astFile: options.astFile,
    });

    if (!options.bridgeUrl) {
      overlay.flashMessage("Bridge off");
      return {
        ok: false,
      };
    }

    const result = await saveReviewToBridge(options.bridgeUrl, {
      documentId: store.documentId,
      sidecar,
      sourceMap: options.sourceMap,
      wireFile: options.wireFile || options.sourceMap?.entryFile,
      componentFile: options.componentFile,
      astFile: options.astFile,
      annotationPath: options.annotationPath,
      taskPath: options.taskPath,
    });
    store = sidecarToReviewStore(result.sidecar);
    overlay.setThreads(store.threads);
    overlay.flashMessage(`Saved ${result.paths.annotationPath}`);
    return result;
  }

  let bridgeSubscription = { close() {} };

  if (options.bridgeUrl) {
    try {
      await pingBridge(options.bridgeUrl);
      bridgeState.connected = true;
      bridgeState.label = "bridge ready";
      bridgeState.tone = "good";
      overlay.setBridgeState(bridgeState);
      await loadFromBridge();
      bridgeSubscription = listenToBridgeEvents(options.bridgeUrl, async (event) => {
        if (event.documentId !== store.documentId) {
          return;
        }
        if (event.kind === "review-saved" || event.kind === "thread-status-updated") {
          await loadFromBridge();
        }
      });
    } catch {
      bridgeState.connected = false;
      bridgeState.label = "bridge unavailable";
      bridgeState.tone = "warn";
      overlay.setBridgeState(bridgeState);
    }
  } else {
    overlay.setBridgeState(bridgeState);
  }

  return {
    getStore() {
      return store;
    },
    async save() {
      return save();
    },
    async load() {
      return loadFromBridge();
    },
    dispose() {
      bridgeSubscription.close();
      overlay.dispose();
    },
  };
}
