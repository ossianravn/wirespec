const USER_COPY_PROPS = ["label", "title", "text", "placeholder", "description", "options"];
const CONTAINER_KINDS = new Set(["row", "column", "grid", "stack", "main", "section", "aside"]);
const PRIMARY_ACTION_CONTEXTS = new Set(["actions", "toolbar"]);
const INTERACTIVE_KINDS = new Set([
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
    "form",
]);
const CONTENT_ONLY_KINDS = new Set([
    "card",
    "panel",
    "section",
    "heading",
    "text",
    "helper",
    "badge",
    "status",
    "divider",
    "avatar",
    "icon",
]);
const KPI_WORDS = /\b(total|active|completed|pending|conversion|revenue|sales|arr|mrr|churn|growth|visitors|users|uptime|health|performance|analytics|insights|metrics?)\b/i;
const GENERIC_SHELL_WORDS = /\b(dashboard|overview|workspace home|team home|control center|command center)\b/i;
const GENERIC_CHROME_WORDS = /\b(overview|insights|metrics?|analytics|activity|performance|summary|status center)\b/i;
const PLACEHOLDER_COPY = /^(lorem ipsum|placeholder|tbd|todo|sample text|sample data|your data|section \d+|item \d+|card \d+|title|subtitle|description|click here|learn more|start here|coming soon)$/i;
const PLACEHOLDER_COPY_FRAGMENT = /(content goes here|replace me|add copy here|write something here|placeholder text)/i;
const VAGUE_ACCEPTANCE = /\b(looks good|works well|user friendly|easy to use|modern|clean|intuitive|responsive|polished|nice)\b/i;
const DEV_CONTEXT = /\b(react|tailwind|css|component|prop|hook|api|endpoint|frontend|backend|developer|engineer|agent|codex|llm|debug|todo|fixme|wire up|implementation)\b/i;
const LOADING_STATE = /\b(loading|submitting|saving|sending|syncing|searching|refreshing|busy|autosaving)\b/i;
const ERROR_STATE = /\b(error|failed|failure|invalid|blocked|denied)\b/i;
const EMPTY_STATE = /\b(empty|no-results|no results|blank)\b/i;
function compareDiagnostics(left, right) {
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
function pushDiagnostic(diagnostics, code, message, span, targetId, fixHint) {
    diagnostics.push({
        code,
        level: "warning",
        message,
        span,
        targetId,
        fixHint,
    });
}
function flattenTree(node, parent, entries) {
    const entry = { node, parent };
    entries.push(entry);
    for (const child of node.children) {
        flattenTree(child, entry, entries);
    }
}
function isDescendantOf(entry, ancestor) {
    let current = entry.parent;
    while (current) {
        if (current === ancestor) {
            return true;
        }
        current = current.parent;
    }
    return false;
}
function descendantsOf(entry, entries) {
    return entries.filter((candidate) => candidate !== entry && isDescendantOf(candidate, entry));
}
function directChildrenOf(entry, entries) {
    return entries.filter((candidate) => candidate.parent === entry);
}
function stringValues(value) {
    if (value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === "string" ? item.trim() : String(item)))
            .filter(Boolean);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }
    return [String(value)];
}
function nodeCopyValues(node) {
    const values = [];
    for (const prop of USER_COPY_PROPS) {
        values.push(...stringValues(node.props[prop]));
    }
    return values;
}
function nodeCopyText(node) {
    return nodeCopyValues(node).join(" ");
}
function documentText(document) {
    return [
        document.documentTitle,
        document.intent,
        ...document.acceptance.map((criterion) => criterion.text),
        ...document.sections.map((section) => section.body),
    ]
        .filter(Boolean)
        .join(" ");
}
function hasDescendant(entry, entries, predicate) {
    return descendantsOf(entry, entries).some(predicate);
}
function isPrimaryButton(node) {
    if (node.kind !== "button") {
        return false;
    }
    if (node.props.visible === false) {
        return false;
    }
    return node.props.variant === "primary" || node.props.action === "submit";
}
function formNeedsSubmitStates(formEntry, entries) {
    const descendants = descendantsOf(formEntry, entries);
    const buttons = descendants.filter((entry) => isPrimaryButton(entry.node));
    if (buttons.length === 0) {
        return false;
    }
    const hasRequiredField = descendants.some((entry) => {
        if (!["field", "textarea", "select", "combobox", "checkbox", "radio-group"].includes(entry.node.kind)) {
            return false;
        }
        return entry.node.props.required === true;
    });
    const hasHighRiskField = descendants.some((entry) => entry.node.kind === "field" &&
        (entry.node.props.type === "password" || entry.node.props.type === "email"));
    const hasAlert = descendants.some((entry) => entry.node.kind === "alert");
    const hasCommitLabel = buttons.some((entry) => /\b(sign in|create|continue|send|save|confirm|check in|pay|submit)\b/i.test(nodeCopyText(entry.node)));
    return hasRequiredField || hasHighRiskField || hasAlert || hasCommitLabel;
}
function looksLikeKpiCard(entry, entries) {
    if (!["card", "panel", "section"].includes(entry.node.kind)) {
        return false;
    }
    const descendants = descendantsOf(entry, entries);
    const copy = [nodeCopyText(entry.node), ...descendants.map((child) => nodeCopyText(child.node))]
        .join(" ")
        .trim();
    if (!copy) {
        return false;
    }
    const hasMetricWords = KPI_WORDS.test(copy);
    const hasNumericValue = /\b\d+([.,]\d+)?(%|k|m|h|min|sec|usd|eur|dkk)?\b/i.test(copy) ||
        /\b(up|down)\s+\d+([.,]\d+)?%/i.test(copy);
    const hasInteraction = descendants.some((child) => INTERACTIVE_KINDS.has(child.node.kind));
    return hasMetricWords && hasNumericValue && !hasInteraction;
}
function isFillerContentCard(entry, entries) {
    if (!["card", "panel"].includes(entry.node.kind)) {
        return false;
    }
    const descendants = descendantsOf(entry, entries);
    if (descendants.some((child) => INTERACTIVE_KINDS.has(child.node.kind))) {
        return false;
    }
    if (descendants.some((child) => ["table", "list", "empty-state", "dialog", "drawer"].includes(child.node.kind))) {
        return false;
    }
    return descendants.every((child) => CONTENT_ONLY_KINDS.has(child.node.kind));
}
function hasLoadingState(document) {
    return document.variants.some((variant) => variant.kind === "state" && LOADING_STATE.test(variant.name));
}
function hasErrorState(document) {
    return document.variants.some((variant) => variant.kind === "state" && ERROR_STATE.test(variant.name));
}
function hasEmptyState(document, entries) {
    return (entries.some((entry) => entry.node.kind === "empty-state") ||
        document.variants.some((variant) => variant.kind === "state" && EMPTY_STATE.test(variant.name)));
}
function lintGenericDashboardShell(document, entries, diagnostics) {
    if (!GENERIC_SHELL_WORDS.test(documentText(document))) {
        return;
    }
    const shellNodes = entries.filter((entry) => ["card", "panel", "section", "aside"].includes(entry.node.kind));
    if (shellNodes.length < 3) {
        return;
    }
    pushDiagnostic(diagnostics, "SLP-01", "This screen reads like a generic dashboard shell instead of a task-first workspace.", document.root.span, document.root.id, "Lead with the user's job to be done and trim generic overview surfaces.");
}
function lintFakeKpiCards(entries, diagnostics) {
    for (const entry of entries) {
        if (!CONTAINER_KINDS.has(entry.node.kind)) {
            continue;
        }
        const children = directChildrenOf(entry, entries);
        const kpiCards = children.filter((child) => looksLikeKpiCard(child, entries));
        if (kpiCards.length < 3) {
            continue;
        }
        pushDiagnostic(diagnostics, "SLP-02", "These cards look like KPI filler rather than information the task actually needs.", entry.node.span, entry.node.id, "Keep summary metrics only when the user's next action depends on them.");
    }
}
function lintRepeatedFillerCards(entries, diagnostics) {
    for (const entry of entries) {
        if (!CONTAINER_KINDS.has(entry.node.kind)) {
            continue;
        }
        const fillerCards = directChildrenOf(entry, entries).filter((child) => isFillerContentCard(child, entries));
        if (fillerCards.length < 4) {
            continue;
        }
        pushDiagnostic(diagnostics, "SLP-03", "Several sibling cards repeat the same filler pattern and bury the real task.", entry.node.span, entry.node.id, "Collapse or remove decorative cards so the working surface stays primary.");
    }
}
function lintVagueCopy(entries, diagnostics) {
    for (const entry of entries) {
        const copy = nodeCopyValues(entry.node);
        const match = copy.find((value) => PLACEHOLDER_COPY.test(value) || PLACEHOLDER_COPY_FRAGMENT.test(value));
        if (!match) {
            continue;
        }
        pushDiagnostic(diagnostics, "SLP-04", `The copy "${match}" is placeholder-like or too vague for an approved spec.`, entry.node.span, entry.node.id, "Use domain language that tells the user what this element actually does.");
    }
}
function lintPrimaryActions(entries, diagnostics) {
    for (const entry of entries) {
        if (entry.node.kind !== "form") {
            continue;
        }
        const descendants = descendantsOf(entry, entries);
        const primaryButtons = descendants.filter((candidate) => isPrimaryButton(candidate.node));
        if (primaryButtons.length === 0) {
            pushDiagnostic(diagnostics, "SLP-05", "This form has no clear primary action.", entry.node.span, entry.node.id, "Add one primary or submit button near the task the form completes.");
            continue;
        }
        if (primaryButtons.length > 1) {
            pushDiagnostic(diagnostics, "SLP-05", "This form has more than one primary action.", entry.node.span, entry.node.id, "Keep one clear primary action and demote the rest.");
            continue;
        }
        const primaryButton = primaryButtons[0];
        let current = primaryButton.parent;
        let insideActions = false;
        while (current && current !== entry) {
            if (PRIMARY_ACTION_CONTEXTS.has(current.node.kind)) {
                insideActions = true;
                break;
            }
            current = current.parent;
        }
        if (!insideActions && entry.node.children.length >= 4) {
            pushDiagnostic(diagnostics, "SLP-05", "The primary action is buried inside the form instead of being grouped near the task completion point.", primaryButton.node.span, primaryButton.node.id, "Wrap the primary button in an actions group near the relevant fields.");
        }
    }
    for (const entry of entries) {
        if (!PRIMARY_ACTION_CONTEXTS.has(entry.node.kind)) {
            continue;
        }
        const directPrimaryButtons = directChildrenOf(entry, entries).filter((child) => isPrimaryButton(child.node));
        if (directPrimaryButtons.length <= 1) {
            continue;
        }
        pushDiagnostic(diagnostics, "SLP-05", "This action group has more than one primary action.", entry.node.span, entry.node.id, "Keep one clear primary action and demote the rest.");
    }
}
function lintMissingStates(document, entries, diagnostics) {
    const loadingState = hasLoadingState(document);
    const errorState = hasErrorState(document);
    const emptyState = hasEmptyState(document, entries);
    for (const entry of entries) {
        if (entry.node.kind !== "form") {
            continue;
        }
        if (!formNeedsSubmitStates(entry, entries)) {
            continue;
        }
        if (!loadingState) {
            pushDiagnostic(diagnostics, "SLP-06", "This submit flow has no loading state.", entry.node.span, entry.node.id, 'Add a state such as `loading` or `submitting` that patches the form or submit button.');
        }
        if (!errorState) {
            pushDiagnostic(diagnostics, "SLP-06", "This submit flow has no failure state.", entry.node.span, entry.node.id, 'Add a state such as `error` or `submit-failed` so recovery is clear.');
        }
    }
    const hasSearch = entries.some((entry) => entry.node.kind === "field" && entry.node.props.type === "search");
    const hasPagination = entries.some((entry) => entry.node.kind === "pagination");
    const hasCollection = entries.some((entry) => entry.node.kind === "table" || entry.node.kind === "list");
    if (!hasCollection || (!hasSearch && !hasPagination)) {
        return;
    }
    if (!loadingState) {
        pushDiagnostic(diagnostics, "SLP-06", "This results view has no loading state.", document.root.span, document.root.id, 'Add a state such as `loading` so the user knows results are on the way.');
    }
    if (!emptyState) {
        pushDiagnostic(diagnostics, "SLP-06", "This results view has no empty state.", document.root.span, document.root.id, 'Add an `empty-state` node or a state such as `empty` with next-step guidance.');
    }
}
function lintMissingMobileBreakpoint(document, entries, diagnostics) {
    const breakpoints = document.variants.filter((variant) => variant.kind === "breakpoint");
    if (document.root.kind !== "screen" || breakpoints.length > 0) {
        return;
    }
    const complexLayout = entries.some((entry) => ["row", "grid", "table", "tabs", "toolbar", "aside", "stepper", "form"].includes(entry.node.kind));
    if (!complexLayout) {
        return;
    }
    pushDiagnostic(diagnostics, "SLP-07", "This screen has no narrow-screen breakpoint.", document.root.span, document.root.id, 'Add a breakpoint such as `kind=breakpoint name=mobile max=767` for the smaller-width fallback.');
}
function lintAcceptance(document, diagnostics) {
    if (document.acceptance.length === 0) {
        pushDiagnostic(diagnostics, "SLP-08", "This spec has no acceptance criteria.", document.root.span, document.root.id, "Add concrete checks for task completion, state handling, and responsive behavior.");
        return;
    }
    const vagueCriterion = document.acceptance.find((criterion) => VAGUE_ACCEPTANCE.test(criterion.text) || criterion.text.trim().split(/\s+/).length < 5);
    if (!vagueCriterion) {
        return;
    }
    pushDiagnostic(diagnostics, "SLP-08", "Acceptance criteria are too vague to verify reliably.", vagueCriterion.span, vagueCriterion.id, "Replace general quality words with observable user outcomes.");
}
function lintDeveloperContext(entries, diagnostics) {
    for (const entry of entries) {
        const match = nodeCopyValues(entry.node).find((value) => DEV_CONTEXT.test(value));
        if (!match) {
            continue;
        }
        pushDiagnostic(diagnostics, "SLP-09", `The visible copy "${match}" leaks implementation or developer context.`, entry.node.span, entry.node.id, "Keep React/API/agent/debug language out of user-facing text.");
    }
}
function lintOrnamentalChrome(entries, diagnostics) {
    for (const entry of entries) {
        if (entry.node.kind === "aside") {
            const descendants = descendantsOf(entry, entries);
            const copy = [nodeCopyText(entry.node), ...descendants.map((child) => nodeCopyText(child.node))].join(" ");
            const hasWorkSupport = descendants.some((child) => INTERACTIVE_KINDS.has(child.node.kind) || ["table", "list", "form", "empty-state"].includes(child.node.kind));
            if (GENERIC_CHROME_WORDS.test(copy) && !hasWorkSupport) {
                pushDiagnostic(diagnostics, "SLP-10", "This sidebar looks ornamental rather than task-supporting.", entry.node.span, entry.node.id, "Keep only sidebar context that helps the next action.");
            }
            continue;
        }
        if (entry.node.kind !== "toolbar") {
            continue;
        }
        const children = directChildrenOf(entry, entries);
        const hasControls = children.some((child) => INTERACTIVE_KINDS.has(child.node.kind));
        if (hasControls) {
            continue;
        }
        if (children.length < 3) {
            continue;
        }
        const onlyDecorative = children.every((child) => ["helper", "badge", "status", "text", "icon", "avatar", "divider"].includes(child.node.kind));
        if (!onlyDecorative) {
            continue;
        }
        pushDiagnostic(diagnostics, "SLP-10", "This toolbar is ornamental and does not help the task flow.", entry.node.span, entry.node.id, "Use toolbars for controls that move the task forward, not decorative status chrome.");
    }
}
export function lintWireSpecQuality(document) {
    const diagnostics = [];
    const entries = [];
    flattenTree(document.root, undefined, entries);
    lintGenericDashboardShell(document, entries, diagnostics);
    lintFakeKpiCards(entries, diagnostics);
    lintRepeatedFillerCards(entries, diagnostics);
    lintVagueCopy(entries, diagnostics);
    lintPrimaryActions(entries, diagnostics);
    lintMissingStates(document, entries, diagnostics);
    lintMissingMobileBreakpoint(document, entries, diagnostics);
    lintAcceptance(document, diagnostics);
    lintDeveloperContext(entries, diagnostics);
    lintOrnamentalChrome(entries, diagnostics);
    diagnostics.sort(compareDiagnostics);
    return diagnostics;
}
