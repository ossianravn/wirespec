import { SourceSpan, WireNode, WireScalar, WireValue } from "./types.js";

export class WireSpecParseError extends Error {
  constructor(message: string, readonly span?: SourceSpan) {
    super(message);
    this.name = "WireSpecParseError";
  }
}

export function stripQuotes(value: string): string {
  return value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function deepCloneNode(node: WireNode): WireNode {
  return {
    kind: node.kind,
    id: node.id,
    props: { ...node.props },
    children: node.children.map((child) => deepCloneNode(child)),
    span: { ...node.span },
  };
}

export function sourceSpan(
  file: string,
  lineStart: number,
  columnStart: number,
  lineEnd: number,
  columnEnd: number,
): SourceSpan {
  return {
    file,
    lineStart,
    columnStart,
    lineEnd,
    columnEnd,
  };
}

export function countLeadingSpaces(value: string): number {
  let index = 0;
  while (index < value.length && value[index] === " ") {
    index += 1;
  }
  return index;
}

export function normalizeSectionId(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

export function parseScalar(raw: string): WireScalar {
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return Number(raw);
  }
  return raw;
}

export function parseValue(raw: string): WireValue {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    const items: WireScalar[] = [];
    let buffer = "";
    let inQuote = false;
    let escapeNext = false;
    for (let index = 0; index < inner.length; index += 1) {
      const char = inner[index];
      if (escapeNext) {
        buffer += char;
        escapeNext = false;
        continue;
      }
      if (char === "\\") {
        escapeNext = true;
        buffer += char;
        continue;
      }
      if (char === '"') {
        inQuote = !inQuote;
        buffer += char;
        continue;
      }
      if (char === "," && !inQuote) {
        items.push(parseScalar(unescapeQuoted(stripQuotes(buffer.trim()))));
        buffer = "";
        continue;
      }
      buffer += char;
    }
    if (buffer.trim()) {
      items.push(parseScalar(unescapeQuoted(stripQuotes(buffer.trim()))));
    }
    return items;
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unescapeQuoted(trimmed.slice(1, -1));
  }
  return parseScalar(trimmed);
}

export function unescapeQuoted(value: string): string {
  return value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}

export function formatValue(value: WireValue): string {
  if (Array.isArray(value)) {
    return `[${value
      .map((item) => formatValue(item))
      .join(", ")}]`;
  }
  if (typeof value === "string") {
    if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
      return value;
    }
    return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  }
  return String(value);
}

export function nodeLabel(node: WireNode): string | undefined {
  const labelLike = node.props.label ?? node.props.text ?? node.props.title;
  if (typeof labelLike === "string" && labelLike.trim()) {
    return labelLike.trim();
  }
  return undefined;
}

export function isTruthy(value: WireValue | undefined): boolean {
  return value === true || value === "true" || value === 1;
}

export function isVisible(node: WireNode): boolean {
  return node.props.visible !== false;
}

export function screenIdFromNode(node: WireNode): string {
  return node.id ?? (typeof node.props.id === "string" ? node.props.id : "screen");
}

export function toKebab(input: string): string {
  return input
    .trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}

export function roleForNode(node: WireNode): string | undefined {
  const type = typeof node.props.type === "string" ? node.props.type : undefined;
  switch (node.kind) {
    case "button":
      return "button";
    case "link":
      return "link";
    case "field":
      return "textbox";
    case "textarea":
      return "textbox";
    case "select":
    case "combobox":
      return "combobox";
    case "checkbox":
      return "checkbox";
    case "switch":
      return "switch";
    case "radio-group":
      return "radiogroup";
    case "radio":
      return "radio";
    case "dialog":
      return "dialog";
    case "drawer":
      return "complementary";
    case "alert":
      return "alert";
    case "nav":
    case "breadcrumbs":
    case "pagination":
      return "navigation";
    case "toolbar":
      return "toolbar";
    case "tabs":
      return "tablist";
    case "tab":
      return "tab";
    case "tab-panel":
      return "tabpanel";
    case "list":
    case "stepper":
      return "list";
    case "list-item":
    case "step":
      return "listitem";
    case "table":
      return "table";
    case "table-header":
    case "table-body":
      return "rowgroup";
    case "table-row":
      return "row";
    case "table-cell":
      return "cell";
    case "empty-state":
      return "region";
    case "avatar":
    case "icon":
      return "img";
    default:
      if (type === "checkbox") {
        return "checkbox";
      }
      if (type === "radio") {
        return "radio";
      }
      return undefined;
  }
}

export function classifyScope(kind: string, hasChildren: boolean): "screen" | "section" | "element" {
  if (kind === "screen" || kind === "component") {
    return "screen";
  }
  const sectionKinds = new Set([
    "header",
    "main",
    "aside",
    "footer",
    "section",
    "card",
    "panel",
    "form",
    "row",
    "column",
    "grid",
    "stack",
    "actions",
    "dialog",
    "drawer",
    "list",
    "list-item",
    "table",
    "table-header",
    "table-body",
    "table-row",
    "table-cell",
    "tabs",
    "tab-panel",
    "toolbar",
    "empty-state",
    "nav",
    "breadcrumbs",
    "pagination",
    "stepper",
    "radio-group",
  ]);
  if (sectionKinds.has(kind) || hasChildren) {
    return "section";
  }
  return "element";
}

export function semanticTargetId(scope: "screen" | "section" | "element", node: WireNode): string {
  if (scope === "screen") {
    return `screen:${screenIdFromNode(node)}`;
  }
  if (node.id) {
    return `node:${node.id}`;
  }
  return `node:auto:${toKebab(node.kind)}-${node.span.lineStart}-${node.span.columnStart}`;
}
