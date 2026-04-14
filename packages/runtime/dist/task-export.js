import { buildEditorOpenRequest } from "./editor-links.js";
import { resolveTarget } from "./source-map.js";
import reviewContract from "../../review-contract/index.js";
const { AGENT_TASK_EXPORT_VERSION, isActiveReviewStatus, reviewSeverityRank } = reviewContract;
function latestMessageBody(thread) {
    const latestMessage = thread.messages[thread.messages.length - 1];
    return latestMessage?.body ?? "";
}
function buildSummary(thread) {
    const focus = thread.title ?? latestMessageBody(thread);
    return `${thread.severity} · ${thread.category} · ${thread.target.targetId} · ${focus}`;
}
function toTask(thread, sourceMap, workspaceRoot = "") {
    const resolution = resolveTarget(sourceMap, thread.target);
    const editorLocation = resolution.target
        ? buildEditorOpenRequest(resolution.target.span, workspaceRoot).location
        : undefined;
    const task = {
        taskId: `task:${thread.id}`,
        threadId: thread.id,
        status: thread.status,
        severity: thread.severity,
        severityRank: reviewSeverityRank(thread.severity),
        screenId: thread.target.screenId,
        scope: thread.target.scope,
        targetId: resolution.target?.targetId ?? thread.target.targetId,
        summary: buildSummary(thread),
        requestedChange: latestMessageBody(thread),
        orphaned: resolution.status === "orphaned" || Boolean(thread.orphaned),
    };
    const resolvedWireId = resolution.target?.wireId ?? thread.target.wireId;
    if (resolvedWireId) {
        task.wireId = resolvedWireId;
    }
    if (thread.target.variantKey) {
        task.variantKey = thread.target.variantKey;
    }
    if (thread.taxonomy && thread.taxonomy.length > 0) {
        task.taxonomy = thread.taxonomy;
    }
    if (thread.suggestedOps && thread.suggestedOps.length > 0) {
        task.suggestedOps = thread.suggestedOps;
    }
    if (editorLocation) {
        task.openInEditor = editorLocation;
    }
    return task;
}
export function exportAgentTasks(store, sourceMap, options = {}) {
    const includeStatuses = new Set(options.includeStatuses ?? []);
    const tasks = store.threads
        .filter((thread) => includeStatuses.size ? includeStatuses.has(thread.status) : isActiveReviewStatus(thread.status))
        .map((thread) => toTask(thread, sourceMap, options.workspaceRoot))
        .sort((a, b) => {
        if (a.severityRank !== b.severityRank) {
            return a.severityRank - b.severityRank;
        }
        return a.threadId.localeCompare(b.threadId);
    });
    return {
        version: AGENT_TASK_EXPORT_VERSION,
        documentId: store.documentId,
        exportedAt: new Date().toISOString(),
        tasks,
    };
}
