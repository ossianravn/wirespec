import { OpenInEditorLocation, SourceSpan } from "./review-types.js";
import { buildVsCodeUri } from "./source-map.js";

export interface EditorOpenRequest {
  preferredEditor: "vscode";
  location: OpenInEditorLocation;
  fallbackCommand: string;
}

export function buildEditorOpenRequest(
  span: SourceSpan,
  workspaceRoot = "",
): EditorOpenRequest {
  const uri = buildVsCodeUri(span, workspaceRoot);
  return {
    preferredEditor: "vscode",
    location: {
      file: span.file,
      line: span.lineStart,
      column: span.columnStart,
      uri,
    },
    fallbackCommand: `code -g ${span.file}:${span.lineStart}:${span.columnStart}`,
  };
}
