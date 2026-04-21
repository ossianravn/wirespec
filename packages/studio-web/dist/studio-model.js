import {
  buildSourceMap,
  buildVariantRefs,
  formatWireSpecDocument,
  lintWireSpecDocument,
  parseWireSpecDocument,
  renderDocumentSelection,
} from "../../runtime/dist/index.js";
import {
  applyStudioCommandToSession,
  canInsertSemanticChild,
  createStudioNode,
  createStudioSession,
  syntheticSpan,
  undoStudioSession,
  redoStudioSession,
} from "../../studio-core/dist/index.js";

export const TEMPLATE_CATALOG = [
  {
    id: "login",
    label: "Login",
    category: "Auth",
    summary: "Returning-user sign in with inline recovery and mobile submit visibility.",
    sourceFile: "docs/spec/v1-rc0/screens/01-login.md",
  },
  {
    id: "workspace-onboarding",
    label: "Workspace onboarding",
    category: "Onboarding",
    summary: "Short setup form with stepper context and validation.",
    sourceFile: "docs/spec/v1-rc0/screens/02-workspace-onboarding.md",
  },
  {
    id: "knowledge-search",
    label: "Knowledge search",
    category: "Search",
    summary: "Task-first search with filters, results, empty state, and mobile drawer behavior.",
    sourceFile: "docs/spec/v1-rc0/screens/03-knowledge-search.md",
  },
  {
    id: "fulfillment-queue",
    label: "Fulfillment queue",
    category: "Operations",
    summary: "Queue table with tabs, SLA context, and operator actions.",
    sourceFile: "docs/spec/v1-rc0/screens/04-fulfillment-queue.md",
  },
  {
    id: "case-detail",
    label: "Case detail",
    category: "Detail",
    summary: "Split-layout case triage with breadcrumbs, summary, timeline, and actions.",
    sourceFile: "docs/spec/v1-rc0/screens/05-case-detail.md",
  },
  {
    id: "security-settings",
    label: "Security settings",
    category: "Settings",
    summary: "Policy-first settings with tabs, switches, and access management.",
    sourceFile: "docs/spec/v1-rc0/screens/06-security-settings.md",
  },
  {
    id: "checkout",
    label: "Checkout",
    category: "Commerce",
    summary: "Shipping form with order summary and recovery state.",
    sourceFile: "docs/spec/v1-rc0/screens/07-checkout.md",
  },
  {
    id: "clinic-scheduler",
    label: "Clinic scheduler",
    category: "Scheduling",
    summary: "Day schedule grid with provider filters and mobile agenda fallback.",
    sourceFile: "docs/spec/v1-rc0/screens/08-clinic-scheduler.md",
  },
  {
    id: "support-conversation",
    label: "Support conversation",
    category: "Conversation",
    summary: "Thread-first support workflow with composer and details drawer.",
    sourceFile: "docs/spec/v1-rc0/screens/09-support-conversation.md",
  },
  {
    id: "article-editor",
    label: "Article editor",
    category: "Editor",
    summary: "Focused writing surface with tabs, preview, and publishing settings.",
    sourceFile: "docs/spec/v1-rc0/screens/10-article-editor.md",
  },
];

export const EDIT_SCOPES = [
  { id: "base", label: "Base" },
  { id: "state", label: "State" },
  { id: "breakpoint", label: "Responsive" },
];

export const STATE_PRESETS = [
  { id: "loading", label: "Loading" },
  { id: "error", label: "Error" },
  { id: "empty", label: "Empty" },
  { id: "success", label: "Success" },
  { id: "disabled", label: "Disabled" },
  { id: "selected", label: "Selected" },
  { id: "expanded", label: "Expanded" },
];

export const BREAKPOINT_PRESETS = [
  { id: "desktop", label: "Desktop", width: 1180 },
  { id: "tablet", label: "Tablet", width: 834, when: { minWidth: 600, maxWidth: 1023 } },
  { id: "mobile", label: "Mobile", width: 390, when: { maxWidth: 599 } },
];

