import {
  SourceMapDocument,
  SourceSpan,
  SourceTarget,
  TargetResolution,
  ThreadTargetRef,
} from "./review-types.js";

export function indexTargets(
  sourceMap: SourceMapDocument,
): Map<string, SourceTarget> {
  return new Map(sourceMap.targets.map((target) => [target.targetId, target]));
}

export function indexRenames(
  sourceMap: SourceMapDocument,
): Map<string, string> {
  return new Map(
    (sourceMap.renames ?? []).map((rename) => [
      rename.fromTargetId,
      rename.toTargetId,
    ]),
  );
}

export function resolveTarget(
  sourceMap: SourceMapDocument,
  targetRef: ThreadTargetRef,
): TargetResolution {
  const targets = indexTargets(sourceMap);
  const renames = indexRenames(sourceMap);
  const messages: string[] = [];

  let target = targets.get(targetRef.targetId);
  let status: TargetResolution["status"] = "matched";

  if (!target) {
    const renamedTargetId = renames.get(targetRef.targetId);
    if (renamedTargetId) {
      target = targets.get(renamedTargetId);
      status = "renamed";
      messages.push(
        `Retargeted ${targetRef.targetId} -> ${renamedTargetId} via rename table.`,
      );
    }
  }

  if (!target) {
    return {
      status: "orphaned",
      messages: [
        `Target ${targetRef.targetId} does not exist in the current source map.`,
      ],
    };
  }

  if (
    targetRef.variantKey &&
    target.variants &&
    target.variants.length > 0 &&
    !target.variants.includes(targetRef.variantKey)
  ) {
    status = "missing-variant";
    messages.push(
      `Target ${target.targetId} exists, but variant ${targetRef.variantKey} is missing.`,
    );
  }

  return { status, target, messages };
}

export function getParentChain(
  sourceMap: SourceMapDocument,
  targetId: string,
): SourceTarget[] {
  const targets = indexTargets(sourceMap);
  const chain: SourceTarget[] = [];
  let current = targets.get(targetId);

  while (current) {
    chain.push(current);
    current = current.parentTargetId
      ? targets.get(current.parentTargetId)
      : undefined;
  }

  return chain;
}

export function formatEditorLocation(span: SourceSpan): string {
  return `${span.file}:${span.lineStart}:${span.columnStart}`;
}

export function buildVsCodeUri(
  span: SourceSpan,
  workspaceRoot = "",
): string {
  const filePath = span.file.startsWith("/")
    ? span.file
    : `${workspaceRoot.replace(/\/$/, "")}${workspaceRoot ? "/" : ""}${span.file}`;
  return `vscode://file/${encodeURI(filePath)}:${span.lineStart}:${span.columnStart}`;
}
