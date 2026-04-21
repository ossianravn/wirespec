import { classifyScope, escapeHtml, isVisible, nodeLabel, roleForNode, screenIdFromNode, semanticTargetId, } from "./utils.js";
import { resolveDocument } from "./resolver.js";
const SPACE_TOKEN_MAP = {
    none: "0",
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
};
const WIDTH_TOKEN_MAP = {
    content: "max-content",
    xs: "20rem",
    sm: "26rem",
    md: "40rem",
    lg: "56rem",
    xl: "72rem",
    "2xl": "88rem",
    fill: "100%",
};
function stringProp(node, key) {
    const value = node.props[key];
    return typeof value === "string" ? value : undefined;
}
function numberProp(node, key) {
    const value = node.props[key];
    return typeof value === "number" ? value : undefined;
}
function boolProp(node, key) {
    const value = node.props[key];
    return typeof value === "boolean" ? value : undefined;
}
function listProp(node, key) {
    const value = node.props[key];
    if (!Array.isArray(value)) {
        return [];
    }
    return value.map((item) => String(item));
}
function domIdForWireId(screenId, wireId) {
    return `ws-${screenId}-${wireId}`;
}
function domIdForNode(screenId, node) {
    return node.id ? domIdForWireId(screenId, node.id) : undefined;
}
function controlIdForNode(screenId, node) {
    return node.id ? `ws-input-${screenId}-${node.id}` : undefined;
}
function autoControlId(screenId, node, suffix) {
    return `ws-${screenId}-${suffix}-${node.span.lineStart}-${node.span.columnStart}`;
}
function classNames(node) {
    const parts = [`ws-${node.kind}`, "ws-node"];
    const variant = stringProp(node, "variant");
    const tone = stringProp(node, "tone");
    const direction = stringProp(node, "direction");
    const size = stringProp(node, "size");
    if (variant)
        parts.push(`is-${variant}`);
    if (tone)
        parts.push(`tone-${tone}`);
    if (direction)
        parts.push(`dir-${direction}`);
    if (size)
        parts.push(`size-${size}`);
    if (boolProp(node, "selected"))
        parts.push("is-selected");
    if (boolProp(node, "current"))
        parts.push("is-current");
    if (boolProp(node, "disabled"))
        parts.push("is-disabled");
    if (boolProp(node, "busy"))
        parts.push("is-busy");
    if (boolProp(node, "invalid"))
        parts.push("is-invalid");
    if (!isVisible(node))
        parts.push("is-hidden");
    return parts.join(" ");
}
function widthTokenValue(value) {
    return WIDTH_TOKEN_MAP[value] ?? value;
}
function spaceTokenValue(value) {
    return SPACE_TOKEN_MAP[value] ?? value;
}
function widthStyle(property, value) {
    const token = widthTokenValue(value);
    if (property === "width" && token !== "100%" && token !== "max-content") {
        return `${property}:min(100%,${token})`;
    }
    return `${property}:${token}`;
}
function layoutStyle(node) {
    const parts = [];
    const width = stringProp(node, "width");
    const min = stringProp(node, "min");
    const max = stringProp(node, "max");
    const height = stringProp(node, "height");
    const align = stringProp(node, "align");
    const justify = stringProp(node, "justify");
    const gap = stringProp(node, "gap");
    const padding = stringProp(node, "padding");
    const cols = stringProp(node, "cols");
    const direction = stringProp(node, "direction");
    const sticky = stringProp(node, "sticky");
    const order = node.props.order;
    if (width)
        parts.push(widthStyle("width", width));
    if (min)
        parts.push(widthStyle("min-width", min));
    if (max)
        parts.push(widthStyle("max-width", max));
    if (height)
        parts.push(`min-height:${escapeHtml(height)}`);
    if (direction === "row" || direction === "column") {
        parts.push(`flex-direction:${direction}`);
    }
    if (align === "start")
        parts.push("align-items:flex-start");
    if (align === "center")
        parts.push("align-items:center");
    if (align === "end")
        parts.push("align-items:flex-end");
    if (align === "stretch")
        parts.push("align-items:stretch");
    if (justify === "start")
        parts.push("justify-content:flex-start");
    if (justify === "center")
        parts.push("justify-content:center");
    if (justify === "end")
        parts.push("justify-content:flex-end");
    if (justify === "between")
        parts.push("justify-content:space-between");
    if (gap)
        parts.push(`gap:${spaceTokenValue(gap)}`);
    if (padding)
        parts.push(`padding:${spaceTokenValue(padding)}`);
    if (cols && /^\d+$/.test(cols)) {
        parts.push(`grid-template-columns:repeat(${cols}, minmax(0, 1fr))`);
    }
    if (sticky === "bottom") {
        parts.push("position:sticky");
        parts.push("bottom:0");
        parts.push("background:var(--ws-surface)");
    }
    if (typeof order === "number") {
        parts.push(`order:${order}`);
    }
    else if (order === "before") {
        parts.push("order:-1");
    }
    else if (order === "after") {
        parts.push("order:1");
    }
    return parts.join(";");
}
function dataAttrs(node, context) {
    const scope = classifyScope(node.kind, node.children.length > 0);
    const targetId = semanticTargetId(scope, node);
    const attrs = [
        `class="${classNames(node)}"`,
        `data-ws-kind="${escapeHtml(node.kind)}"`,
        `data-ws-screen="${escapeHtml(context.screenId)}"`,
        `data-ws-target="${escapeHtml(targetId)}"`,
    ];
    if (node.id) {
        attrs.push(`data-ws-id="${escapeHtml(node.id)}"`);
    }
    const domId = domIdForNode(context.screenId, node);
    if (domId) {
        attrs.push(`id="${escapeHtml(domId)}"`);
    }
    const role = roleForNode(node);
    if (role) {
        attrs.push(`data-ws-role="${escapeHtml(role)}"`);
    }
    const style = layoutStyle(node);
    if (style) {
        attrs.push(`style="${escapeHtml(style)}"`);
    }
    if (!isVisible(node)) {
        attrs.push('hidden=""');
        attrs.push('aria-hidden="true"');
    }
    return attrs.join(" ");
}
function renderChildren(node, context, overrides = {}) {
    return node.children
        .map((child) => renderNode(child, {
        ...context,
        parentKind: node.kind,
        ...overrides,
    }))
        .join("");
}
function helperMarkup(helperId, helper) {
    if (!helper) {
        return "";
    }
    return `<p class="ws-helper"${helperId ? ` id="${escapeHtml(helperId)}"` : ""}>${escapeHtml(helper)}</p>`;
}
function renderField(node, context) {
    const label = stringProp(node, "label") ?? "Field";
    const type = stringProp(node, "type") ?? "text";
    const name = stringProp(node, "name") ?? node.id ?? "field";
    const placeholder = stringProp(node, "placeholder");
    const autocomplete = stringProp(node, "autocomplete");
    const value = stringProp(node, "value");
    const helper = stringProp(node, "description");
    const helperId = helper && node.id ? `${domIdForWireId(context.screenId, node.id)}-description` : undefined;
    const inputId = controlIdForNode(context.screenId, node);
    const required = boolProp(node, "required");
    const disabled = boolProp(node, "disabled");
    const readonly = boolProp(node, "readonly");
    const invalid = boolProp(node, "invalid");
    return `<label ${dataAttrs(node, context)}><span class="ws-label">${escapeHtml(label)}</span><input${inputId ? ` id="${escapeHtml(inputId)}"` : ""} class="ws-input" type="${escapeHtml(type)}" name="${escapeHtml(name)}"${value ? ` value="${escapeHtml(value)}"` : ""}${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""}${autocomplete ? ` autocomplete="${escapeHtml(autocomplete)}"` : ""}${required ? ' required=""' : ""}${disabled ? ' disabled=""' : ""}${readonly ? ' readonly=""' : ""}${invalid ? ' aria-invalid="true"' : ""}${helperId ? ` aria-describedby="${escapeHtml(helperId)}"` : ""}></label>${helperMarkup(helperId, helper)}`;
}
function renderTextarea(node, context) {
    const label = stringProp(node, "label") ?? "Textarea";
    const name = stringProp(node, "name") ?? node.id ?? "textarea";
    const placeholder = stringProp(node, "placeholder");
    const value = stringProp(node, "value") ?? "";
    const helper = stringProp(node, "description");
    const helperId = helper && node.id ? `${domIdForWireId(context.screenId, node.id)}-description` : undefined;
    const inputId = controlIdForNode(context.screenId, node);
    const rows = numberProp(node, "rows") ?? 3;
    const required = boolProp(node, "required");
    const disabled = boolProp(node, "disabled");
    const readonly = boolProp(node, "readonly");
    const invalid = boolProp(node, "invalid");
    return `<label ${dataAttrs(node, context)}><span class="ws-label">${escapeHtml(label)}</span><textarea${inputId ? ` id="${escapeHtml(inputId)}"` : ""} class="ws-textarea" name="${escapeHtml(name)}" rows="${rows}"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""}${required ? ' required=""' : ""}${disabled ? ' disabled=""' : ""}${readonly ? ' readonly=""' : ""}${invalid ? ' aria-invalid="true"' : ""}${helperId ? ` aria-describedby="${escapeHtml(helperId)}"` : ""}>${escapeHtml(value)}</textarea></label>${helperMarkup(helperId, helper)}`;
}
function renderSelect(node, context) {
    const label = stringProp(node, "label") ?? "Select";
    const name = stringProp(node, "name") ?? node.id ?? "select";
    const placeholder = stringProp(node, "placeholder");
    const helper = stringProp(node, "description");
    const helperId = helper && node.id ? `${domIdForWireId(context.screenId, node.id)}-description` : undefined;
    const inputId = controlIdForNode(context.screenId, node);
    const options = listProp(node, "options");
    const selectedValue = stringProp(node, "value");
    const required = boolProp(node, "required");
    const disabled = boolProp(node, "disabled");
    const readonly = boolProp(node, "readonly");
    const invalid = boolProp(node, "invalid");
    const optionMarkup = options.length > 0
        ? options
            .map((option) => `<option value="${escapeHtml(option)}"${selectedValue === option ? ' selected=""' : ""}>${escapeHtml(option)}</option>`)
            .join("")
        : `<option value="">${escapeHtml(placeholder ?? label)}</option>`;
    return `<label ${dataAttrs(node, context)}><span class="ws-label">${escapeHtml(label)}</span><select${inputId ? ` id="${escapeHtml(inputId)}"` : ""} class="ws-select" name="${escapeHtml(name)}"${required ? ' required=""' : ""}${disabled ? ' disabled=""' : ""}${readonly ? ' aria-readonly="true"' : ""}${invalid ? ' aria-invalid="true"' : ""}${helperId ? ` aria-describedby="${escapeHtml(helperId)}"` : ""}>${optionMarkup}</select></label>${helperMarkup(helperId, helper)}`;
}
function renderCombobox(node, context) {
    const label = stringProp(node, "label") ?? "Combobox";
    const name = stringProp(node, "name") ?? node.id ?? "combobox";
    const placeholder = stringProp(node, "placeholder");
    const helper = stringProp(node, "description");
    const helperId = helper && node.id ? `${domIdForWireId(context.screenId, node.id)}-description` : undefined;
    const inputId = controlIdForNode(context.screenId, node) ?? autoControlId(context.screenId, node, "combobox");
    const listId = `${inputId}-options`;
    const value = stringProp(node, "value");
    const options = listProp(node, "options");
    const required = boolProp(node, "required");
    const disabled = boolProp(node, "disabled");
    const readonly = boolProp(node, "readonly");
    const invalid = boolProp(node, "invalid");
    const optionMarkup = options.length > 0
        ? `<datalist id="${escapeHtml(listId)}">${options
            .map((option) => `<option value="${escapeHtml(option)}"></option>`)
            .join("")}</datalist>`
        : `<datalist id="${escapeHtml(listId)}"><option value="${escapeHtml(placeholder ?? label)}"></option></datalist>`;
    return `<label ${dataAttrs(node, context)}><span class="ws-label">${escapeHtml(label)}</span><input id="${escapeHtml(inputId)}" class="ws-input" type="text" role="combobox" aria-expanded="false" aria-controls="${escapeHtml(listId)}" list="${escapeHtml(listId)}" name="${escapeHtml(name)}"${value ? ` value="${escapeHtml(value)}"` : ""}${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ""}${required ? ' required=""' : ""}${disabled ? ' disabled=""' : ""}${readonly ? ' readonly=""' : ""}${invalid ? ' aria-invalid="true"' : ""}${helperId ? ` aria-describedby="${escapeHtml(helperId)}"` : ""}></label>${helperMarkup(helperId, helper)}${optionMarkup}`;
}
function renderCheckboxLike(node, context, role) {
    const label = stringProp(node, "label") ?? stringProp(node, "text") ?? role;
    const name = role === "radio"
        ? context.radioGroupName ?? stringProp(node, "name") ?? node.id ?? "radio-group"
        : stringProp(node, "name") ?? node.id ?? role;
    const checked = boolProp(node, "checked");
    const required = boolProp(node, "required");
    const disabled = boolProp(node, "disabled");
    const value = stringProp(node, "value");
    const type = role === "radio" ? "radio" : "checkbox";
    const roleAttr = role === "switch" ? ' role="switch"' : "";
    const ariaChecked = role === "switch" ? ` aria-checked="${checked ? "true" : "false"}"` : "";
    return `<label ${dataAttrs(node, context)}><input class="ws-check" type="${type}" name="${escapeHtml(name)}"${value ? ` value="${escapeHtml(value)}"` : ""}${checked ? ' checked=""' : ""}${required ? ' required=""' : ""}${disabled ? ' disabled=""' : ""}${roleAttr}${ariaChecked}><span>${escapeHtml(label)}</span></label>`;
}
function renderRadioGroup(node, context) {
    const label = stringProp(node, "label") ?? "Options";
    const name = stringProp(node, "name") ?? node.id ?? "radio-group";
    const helper = stringProp(node, "description");
    const helperId = helper && node.id ? `${domIdForWireId(context.screenId, node.id)}-description` : undefined;
    const radios = node.children
        .map((child) => renderNode(child, {
        ...context,
        parentKind: node.kind,
        radioGroupName: name,
    }))
        .join("");
    return `<fieldset ${dataAttrs(node, context)}${helperId ? ` aria-describedby="${escapeHtml(helperId)}"` : ""}><legend class="ws-legend">${escapeHtml(label)}</legend>${radios}${helperMarkup(helperId, helper)}</fieldset>`;
}
function renderHeading(node, context) {
    const level = Math.max(1, Math.min(6, numberProp(node, "level") ?? 2));
    const text = stringProp(node, "text") ?? nodeLabel(node) ?? node.kind;
    return `<h${level} ${dataAttrs(node, context)}>${escapeHtml(text)}</h${level}>`;
}
function renderTextLike(node, context) {
    const text = stringProp(node, "text") ??
        stringProp(node, "title") ??
        stringProp(node, "label") ??
        nodeLabel(node) ??
        "";
    const tag = node.kind === "badge" ? "span" : node.kind === "alert" ? "div" : "p";
    const roleAttr = node.kind === "alert" ? ' role="alert"' : "";
    return `<${tag} ${dataAttrs(node, context)}${roleAttr}>${escapeHtml(text)}</${tag}>`;
}
function renderButton(node, context) {
    const label = stringProp(node, "label") ?? stringProp(node, "text") ?? "Button";
    const action = stringProp(node, "action");
    const disabled = boolProp(node, "disabled");
    const busy = boolProp(node, "busy");
    const type = action === "submit" ? "submit" : "button";
    const actionAttr = action && action !== "submit" ? ` data-ws-action="${escapeHtml(action)}"` : "";
    return `<button ${dataAttrs(node, context)} type="${type}"${actionAttr}${disabled ? ' disabled=""' : ""}${busy ? ' aria-busy="true"' : ""}>${escapeHtml(label)}</button>`;
}
function renderLink(node, context) {
    const label = stringProp(node, "label") ?? stringProp(node, "text") ?? "Link";
    const href = stringProp(node, "href") ?? stringProp(node, "route") ?? "#";
    const current = boolProp(node, "current");
    return `<a ${dataAttrs(node, context)} href="${escapeHtml(href)}"${current ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
}
function renderContainer(node, context, tag = "div", extraAttrs = "") {
    const extra = extraAttrs ? ` ${extraAttrs}` : "";
    return `<${tag} ${dataAttrs(node, context)}${extra}>${renderChildren(node, context)}</${tag}>`;
}
function renderList(node, context) {
    if (node.kind === "list-item") {
        const text = stringProp(node, "text") ?? stringProp(node, "label");
        const content = node.children.length > 0 ? renderChildren(node, context) : text ? escapeHtml(text) : "";
        return `<li ${dataAttrs(node, context)}>${content}</li>`;
    }
    return `<ul ${dataAttrs(node, context)}>${renderChildren(node, context)}</ul>`;
}
function renderBreadcrumbItem(node, context) {
    const label = stringProp(node, "label") ?? nodeLabel(node) ?? "Item";
    const href = stringProp(node, "href") ?? stringProp(node, "route");
    const current = boolProp(node, "current") || !href;
    const content = href && !current
        ? `<a ${dataAttrs(node, context)} href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
        : `<span ${dataAttrs(node, context)}${current ? ' aria-current="page"' : ""}>${escapeHtml(label)}</span>`;
    return `<li class="ws-breadcrumb-item">${content}</li>`;
}
function renderBreadcrumbs(node, context) {
    const items = node.children
        .map((child) => renderNode(child, { ...context, parentKind: node.kind }))
        .join("");
    return `<nav ${dataAttrs(node, context)} aria-label="Breadcrumb"><ol class="ws-breadcrumbs-list">${items}</ol></nav>`;
}
function renderTabs(node, context) {
    return `<div ${dataAttrs(node, context)} role="tablist">${renderChildren(node, context)}</div>`;
}
function renderTab(node, context) {
    const label = stringProp(node, "label") ?? nodeLabel(node) ?? "Tab";
    const controls = stringProp(node, "controls");
    const selected = boolProp(node, "selected") === true;
    const controlsId = controls ? domIdForWireId(context.screenId, controls) : undefined;
    return `<button ${dataAttrs(node, context)} type="button" role="tab" aria-selected="${selected ? "true" : "false"}"${controlsId ? ` aria-controls="${escapeHtml(controlsId)}"` : ""}>${escapeHtml(label)}</button>`;
}
function renderTabPanel(node, context) {
    const labelledBy = node.id ? context.metadata.tabPanelToTabId.get(node.id) : undefined;
    const labelledById = labelledBy ? domIdForWireId(context.screenId, labelledBy) : undefined;
    return `<section ${dataAttrs(node, context)} role="tabpanel"${labelledById ? ` aria-labelledby="${escapeHtml(labelledById)}"` : ""}>${renderChildren(node, context)}</section>`;
}
function renderTable(node, context) {
    return `<table ${dataAttrs(node, context)}>${renderChildren(node, context)}</table>`;
}
function renderTableSection(node, context, tag, section) {
    return `<${tag} ${dataAttrs(node, context)}>${renderChildren(node, context, { tableSection: section })}</${tag}>`;
}
function renderTableRow(node, context) {
    return `<tr ${dataAttrs(node, context)}>${renderChildren(node, context)}</tr>`;
}
function renderTableCell(node, context) {
    const tag = context.tableSection === "header" ? "th" : "td";
    const text = stringProp(node, "text") ?? stringProp(node, "label");
    const content = node.children.length > 0 ? renderChildren(node, context) : text ? escapeHtml(text) : "";
    const scope = context.tableSection === "header" ? ' scope="col"' : "";
    return `<${tag} ${dataAttrs(node, context)}${scope}>${content}</${tag}>`;
}
function renderPagination(node, context) {
    const current = numberProp(node, "current") ?? 1;
    const count = numberProp(node, "count") ?? 1;
    return `<nav ${dataAttrs(node, context)} aria-label="Pagination"><p class="ws-status">Page ${current} of ${count}</p></nav>`;
}
function renderStepper(node, context) {
    return `<ol ${dataAttrs(node, context)}>${renderChildren(node, context)}</ol>`;
}
function renderStep(node, context) {
    const label = stringProp(node, "label") ?? nodeLabel(node) ?? "Step";
    const current = boolProp(node, "current");
    return `<li ${dataAttrs(node, context)}${current ? ' aria-current="step"' : ""}>${escapeHtml(label)}</li>`;
}
function renderEmptyState(node, context) {
    const title = stringProp(node, "title") ?? nodeLabel(node) ?? "Empty state";
    const description = stringProp(node, "description");
    const children = renderChildren(node, context);
    return `<section ${dataAttrs(node, context)}><h2 class="ws-empty-state-title">${escapeHtml(title)}</h2>${description ? `<p class="ws-helper">${escapeHtml(description)}</p>` : ""}${children}</section>`;
}
function renderToken(node, context) {
    const label = stringProp(node, "label") ??
        stringProp(node, "title") ??
        stringProp(node, "text") ??
        (node.kind === "avatar" ? "Avatar" : "Icon");
    return `<span ${dataAttrs(node, context)} role="img" aria-label="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}
function labelledByHeading(node, context) {
    const heading = node.children.find((child) => child.kind === "heading" && child.id);
    return heading?.id ? domIdForWireId(context.screenId, heading.id) : undefined;
}
function renderNode(node, context) {
    switch (node.kind) {
        case "screen":
        case "component":
            return `<div ${dataAttrs(node, context)}>${renderChildren(node, context)}</div>`;
        case "header":
            return renderContainer(node, context, "header");
        case "nav":
            return renderContainer(node, context, "nav");
        case "main":
            return renderContainer(node, context, "main");
        case "aside":
            return renderContainer(node, context, "aside");
        case "footer":
            return renderContainer(node, context, "footer");
        case "section":
        case "card":
        case "panel":
            return renderContainer(node, context, "section");
        case "row":
        case "column":
        case "grid":
        case "stack":
        case "actions":
            return renderContainer(node, context, "div");
        case "toolbar":
            return renderContainer(node, context, "div", 'role="toolbar"');
        case "form": {
            const submit = stringProp(node, "submit");
            return renderContainer(node, context, "form", submit ? `data-ws-submit="${escapeHtml(submit)}"` : "");
        }
        case "dialog": {
            const labelledBy = labelledByHeading(node, context);
            return renderContainer(node, context, "section", `role="dialog" aria-modal="true"${labelledBy ? ` aria-labelledby="${escapeHtml(labelledBy)}"` : ""}`);
        }
        case "drawer": {
            const labelledBy = labelledByHeading(node, context);
            return renderContainer(node, context, "aside", labelledBy ? `aria-labelledby="${escapeHtml(labelledBy)}"` : "");
        }
        case "heading":
            return renderHeading(node, context);
        case "text":
        case "helper":
        case "alert":
        case "status":
        case "badge":
            return renderTextLike(node, context);
        case "empty-state":
            return renderEmptyState(node, context);
        case "field":
            return renderField(node, context);
        case "textarea":
            return renderTextarea(node, context);
        case "checkbox":
            return renderCheckboxLike(node, context, "checkbox");
        case "switch":
            return renderCheckboxLike(node, context, "switch");
        case "radio-group":
            return renderRadioGroup(node, context);
        case "radio":
            return renderCheckboxLike(node, context, "radio");
        case "select":
            return renderSelect(node, context);
        case "combobox":
            return renderCombobox(node, context);
        case "button":
            return renderButton(node, context);
        case "link":
            return renderLink(node, context);
        case "breadcrumbs":
            return renderBreadcrumbs(node, context);
        case "breadcrumb-item":
            return renderBreadcrumbItem(node, context);
        case "tabs":
            return renderTabs(node, context);
        case "tab":
            return renderTab(node, context);
        case "tab-panel":
            return renderTabPanel(node, context);
        case "list":
        case "list-item":
            return renderList(node, context);
        case "table":
            return renderTable(node, context);
        case "table-header":
            return renderTableSection(node, context, "thead", "header");
        case "table-body":
            return renderTableSection(node, context, "tbody", "body");
        case "table-row":
            return renderTableRow(node, context);
        case "table-cell":
            return renderTableCell(node, context);
        case "pagination":
            return renderPagination(node, context);
        case "stepper":
            return renderStepper(node, context);
        case "step":
            return renderStep(node, context);
        case "avatar":
        case "icon":
            return renderToken(node, context);
        case "divider":
            return `<hr ${dataAttrs(node, context)}>`;
        default:
            return renderContainer(node, context, "div");
    }
}
function collectRenderMetadata(node, metadata = { tabPanelToTabId: new Map() }) {
    if (node.kind === "tab" && node.id) {
        const controls = stringProp(node, "controls");
        if (controls) {
            metadata.tabPanelToTabId.set(controls, node.id);
        }
    }
    for (const child of node.children) {
        collectRenderMetadata(child, metadata);
    }
    return metadata;
}
export function wireframeCss() {
    return `
:root {
  --ws-bg: #f7f7f7;
  --ws-surface: #ffffff;
  --ws-border: #d8d8d8;
  --ws-border-strong: #bbbbbb;
  --ws-text: #1f1f1f;
  --ws-muted: #666666;
  --ws-accent: #111111;
  --ws-space-xs: 8px;
  --ws-space-sm: 12px;
  --ws-space-md: 16px;
  --ws-space-lg: 24px;
  --ws-space-xl: 32px;
  --ws-radius: 10px;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--ws-bg); color: var(--ws-text); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.4; }