export const PALETTE_GROUPS = [
  {
    id: "structure",
    label: "Structure",
    items: [
      { kind: "main", label: "Main area", hint: "Primary content region." },
      { kind: "section", label: "Section", hint: "Named task segment." },
      { kind: "card", label: "Card", hint: "Compact grouped block." },
      { kind: "panel", label: "Panel", hint: "Context or secondary content." },
      { kind: "form", label: "Form", hint: "Submission or editing container." },
      { kind: "row", label: "Row", hint: "Horizontal arrangement." },
      { kind: "column", label: "Column", hint: "Vertical grouping." },
      { kind: "grid", label: "Grid", hint: "Dense structured layout." },
      { kind: "stack", label: "Stack", hint: "Loose vertical grouping." },
      { kind: "actions", label: "Button row", hint: "Primary and secondary actions." },
      { kind: "dialog", label: "Dialog", hint: "Blocking confirmation or flow." },
      { kind: "drawer", label: "Drawer", hint: "Context panel or details tray." },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { kind: "nav", label: "Navigation", hint: "Persistent wayfinding group." },
      { kind: "breadcrumbs", label: "Breadcrumbs", hint: "Location path." },
      { kind: "tabs", label: "Tabs", hint: "Section switcher. Add panels alongside it." },
      { kind: "tab-panel", label: "Tab panel", hint: "Content panel controlled by a tab." },
      { kind: "stepper", label: "Stepper", hint: "Progress sequence." },
      { kind: "pagination", label: "Pagination", hint: "Paged result navigation." },
    ],
  },
  {
    id: "controls",
    label: "Controls",
    items: [
      { kind: "field", label: "Text input", hint: "Single-line text field." },
      { kind: "textarea", label: "Textarea", hint: "Multi-line text entry." },
      { kind: "select", label: "Select", hint: "Pick from known options." },
      { kind: "checkbox", label: "Checkbox", hint: "Independent toggle." },
      { kind: "radio-group", label: "Radio group", hint: "Mutually exclusive choices." },
      { kind: "switch", label: "Switch", hint: "Immediate binary setting." },
      { kind: "combobox", label: "Combobox", hint: "Typed lookup with options." },
      { kind: "button", label: "Button", hint: "Primary or secondary action." },
      { kind: "link", label: "Link", hint: "Navigation or secondary action." },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { kind: "heading", label: "Heading", hint: "Section or screen title." },
      { kind: "text", label: "Body copy", hint: "Task-supporting prose." },
      { kind: "helper", label: "Helper note", hint: "Short guidance or context." },
      { kind: "alert", label: "Alert", hint: "Critical or positive inline message." },
      { kind: "badge", label: "Badge", hint: "Compact status emphasis." },
      { kind: "status", label: "Status line", hint: "Current state text." },
      { kind: "empty-state", label: "Empty state", hint: "No-results or no-content fallback." },
      { kind: "divider", label: "Divider", hint: "Visual separation." },
    ],
  },
  {
    id: "collections",
    label: "Collections",
    items: [
      { kind: "list", label: "List", hint: "Ordered or unordered collection." },
      { kind: "table", label: "Table", hint: "Structured operational data." },
    ],
  },
];

const CONTAINER_KINDS = new Set([
  "screen",
  "component",
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
  "tabs",
  "tab-panel",
  "list",
  "list-item",
  "table",
  "table-header",
  "table-body",
  "table-row",
  "table-cell",
  "stepper",
  "radio-group",
]);

