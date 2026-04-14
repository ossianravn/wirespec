import {
  AnnotationSidecar,
  AnnotationSidecarMessage,
  ReviewDraft,
  ReviewMessage,
  ReviewStore,
  ReviewThread,
  SourceMapDocument,
  SourceTarget,
  SourceSpanAnchor,
  TextQuoteAnchor,
  ThreadAnchor,
  ThreadTargetRef,
} from "./types.js";
import { resolveTarget } from "./source-map.js";
import { createEmptyReviewStore, replaceThreads } from "./review-store.js";

export interface CreateThreadOptions {
  authorId?: string;
  authorRole?: "human" | "agent" | "system";
  now?: string;
  variantKey?: string;
}

export interface SidecarOptions {
  wireFile?: string;
  astFile?: string;
  component?: string;
}

function shortId(prefix: string): string {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return `${prefix}-${globalCrypto.randomUUID().replaceAll(/-/g, "").slice(0, 12)}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}-${time}${random}`;
}

function quoteAnchor(label: string | undefined): TextQuoteAnchor | undefined {
  if (!label) {
    return undefined;
  }
  return {
    type: "text-quote",
    exact: label,
  };
}

function spanAnchor(target: SourceTarget): SourceSpanAnchor {
  return {
    type: "source-span",
    file: target.span.file,
    lineStart: target.span.lineStart,
    lineEnd: target.span.lineEnd,
    columnStart: target.span.columnStart,
    columnEnd: target.span.columnEnd,
  };
}

export function buildAnchorsForTarget(target: SourceTarget): ThreadAnchor[] {
  const anchors: ThreadAnchor[] = [];
  if (target.wireId) {
    anchors.push({
      type: "node-id",
      value: target.wireId,
    });
  }
  if (target.dom?.selector) {
    anchors.push({
      type: "selector",
      value: target.dom.selector,
    });
  }
  anchors.push(spanAnchor(target));
  const quoted = quoteAnchor(target.label ?? target.signature?.text);
  if (quoted) {
    anchors.push(quoted);
  }
  return anchors;
}

function targetRefForTarget(
  target: SourceTarget,
  variantKey?: string,
): ThreadTargetRef {
  return {
    targetId: target.targetId,
    screenId: target.screenId,
    scope: target.scope,
    wireId: target.wireId,
    variantKey,
    anchors: buildAnchorsForTarget(target),
  };
}

function latestMessageBody(thread: ReviewThread): string {
  return thread.messages[thread.messages.length - 1]?.body ?? "";
}

export function createReviewThreadFromDraft(
  draft: ReviewDraft,
  sourceMap: SourceMapDocument,
  options: CreateThreadOptions = {},
): ReviewThread {
  const target =
    sourceMap.targets.find((entry) => entry.targetId === draft.targetId) ??
    sourceMap.targets[0];

  if (!target) {
    throw new Error(`Cannot create a review thread because target ${draft.targetId} was not found.`);
  }

  const now = options.now ?? new Date().toISOString();
  const severity = draft.severity;
  const motivation =
    draft.motivation ??
    (severity === "question" ? "question" : severity === "must" ? "blocking" : "change-request");

  return {
    id: shortId("ann"),
    title: draft.title,
    status: "open",
    severity,
    motivation,
    category: draft.category.trim() || "ux",
    taxonomy: draft.taxonomy,
    target: targetRefForTarget(target, options.variantKey),
    messages: [
      {
        messageId: shortId("msg"),
        authorId: options.authorId ?? "reviewer",
        authorRole: options.authorRole ?? "human",
        body: draft.body.trim(),
        createdAt: now,
        kind: "comment",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function toSidecarMessage(message: ReviewMessage): AnnotationSidecarMessage {
  return {
    id: message.messageId,
    author: message.authorId,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt,
  };
}

function toReviewMessage(message: AnnotationSidecarMessage): ReviewMessage {
  return {
    messageId: message.id,
    authorId: message.author,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt,
    kind: "comment",
  };
}

export function reviewStoreToSidecar(
  store: ReviewStore,
  sourceMap: SourceMapDocument,
  options: SidecarOptions = {},
): AnnotationSidecar {
  return {
    schemaVersion: "0.2.0",
    documentId: store.documentId,
    source: {
      wireFile: options.wireFile ?? sourceMap.entryFile,
      astFile: options.astFile,
      component: options.component,
    },
    threads: store.threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      status: thread.status,
      severity: thread.severity,
      motivation: thread.motivation,
      category: thread.category,
      taxonomy: thread.taxonomy,
      orphaned: thread.orphaned,
      target: {
        ...thread.target,
        anchors: thread.target.anchors ?? [],
      },
      messages: thread.messages.map(toSidecarMessage),
      suggestedOps: thread.suggestedOps,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      resolutionNote: thread.resolutionNote,
    })),
  };
}

export function sidecarToReviewStore(
  sidecar: AnnotationSidecar,
  sourceMap?: SourceMapDocument,
): ReviewStore {
  const fallbackScreenId =
    sourceMap?.targets.find((target) => target.scope === "screen")?.screenId ??
    sourceMap?.documentId ??
    "screen";
  const store = createEmptyReviewStore(sidecar.documentId, fallbackScreenId);
  const threads = sidecar.threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    status: thread.status,
    severity: thread.severity,
    motivation: thread.motivation,
    category: thread.category,
    taxonomy: thread.taxonomy,
    target: {
      ...thread.target,
      anchors: thread.target.anchors ?? [],
    },
    messages: thread.messages.map(toReviewMessage),
    suggestedOps: thread.suggestedOps,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    orphaned: thread.orphaned,
    resolutionNote: thread.resolutionNote,
  }));
  const hydrated = replaceThreads(store, threads);
  return sourceMap ? relinkStoreAgainstSourceMap(hydrated, sourceMap) : hydrated;
}

