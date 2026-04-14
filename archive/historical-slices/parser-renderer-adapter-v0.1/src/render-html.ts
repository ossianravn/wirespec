import { ParsedWireSpecDocument, ResolvedDocument, VariantSelection, WireNode } from "./types.js";
import { escapeHtml, isVisible, nodeLabel, roleForNode, screenIdFromNode, semanticTargetId } from "./utils.js";
import { resolveDocument } from "./resolver.js";

export interface RenderOptions {
  includeDocumentShell?: boolean;
  includeAcceptance?: boolean;
  titleSuffix?: string;
}

function stringProp(node: WireNode, key: string): string | undefined {
  const value = node.props[key];
  return typeof value === "string" ? value : undefined;
}

function numberProp(node: WireNode, key: string): number | undefined {
  const value = node.props[key];
  return typeof value === "number" ? value : undefined;
}

function boolProp(node: WireNode, key: string): boolean | undefined {
  const value = node.props[key];
  return typeof value === "boolean" ? value : undefined;
}

function classNames(node: WireNode): string {
  const parts = [`ws-${node.kind}`, "ws-node"];
  const variant = stringProp(node, "variant");
  const tone = stringProp(node, "tone");
  const direction = stringProp(node, "direction");
  const size = stringProp(node, "size");
  if (variant) parts.push(`is-${variant}`);
  if (tone) parts.push(`tone-${tone}`);
  if (direction) parts.push(`dir-${direction}`);
  if (size) parts.push(`size-${size}`);
  if (!isVisible(node)) parts.push("is-hidden");
  return parts.join(" ");
}

function layoutStyle(node: WireNode): string {
  const parts: string[] = [];
  const width = stringProp(node, "width");
  const max = stringProp(node, "max");
  const align = stringProp(node, "align");
  const justify = stringProp(node, "justify");
  const gap = stringProp(node, "gap");
  const padding = stringProp(node, "padding");
  const cols = stringProp(node, "cols");
  const sticky = stringProp(node, "sticky");

  const sizeMap: Record<string, string> = {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    fill: "100%",
  };

  if (width === "fill") parts.push("width:100%");
  if (max && sizeMap[max]) parts.push(`max-width:${sizeMap[max] === "100%" ? "100%" : sizeMap[max] === "32px" ? "32rem" : sizeMap[max] === "24px" ? "28rem" : sizeMap[max] === "16px" ? "20rem" : sizeMap[max]}`);
  if (align === "center") parts.push("align-items:center");
  if (justify === "center") parts.push("justify-content:center");
  if (justify === "between") parts.push("justify-content:space-between");
  if (gap && sizeMap[gap]) parts.push(`gap:${sizeMap[gap]}`);
  if (padding && sizeMap[padding]) parts.push(`padding:${sizeMap[padding]}`);
  if (cols === "2") parts.push("grid-template-columns:repeat(2,minmax(0,1fr))");
  if (sticky === "bottom") parts.push("position:sticky;bottom:0;background:var(--ws-surface)");
  return parts.join(";");
}