const PREFERRED_PARENT_KINDS = {
  heading: ["section", "card", "panel", "main", "header", "dialog", "drawer"],
  text: ["section", "card", "panel", "list-item", "table-cell", "dialog", "drawer"],
  helper: ["form", "section", "card", "panel", "actions", "toolbar"],
  alert: ["form", "section", "card", "panel", "dialog", "drawer"],
  badge: ["table-cell", "section", "panel", "row", "column"],
  status: ["section", "panel", "toolbar", "actions"],
  "empty-state": ["section", "panel", "main", "tab-panel"],
  divider: ["panel", "card", "section", "form", "stack", "column"],
  field: ["form", "toolbar", "section", "card", "panel", "column", "row", "grid", "stack"],
  textarea: ["form", "section", "card", "panel", "column", "row", "grid", "stack"],
  select: ["form", "toolbar", "section", "card", "panel", "column", "row", "grid", "stack"],
  checkbox: ["form", "section", "card", "panel", "row", "column", "stack"],
  "radio-group": ["form", "section", "card", "panel", "row", "column", "stack"],
  switch: ["form", "section", "card", "panel", "row", "column", "stack"],
  combobox: ["form", "toolbar", "section", "card", "panel", "row", "column", "stack"],
  button: ["actions", "toolbar", "form", "dialog", "drawer", "section", "panel"],
  link: ["actions", "toolbar", "form", "list-item", "section", "panel"],
  "breadcrumb-item": ["breadcrumbs"],
  tab: ["tabs"],
  "tab-panel": ["section", "main", "card", "panel", "column", "stack"],
  step: ["stepper"],
  list: ["section", "main", "card", "panel", "tab-panel"],
  table: ["section", "main", "card", "panel", "tab-panel"],
  "table-header": ["table"],
  "table-body": ["table"],
  "table-row": ["table-body", "table-header", "table"],
  "table-cell": ["table-row"],
  pagination: ["section", "main", "panel", "card"],
  tabs: ["section", "main", "card", "panel", "column", "stack"],
  breadcrumbs: ["header", "section", "panel", "main"],
  stepper: ["section", "main", "card", "panel"],
  actions: ["form", "section", "panel", "card", "dialog", "drawer", "main"],
  row: ["section", "main", "card", "panel", "form", "dialog", "drawer", "column", "stack"],
  column: ["section", "main", "card", "panel", "form", "dialog", "drawer", "row", "stack"],
  grid: ["section", "main", "card", "panel", "form"],
  stack: ["section", "main", "card", "panel", "form", "dialog", "drawer"],
  form: ["section", "main", "card", "panel", "dialog", "drawer"],
  section: ["main", "tab-panel", "panel", "card", "drawer", "dialog"],
  card: ["main", "section", "column", "stack"],
  panel: ["main", "section", "row", "column", "stack", "aside"],
  dialog: ["screen", "main", "section"],
  drawer: ["screen", "main", "section"],
  main: ["screen"],
  nav: ["header", "section", "main"],
};

