import {
  ParsedWireSpecDocument,
  ResolvedDocument,
  VariantBlock,
  VariantKind,
  VariantSelection,
  WireNode,
} from "./types.js";
import { WireSpecParseError, deepCloneNode } from "./utils.js";

interface IndexedNode {
  node: WireNode;
  parent?: WireNode;
  index: number;
}

function visit(
  node: WireNode,
  parent: WireNode | undefined,
  callback: (entry: IndexedNode) => void,
): void {
  callback({ node, parent, index: parent ? parent.children.indexOf(node) : 0 });
  for (const child of node.children) {
    visit(child, node, callback);
  }
}

function indexById(root: WireNode): Map<string, IndexedNode> {
  const map = new Map<string, IndexedNode>();
  visit(root, undefined, (entry) => {
    if (!entry.node.id) {
      return;
    }
    if (map.has(entry.node.id)) {
      throw new WireSpecParseError(`Duplicate id detected: ${entry.node.id}`, entry.node.span);
    }
    map.set(entry.node.id, entry);
  });
  return map;
}

function resolveVariants(
  document: ParsedWireSpecDocument,
  selection: VariantSelection,
): VariantBlock[] {
  const byKind = new Map<VariantKind, VariantBlock[]>();
  for (const variant of document.variants) {
    const list = byKind.get(variant.kind) ?? [];
    list.push(variant);
    byKind.set(variant.kind, list);
  }

  const selected: VariantBlock[] = [];
  const pushMatching = (kind: VariantKind, desired?: string) => {
    if (!desired) {
      return;
    }
    const match = (byKind.get(kind) ?? []).find((variant) => variant.name === desired);
    if (!match) {
      throw new WireSpecParseError(`Unknown ${kind} variant: ${desired}`);
    }
    selected.push(match);
  };

  pushMatching("mode", selection.mode);
  pushMatching("theme", selection.theme);
  pushMatching("breakpoint", selection.breakpoint);
  pushMatching("state", selection.state);

  return selected;
}

function patchNode(node: WireNode, props: Record<string, string | number | boolean | Array<string | number | boolean>>): void {
  if ("id" in props) {
    throw new WireSpecParseError("patch may not change a node id.", node.span);
  }
  node.props = {
    ...node.props,
    ...props,
  };
}

function removeFromParent(parent: WireNode, childId: string): void {
  parent.children = parent.children.filter((child) => child.id !== childId);
}

function insertRelative(
  root: WireNode,
  parent: WireNode | undefined,
  refNode: WireNode,
  position: "before" | "after" | "inside-start" | "inside-end",
  inserted: WireNode,
): void {
  if (position === "inside-start") {
    refNode.children = [inserted, ...refNode.children];
    return;
  }
  if (position === "inside-end") {
    refNode.children = [...refNode.children, inserted];
    return;
  }
  if (!parent) {
    throw new WireSpecParseError(`Cannot insert ${position} the root node.`, root.span);
  }
  const refIndex = parent.children.findIndex((child) => child.id === refNode.id);
  if (refIndex === -1) {
    throw new WireSpecParseError("Reference node was not found in parent children.", refNode.span);
  }
  const insertAt = position === "before" ? refIndex : refIndex + 1;
  parent.children = [
    ...parent.children.slice(0, insertAt),
    inserted,
    ...parent.children.slice(insertAt),
  ];
}

export function resolveDocument(
  document: ParsedWireSpecDocument,
  selection: VariantSelection = {},
): ResolvedDocument {
  const root = deepCloneNode(document.root);
  const orderedVariants = resolveVariants(document, selection);
  const removedIds = new Set<string>();

  for (const variant of orderedVariants) {
    for (const op of variant.ops) {
      const idIndex = indexById(root);
      if (op.op === "insert") {
        if (idIndex.has(op.node.id ?? "")) {
          throw new WireSpecParseError(`Inserted node id already exists: ${op.node.id}`, op.span);
        }
        const ref = idIndex.get(op.ref);
        if (!ref) {
          throw new WireSpecParseError(`Unknown insert ref: ${op.ref}`, op.span);
        }
        insertRelative(root, ref.parent, ref.node, op.position, deepCloneNode(op.node));
        continue;
      }

      if (removedIds.has(op.target)) {
        throw new WireSpecParseError(
          `Operation targeted a node that was already removed: ${op.target}`,
          op.span,
        );
      }

      const indexed = idIndex.get(op.target);
      if (!indexed) {
        throw new WireSpecParseError(`Unknown operation target: ${op.target}`, op.span);
      }

      if (op.op === "patch") {
        patchNode(indexed.node, op.props);
        continue;
      }

      if (op.op === "show") {
        indexed.node.props.visible = true;
        continue;
      }

      if (op.op === "hide") {
        indexed.node.props.visible = false;
        continue;
      }

      if (op.op === "remove") {
        if (!indexed.parent) {
          throw new WireSpecParseError("The root node may not be removed.", op.span);
        }
        visit(indexed.node, indexed.parent, (entry) => {
          if (entry.node.id) {
            removedIds.add(entry.node.id);
          }
        });
        removeFromParent(indexed.parent, op.target);
      }
    }
  }

  return {
    schemaVersion: document.schemaVersion,
    sourceFormat: document.sourceFormat,
    sourceFile: document.sourceFile,
    metadata: { ...document.metadata },
    documentTitle: document.documentTitle,
    selection: { ...selection },
    root,
    sections: document.sections.map((section) => ({
      ...section,
      span: { ...section.span },
    })),
    acceptance: document.acceptance.map((criterion) => ({
      ...criterion,
      span: { ...criterion.span },
      tags: [...criterion.tags],
    })),
  };
}
