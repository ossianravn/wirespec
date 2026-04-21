import { formatValue } from "./utils.js";
import { CANONICAL_PROP_ORDER } from "./vocabulary.js";
function lineEnding(options) {
    return options?.lineEnding ?? "\n";
}
function formatFrontmatterValue(value) {
    if (!value.includes("\n")) {
        return [value];
    }
    return value.split("\n").map((line) => line.trimEnd());
}
function orderedEntries(id, props) {
    const entries = [];
    if (id) {
        entries.push(["id", id]);
    }
    const known = [];
    const extensions = [];
    const unknown = [];
    for (const key of Object.keys(props)) {
        const entry = [key, props[key]];
        if (CANONICAL_PROP_ORDER.includes(key)) {
            known.push(entry);
        }
        else if (key.startsWith("x-")) {
            extensions.push(entry);
        }
        else {
            unknown.push(entry);
        }
    }
    known.sort((left, right) => CANONICAL_PROP_ORDER.indexOf(left[0]) - CANONICAL_PROP_ORDER.indexOf(right[0]));
    extensions.sort((left, right) => left[0].localeCompare(right[0]));
    unknown.sort((left, right) => left[0].localeCompare(right[0]));
    return [...entries, ...known, ...extensions, ...unknown];
}
function formatNodeLine(node) {
    const attrs = orderedEntries(node.id, node.props)
        .map(([key, value]) => `${key}=${formatValue(value)}`);
    return [node.kind, ...attrs].join(" ");
}
function formatNodeTree(node, depth = 0) {
    const indent = "  ".repeat(depth);
    const lines = [`${indent}${formatNodeLine(node)}`];
    for (const child of node.children) {
        lines.push(...formatNodeTree(child, depth + 1));
    }
    return lines;
}
function formatVariantInfo(block) {
    const parts = [`wirespec v=1 kind=${block.kind}`];
    if (block.name) {
        parts.push(`name=${formatValue(block.name)}`);
    }
    if (block.kind === "breakpoint") {
        if (typeof block.when?.minWidth === "number") {
            parts.push(`min=${block.when.minWidth}`);
        }
        if (typeof block.when?.maxWidth === "number") {
            parts.push(`max=${block.when.maxWidth}`);
        }
    }
    return parts.join(" ");
}
function formatVariantOp(op) {
    switch (op.op) {
        case "patch": {
            const props = orderedEntries(undefined, op.props)
                .map(([key, value]) => `${key}=${formatValue(value)}`);
            return [[`patch`, `target=${formatValue(op.target)}`, ...props].join(" ")];
        }
        case "show":
        case "hide":
        case "remove":
            return [`${op.op} target=${formatValue(op.target)}`];
        case "insert": {
            const lines = [`insert ref=${formatValue(op.ref)} position=${formatValue(op.position)}`];
            for (const childLine of formatNodeTree(op.node, 1)) {
                lines.push(childLine);
            }
            return lines;
        }
    }
}
function formatSection(section) {
    return [`## ${section.title}`, section.body].filter(Boolean).join("\n");
}
export function formatWireNode(node, options = {}) {
    return formatNodeTree(node).join(lineEnding(options));
}
export function formatVariantBlock(block, options = {}) {
    const eol = lineEnding(options);
    const body = block.ops.flatMap((op) => formatVariantOp(op)).join(eol);
    return [`\`\`\`${formatVariantInfo(block)}`, body, "```"].join(eol);
}
export function formatWireSpecDocument(document, options = {}) {
    const eol = lineEnding(options);
    const parts = [];
    const metadataKeys = Object.keys(document.metadata);
    if (metadataKeys.length > 0) {
        parts.push("---");
        for (const key of metadataKeys) {
            const value = document.metadata[key] ?? "";
            const valueLines = formatFrontmatterValue(value);
            const multilineValue = value.includes("\n") || value.trimStart().startsWith("- ");
            if (!multilineValue) {
                parts.push(`${key}: ${valueLines[0]}`.trimEnd());
                continue;
            }
            parts.push(`${key}:`);
            for (const line of valueLines) {
                parts.push(line ? `  ${line.trimStart()}` : "  ");
            }
        }
        parts.push("---");
        parts.push("");
    }
    parts.push(`# ${document.documentTitle || document.metadata.id || "Untitled"}`);
    parts.push("");
    const intentSection = document.sections.find((section) => section.kind === "intent");
    if (intentSection) {
        parts.push(formatSection(intentSection));
        parts.push("");
    }
    parts.push("```wirespec v=1 kind=base");
    parts.push(formatWireNode(document.root, options));
    parts.push("```");
    if (document.variants.length > 0) {
        parts.push("");
        for (let index = 0; index < document.variants.length; index += 1) {
            parts.push(formatVariantBlock(document.variants[index], options));
            if (index < document.variants.length - 1) {
                parts.push("");
            }
        }
    }
    const remainingSections = document.sections.filter((section) => section.kind !== "intent" && section.kind !== "acceptance");
    if (remainingSections.length > 0) {
        parts.push("");
        for (let index = 0; index < remainingSections.length; index += 1) {
            parts.push(formatSection(remainingSections[index]));
            if (index < remainingSections.length - 1) {
                parts.push("");
            }
        }
    }
    const acceptanceSection = document.sections.find((section) => section.kind === "acceptance");
    if (acceptanceSection) {
        parts.push("");
        parts.push(formatSection(acceptanceSection));
    }
    else if (document.acceptance.length > 0) {
        parts.push("");
        parts.push("## Acceptance");
        for (const criterion of document.acceptance) {
            parts.push(`- ${criterion.text}`);
        }
    }
    return `${parts.join(eol).replace(new RegExp(`${eol}{3,}`, "g"), `${eol}${eol}`)}${eol}`;
}