body { padding: var(--ws-space-lg); }
.ws-node { min-width: 0; }
.ws-screen { width: 100%; min-height: calc(100vh - 48px); display: flex; flex-direction: column; gap: var(--ws-space-lg); }
.ws-main, .ws-header, .ws-footer, .ws-section, .ws-panel, .ws-card, .ws-form, .ws-dialog, .ws-drawer, .ws-column, .ws-stack, .ws-empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--ws-space-md);
}
.ws-row, .ws-actions, .ws-toolbar, .ws-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ws-space-md);
}
.ws-grid {
  display: grid;
  gap: var(--ws-space-md);
}
.ws-card, .ws-panel, .ws-dialog, .ws-drawer, .ws-form, .ws-section, .ws-empty-state {
  background: var(--ws-surface);
  border: 1px solid var(--ws-border);
  border-radius: var(--ws-radius);
  padding: var(--ws-space-md);
}
.ws-heading, h1, h2, h3, h4, h5, h6 { margin: 0; font-weight: 600; letter-spacing: -0.01em; }
.ws-text, .ws-helper, .ws-status, .ws-badge, .ws-alert, p { margin: 0; }
.ws-helper, .ws-status { color: var(--ws-muted); }
.ws-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px 8px;
  border: 1px solid var(--ws-border);
  border-radius: 999px;
}
.ws-alert {
  border: 1px solid var(--ws-border);
  background: #fafafa;
  border-radius: 8px;
  padding: var(--ws-space-sm);
}
.ws-field, .ws-select, .ws-radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ws-label, .ws-legend {
  font-size: 0.95rem;
  font-weight: 500;
}
.ws-input, .ws-textarea, .ws-select, select, input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--ws-border);
  border-radius: 8px;
  background: #fff;
  padding: 10px 12px;
  color: var(--ws-text);
  font: inherit;
}
.ws-textarea, textarea {
  min-height: 96px;
  resize: vertical;
}
.ws-check { margin-right: 8px; }
fieldset {
  margin: 0;
  padding: var(--ws-space-sm);
  border: 1px solid var(--ws-border);
  border-radius: 8px;
}
button, .ws-button {
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid var(--ws-border);
  background: #fff;
  color: var(--ws-text);
  padding: 0 14px;
  font: inherit;
  cursor: pointer;
}
button.is-primary, .ws-button.is-primary {
  background: #111;
  color: #fff;
  border-color: #111;
}
a { color: inherit; text-decoration: none; }
.ws-list, .ws-stepper, .ws-breadcrumbs-list {
  margin: 0;
  padding: 0;
}
.ws-list {
  list-style: none;
}
.ws-stepper {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ws-space-sm);
}
.ws-step {
  padding: 6px 10px;
  border: 1px solid var(--ws-border);
  border-radius: 999px;
}
.ws-breadcrumbs-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ws-breadcrumb-item + .ws-breadcrumb-item::before {
  content: "/";
  color: var(--ws-muted);
  margin-right: 8px;
}
.ws-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ws-space-sm);
}
.ws-tab {
  border-style: dashed;
}
.ws-tab-panel {
  border: 1px dashed var(--ws-border);
  border-radius: 8px;
  padding: var(--ws-space-md);
}
.ws-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--ws-surface);
}
.ws-table th,
.ws-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ws-border);
  vertical-align: top;
}
.ws-table th {
  font-weight: 600;
}
.ws-pagination {
  display: flex;
  justify-content: flex-end;
}
.ws-avatar, .ws-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
  padding: 0 10px;
  border: 1px dashed var(--ws-border-strong);
  border-radius: 8px;
  background: #fbfbfb;
  color: var(--ws-muted);
}
[data-ws-id], [data-ws-target] {
  position: relative;
}
[data-ws-id]:hover, [data-ws-target]:hover {
  outline: 2px solid rgba(17, 17, 17, 0.18);
  outline-offset: 2px;
}
.is-hidden { display: none !important; }
.is-selected {
  border-color: var(--ws-border-strong);
  background: #f2f2f2;
}
.is-invalid {
  border-color: #b75b5b;
}
.ws-doc-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--ws-space-md);
  margin-bottom: var(--ws-space-md);
  color: var(--ws-muted);
  font-size: 0.95rem;
}
.ws-acceptance {
  margin-top: var(--ws-space-lg);
  padding: var(--ws-space-md);
  background: var(--ws-surface);
  border: 1px solid var(--ws-border);
  border-radius: var(--ws-radius);
}
.ws-acceptance ul {
  margin: 0;
  padding-left: 20px;
}
`;
}
export function renderResolvedDocument(document, options = {}) {
    const screenId = screenIdFromNode(document.root);
    const title = [document.documentTitle, options.titleSuffix].filter(Boolean).join(" · ");
    const metadata = collectRenderMetadata(document.root);
    const body = renderNode(document.root, { screenId, metadata });
    const acceptance = options.includeAcceptance && document.acceptance.length > 0
        ? `<section class="ws-acceptance"><h2>Acceptance</h2><ul>${document.acceptance
            .map((item) => `<li>${escapeHtml(item.text)}</li>`)
            .join("")}</ul></section>`
        : "";
    const shell = options.includeDocumentShell !== false
        ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title || document.documentTitle)}</title><style>${wireframeCss()}</style></head><body><div class="ws-doc-meta"><span>${escapeHtml(document.documentTitle)}</span><span>${escapeHtml(JSON.stringify(document.selection))}</span></div>${body}${acceptance}</body></html>`
        : `${body}${acceptance}`;
    return shell;
}
export function renderDocumentSelection(document, selection = {}, options = {}) {
    const resolved = resolveDocument(document, selection);
    return renderResolvedDocument(resolved, options);
}
