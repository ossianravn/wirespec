import { OpenInEditorRequest, SourceSpan } from "./types.js";

export function buildEditorOpenRequest(
  span: SourceSpan,
  workspaceRoot = "",
): OpenInEditorRequest {
  const file = workspaceRoot
    ? `${workspaceRoot.replaceAll(/\/+$/g, "")}/${span.file.replaceAll(/^\/+/g, "")}`
    : span.file;

  const uriFile = file.replaceAll("\\", "/");
  const uri = `vscode://file/${encodeURI(uriFile)}:${span.lineStart}:${span.columnStart}`;

  return {
    kind: "open-in-editor",
    location: {
      file,
      line: span.lineStart,
      column: span.columnStart,
      uri,
    },
  };
}