function dataAttrs(node: WireNode, screenId: string): string {
  const scope =
    node.kind === "screen" || node.kind === "component"
      ? "screen"
      : node.children.length > 0
        ? "section"
        : "element";
  const targetId =
    scope === "screen" ? `screen:${screenId}` : `node:${node.id ?? node.kind}`;
  const attrs = [
    `class="${classNames(node)}"`,
    `data-ws-kind="${escapeHtml(node.kind)}"`,
    `data-ws-screen="${escapeHtml(screenId)}"`,
    `data-ws-target="${escapeHtml(targetId)}"`,
  ];
  if (node.id) {
    attrs.push(`data-ws-id="${escapeHtml(node.id)}"`);
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

function renderChildren(node: WireNode, screenId: string): string {
  return node.children.map((child) => renderNode(child, screenId)).join("");
}

function renderField(node: WireNode, screenId: string): string {
  const label = stringProp(node, "label") ?? "Field";
  const type = stringProp(node, "type") ?? "text";
  const name = stringProp(node, "name") ?? node.id ?? "field";
  const required = boolProp(node, "required");
  const disabled = boolProp(node, "disabled");
  const invalid = boolProp(node, "invalid");
  const helper = stringProp(node, "description");
  return `<label ${dataAttrs(node, screenId)}><span class="ws-label">${escapeHtml(label)}</span><input class="ws-input" type="${escapeHtml(type)}" name="${escapeHtml(name)}"${required ? ' required=""' : ""}${disabled ? ' disabled=""' : ""}${invalid ? ' aria-invalid="true"' : ""}></label>${helper ? `<p class="ws-helper">${escapeHtml(helper)}</p>` : ""}`;
}

function renderCheckboxLike(node: WireNode, screenId: string, role: "checkbox" | "switch" | "radio"): string {
  const label = stringProp(node, "label") ?? stringProp(node, "text") ?? role;
  const name = stringProp(node, "name") ?? node.id ?? role;
  const checked = boolProp(node, "checked");
  const disabled = boolProp(node, "disabled");
  const type = role === "radio" ? "radio" : "checkbox";
  const extraRole = role === "switch" ? ' role="switch"' : "";
  return `<label ${dataAttrs(node, screenId)}><input class="ws-check" type="${type}" name="${escapeHtml(name)}"${checked ? ' checked=""' : ""}${disabled ? ' disabled=""' : ""}${extraRole}><span>${escapeHtml(label)}</span></label>`;
}

function renderSelect(node: WireNode, screenId: string): string {
  const label = stringProp(node, "label") ?? "Select";
  const name = stringProp(node, "name") ?? node.id ?? "select";
  const disabled = boolProp(node, "disabled");
  return `<label ${dataAttrs(node, screenId)}><span class="ws-label">${escapeHtml(label)}</span><select class="ws-select" name="${escapeHtml(name)}"${disabled ? ' disabled=""' : ""}><option>${escapeHtml(label)}</option></select></label>`;
}

function renderHeading(node: WireNode, screenId: string): string {
  const level = Math.max(1, Math.min(6, numberProp(node, "level") ?? 2));
  const text = stringProp(node, "text") ?? nodeLabel(node) ?? node.kind;
  return `<h${level} ${dataAttrs(node, screenId)}>${escapeHtml(text)}</h${level}>`;
}

function renderTextLike(node: WireNode, screenId: string): string {
  const text = stringProp(node, "text") ?? nodeLabel(node) ?? "";
  const tag =
    node.kind === "helper"
      ? "p"
      : node.kind === "alert"
        ? "div"
        : node.kind === "status"
          ? "p"
          : node.kind === "badge"
            ? "p"
            : "p";
  const role = node.kind === "alert" ? ' role="alert"' : "";
  return `<${tag} ${dataAttrs(node, screenId)}${role}>${escapeHtml(text)}</${tag}>`;
}

function renderButton(node: WireNode, screenId: string): string {
  const label = stringProp(node, "label") ?? stringProp(node, "text") ?? "Button";
  const disabled = boolProp(node, "disabled");
  const busy = boolProp(node, "busy");
  return `<button ${dataAttrs(node, screenId)} type="button"${disabled ? ' disabled=""' : ""}${busy ? ' aria-busy="true"' : ""}>${escapeHtml(label)}</button>`;
}

function renderLink(node: WireNode, screenId: string): string {
  const label = stringProp(node, "label") ?? stringProp(node, "text") ?? "Link";
  const href = stringProp(node, "href") ?? "#";
  return `<a ${dataAttrs(node, screenId)} href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

function renderContainer(node: WireNode, screenId: string, tag = "div"): string {
  return `<${tag} ${dataAttrs(node, screenId)}>${renderChildren(node, screenId)}</${tag}>`;
}

function renderList(node: WireNode, screenId: string): string {
  const tag = node.kind === "list-item" ? "li" : "ul";
  return `<${tag} ${dataAttrs(node, screenId)}>${renderChildren(node, screenId)}</${tag}>`;
}

function renderNode(node: WireNode, screenId: string): string {
  switch (node.kind) {
    case "screen":
    case "component":
      return `<main ${dataAttrs(node, screenId)}>${renderChildren(node, screenId)}</main>`;
    case "header":
    case "main":
    case "aside":
    case "footer":
    case "section":
    case "card":
    case "panel":
    case "row":
    case "column":
    case "grid":
    case "stack":
    case "actions":
    case "toolbar":
      return renderContainer(node, screenId, "section");
    case "form":
      return renderContainer(node, screenId, "form");
    case "dialog":
      return `<section ${dataAttrs(node, screenId)} role="dialog" aria-modal="true">${renderChildren(node, screenId)}</section>`;
    case "drawer":
      return `<aside ${dataAttrs(node, screenId)}>${renderChildren(node, screenId)}</aside>`;
    case "heading":
      return renderHeading(node, screenId);
    case "text":
    case "helper":
    case "alert":
    case "status":
    case "badge":
      return renderTextLike(node, screenId);
    case "field":
    case "textarea":
      return renderField(node, screenId);
    case "checkbox":
      return renderCheckboxLike(node, screenId, "checkbox");
    case "switch":
      return renderCheckboxLike(node, screenId, "switch");
    case "radio":
      return renderCheckboxLike(node, screenId, "radio");
    case "select":
    case "combobox":
      return renderSelect(node, screenId);
    case "button":
      return renderButton(node, screenId);
    case "link":
      return renderLink(node, screenId);
    case "list":
    case "list-item":
      return renderList(node, screenId);
    case "divider":
      return `<hr ${dataAttrs(node, screenId)}>`;
    default:
      return renderContainer(node, screenId, "div");
  }
}

export function wireframeCss(): string {
  return `
:root {
  --ws-bg: #f7f7f7;
  --ws-surface: #ffffff;
  --ws-border: #d8d8d8;
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
html, body { margin: 0; padding: 0; background: var(--ws-bg); color: var(--ws-text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.4; }
body { padding: var(--ws-space-lg); }
.ws-node { min-width: 0; }
.ws-screen { width: 100%; min-height: calc(100vh - 48px); display: flex; flex-direction: column; gap: var(--ws-space-lg); }
.ws-main, .ws-header, .ws-footer, .ws-section, .ws-panel, .ws-card, .ws-form, .ws-dialog, .ws-drawer, .ws-column, .ws-stack {
  display: flex;
  flex-direction: column;
  gap: var(--ws-space-md);
}
.ws-row, .ws-actions, .ws-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ws-space-md);
}
.ws-grid {
  display: grid;
  gap: var(--ws-space-md);
}
.ws-card, .ws-panel, .ws-dialog, .ws-drawer, .ws-form, .ws-section {
  background: var(--ws-surface);
  border: 1px solid var(--ws-border);
  border-radius: var(--ws-radius);
  padding: var(--ws-space-md);
}
.ws-heading, h1, h2, h3, h4, h5, h6 { margin: 0; font-weight: 600; letter-spacing: -0.01em; }
.ws-text, .ws-helper, .ws-status, .ws-badge, .ws-alert, p { margin: 0; }
.ws-helper, .ws-status { color: var(--ws-muted); }
.ws-alert {
  border: 1px solid var(--ws-border);
  background: #fafafa;
  border-radius: 8px;
  padding: var(--ws-space-sm);
}
.ws-field, .ws-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ws-label { font-size: 0.95rem; font-weight: 500; }
.ws-input, .ws-select select, .ws-select, select, input[type="text"], input[type="email"], input[type="password"] {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--ws-border);
  border-radius: 8px;
  background: #fff;
  padding: 0 12px;
  color: var(--ws-text);
}
.ws-check { margin-right: 8px; }
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
.ws-list { list-style: none; margin: 0; padding: 0; }
[data-ws-id], [data-ws-target] {
  position: relative;
}
[data-ws-id]:hover, [data-ws-target]:hover {
  outline: 2px solid rgba(17, 17, 17, 0.18);
  outline-offset: 2px;
}
.is-hidden { display: none !important; }
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

export function renderResolvedDocument(
  document: ResolvedDocument,
  options: RenderOptions = {},
): string {
  const screenId = screenIdFromNode(document.root);
  const title = [document.documentTitle, options.titleSuffix].filter(Boolean).join(" · ");
  const body = renderNode(document.root, screenId);
  const acceptance =
    options.includeAcceptance && document.acceptance.length > 0
      ? `<section class="ws-acceptance"><h2>Acceptance</h2><ul>${document.acceptance
          .map((item) => `<li>${escapeHtml(item.text)}</li>`)
          .join("")}</ul></section>`
      : "";
  const shell =
    options.includeDocumentShell !== false
      ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title || document.documentTitle)}</title><style>${wireframeCss()}</style></head><body><div class="ws-doc-meta"><span>${escapeHtml(document.documentTitle)}</span><span>${escapeHtml(JSON.stringify(document.selection))}</span></div>${body}${acceptance}</body></html>`
      : `${body}${acceptance}`;
  return shell;
}

export function renderDocumentSelection(
  document: ParsedWireSpecDocument,
  selection: VariantSelection = {},
  options: RenderOptions = {},
): string {
  const resolved = resolveDocument(document, selection);
  return renderResolvedDocument(resolved, options);
}
