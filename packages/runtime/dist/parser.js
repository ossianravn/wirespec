import { WireSpecParseError, countLeadingSpaces, normalizeSectionId, parseValue, sourceSpan, } from "./utils.js";
function parseFrontmatter(lines, sourceFile) {
    if (lines[0] !== "---") {
        return { metadata: {}, nextLineIndex: 0 };
    }
    const metadata = {};
    let index = 1;
    for (; index < lines.length; index += 1) {
        const raw = lines[index];
        if (raw === "---") {
            return { metadata, nextLineIndex: index + 1 };
        }
        const separator = raw.indexOf(":");
        if (separator === -1) {
            throw new WireSpecParseError(`Invalid frontmatter line: ${raw}`, sourceSpan(sourceFile, index + 1, 1, index + 1, raw.length + 1));
        }
        const key = raw.slice(0, separator).trim();
        const value = raw.slice(separator + 1).trim();
        metadata[key] = value;
    }
    throw new WireSpecParseError("Frontmatter fence was not closed.", sourceSpan(sourceFile, 1, 1, Math.max(lines.length, 1), 1));
}
function parseFenceBlocks(lines) {
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        if (!line.startsWith("```")) {
            index += 1;
            continue;
        }
        const infoString = line.slice(3).trim();
        const body = [];
        const spanStart = index + 1;
        index += 1;
        while (index < lines.length && lines[index] !== "```") {
            body.push({ lineNumber: index + 1, text: lines[index] });
            index += 1;
        }
        if (index >= lines.length) {
            throw new Error(`Unclosed fenced block starting on line ${spanStart}.`);
        }
        const spanEnd = index + 1;
        blocks.push({ infoString, body, spanStart, spanEnd });
        index += 1;
    }
    return blocks;
}
function parseInfoString(infoString, sourceFile, lineNumber) {
    const tokens = tokenizePairs(infoString);
    if (tokens.length === 0 || tokens[0].key !== "__head__") {
        throw new WireSpecParseError("Missing fence info string.", sourceSpan(sourceFile, lineNumber, 1, lineNumber, infoString.length + 4));
    }
    const head = String(tokens[0].value);
    if (head !== "wirespec") {
        throw new WireSpecParseError("Expected a wirespec fence.", sourceSpan(sourceFile, lineNumber, 1, lineNumber, infoString.length + 4));
    }
    const result = {};
    for (const token of tokens.slice(1)) {
        result[token.key] = token.value;
    }
    const kind = result.kind;
    if (kind !== "base" &&
        kind !== "state" &&
        kind !== "breakpoint" &&
        kind !== "theme" &&
        kind !== "mode") {
        throw new WireSpecParseError(`Unsupported wirespec block kind: ${String(kind)}`, sourceSpan(sourceFile, lineNumber, 1, lineNumber, infoString.length + 4));
    }
    const info = {
        kind,
    };
    if (typeof result.v === "number") {
        info.v = result.v;
    }
    else if (typeof result.v === "string" && /^-?\d+(\.\d+)?$/.test(result.v)) {
        info.v = Number(result.v);
    }
    if (typeof result.name === "string") {
        info.name = result.name;
    }
    if (typeof result.min === "number") {
        info.min = result.min;
    }
    else if (typeof result.min === "string" && /^-?\d+$/.test(result.min)) {
        info.min = Number(result.min);
    }
    if (typeof result.max === "number") {
        info.max = result.max;
    }
    else if (typeof result.max === "string" && /^-?\d+$/.test(result.max)) {
        info.max = Number(result.max);
    }
    for (const [key, value] of Object.entries(result)) {
        if (!(key in info)) {
            info[key] = value;
        }
    }
    return info;
}
function tokenizePairs(input) {
    const pairs = [];
    let index = 0;
    const readBare = () => {
        const start = index;
        while (index < input.length && !/\s/.test(input[index]) && input[index] !== "=") {
            index += 1;
        }
        return input.slice(start, index);
    };
    const readValueToken = () => {
        if (input[index] === '"') {
            let value = '"';
            index += 1;
            let escapeNext = false;
            while (index < input.length) {
                const char = input[index];
                value += char;
                index += 1;
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (char === "\\") {
                    escapeNext = true;
                    continue;
                }
                if (char === '"') {
                    break;
                }
            }
            return value;
        }
        if (input[index] === "[") {
            let value = "[";
            index += 1;
            let depth = 1;
            let inQuote = false;
            let escapeNext = false;
            while (index < input.length && depth > 0) {
                const char = input[index];
                value += char;
                index += 1;
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (char === "\\") {
                    escapeNext = true;
                    continue;
                }
                if (char === '"') {
                    inQuote = !inQuote;
                    continue;
                }
                if (!inQuote && char === "[") {
                    depth += 1;
                    continue;
                }
                if (!inQuote && char === "]") {
                    depth -= 1;
                }
            }
            return value;
        }
        const start = index;
        while (index < input.length && !/\s/.test(input[index])) {
            index += 1;
        }
        return input.slice(start, index);
    };
    while (index < input.length) {
        while (index < input.length && /\s/.test(input[index])) {
            index += 1;
        }
        if (index >= input.length) {
            break;
        }
        const key = readBare();
        if (!key) {
            break;
        }
        if (index >= input.length || input[index] !== "=") {
            pairs.push({ key: "__head__", value: key });
            continue;
        }
        index += 1;
        const rawValue = readValueToken();
        pairs.push({ key, value: parseValue(rawValue) });
    }
    return pairs;
}
function parseNodeLine(rawLine, sourceFile, lineNumber) {
    const tokens = tokenizePairs(rawLine.trim());
    if (tokens.length === 0) {
        throw new WireSpecParseError("Expected a node definition.", sourceSpan(sourceFile, lineNumber, 1, lineNumber, rawLine.length + 1));
    }
    const head = tokens[0];
    if (head.key !== "__head__") {
        throw new WireSpecParseError("A node line must start with a kind token.", sourceSpan(sourceFile, lineNumber, 1, lineNumber, rawLine.length + 1));
    }
    const props = {};
    for (const token of tokens.slice(1)) {
        props[token.key] = token.value;
    }
    const id = typeof props.id === "string" ? props.id : undefined;
    if (id) {
        delete props.id;
    }
    return {
        kind: String(head.value),
        id,
        props,
        spanColumnEnd: rawLine.length + 1,
    };
}
function finalizeSpans(node) {
    if (node.children.length === 0) {
        return node.span;
    }
    let lastLine = node.span.lineEnd;
    let lastColumn = node.span.columnEnd;
    for (const child of node.children) {
        const childSpan = finalizeSpans(child);
        if (childSpan.lineEnd > lastLine ||
            (childSpan.lineEnd === lastLine && childSpan.columnEnd > lastColumn)) {
            lastLine = childSpan.lineEnd;
            lastColumn = childSpan.columnEnd;
        }
    }
    node.span = {
        ...node.span,
        lineEnd: lastLine,
        columnEnd: lastColumn,
    };
    return node.span;
}
function parseNodeTree(lines, sourceFile, baseIndent = 0) {
    if (lines.length === 0) {
        throw new WireSpecParseError("Expected at least one node line.");
    }
    const stack = [];
    let root;
    for (const line of lines) {
        if (!line.text.trim()) {
            continue;
        }
        if (line.text.includes("\t")) {
            throw new WireSpecParseError("Tabs are invalid inside wirespec blocks.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
        }
        const indent = countLeadingSpaces(line.text);
        if (indent < baseIndent) {
            throw new WireSpecParseError("Indentation was smaller than the current block baseline.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
        }
        const relative = indent - baseIndent;
        if (relative % 2 !== 0) {
            throw new WireSpecParseError("Indentation must use two spaces per level.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
        }
        const depth = relative / 2;
        if (depth > stack.length) {
            throw new WireSpecParseError("Indentation jumped by more than one level.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
        }
        const parsed = parseNodeLine(line.text.slice(indent), sourceFile, line.lineNumber);
        const node = {
            kind: parsed.kind,
            id: parsed.id,
            props: parsed.props,
            children: [],
            span: sourceSpan(sourceFile, line.lineNumber, indent + 1, line.lineNumber, parsed.spanColumnEnd),
        };
        if (depth === 0) {
            if (root) {
                throw new WireSpecParseError("A base tree or insert subtree may only have one root node.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            root = node;
        }
        else {
            const parent = stack[depth - 1];
            if (!parent) {
                throw new WireSpecParseError("Missing parent node for indentation depth.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            parent.children.push(node);
        }
        stack[depth] = node;
        stack.length = depth + 1;
    }
    if (!root) {
        throw new WireSpecParseError("No node tree was found.");
    }
    finalizeSpans(root);
    return root;
}
function parseVariantOps(lines, sourceFile) {
    const ops = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        if (!line.text.trim()) {
            index += 1;
            continue;
        }
        if (countLeadingSpaces(line.text) !== 0) {
            throw new WireSpecParseError("Variant operations must start at column 1.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
        }
        const tokens = tokenizePairs(line.text.trim());
        const head = tokens[0];
        if (!head || head.key !== "__head__") {
            throw new WireSpecParseError("Variant operations must start with an operation name.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
        }
        const opName = String(head.value);
        const props = {};
        for (const token of tokens.slice(1)) {
            props[token.key] = token.value;
        }
        if (opName === "patch") {
            const target = props.target;
            if (typeof target !== "string") {
                throw new WireSpecParseError("patch requires target=<id>.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            delete props.target;
            ops.push({
                op: "patch",
                target,
                props,
                span: sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1),
            });
            index += 1;
            continue;
        }
        if (opName === "show" || opName === "hide" || opName === "remove") {
            const target = props.target;
            if (typeof target !== "string") {
                throw new WireSpecParseError(`${opName} requires target=<id>.`, sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            ops.push({
                op: opName,
                target,
                span: sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1),
            });
            index += 1;
            continue;
        }
        if (opName === "insert") {
            const position = props.position;
            const ref = props.ref;
            if (position !== "before" &&
                position !== "after" &&
                position !== "inside-start" &&
                position !== "inside-end") {
                throw new WireSpecParseError("insert requires a valid position=...", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            if (typeof ref !== "string") {
                throw new WireSpecParseError("insert requires ref=<id>.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            const subtreeLines = [];
            index += 1;
            while (index < lines.length) {
                const next = lines[index];
                if (!next.text.trim()) {
                    index += 1;
                    continue;
                }
                if (countLeadingSpaces(next.text) === 0) {
                    break;
                }
                subtreeLines.push(next);
                index += 1;
            }
            if (subtreeLines.length === 0) {
                throw new WireSpecParseError("insert must be followed by an indented subtree.", sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
            }
            const subtree = parseNodeTree(subtreeLines, sourceFile, countLeadingSpaces(subtreeLines[0].text));
            ops.push({
                op: "insert",
                position,
                ref,
                node: subtree,
                span: sourceSpan(sourceFile, line.lineNumber, 1, subtree.span.lineEnd, subtree.span.columnEnd),
            });
            continue;
        }
        throw new WireSpecParseError(`Unsupported variant operation: ${opName}`, sourceSpan(sourceFile, line.lineNumber, 1, line.lineNumber, line.text.length + 1));
    }
    return ops;
}
function parseSections(lines, sourceFile) {
    const sections = [];
    const acceptance = [];
    let documentTitle = "";
    let inFence = false;
    let current = null;
    const flush = () => {
        if (!current) {
            return;
        }
        const body = current.lines
            .map((line) => line.text)
            .join("\n")
            .trim();
        const meaningfulLines = current.lines.filter((line) => line.text.trim() !== "");
        const spanStartLine = meaningfulLines[0]?.lineNumber ?? current.startLine;
        const spanStartColumn = meaningfulLines[0]?.text.search(/\S|$/) !== undefined
            ? (meaningfulLines[0]?.text.search(/\S|$/) ?? 0) + 1
            : 1;
        const lastMeaningful = meaningfulLines.at(-1);
        const kind = current.title.toLowerCase() === "intent"
            ? "intent"
            : current.title.toLowerCase() === "acceptance"
                ? "acceptance"
                : current.title.toLowerCase() === "notes"
                    ? "notes"
                    : "other";
        const section = {
            id: normalizeSectionId(current.title),
            title: current.title,
            kind,
            body,
            span: sourceSpan(sourceFile, spanStartLine, spanStartColumn, lastMeaningful?.lineNumber ?? spanStartLine, (lastMeaningful?.text.length ?? 0) + 1),
        };
        sections.push(section);
        if (kind === "acceptance") {
            let counter = 1;
            for (const line of current.lines) {
                const trimmed = line.text.trim();
                if (!trimmed.startsWith("- ")) {
                    continue;
                }
                const text = trimmed.slice(2).trim();
                if (!text) {
                    continue;
                }
                acceptance.push({
                    id: `acc-${counter}`,
                    text,
                    level: "must",
                    tags: [],
                    span: sourceSpan(sourceFile, line.lineNumber, line.text.indexOf("- ") + 1, line.lineNumber, line.text.length + 1),
                });
                counter += 1;
            }
        }
        current = null;
    };
    for (let index = 0; index < lines.length; index += 1) {
        const raw = lines[index];
        const lineNumber = index + 1;
        if (raw.startsWith("```")) {
            inFence = !inFence;
            continue;
        }
        if (inFence) {
            continue;
        }
        if (raw.startsWith("# ")) {
            documentTitle = raw.slice(2).trim();
            continue;
        }
        if (raw.startsWith("## ")) {
            flush();
            current = {
                title: raw.slice(3).trim(),
                lines: [],
                startLine: lineNumber + 1,
            };
            continue;
        }
        if (current) {
            current.lines.push({ lineNumber, text: raw });
        }
    }
    flush();
    return {
        documentTitle,
        sections,
        acceptance,
    };
}
export function parseWireSpecDocument(source, sourceFile = "document.wirespec.md") {
    const lines = source.replaceAll("\r\n", "\n").split("\n");
    const { metadata } = parseFrontmatter(lines, sourceFile);
    const { documentTitle, sections, acceptance } = parseSections(lines, sourceFile);
    const fences = parseFenceBlocks(lines);
    const wirespecFences = fences
        .filter((fence) => fence.infoString.startsWith("wirespec"))
        .map((fence) => ({
        ...fence,
        info: parseInfoString(fence.infoString, sourceFile, fence.spanStart),
    }));
    const baseFence = wirespecFences.find((fence) => fence.info.kind === "base");
    if (!baseFence) {
        throw new WireSpecParseError("A document must contain one base wirespec block.");
    }
    const extraBaseFence = wirespecFences.find((fence) => fence.info.kind === "base" && fence !== baseFence);
    if (extraBaseFence) {
        throw new WireSpecParseError("A document may not contain more than one base wirespec block.", sourceSpan(sourceFile, extraBaseFence.spanStart, 1, extraBaseFence.spanEnd, 4));
    }
    const root = parseNodeTree(baseFence.body, sourceFile);
    const variants = wirespecFences
        .filter((fence) => fence.info.kind !== "base")
        .map((fence) => {
        const name = typeof fence.info.name === "string" ? fence.info.name : fence.info.kind;
        return {
            kind: fence.info.kind,
            name,
            when: fence.info.kind === "breakpoint"
                ? {
                    minWidth: typeof fence.info.min === "number" ? fence.info.min : undefined,
                    maxWidth: typeof fence.info.max === "number" ? fence.info.max : undefined,
                }
                : undefined,
            ops: parseVariantOps(fence.body, sourceFile),
            span: sourceSpan(sourceFile, fence.spanStart, 1, fence.spanEnd, 4),
        };
    });
    const intent = sections.find((section) => section.kind === "intent")?.body;
    const notes = sections.find((section) => section.kind === "notes")?.body;
    return {
        schemaVersion: "1.0.0-rc0",
        sourceFormat: "markdown+wirespec",
        sourceFile,
        metadata,
        documentTitle,
        intent,
        notes,
        sections,
        acceptance,
        root,
        variants,
    };
}