export const INSPECTOR_FIELDS = [
  { key: "label", label: "Label", type: "text", kinds: ["field", "textarea", "select", "checkbox", "radio-group", "radio", "switch", "combobox", "button", "link", "tab", "step", "breadcrumb-item"] },
  { key: "text", label: "Text", type: "text", kinds: ["heading", "text", "helper", "alert", "badge", "status", "table-cell"] },
  { key: "title", label: "Title", type: "text", kinds: ["screen", "dialog", "drawer", "empty-state"] },
  { key: "description", label: "Description", type: "text", kinds: ["empty-state", "alert"] },
  { key: "placeholder", label: "Placeholder", type: "text", kinds: ["field", "textarea", "combobox"] },
  { key: "name", label: "Field name", type: "text", kinds: ["field", "textarea", "select", "checkbox", "radio-group", "switch", "combobox"] },
  { key: "type", label: "Input type", type: "select", options: ["text", "email", "password", "search", "date", "number"], kinds: ["field"] },
  { key: "href", label: "Href", type: "text", kinds: ["link"] },
  { key: "action", label: "Action", type: "text", kinds: ["button"] },
  { key: "submit", label: "Submit action", type: "text", kinds: ["form"] },
  { key: "options", label: "Options", type: "list", kinds: ["select", "combobox"] },
  { key: "level", label: "Heading level", type: "select", options: ["1", "2", "3", "4"], kinds: ["heading"] },
  { key: "tone", label: "Tone", type: "select", options: ["critical", "warning", "positive", "neutral"], kinds: ["alert", "badge", "status"] },
  { key: "variant", label: "Variant", type: "select", options: ["primary", "secondary", "tertiary"], kinds: ["button"] },
  { key: "width", label: "Width", type: "select", options: ["fill", "sm", "md", "lg"], kinds: ["main", "section", "card", "panel", "aside", "actions"] },
  { key: "max", label: "Max width", type: "select", options: ["fill", "sm", "md", "lg", "xl"], kinds: ["main", "card", "panel", "dialog", "drawer"] },
  { key: "align", label: "Align", type: "select", options: ["start", "center", "end"], kinds: ["main", "row", "column", "grid", "stack", "toolbar", "actions"] },
  { key: "justify", label: "Justify", type: "select", options: ["start", "center", "between", "end"], kinds: ["main", "row", "column", "grid", "stack", "toolbar", "actions"] },
  { key: "gap", label: "Gap", type: "select", options: ["xs", "sm", "md", "lg"], kinds: ["row", "column", "grid", "stack", "toolbar", "actions", "main"] },
  { key: "padding", label: "Padding", type: "select", options: ["none", "xs", "sm", "md", "lg"], kinds: ["main", "section", "card", "panel", "dialog", "drawer"] },
  { key: "rows", label: "Rows", type: "number", kinds: ["textarea"] },
  { key: "count", label: "Page count", type: "number", kinds: ["pagination"] },
  { key: "current", label: "Current page", type: "number", kinds: ["pagination"] },
  { key: "required", label: "Required", type: "boolean", kinds: ["field", "textarea", "select", "combobox", "radio-group"] },
  { key: "disabled", label: "Disabled", type: "boolean", kinds: ["form", "field", "textarea", "select", "checkbox", "radio-group", "switch", "combobox", "button"] },
  { key: "busy", label: "Busy", type: "boolean", kinds: ["form", "button", "section", "panel"] },
  { key: "selected", label: "Selected", type: "boolean", kinds: ["tab", "button"] },
  { key: "checked", label: "Checked", type: "boolean", kinds: ["checkbox", "radio", "switch"] },
  { key: "expanded", label: "Expanded", type: "boolean", kinds: ["button", "drawer"] },
  { key: "invalid", label: "Invalid", type: "boolean", kinds: ["field", "textarea", "select", "combobox", "radio-group"] },
  { key: "visible", label: "Visible", type: "boolean", kinds: ["alert", "empty-state", "tab-panel", "button", "section", "panel", "drawer"] },
];

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanizeKind(kind) {
  return kind
    .split("-")
    .map((part) => capitalize(part))
    .join(" ");
}

function nodeTextSeed(node) {
  return node.props.label || node.props.text || node.props.title || node.props.name || node.id || humanizeKind(node.kind);
}

function buildNodeIndex(root) {
  const map = new Map();
  function visit(node, parentId, depth) {
    if (!node.id) {
      return;
    }
    map.set(node.id, { node, parentId, depth });
    node.children.forEach((child, index) => {
      if (child.id) {
        map.set(child.id, { node: child, parentId: node.id, depth: depth + 1, index });
      }
    });
    node.children.forEach((child, index) => {
      visit(child, node.id, depth + 1);
      if (child.id) {
        const entry = map.get(child.id);
        if (entry) {
          entry.index = index;
        }
      }
    });
  }
  visit(root, undefined, 0);
  return map;
}

function walkTree(node, parentId, depth, rows) {
  rows.push({
    id: node.id,
    kind: node.kind,
    label: nodeTextSeed(node),
    depth,
    parentId,
    childCount: node.children.length,
  });
  node.children.forEach((child) => walkTree(child, node.id, depth + 1, rows));
}

