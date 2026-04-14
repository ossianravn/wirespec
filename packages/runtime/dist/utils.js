export class WireSpecParseError extends Error {
    span;
    constructor(message, span) {
        super(message);
        this.span = span;
        this.name = "WireSpecParseError";
    }
}
export function stripQuotes(value) {
    return value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1)
        : value;
}
export function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
export function deepCloneNode(node) {
    return {
        kind: node.kind,
        id: node.id,
        props: { ...node.props },
        children: node.children.map((child) => deepCloneNode(child)),
        span: { ...node.span },
    };
}
export function sourceSpan(file, lineStart, columnStart, lineEnd, columnEnd) {
    return {
        file,
        lineStart,
        columnStart,
        lineEnd,
        columnEnd,
    };
}
export function countLeadingSpaces(value) {
    let index = 0;
    while (index < value.length && value[index] === " ") {
        index += 1;
    }
    return index;
}
export function normalizeSectionId(title) {
    return title
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
}
export function parseScalar(raw) {
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
export function parseValue(raw) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) {
            return [];
        }
        const items = [];
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
export function unescapeQuoted(value) {
    return value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}
export function formatValue(value) {
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
export function nodeLabel(node) {
    const labelLike = node.props.label ?? node.props.text ?? node.props.title;
    if (typeof labelLike === "string" && labelLike.trim()) {
        return labelLike.trim();
    }
    return undefined;
}
export function isTruthy(value) {
    return value === true || value === "true" || value === 1;
}
export function isVisible(node) {
    return node.props.visible !== false;
}
export function screenIdFromNode(node) {
    return node.id ?? (typeof node.props.id === "string" ? node.props.id : "screen");
}
export function toKebab(input) {
    return input
        .trim()
        .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replaceAll(/[^a-zA-Z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "")
        .toLowerCase();
}
export function roleForNode(node) {
    const type = typeof node.props.type === "string" ? node.props.type : undefined;
    switch (node.kind) {
        case "button":
            return "button";
        case "link":
            return "link";
        case "field":
        case "textarea":
        case "select":
        case "combobox":
            return "textbox";
        case "checkbox":
        case "switch":
            return "checkbox";
        case "radio":
            return "radio";
        case "dialog":
            return "dialog";
        case "drawer":
            return "complementary";
        case "alert":
            return "alert";
        default:
            if (type === "checkbox") {
                return "checkbox";
            }
            return undefined;
    }
}
export function classifyScope(kind, hasChildren) {
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
    ]);
    if (sectionKinds.has(kind) || hasChildren) {
        return "section";
    }
    return "element";
}
export function semanticTargetId(scope, node) {
    if (scope === "screen") {
        return `screen:${screenIdFromNode(node)}`;
    }
    return `node:${node.id ?? toKebab(node.kind)}`;
}
