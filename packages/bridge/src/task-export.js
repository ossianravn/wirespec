import { latestMessageBody } from "./annotation-sidecar.js";
import reviewContract from "../../review-contract/index.js";

const { AGENT_TASK_EXPORT_VERSION, reviewSeverityRank } = reviewContract;

function sourceSpanAnchor(thread) {
  return (thread.target.anchors || []).find((anchor) => anchor.type === "source-span");
}

export function buildEditorOpenRequest(thread) {
  const anchor = sourceSpanAnchor(thread);
  if (!anchor) {
    return undefined;
  }
  return {
    file: anchor.file,
    line: anchor.lineStart,
    column: anchor.columnStart,
    uri: `vscode://file/${encodeURIComponent(anchor.file)}:${anchor.lineStart}:${anchor.columnStart}`,
  };
}

export function exportAgentTasks(store) {
  return {
    version: AGENT_TASK_EXPORT_VERSION,
    documentId: store.documentId,
    exportedAt: new Date().toISOString(),
    tasks: store.threads.map((thread) => ({
      taskId: `task:${thread.id}`,
      threadId: thread.id,
      status: thread.status,
      severity: thread.severity,
      severityRank: reviewSeverityRank(thread.severity),
      screenId: thread.target.screenId,
      scope: thread.target.scope,
      targetId: thread.target.targetId,
      summary: `${thread.severity} · ${thread.category} · ${thread.target.targetId} · ${thread.title}`,
      requestedChange: latestMessageBody(thread),
      orphaned: !!thread.orphaned,
      wireId: thread.target.wireId,
      variantKey: thread.target.variantKey,
      taxonomy: thread.taxonomy || [],
      ...(buildEditorOpenRequest(thread) ? { openInEditor: buildEditorOpenRequest(thread) } : {}),
    })),
  };
}