function ancestorChain(root, nodeId) {
  const index = buildNodeIndex(root);
  const chain = [];
  let currentId = nodeId;
  while (currentId) {
    const entry = index.get(currentId);
    if (!entry) {
      break;
    }
    chain.push(entry);
    currentId = entry.parentId;
  }
  return chain;
}

function variantBlockForScope(document, scope) {
  const variant = variantInputForScope(scope);
  if (!variant) {
    return undefined;
  }
  return document.variants.find((entry) => entry.kind === variant.kind && entry.name === variant.name);
}

function breakpointPresetById(id) {
  return BREAKPOINT_PRESETS.find((entry) => entry.id === id);
}

function mergePatchOps(ops, targetId, props) {
  let merged = false;
  const nextOps = [];
  for (const op of ops) {
    if (op.op === "patch" && op.target === targetId) {
      if (!merged) {
        nextOps.push({
          ...op,
          props: {
            ...op.props,
            ...props,
          },
          span: syntheticSpan("studio-web"),
        });
        merged = true;
      }
      continue;
    }
    nextOps.push(op);
  }
  if (!merged) {
    nextOps.push({
      op: "patch",
      target: targetId,
      props,
      span: syntheticSpan("studio-web"),
    });
  }
  return nextOps;
}

function replaceVisibilityOps(ops, targetId, visible) {
  const nextOps = ops.filter((op) => !(op.target === targetId && (op.op === "show" || op.op === "hide")));
  nextOps.push({
    op: visible ? "show" : "hide",
    target: targetId,
    span: syntheticSpan("studio-web"),
  });
  return nextOps;
}

function normalizeListValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseFieldValue(field, rawValue) {
  if (field.type === "boolean") {
    return Boolean(rawValue);
  }
  if (field.type === "number") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (field.type === "list") {
    return normalizeListValue(rawValue);
  }
  if (field.type === "select" && (field.key === "level" || field.key === "count" || field.key === "current" || field.key === "rows")) {
    return Number(rawValue);
  }
  return rawValue;
}

function fieldNameBase(kind) {
  return kind.replace(/[^a-z0-9]+/gi, "-");
}

export function createRuntimeAdapters(sourceFile) {
  return {
    entryFile: sourceFile,
    formatDocument: formatWireSpecDocument,
    buildVariantRefs,
    buildSourceMap,
  };
}

export function createStudioWorkspaceFromSource(source, sourceFile) {
  const document = parseWireSpecDocument(source, sourceFile);
  return createStudioSession(document, createRuntimeAdapters(document.sourceFile));
}

export function getTemplateMeta(templateId) {
  return TEMPLATE_CATALOG.find((entry) => entry.id === templateId);
}

export function getStateOptions(document) {
  const names = new Set(STATE_PRESETS.map((entry) => entry.id));
  document.variants
    .filter((variant) => variant.kind === "state")
    .forEach((variant) => names.add(variant.name));
  return ["base", ...Array.from(names)];
}

export function getBreakpointOptions(document) {
  const names = new Set(BREAKPOINT_PRESETS.map((entry) => entry.id));
  document.variants
    .filter((variant) => variant.kind === "breakpoint")
    .forEach((variant) => names.add(variant.name));
  return Array.from(names);
}

export function getBreakpointWidth(name) {
  return breakpointPresetById(name)?.width ?? 1180;
}

export function variantInputForScope(scope) {
  if (scope.editScope === "state" && scope.stateName && scope.stateName !== "base") {
    return {
      kind: "state",
      name: scope.stateName,
    };
  }
  if (scope.editScope === "breakpoint" && scope.breakpointName && scope.breakpointName !== "desktop") {
    const preset = breakpointPresetById(scope.breakpointName);
    return {
      kind: "breakpoint",
      name: scope.breakpointName,
      when: preset?.when,
    };
  }
  return undefined;
}

export function selectionFromScope(scope) {
  return {
    state: scope.stateName && scope.stateName !== "base" ? scope.stateName : undefined,
    breakpoint:
      scope.breakpointName && scope.breakpointName !== "desktop" ? scope.breakpointName : undefined,
  };
}

