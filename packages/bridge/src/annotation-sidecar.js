import { createEmptyReviewStore, replaceThreads } from "./review-store.js";
import { nowIso, shortId, textQuoteForTarget } from "./browser-shared.js";
import reviewContract from "../../review-contract/index.js";

const { ANNOTATION_SIDECAR_SCHEMA_VERSION } = reviewContract;

function spanAnchor(target) {
  return {
    type: "source-span",
    file: target.span.file,
    lineStart: target.span.lineStart,
    lineEnd: target.span.lineEnd,
    columnStart: target.span.columnStart,
    columnEnd: target.span.columnEnd,
  };
}

export function buildAnchorsForTarget(target) {
  const anchors = [];
  if (target.wireId) {
    anchors.push({ type: "node-id", value: target.wireId });
  }
  if (target.dom?.selector) {
    anchors.push({ type: "selector", value: target.dom.selector });
  }
  if (target.span) {
    anchors.push(spanAnchor(target));
  }
  const textQuote = textQuoteForTarget(target);
  if (textQuote) {
    anchors.push({ type: "text-quote", exact: textQuote });
  }
  return anchors;
}

function anchorKey(anchor) {
  return JSON.stringify(anchor);
}

function preservedImplementationAnchors(existingAnchors, target) {
  return (existingAnchors || []).filter((anchor) => {
    if (anchor.type === "source-span") {
      return anchor.file !== target.span?.file;
    }
    return anchor.type === "render-region";
  });
}

function targetRefForSourceTarget(target, variantKey, existingAnchors = []) {
  const anchors = [];
  const seen = new Set();
  for (const anchor of [...preservedImplementationAnchors(existingAnchors, target), ...buildAnchorsForTarget(target)]) {
    const key = anchorKey(anchor);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    anchors.push(anchor);
  }

  return {
    targetId: target.targetId,
    screenId: target.screenId,
    scope: target.scope,
    wireId: target.wireId,
    variantKey,
    anchors,
  };
}

export function createReviewThreadFromDraft(draft, sourceMap, options = {}) {
  const target = sourceMap.targets.find((entry) => entry.targetId === draft.targetId);
  if (!target) {
    throw new Error(`Target ${draft.targetId} was not found in the source map.`);
  }

  const now = options.now || nowIso();
  const severity = draft.severity || "should";
  const motivation =
    draft.motivation ||
    (severity === "question" ? "question" : severity === "must" ? "blocking" : "change-request");

  return {
    id: shortId("ann"),
    title: draft.title?.trim() || `Review ${target.label || target.wireId || target.kind}`,
    status: "open",
    severity,
    motivation,
    category: draft.category?.trim() || "ux",
    taxonomy: Array.isArray(draft.taxonomy) ? draft.taxonomy : [],
    target: targetRefForSourceTarget(target, options.variantKey),
    messages: [
      {
        messageId: shortId("msg"),
        authorId: options.authorId || "reviewer",
        authorRole: options.authorRole || "human",
        body: String(draft.body || "").trim(),
        createdAt: now,
        kind: "comment",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeMessageForSidecar(message) {
  return {
    id: message.messageId,
    author: message.authorId,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt,
  };
}

function normalizeMessageForStore(message) {
  return {
    messageId: message.id,
    authorId: message.author,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt,
    kind: "comment",
  };
}

export function reviewStoreToSidecar(store, options = {}) {
  return {
    schemaVersion: ANNOTATION_SIDECAR_SCHEMA_VERSION,
    documentId: store.documentId,
    source: {
      ...(options.wireFile ? { wireFile: options.wireFile } : {}),
      ...(options.astFile ? { astFile: options.astFile } : {}),
      ...(options.component ? { component: options.component } : {}),
    },
    threads: store.threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      status: thread.status,
      severity: thread.severity,
      motivation: thread.motivation,
      category: thread.category,
      ...(thread.taxonomy?.length ? { taxonomy: thread.taxonomy } : {}),
      ...(thread.resolutionNote ? { resolutionNote: thread.resolutionNote } : {}),
      target: {
        targetId: thread.target.targetId,
        screenId: thread.target.screenId,
        scope: thread.target.scope,
        ...(thread.target.wireId ? { wireId: thread.target.wireId } : {}),
        ...(thread.target.variantKey ? { variantKey: thread.target.variantKey } : {}),
        anchors: thread.target.anchors || [],
      },
      messages: thread.messages.map(normalizeMessageForSidecar),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    })),
  };
}

export function sidecarToReviewStore(sidecar) {
  const store = createEmptyReviewStore(sidecar.documentId);
  return replaceThreads(
    store,
    (sidecar.threads || []).map((thread) => ({
      id: thread.id,
      title: thread.title,
      status: thread.status,
      severity: thread.severity,
      motivation: thread.motivation,
      category: thread.category,
      taxonomy: thread.taxonomy || [],
      resolutionNote: thread.resolutionNote,
      target: {
        targetId: thread.target.targetId,
        screenId: thread.target.screenId,
        scope: thread.target.scope,
        wireId: thread.target.wireId,
        variantKey: thread.target.variantKey,
        anchors: thread.target.anchors || [],
      },
      messages: (thread.messages || []).map(normalizeMessageForStore),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    })),
  );
}

function byNodeId(sourceMap, value) {
  return sourceMap.targets.find((target) => target.wireId && target.wireId === value);
}

function bySelector(sourceMap, value) {
  return sourceMap.targets.find((target) => target.dom?.selector === value);
}

function byTextQuote(sourceMap, exact) {
  return sourceMap.targets.find(
    (target) => (target.label && target.label === exact) || (target.signature?.text && target.signature.text === exact),
  );
}

function bySourceSpan(sourceMap, anchor) {
  return sourceMap.targets.find((target) => {
    const span = target.span;
    return (
      span &&
      span.file === anchor.file &&
      span.lineStart === anchor.lineStart &&
      span.lineEnd === anchor.lineEnd &&
      span.columnStart === anchor.columnStart &&
      span.columnEnd === anchor.columnEnd
    );
  });
}

export function relinkThreadAgainstSourceMap(thread, sourceMap) {
  const direct = sourceMap.targets.find((target) => target.targetId === thread.target.targetId);
  if (direct) {
    return {
      ...thread,
      orphaned: false,
      target: targetRefForSourceTarget(direct, thread.target.variantKey, thread.target.anchors),
    };
  }

  for (const anchor of thread.target.anchors || []) {
    const match =
      anchor.type === "node-id"
        ? byNodeId(sourceMap, anchor.value)
        : anchor.type === "selector"
          ? bySelector(sourceMap, anchor.value)
          : anchor.type === "text-quote"
            ? byTextQuote(sourceMap, anchor.exact)
            : anchor.type === "source-span"
              ? bySourceSpan(sourceMap, anchor)
              : undefined;

    if (match) {
      return {
        ...thread,
        orphaned: false,
        target: targetRefForSourceTarget(match, thread.target.variantKey, thread.target.anchors),
      };
    }
  }

  return {
    ...thread,
    orphaned: true,
  };
}

export function relinkStoreAgainstSourceMap(store, sourceMap) {
  return replaceThreads(
    store,
    store.threads.map((thread) => relinkThreadAgainstSourceMap(thread, sourceMap)),
  );
}

export function latestMessageBody(thread) {
  return thread.messages[thread.messages.length - 1]?.body || "";
}
