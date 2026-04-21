import {
  LintDiagnostic,
  LintOptions,
  LintResult,
  ParsedWireSpecDocument,
  SourceSpan,
  WireNode,
  WireValue,
} from "./types.js";
import {
  INTERACTIVE_KINDS,
  REQUIRED_PROPS_BY_KIND,
  ROOT_KINDS,
  STRUCTURAL_CHILD_RULES,
  isKnownKind,
} from "./vocabulary.js";
import { lintWireSpecQuality } from "./quality-rules.js";

interface NodeContext {
  parent?: WireNode;
}

interface IdRecord {
  span: SourceSpan;
  kind: string;
}

function hasMeaningfulValue(value: WireValue | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

function compareDiagnostics(left: LintDiagnostic, right: LintDiagnostic): number {
  const leftLine = left.span?.lineStart ?? Number.MAX_SAFE_INTEGER;
  const rightLine = right.span?.lineStart ?? Number.MAX_SAFE_INTEGER;
  if (leftLine !== rightLine) {
    return leftLine - rightLine;
  }
  const leftColumn = left.span?.columnStart ?? Number.MAX_SAFE_INTEGER;
  const rightColumn = right.span?.columnStart ?? Number.MAX_SAFE_INTEGER;
  if (leftColumn !== rightColumn) {
    return leftColumn - rightColumn;
  }
  return left.code.localeCompare(right.code);
}

function pushDiagnostic(
  diagnostics: LintDiagnostic[],
  diagnostic: LintDiagnostic,
): void {
  diagnostics.push(diagnostic);
}

function collectTreeIds(node: WireNode, ids: Map<string, IdRecord>, diagnostics: LintDiagnostic[]): void {
  if (node.id) {
    const existing = ids.get(node.id);
    if (existing) {
      pushDiagnostic(diagnostics, {
        code: "ID-DUPLICATE",
        level: "error",
        message: `Duplicate id "${node.id}" is already used by ${existing.kind}.`,
        span: node.span,
        targetId: node.id,
        fixHint: "Give each meaningful node a unique stable id.",
      });
    } else {
      ids.set(node.id, { span: node.span, kind: node.kind });
    }
  }

  for (const child of node.children) {
    collectTreeIds(child, ids, diagnostics);
  }
}

function lintRequiredProps(node: WireNode, diagnostics: LintDiagnostic[]): void {
  for (const prop of REQUIRED_PROPS_BY_KIND[node.kind] ?? []) {
    if (prop === "id") {
      if (!node.id) {
        pushDiagnostic(diagnostics, {
          code: "VOCAB-MISSING-PROP",
          level: "error",
          message: `${node.kind} requires id.`,
          span: node.span,
          fixHint: `Add id=<stable-id> to the ${node.kind} node.`,
        });
      }
      continue;
    }

    if (!hasMeaningfulValue(node.props[prop])) {
      pushDiagnostic(diagnostics, {
        code: "VOCAB-MISSING-PROP",
        level: "error",
        message: `${node.kind} requires ${prop}.`,
        span: node.span,
        targetId: node.id,
        fixHint: `Add ${prop}=... to the ${node.kind} node.`,
      });
    }
  }
}

function lintStructuralRule(node: WireNode, diagnostics: LintDiagnostic[]): void {
  const allowedChildren = STRUCTURAL_CHILD_RULES[node.kind];
  if (!allowedChildren) {
    return;
  }

  for (const child of node.children) {
    if (!allowedChildren.has(child.kind)) {
      pushDiagnostic(diagnostics, {
        code: "STRUCT-INVALID-CHILD",
        level: "error",
        message: `${node.kind} may only contain ${Array.from(allowedChildren).join(", ")} children, not ${child.kind}.`,
        span: child.span,
        targetId: child.id,
        fixHint: `Move ${child.kind} into a compatible parent or change it to one of the allowed child kinds.`,
      });
    }
  }

  if (node.kind === "table" && node.children.length > 0) {
    const hasSection = node.children.some((child) => child.kind === "table-header" || child.kind === "table-body");
    if (!hasSection) {
      pushDiagnostic(diagnostics, {
        code: "STRUCT-TABLE-SECTIONS",
        level: "error",
        message: "table should contain table-header and/or table-body children.",
        span: node.span,
        targetId: node.id,
        fixHint: "Wrap rows in table-header or table-body.",
      });
    }
  }
}

function walkNode(
  node: WireNode,
  diagnostics: LintDiagnostic[],
  ids: Map<string, IdRecord>,
  tabControls: Map<string, WireNode>,
  tabPanels: Map<string, WireNode>,
  options: Required<LintOptions>,
  context: NodeContext = {},
): void {
  if (!isKnownKind(node.kind)) {
    pushDiagnostic(diagnostics, {
      code: "VOCAB-UNKNOWN-KIND",
      level: "error",
      message: `Unknown node kind "${node.kind}". Use a reserved kind or an x-* extension.`,
      span: node.span,
      targetId: node.id,
      fixHint: "Rename the node to a core kind, or prefix it with x- for a local extension.",
    });
  }

  lintRequiredProps(node, diagnostics);
  lintStructuralRule(node, diagnostics);

  if (options.requireStableIdsOnInteractiveNodes && INTERACTIVE_KINDS.has(node.kind) && !node.id) {
    pushDiagnostic(diagnostics, {
      code: "ID-MISSING-STABLE",
      level: "warning",
      message: `${node.kind} should have a stable id so variants, review threads, and code mapping stay reliable.`,
      span: node.span,
      fixHint: `Add id=<stable-id> to the ${node.kind} node.`,
    });
  }

  if (node.kind === "tab" && typeof node.props.controls === "string") {
    tabControls.set(node.props.controls, node);
  }
  if (node.kind === "tab-panel" && node.id) {
    tabPanels.set(node.id, node);
  }

  for (const child of node.children) {
    walkNode(child, diagnostics, ids, tabControls, tabPanels, options, { parent: node });
  }
}

function lintVariantTargets(
  diagnostics: LintDiagnostic[],
  variants: ParsedWireSpecDocument["variants"],
  knownIds: Set<string>,
): void {
  for (const variant of variants) {
    for (const op of variant.ops) {
      if (op.op === "insert") {
        if (!knownIds.has(op.ref)) {
          pushDiagnostic(diagnostics, {
            code: "STRUCT-UNKNOWN-TARGET",
            level: "error",
            message: `insert in ${variant.kind}:${variant.name} references unknown ref "${op.ref}".`,
            span: op.span,
            targetId: op.ref,
            fixHint: "Reference an existing explicit id.",
          });
        }
        continue;
      }

      if (!knownIds.has(op.target)) {
        pushDiagnostic(diagnostics, {
          code: "STRUCT-UNKNOWN-TARGET",
          level: "error",
          message: `${op.op} in ${variant.kind}:${variant.name} targets unknown id "${op.target}".`,
          span: op.span,
          targetId: op.target,
          fixHint: "Target an existing explicit id from the base tree or an inserted node.",
        });
      }
    }
  }
}

function lintVariantInsertedTrees(
  diagnostics: LintDiagnostic[],
  variants: ParsedWireSpecDocument["variants"],
  ids: Map<string, IdRecord>,
  options: Required<LintOptions>,
): Set<string> {
  const insertedIds = new Set<string>();

  for (const variant of variants) {
    for (const op of variant.ops) {
      if (op.op !== "insert") {
        continue;
      }

      const tabControls = new Map<string, WireNode>();
      const tabPanels = new Map<string, WireNode>();
      collectTreeIds(op.node, ids, diagnostics);
      walkNode(op.node, diagnostics, ids, tabControls, tabPanels, options);

      if (op.node.id) {
        insertedIds.add(op.node.id);
      }
      const stack = [...op.node.children];
      while (stack.length > 0) {
        const child = stack.pop();
        if (!child) {
          continue;
        }
        if (child.id) {
          insertedIds.add(child.id);
        }
        stack.push(...child.children);
      }
    }
  }

  return insertedIds;
}

function lintTabPairs(
  diagnostics: LintDiagnostic[],
  tabControls: Map<string, WireNode>,
  tabPanels: Map<string, WireNode>,
): void {
  for (const [panelId, tab] of tabControls) {
    if (!tabPanels.has(panelId)) {
      pushDiagnostic(diagnostics, {
        code: "STRUCT-TAB-CONTROLS",
        level: "error",
        message: `tab "${tab.id ?? "unknown"}" controls missing tab-panel "${panelId}".`,
        span: tab.span,
        targetId: tab.id,
        fixHint: "Create the referenced tab-panel or update controls=... to a real panel id.",
      });
    }
  }

  for (const [panelId, panel] of tabPanels) {
    if (!tabControls.has(panelId)) {
      pushDiagnostic(diagnostics, {
        code: "STRUCT-TAB-PANEL",
        level: "error",
        message: `tab-panel "${panelId}" is not referenced by any tab controls=... prop.`,
        span: panel.span,
        targetId: panelId,
        fixHint: "Add a matching tab with controls=<panel-id>.",
      });
    }
  }
}

export function lintWireSpecDocument(
  document: ParsedWireSpecDocument,
  options: LintOptions = {},
): LintResult {
  const diagnostics: LintDiagnostic[] = [];
  const normalizedOptions: Required<LintOptions> = {
    requireStableIdsOnInteractiveNodes: options.requireStableIdsOnInteractiveNodes !== false,
    includeQualityWarnings: options.includeQualityWarnings !== false,
  };

  if (!ROOT_KINDS.has(document.root.kind)) {
    pushDiagnostic(diagnostics, {
      code: "STRUCT-ROOT-KIND",
      level: "error",
      message: `Root node must be screen or component, not ${document.root.kind}.`,
      span: document.root.span,
      targetId: document.root.id,
      fixHint: "Use screen for a page-level spec or component for a reusable fragment.",
    });
  }

  const ids = new Map<string, IdRecord>();
  collectTreeIds(document.root, ids, diagnostics);

  const tabControls = new Map<string, WireNode>();
  const tabPanels = new Map<string, WireNode>();
  walkNode(document.root, diagnostics, ids, tabControls, tabPanels, normalizedOptions);
  lintTabPairs(diagnostics, tabControls, tabPanels);

  const insertedIds = lintVariantInsertedTrees(diagnostics, document.variants, ids, normalizedOptions);
  const knownIds = new Set<string>([...ids.keys(), ...insertedIds]);
  lintVariantTargets(diagnostics, document.variants, knownIds);

  if (normalizedOptions.includeQualityWarnings) {
    diagnostics.push(...lintWireSpecQuality(document));
  }

  diagnostics.sort(compareDiagnostics);

  return {
    ok: !diagnostics.some((diagnostic) => diagnostic.level === "error"),
    diagnostics,
  };
}