export function listOutlineRows(document) {
  const rows = [];
  walkTree(document.root, undefined, 0, rows);
  return rows;
}

export function getNodeEntry(document, nodeId) {
  return buildNodeIndex(document.root).get(nodeId);
}

export function nodeSummary(node) {
  return `${humanizeKind(node.kind)}: ${nodeTextSeed(node)}`;
}

export function fieldsForNode(node) {
  return INSPECTOR_FIELDS.filter((field) => field.kinds.includes(node.kind));
}

export function fieldValueForNode(node, field) {
  const value = node.props[field.key];
  if (field.type === "list") {
    return Array.isArray(value) ? value.join(", ") : "";
  }
  if (value === undefined) {
    return field.type === "boolean" ? false : "";
  }
  return value;
}

export function fieldValueForScope(document, node, scope, field) {
  const block = variantBlockForScope(document, scope);
  if (!block) {
    return fieldValueForNode(node, field);
  }
  if (field.key === "visible") {
    const visibilityOp = [...block.ops]
      .reverse()
      .find((op) => op.target === node.id && (op.op === "show" || op.op === "hide"));
    if (visibilityOp) {
      return visibilityOp.op === "show";
    }
  }
  const patchOp = [...block.ops]
    .reverse()
    .find((op) => op.op === "patch" && op.target === node.id && field.key in op.props);
  if (patchOp) {
    return field.type === "list" ? normalizeListValue(patchOp.props[field.key]).join(", ") : patchOp.props[field.key];
  }
  return fieldValueForNode(node, field);
}

