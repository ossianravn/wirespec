import { EventEmitter } from "node:events";
import { appendFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  safePathUnderRoot,
  sanitizeDocumentId,
  writeJsonFile,
  readJsonFile,
  shortId,
  nowIso,
} from "./shared.js";
import {
  relinkStoreAgainstSourceMap,
  reviewStoreToSidecar,
  sidecarToReviewStore,
} from "./annotation-sidecar.js";
import { exportAgentTasks } from "./task-export.js";
import { reviewCounts, updateThreadStatus } from "./review-store.js";

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function firstPresentDocumentId(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function requireDocumentId(...values) {
  const raw = firstPresentDocumentId(...values);
  const sanitized = sanitizeDocumentId(raw);
  if (!sanitized) {
    throw new Error("documentId is required and must sanitize to a non-empty id.");
  }
  return sanitized;
}

function assertObjectLike(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertSidecarPayload(sidecar, documentId) {
  assertObjectLike(sidecar, "sidecar");
  const sidecarId = sanitizeDocumentId(sidecar.documentId);
  if (!sidecarId) {
    throw new Error("sidecar.documentId is required.");
  }
  if (sidecarId !== documentId) {
    throw new Error(`sidecar.documentId "${sidecar.documentId}" does not match documentId "${documentId}".`);
  }
  if (!Array.isArray(sidecar.threads)) {
    throw new Error("sidecar.threads must be an array.");
  }
  if (sidecar.source !== undefined && (typeof sidecar.source !== "object" || Array.isArray(sidecar.source))) {
    throw new Error("sidecar.source must be an object when present.");
  }
}

function assertSourceMapPayload(sourceMap, documentId) {
  assertObjectLike(sourceMap, "sourceMap");
  const sourceMapId = sanitizeDocumentId(sourceMap.documentId);
  if (!sourceMapId) {
    throw new Error("sourceMap.documentId is required.");
  }
  if (sourceMapId !== documentId) {
    throw new Error(`sourceMap.documentId "${sourceMap.documentId}" does not match documentId "${documentId}".`);
  }
  if (!Array.isArray(sourceMap.targets)) {
    throw new Error("sourceMap.targets must be an array.");
  }
}

export class ReviewBridgeService extends EventEmitter {
  constructor(options) {
    super();
    this.workspaceRoot = path.resolve(options.workspaceRoot);
    this.reviewDir = options.reviewDir || ".wirespec/reviews";
    this.eventLogRelative = options.eventLogPath || `${this.reviewDir}/events.ndjson`;
    this.now = options.now || nowIso;
    this.createId = options.createId || shortId;
  }

  defaultPaths(documentId) {
    const safeId = sanitizeDocumentId(documentId);
    if (!safeId) {
      throw new Error("documentId is required to resolve review file paths.");
    }
    return {
      annotationPath: `${this.reviewDir}/${safeId}.annotations.json`,
      taskPath: `${this.reviewDir}/${safeId}.agent-tasks.json`,
      eventLogPath: this.eventLogRelative,
    };
  }

  resolvePaths(documentId, overrides = {}) {
    const defaults = this.defaultPaths(documentId);
    return {
      annotation: safePathUnderRoot(
        this.workspaceRoot,
        overrides.annotationPath,
        defaults.annotationPath,
      ),
      tasks: safePathUnderRoot(
        this.workspaceRoot,
        overrides.taskPath,
        defaults.taskPath,
      ),
      eventLog: safePathUnderRoot(
        this.workspaceRoot,
        undefined,
        defaults.eventLogPath,
      ),
    };
  }

  async saveReview(payload) {
    const documentId = requireDocumentId(
      payload.documentId,
      payload.sidecar?.documentId,
      payload.sourceMap?.documentId,
    );
    if (!payload.sidecar) {
      throw new Error("sidecar is required.");
    }
    if (!payload.sourceMap) {
      throw new Error("sourceMap is required.");
    }
    assertSidecarPayload(payload.sidecar, documentId);
    assertSourceMapPayload(payload.sourceMap, documentId);

    const paths = this.resolvePaths(documentId, payload);
    const store = relinkStoreAgainstSourceMap(sidecarToReviewStore(payload.sidecar), payload.sourceMap);
    const normalizedSidecar = reviewStoreToSidecar(store, {
      wireFile: payload.wireFile || payload.sidecar?.source?.wireFile || payload.sourceMap?.entryFile,
      component: payload.componentFile || payload.sidecar?.source?.component,
      astFile: payload.astFile || payload.sidecar?.source?.astFile,
    });
    const tasks = exportAgentTasks(store, {
      exportedAt: this.now(),
    });
    const counts = reviewCounts(store);

    await writeJsonFile(paths.annotation.absolute, normalizedSidecar);
    await writeJsonFile(paths.tasks.absolute, tasks);
    await mkdir(path.dirname(paths.eventLog.absolute), { recursive: true });

    const event = {
      eventId: this.createId("evt"),
      kind: "review-saved",
      documentId,
      annotationPath: paths.annotation.relative,
      taskPath: paths.tasks.relative,
      activeThreads: counts.active,
      totalThreads: counts.total,
      createdAt: this.now(),
    };
    await appendFile(paths.eventLog.absolute, `${JSON.stringify(event)}\n`, "utf8");
    this.emit("event", event);

    return {
      ok: true,
      documentId,
      paths: {
        annotationPath: paths.annotation.relative,
        taskPath: paths.tasks.relative,
        eventLogPath: paths.eventLog.relative,
      },
      counts,
      sidecar: normalizedSidecar,
      tasks,
      event,
    };
  }

  async loadReview(payload) {
    const documentId = requireDocumentId(payload.documentId);
    if (payload.sourceMap) {
      assertSourceMapPayload(payload.sourceMap, documentId);
    }
    const paths = this.resolvePaths(documentId, payload);
    if (!(await fileExists(paths.annotation.absolute))) {
      return {
        ok: true,
        found: false,
        documentId,
        paths: {
          annotationPath: paths.annotation.relative,
          taskPath: paths.tasks.relative,
          eventLogPath: paths.eventLog.relative,
        },
      };
    }

    const sidecar = await readJsonFile(paths.annotation.absolute);
    assertSidecarPayload(sidecar, documentId);
    let store = sidecarToReviewStore(sidecar);
    if (payload.sourceMap) {
      store = relinkStoreAgainstSourceMap(store, payload.sourceMap);
    }
    const tasks = exportAgentTasks(store, {
      exportedAt: this.now(),
    });
    const counts = reviewCounts(store);

    return {
      ok: true,
      found: true,
      documentId,
      paths: {
        annotationPath: paths.annotation.relative,
        taskPath: paths.tasks.relative,
        eventLogPath: paths.eventLog.relative,
      },
      counts,
      sidecar: reviewStoreToSidecar(store, {
        wireFile: sidecar.source?.wireFile,
        component: sidecar.source?.component,
        astFile: sidecar.source?.astFile,
      }),
      tasks,
    };
  }

  async setThreadStatus(payload) {
    const documentId = requireDocumentId(payload.documentId);
    if (payload.sourceMap) {
      assertSourceMapPayload(payload.sourceMap, documentId);
    }
    const loaded = await this.loadReview(payload);
    if (!loaded.found) {
      throw new Error(`No saved review was found for ${payload.documentId}.`);
    }
    let store = sidecarToReviewStore(loaded.sidecar);
    store = updateThreadStatus(store, payload.threadId, payload.status, {
      resolutionNote: payload.resolutionNote,
      updatedAt: this.now(),
    });
    const result = await this.saveReview({
      ...payload,
      documentId: loaded.documentId,
      sidecar: reviewStoreToSidecar(store, {
        wireFile: loaded.sidecar.source?.wireFile,
        component: loaded.sidecar.source?.component,
        astFile: loaded.sidecar.source?.astFile,
      }),
      sourceMap: payload.sourceMap || { documentId: loaded.documentId, entryFile: loaded.sidecar.source?.wireFile, targets: [] },
    });

    const event = {
      eventId: this.createId("evt"),
      kind: "thread-status-updated",
      documentId: loaded.documentId,
      threadId: payload.threadId,
      status: payload.status,
      annotationPath: result.paths.annotationPath,
      taskPath: result.paths.taskPath,
      createdAt: this.now(),
    };
    const paths = this.resolvePaths(loaded.documentId, payload);
    await appendFile(paths.eventLog.absolute, `${JSON.stringify(event)}\n`, "utf8");
    this.emit("event", event);

    return {
      ok: true,
      documentId: loaded.documentId,
      event,
      paths: result.paths,
      counts: result.counts,
      sidecar: result.sidecar,
      tasks: result.tasks,
    };
  }
}
