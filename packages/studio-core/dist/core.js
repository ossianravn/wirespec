const STRICT_CHILD_RULES = {
    breadcrumbs: new Set(["breadcrumb-item"]),
    tabs: new Set(["tab"]),
    stepper: new Set(["step"]),
    list: new Set(["list-item"]),
    table: new Set(["table-header", "table-body"]),
    "table-header": new Set(["table-row"]),
    "table-body": new Set(["table-row"]),
    "table-row": new Set(["table-cell"]),
    "radio-group": new Set(["radio"]),
    actions: new Set(["button", "link"]),
};
const FORM_CHILDREN = new Set([
    "heading",
    "text",
    "helper",
    "alert",
    "field",
    "textarea",
    "select",
    "checkbox",
    "radio-group",
    "switch",
    "combobox",
    "row",
    "column",
    "grid",
    "stack",
    "actions",
    "divider",
    "link",
]);
const TOOLBAR_CHILDREN = new Set([
    "field",
    "textarea",
    "select",
    "checkbox",
    "radio-group",
    "switch",
    "combobox",
    "button",
    "link",
    "status",
    "badge",
    "helper",
]);
const STABLE_ID_KINDS = new Set([
    "header",
    "nav",
    "main",
    "aside",
    "footer",
    "section",
    "toolbar",
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
    "breadcrumbs",
    "breadcrumb-item",
    "tabs",
    "tab",
    "tab-panel",
    "list",
    "list-item",
    "table",
    "table-header",
    "table-body",
    "table-row",
    "table-cell",
    "pagination",
    "stepper",
    "step",
    "heading",
    "text",
    "helper",
    "alert",
    "badge",
    "status",
    "empty-state",
    "field",
    "textarea",
    "select",
    "checkbox",
    "radio-group",
    "radio",
    "switch",
    "combobox",
    "button",
    "link",
]);
export class StudioCommandError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "StudioCommandError";
        this.code = code;
    }
}
function structuredCloneValue(value) {
    const clone = globalThis.structuredClone;
    if (typeof clone === "function") {
        return clone(value);
    }
    return JSON.parse(JSON.stringify(value));
}
export function syntheticSpan(file = "studio") {
    return {
        file,
        lineStart: 1,
        columnStart: 1,
        lineEnd: 1,
        columnEnd: 1,
    };
}
function clampPosition(position, length) {
    if (position === undefined || Number.isNaN(position)) {
        return length;
    }
    return Math.max(0, Math.min(length, position));
}
function visitTree(node, parent, callback) {
    callback({
        node,
        parent,
        index: parent ? parent.children.indexOf(node) : 0,
    });
    for (const child of node.children) {
        visitTree(child, node, callback);
    }
}
function indexTree(root) {
    const ids = new Map();
    visitTree(root, undefined, (entry) => {
        if (!entry.node.id) {
            return;
        }
        if (ids.has(entry.node.id)) {
            throw new StudioCommandError("STUDIO_DUPLICATE_ID", `Duplicate id "${entry.node.id}" already exists.`);
        }
        ids.set(entry.node.id, entry);
    });
    return ids;
}
function collectIds(node, ids) {
    if (node.id) {
        ids.add(node.id);
    }
    for (const child of node.children) {
        collectIds(child, ids);
    }
}
function collectVariantInsertIds(variants, ids) {
    for (const variant of variants) {
        for (const op of variant.ops) {
            if (op.op === "insert") {
                collectIds(op.node, ids);
            }
        }
    }
}
function slugify(value) {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "item";
}
function nodeLabelSeed(node) {
    const candidate = (typeof node.props.label === "string" && node.props.label) ||
        (typeof node.props.title === "string" && node.props.title) ||
        (typeof node.props.text === "string" && node.props.text) ||
        (typeof node.props.name === "string" && node.props.name) ||
        node.kind;
    return slugify(candidate);
}
function ensureUniqueId(baseId, usedIds) {
    if (!usedIds.has(baseId)) {
        usedIds.add(baseId);
        return baseId;
    }
    let suffix = 2;
    while (usedIds.has(`${baseId}-${suffix}`)) {
        suffix += 1;
    }
    const nextId = `${baseId}-${suffix}`;
    usedIds.add(nextId);
    return nextId;
}
function normalizeNode(node, usedIds, file) {
    const normalized = {
        kind: node.kind,
        id: node.id,
        props: { ...(node.props ?? {}) },
        children: [],
        span: node.span ? { ...node.span } : syntheticSpan(file),
    };
    if (!normalized.id && STABLE_ID_KINDS.has(normalized.kind)) {
        normalized.id = ensureUniqueId(`${normalized.kind}-${nodeLabelSeed(normalized)}`, usedIds);
    }
    else if (normalized.id) {
        if (usedIds.has(normalized.id)) {
            throw new StudioCommandError("STUDIO_DUPLICATE_ID", `Duplicate id "${normalized.id}" already exists.`);
        }
        usedIds.add(normalized.id);
    }
    normalized.children = (node.children ?? []).map((child) => normalizeNode(child, usedIds, file));
    return normalized;
}
function findVariantIndex(document, kind, name) {
    return document.variants.findIndex((variant) => variant.kind === kind && variant.name === name);
}
function createVariantBlock(kind, name, file, when) {
    return {
        kind,
        name,
        when: when ? { ...when } : undefined,
        ops: [],
        span: syntheticSpan(file),
    };
}
function cloneDocument(document) {
    return structuredCloneValue(document);
}
function removeChild(parent, index) {
    const [removed] = parent.children.splice(index, 1);
    if (!removed) {
        throw new StudioCommandError("STUDIO_NODE_NOT_FOUND", "The requested child was not found.");
    }
    return removed;
}
function insertChild(parent, position, node) {
    const insertAt = clampPosition(position, parent.children.length);
    parent.children.splice(insertAt, 0, node);
}
function isDirectSemanticChild(parentKind, childKind) {
    const strictRule = STRICT_CHILD_RULES[parentKind];
    if (strictRule) {
        return strictRule.has(childKind);
    }
    if (parentKind === "form") {
        return FORM_CHILDREN.has(childKind);
    }
    if (parentKind === "toolbar") {
        return TOOLBAR_CHILDREN.has(childKind);
    }
    return true;
}
export function canInsertSemanticChild(parentKind, childKind) {
    return isDirectSemanticChild(parentKind, childKind);
}
export function createStudioNode(kind, options = {}) {
    return {
        kind,
        id: options.id,
        props: { ...(options.props ?? {}) },
        children: structuredCloneValue(options.children ?? []),
        span: syntheticSpan(options.sourceFile),
    };
}
function nodeIdsForDocument(document) {
    const ids = new Set();
    collectIds(document.root, ids);
    collectVariantInsertIds(document.variants, ids);
    return ids;
}
function variantKnownIds(document, block, options = {}) {
    const ids = new Set();
    collectIds(document.root, ids);
    for (const variant of document.variants) {
        if (variant === block) {
            break;
        }
        collectVariantInsertIds([variant], ids);
    }
    if (options.includeCurrentBlockOps !== false) {
        for (const op of block.ops) {
            if (op.op === "insert") {
                collectIds(op.node, ids);
            }
        }
    }
    return ids;
}
function normalizeVariantOps(document, block, ops, options = {}) {
    const knownIds = variantKnownIds(document, block, options);
    return ops.map((entry) => {
        const op = structuredCloneValue(entry);
        op.span = op.span ? { ...op.span } : syntheticSpan(document.sourceFile);
        if (op.op === "insert") {
            op.node = normalizeNode(op.node, knownIds, document.sourceFile);
            if (!knownIds.has(op.ref)) {
                throw new StudioCommandError("STUDIO_UNKNOWN_VARIANT_TARGET", `Unknown insert ref "${op.ref}".`);
            }
            return op;
        }
        if (!knownIds.has(op.target)) {
            throw new StudioCommandError("STUDIO_UNKNOWN_VARIANT_TARGET", `Unknown variant target "${op.target}".`);
        }
        return op;
    });
}
function unwrapAllowed(parentKind, wrapper) {
    return wrapper.children.every((child) => isDirectSemanticChild(parentKind, child.kind));
}
function assertNotRoot(root, nodeId) {
    if (root.id === nodeId) {
        throw new StudioCommandError("STUDIO_ROOT_MUTATION", "The root node may not be removed, moved, or unwrapped.");
    }
}
function assertNotDescendant(root, nodeId, newParentId) {
    const index = indexTree(root);
    const moving = index.get(nodeId);
    const target = index.get(newParentId);
    if (!moving || !target) {
        return;
    }
    let current = target.parent;
    while (current) {
        if (current.id === nodeId) {
            throw new StudioCommandError("STUDIO_INVALID_MOVE", "A node may not be moved inside its own subtree.");
        }
        current = current.id ? index.get(current.id)?.parent : undefined;
    }
}
export function planSemanticInsert(document, intent) {
    const index = indexTree(document.root);
    const parent = index.get(intent.parentId);
    if (!parent) {
        throw new StudioCommandError("STUDIO_PARENT_NOT_FOUND", `Unknown parent id "${intent.parentId}".`);
    }
    const position = clampPosition(intent.position, parent.node.children.length);
    if (isDirectSemanticChild(parent.node.kind, intent.nodeKind)) {
        return {
            parentId: intent.parentId,
            position,
            direct: true,
        };
    }
    if (intent.nodeKind === "table-row" && parent.node.kind === "table") {
        const body = parent.node.children.find((child) => child.kind === "table-body");
        if (!body?.id) {
            throw new StudioCommandError("STUDIO_INVALID_DROP", "table-row must be dropped into table-body or table-header.");
        }
        return {
            parentId: body.id,
            position: body.children.length,
            direct: false,
            notice: {
                code: "STUDIO_AUTOCORRECT_TABLE_ROW",
                level: "info",
                message: "Moved the row into the table body because table rows must live inside table-body or table-header.",
            },
        };
    }
    throw new StudioCommandError("STUDIO_INVALID_DROP", `${intent.nodeKind} may not be inserted directly inside ${parent.node.kind}.`);
}
function refreshProjection(document, adapters) {
    if (!adapters) {
        return undefined;
    }
    const projection = {};
    if (adapters.formatDocument) {
        projection.canonicalSource = adapters.formatDocument(document);
    }
    if (adapters.buildVariantRefs) {
        projection.variantRefs = adapters.buildVariantRefs(document);
    }
    if (adapters.buildSourceMap) {
        projection.sourceMap = adapters.buildSourceMap(document, {
            entryFile: adapters.entryFile ?? document.sourceFile,
            variantRefs: projection.variantRefs,
        });
    }
    return projection;
}
export function createStudioSession(document, adapters) {
    const cloned = cloneDocument(document);
    return {
        document: cloned,
        past: [],
        future: [],
        lastNotices: [],
        adapters,
        projection: refreshProjection(cloned, adapters),
    };
}
function nextAcceptanceId(acceptance, text) {
    const base = `acceptance-${slugify(text).slice(0, 32)}`;
    const ids = new Set(acceptance.map((criterion) => criterion.id));
    return ensureUniqueId(base, ids);
}
function syncAcceptanceSection(document) {
    const body = document.acceptance.map((criterion) => `- ${criterion.text}`).join("\n");
    const existing = document.sections.find((section) => section.kind === "acceptance");
    if (existing) {
        existing.title = "Acceptance";
        existing.body = body;
        return;
    }
    if (!body) {
        return;
    }
    document.sections.push({
        id: "acceptance",
        title: "Acceptance",
        kind: "acceptance",
        body,
        span: syntheticSpan(document.sourceFile),
    });
}
function addVariantOp(document, command) {
    const notices = [];
    let variantIndex = findVariantIndex(document, command.variant.kind, command.variant.name);
    if (variantIndex === -1) {
        document.variants.push(createVariantBlock(command.variant.kind, command.variant.name, document.sourceFile, command.variant.when));
        variantIndex = document.variants.length - 1;
        notices.push({
            code: "STUDIO_CREATED_VARIANT",
            level: "info",
            message: `Created ${command.variant.kind} variant "${command.variant.name}".`,
        });
    }
    const block = document.variants[variantIndex];
    if (command.variant.when && command.variant.kind === "breakpoint") {
        block.when = { ...command.variant.when };
    }
    const [op] = normalizeVariantOps(document, block, [command.op], {
        includeCurrentBlockOps: true,
    });
    block.ops.push(op);
    return notices;
}
function replaceVariant(document, command) {
    const notices = [];
    let variantIndex = findVariantIndex(document, command.variant.kind, command.variant.name);
    if (variantIndex === -1) {
        document.variants.push(createVariantBlock(command.variant.kind, command.variant.name, document.sourceFile, command.variant.when));
        variantIndex = document.variants.length - 1;
        notices.push({
            code: "STUDIO_CREATED_VARIANT",
            level: "info",
            message: `Created ${command.variant.kind} variant "${command.variant.name}".`,
        });
    }
    const block = document.variants[variantIndex];
    if (command.variant.kind === "breakpoint") {
        if (command.variant.when) {
            block.when = { ...command.variant.when };
        }
    }
    else {
        block.when = undefined;
    }
    block.ops = normalizeVariantOps(document, block, command.ops, {
        includeCurrentBlockOps: false,
    });
    return notices;
}
function removeVariant(document, variant) {
    const variantIndex = findVariantIndex(document, variant.kind, variant.name);
    if (variantIndex === -1) {
        return;
    }
    document.variants.splice(variantIndex, 1);
}
export function applyStudioCommand(document, command) {
    const next = cloneDocument(document);
    const notices = [];
    const index = indexTree(next.root);
    switch (command.type) {
        case "insert-node": {
            const plan = planSemanticInsert(next, {
                parentId: command.parentId,
                nodeKind: command.node.kind,
                position: command.position,
            });
            if (plan.notice) {
                notices.push(plan.notice);
            }
            const refreshedIndex = indexTree(next.root);
            const parent = refreshedIndex.get(plan.parentId);
            if (!parent) {
                throw new StudioCommandError("STUDIO_PARENT_NOT_FOUND", `Unknown parent id "${plan.parentId}".`);
            }
            const usedIds = nodeIdsForDocument(next);
            const normalizedNode = normalizeNode(command.node, usedIds, next.sourceFile);
            insertChild(parent.node, plan.position, normalizedNode);
            break;
        }
        case "remove-node": {
            assertNotRoot(next.root, command.nodeId);
            const target = index.get(command.nodeId);
            if (!target || !target.parent) {
                throw new StudioCommandError("STUDIO_NODE_NOT_FOUND", `Unknown node id "${command.nodeId}".`);
            }
            removeChild(target.parent, target.index);
            break;
        }
        case "move-node": {
            assertNotRoot(next.root, command.nodeId);
            assertNotDescendant(next.root, command.nodeId, command.newParentId);
            const movingIndex = indexTree(next.root);
            const moving = movingIndex.get(command.nodeId);
            if (!moving || !moving.parent) {
                throw new StudioCommandError("STUDIO_NODE_NOT_FOUND", `Unknown node id "${command.nodeId}".`);
            }
            const movedNode = removeChild(moving.parent, moving.index);
            const plan = planSemanticInsert(next, {
                parentId: command.newParentId,
                nodeKind: movedNode.kind,
                position: command.position,
            });
            if (plan.notice) {
                notices.push(plan.notice);
            }
            const afterMoveIndex = indexTree(next.root);
            const parent = afterMoveIndex.get(plan.parentId);
            if (!parent) {
                throw new StudioCommandError("STUDIO_PARENT_NOT_FOUND", `Unknown parent id "${plan.parentId}".`);
            }
            insertChild(parent.node, plan.position, movedNode);
            break;
        }
        case "patch-node": {
            const target = index.get(command.nodeId);
            if (!target) {
                throw new StudioCommandError("STUDIO_NODE_NOT_FOUND", `Unknown node id "${command.nodeId}".`);
            }
            if ("id" in command.props) {
                throw new StudioCommandError("STUDIO_PATCH_ID", "patch-node may not change node ids.");
            }
            target.node.props = {
                ...target.node.props,
                ...command.props,
            };
            break;
        }
        case "wrap-node": {
            assertNotRoot(next.root, command.nodeId);
            const target = index.get(command.nodeId);
            if (!target || !target.parent) {
                throw new StudioCommandError("STUDIO_NODE_NOT_FOUND", `Unknown node id "${command.nodeId}".`);
            }
            const usedIds = nodeIdsForDocument(next);
            const wrapper = normalizeNode(command.wrapper, usedIds, next.sourceFile);
            if (!isDirectSemanticChild(target.parent.kind, wrapper.kind)) {
                throw new StudioCommandError("STUDIO_INVALID_WRAP", `${wrapper.kind} may not wrap content inside ${target.parent.kind}.`);
            }
            if (!isDirectSemanticChild(wrapper.kind, target.node.kind)) {
                throw new StudioCommandError("STUDIO_INVALID_WRAP", `${target.node.kind} may not be wrapped by ${wrapper.kind}.`);
            }
            wrapper.children = [target.node];
            target.parent.children.splice(target.index, 1, wrapper);
            break;
        }
        case "unwrap-node": {
            assertNotRoot(next.root, command.nodeId);
            const target = index.get(command.nodeId);
            if (!target || !target.parent) {
                throw new StudioCommandError("STUDIO_NODE_NOT_FOUND", `Unknown node id "${command.nodeId}".`);
            }
            if (!unwrapAllowed(target.parent.kind, target.node)) {
                throw new StudioCommandError("STUDIO_INVALID_UNWRAP", `${target.node.kind} may not be unwrapped inside ${target.parent.kind}.`);
            }
            target.parent.children.splice(target.index, 1, ...target.node.children);
            break;
        }
        case "add-variant-op": {
            notices.push(...addVariantOp(next, command));
            break;
        }
        case "replace-variant": {
            notices.push(...replaceVariant(next, command));
            break;
        }
        case "remove-variant": {
            removeVariant(next, command.variant);
            break;
        }
        case "add-acceptance": {
            const text = command.text.trim();
            if (!text) {
                throw new StudioCommandError("STUDIO_ACCEPTANCE_TEXT", "Acceptance text may not be empty.");
            }
            next.acceptance.push({
                id: nextAcceptanceId(next.acceptance, text),
                text,
                level: command.level,
                tags: [...(command.tags ?? [])],
                span: syntheticSpan(next.sourceFile),
            });
            syncAcceptanceSection(next);
            break;
        }
    }
    return {
        document: next,
        notices,
    };
}
export function applyStudioCommandToSession(session, command) {
    const result = applyStudioCommand(session.document, command);
    return {
        document: result.document,
        past: [...session.past, cloneDocument(session.document)],
        future: [],
        lastCommand: structuredCloneValue(command),
        lastNotices: result.notices,
        adapters: session.adapters,
        projection: refreshProjection(result.document, session.adapters),
    };
}
export function undoStudioSession(session) {
    if (session.past.length === 0) {
        return session;
    }
    const previous = session.past[session.past.length - 1];
    return {
        document: cloneDocument(previous),
        past: session.past.slice(0, -1).map(cloneDocument),
        future: [cloneDocument(session.document), ...session.future.map(cloneDocument)],
        lastCommand: session.lastCommand,
        lastNotices: [],
        adapters: session.adapters,
        projection: refreshProjection(previous, session.adapters),
    };
}
export function redoStudioSession(session) {
    if (session.future.length === 0) {
        return session;
    }
    const nextDocument = session.future[0];
    return {
        document: cloneDocument(nextDocument),
        past: [...session.past.map(cloneDocument), cloneDocument(session.document)],
        future: session.future.slice(1).map(cloneDocument),
        lastCommand: session.lastCommand,
        lastNotices: [],
        adapters: session.adapters,
        projection: refreshProjection(nextDocument, session.adapters),
    };
}
export function formatStudioDocument(session) {
    if (session.projection?.canonicalSource) {
        return session.projection.canonicalSource;
    }
    if (session.adapters?.formatDocument) {
        return session.adapters.formatDocument(session.document);
    }
    throw new StudioCommandError("STUDIO_FORMATTER_MISSING", "No formatter adapter was provided for this studio session.");
}
export function projectStudioDocument(document, adapters) {
    return refreshProjection(document, adapters) ?? {};
}