function lineDistance(anchor: SourceSpanAnchor, target: SourceTarget): number {
  const start = target.span.lineStart;
  if (anchor.lineStart <= start && start <= anchor.lineEnd) {
    return 0;
  }
  return Math.min(
    Math.abs(anchor.lineStart - start),
    Math.abs(anchor.lineEnd - start),
  );
}

function matchByAnchors(
  sourceMap: SourceMapDocument,
  ref: ThreadTargetRef,
): SourceTarget | undefined {
  const anchors = ref.anchors ?? [];

  for (const anchor of anchors) {
    if (anchor.type === "node-id") {
      const direct = sourceMap.targets.find(
        (target) => target.wireId === anchor.value || target.targetId === `node:${anchor.value}`,
      );
      if (direct) {
        return direct;
      }
    }
  }

  for (const anchor of anchors) {
    if (anchor.type === "selector") {
      const direct = sourceMap.targets.find((target) => target.dom?.selector === anchor.value);
      if (direct) {
        return direct;
      }
    }
  }

  const spanAnchors = anchors.filter(
    (anchor): anchor is SourceSpanAnchor => anchor.type === "source-span",
  );
  if (spanAnchors.length > 0) {
    const candidates = sourceMap.targets.filter((target) =>
      spanAnchors.some((anchor) => anchor.file === target.span.file),
    );
    candidates.sort((left, right) => {
      const leftDistance = Math.min(...spanAnchors.map((anchor) => lineDistance(anchor, left)));
      const rightDistance = Math.min(...spanAnchors.map((anchor) => lineDistance(anchor, right)));
      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }
      return left.targetId.localeCompare(right.targetId);
    });
    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  for (const anchor of anchors) {
    if (anchor.type === "text-quote") {
      const direct = sourceMap.targets.find(
        (target) => target.label === anchor.exact || target.signature?.text === anchor.exact,
      );
      if (direct) {
        return direct;
      }
    }
  }

  return undefined;
}

export function relinkStoreAgainstSourceMap(
  store: ReviewStore,
  sourceMap: SourceMapDocument,
): ReviewStore {
  const threads = store.threads.map((thread) => {
    const resolution = resolveTarget(sourceMap, thread.target);
    if (resolution.target) {
      return {
        ...thread,
        orphaned: resolution.status === "orphaned" ? true : false,
        target: targetRefForTarget(resolution.target, thread.target.variantKey),
      };
    }

    const matchedByAnchor = matchByAnchors(sourceMap, thread.target);
    if (matchedByAnchor) {
      return {
        ...thread,
        orphaned: false,
        target: targetRefForTarget(matchedByAnchor, thread.target.variantKey),
      };
    }

    return {
      ...thread,
      orphaned: true,
      target: {
        ...thread.target,
        anchors: thread.target.anchors ?? [],
      },
    };
  });

  return replaceThreads(
    {
      ...store,
      documentId: sourceMap.documentId,
      screenId:
        sourceMap.targets.find((target) => target.scope === "screen")?.screenId ?? store.screenId,
    },
    threads,
  );
}

export function summarizeThread(thread: ReviewThread): string {
  return thread.title?.trim() || latestMessageBody(thread) || thread.target.targetId;
}