export function createPaletteNode(kind) {
  switch (kind) {
    case "heading":
      return createStudioNode("heading", { props: { level: 2, text: "Section heading" } });
    case "text":
      return createStudioNode("text", { props: { text: "Short supporting copy." } });
    case "helper":
      return createStudioNode("helper", { props: { text: "Helpful context for the next decision." } });
    case "alert":
      return createStudioNode("alert", {
        props: { tone: "critical", text: "Explain what needs attention.", visible: true },
      });
    case "badge":
      return createStudioNode("badge", { props: { tone: "warning", text: "Needs review" } });
    case "status":
      return createStudioNode("status", { props: { text: "In progress" } });
    case "empty-state":
      return createStudioNode("empty-state", {
        props: { title: "Nothing here yet", description: "Add the first item to continue." },
      });
    case "field":
      return createStudioNode("field", {
        props: {
          type: "text",
          name: `${fieldNameBase(kind)}-name`,
          label: "Field label",
        },
      });
    case "textarea":
      return createStudioNode("textarea", {
        props: { name: "notes", label: "Notes", rows: 4, placeholder: "Add details" },
      });
    case "select":
      return createStudioNode("select", {
        props: { name: "choice", label: "Choose one", options: ["Option 1", "Option 2"] },
      });
    case "checkbox":
      return createStudioNode("checkbox", {
        props: { name: "consent", label: "Confirm this choice" },
      });
    case "radio":
      return createStudioNode("radio", {
        props: { value: "option-a", label: "Option A" },
      });
    case "radio-group":
      return createStudioNode("radio-group", {
        props: { name: "choice", label: "Choose one" },
        children: [
          createStudioNode("radio", { props: { value: "option-a", label: "Option A" } }),
          createStudioNode("radio", { props: { value: "option-b", label: "Option B" } }),
        ],
      });
    case "switch":
      return createStudioNode("switch", {
        props: { name: "enabled", label: "Enable this" },
      });
    case "combobox":
      return createStudioNode("combobox", {
        props: {
          name: "lookup",
          label: "Search and choose",
          placeholder: "Type to search",
          options: ["Option 1", "Option 2"],
        },
      });
    case "button":
      return createStudioNode("button", {
        props: { label: "Continue", action: "submit", variant: "primary" },
      });
    case "link":
      return createStudioNode("link", {
        props: { label: "Learn more", href: "/path" },
      });
    case "breadcrumbs":
      return createStudioNode("breadcrumbs", {
        children: [
          createStudioNode("breadcrumb-item", { props: { label: "Home" } }),
          createStudioNode("breadcrumb-item", { props: { label: "Current page" } }),
        ],
      });
    case "tabs":
      return createStudioNode("tabs", {
        children: [
          createStudioNode("tab", { props: { label: "Overview", controls: "overview-panel", selected: true } }),
          createStudioNode("tab", { props: { label: "Details", controls: "details-panel" } }),
        ],
      });
    case "tab-panel":
      return createStudioNode("tab-panel", {
        children: [createStudioNode("text", { props: { text: "Tab content goes here." } })],
      });
    case "list":
      return createStudioNode("list", {
        children: [
          createStudioNode("list-item", {
            children: [createStudioNode("text", { props: { text: "First item" } })],
          }),
          createStudioNode("list-item", {
            children: [createStudioNode("text", { props: { text: "Second item" } })],
          }),
        ],
      });
    case "table":
      return createStudioNode("table", {
        children: [
          createStudioNode("table-header", {
            children: [
              createStudioNode("table-row", {
                children: [
                  createStudioNode("table-cell", { props: { text: "Column" } }),
                  createStudioNode("table-cell", { props: { text: "Action" } }),
                ],
              }),
            ],
          }),
          createStudioNode("table-body", {
            children: [
              createStudioNode("table-row", {
                children: [
                  createStudioNode("table-cell", { props: { text: "Row item" } }),
                  createStudioNode("table-cell", {
                    children: [createStudioNode("button", { props: { label: "Open", action: "open-row" } })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    case "pagination":
      return createStudioNode("pagination", { props: { current: 1, count: 4 } });
    case "stepper":
      return createStudioNode("stepper", {
        children: [
          createStudioNode("step", { props: { label: "Start", current: true } }),
          createStudioNode("step", { props: { label: "Details" } }),
          createStudioNode("step", { props: { label: "Confirm" } }),
        ],
      });
    default:
      return createStudioNode(kind);
  }
}

function findInsertParent(document, selectedNodeId, kind) {
  const chain = ancestorChain(document.root, selectedNodeId || document.root.id);
  const preferredKinds = PREFERRED_PARENT_KINDS[kind] ?? [];
  for (const entry of chain) {
    if (!entry.node.id || !CONTAINER_KINDS.has(entry.node.kind)) {
      continue;
    }
    if (preferredKinds.includes(entry.node.kind) && canInsertSemanticChild(entry.node.kind, kind)) {
      return {
        parentId: entry.node.id,
        position: entry.node.children.length,
      };
    }
  }
  for (const entry of chain) {
    if (!entry.node.id || !CONTAINER_KINDS.has(entry.node.kind)) {
      continue;
    }
    if (canInsertSemanticChild(entry.node.kind, kind)) {
      return {
        parentId: entry.node.id,
        position: entry.node.children.length,
      };
    }
  }
  if (!document.root.id) {
    throw new Error("The current document root is missing an id.");
  }
  return {
    parentId: document.root.id,
    position: document.root.children.length,
  };
}

export function insertPaletteNode(session, selectedNodeId, kind) {
  const node = createPaletteNode(kind);
  const plan = findInsertParent(session.document, selectedNodeId, node.kind);
  return {
    session: applyStudioCommandToSession(session, {
      type: "insert-node",
      parentId: plan.parentId,
      position: plan.position,
      node,
    }),
    focusIdHint: node.id,
  };
}

export function insertPaletteNodeAtTarget(session, kind, targetId, placement = "inside") {
  const node = createPaletteNode(kind);
  if (placement === "inside") {
    const plan = findInsertParent(session.document, targetId, node.kind);
    return {
      session: applyStudioCommandToSession(session, {
        type: "insert-node",
        parentId: plan.parentId,
        position: plan.position,
        node,
      }),
      focusIdHint: node.id,
    };
  }
  const index = buildNodeIndex(session.document.root);
  const target = index.get(targetId);
  if (!target?.parentId) {
    throw new Error("Root-level before/after drops are not supported.");
  }
  return {
    session: applyStudioCommandToSession(session, {
      type: "insert-node",
      parentId: target.parentId,
      position: placement === "before" ? target.index : target.index + 1,
      node,
    }),
    focusIdHint: node.id,
  };
}

export function moveNodeRelative(session, nodeId, targetId, placement = "inside") {
  if (nodeId === targetId) {
    return session;
  }
  const index = buildNodeIndex(session.document.root);
  const moving = index.get(nodeId);
  const target = index.get(targetId);
  if (!moving || !target) {
    throw new Error("Move target or moving node could not be found.");
  }
  if (placement === "inside") {
    return applyStudioCommandToSession(session, {
      type: "move-node",
      nodeId,
      newParentId: targetId,
      position: target.node.children.length,
    });
  }
  if (!target.parentId) {
    throw new Error("Root-level before/after moves are not supported.");
  }
  let position = placement === "before" ? target.index : target.index + 1;
  if (moving.parentId === target.parentId && moving.index < target.index) {
    position -= 1;
  }
  return applyStudioCommandToSession(session, {
    type: "move-node",
    nodeId,
    newParentId: target.parentId,
    position,
  });
}

export function applyScopedNodeProp(session, nodeId, scope, field, rawValue) {
  const value = parseFieldValue(field, rawValue);
  const variant = variantInputForScope(scope);
  if (!variant) {
    return applyStudioCommandToSession(session, {
      type: "patch-node",
      nodeId,
      props: {
        [field.key]: value,
      },
    });
  }
  const existing = variantBlockForScope(session.document, scope);
  const ops =
    field.key === "visible"
      ? replaceVisibilityOps(existing?.ops ?? [], nodeId, Boolean(value))
      : mergePatchOps(existing?.ops ?? [], nodeId, { [field.key]: value });
  return applyStudioCommandToSession(session, {
    type: "replace-variant",
    variant,
    ops,
  });
}

export function deleteActiveVariant(session, scope) {
  const variant = variantInputForScope(scope);
  if (!variant) {
    return session;
  }
  return applyStudioCommandToSession(session, {
    type: "remove-variant",
    variant,
  });
}

export function addAcceptanceCriterion(session, text, level = "should") {
  return applyStudioCommandToSession(session, {
    type: "add-acceptance",
    text,
    level,
  });
}

export function renderStudioPreview(session, scope) {
  return renderDocumentSelection(session.document, selectionFromScope(scope), {
    includeDocumentShell: false,
    includeAcceptance: false,
  });
}

export function getDiagnostics(document) {
  return lintWireSpecDocument(document);
}

export function getCanonicalSource(session) {
  return session.projection?.canonicalSource ?? formatWireSpecDocument(session.document);
}

export function variantSummary(document, scope) {
  const block = variantBlockForScope(document, scope);
  if (!block) {
    return [];
  }
  return block.ops.map((op) => {
    if (op.op === "patch") {
      const keys = Object.keys(op.props);
      return `Patch ${op.target}: ${keys.join(", ")}`;
    }
    if (op.op === "insert") {
      return `Insert ${humanizeKind(op.node.kind)} near ${op.ref}`;
    }
    return `${capitalize(op.op)} ${op.target}`;
  });
}

export function canRemoveScopeVariant(document, scope) {
  return Boolean(variantBlockForScope(document, scope));
}

export function resetFromTemplateSource(source, sourceFile) {
  return createStudioWorkspaceFromSource(source, sourceFile);
}

export function selectFallbackNodeId(session, previousId) {
  const index = buildNodeIndex(session.document.root);
  if (previousId && index.has(previousId)) {
    return previousId;
  }
  return session.document.root.id;
}

export function undoSession(session) {
  return undoStudioSession(session);
}

export function redoSessionState(session) {
  return redoStudioSession(session);
}
