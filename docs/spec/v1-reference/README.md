# WireSpec v1 draft

WireSpec v1 is a CommonMark-compatible authoring pattern for low-fidelity, agent-friendly UI specs.

## Design goals
- Keep the source readable as plain Markdown.
- Keep the UI structure deterministic enough for coding agents to edit safely.
- Represent states and responsive variants as first-class data.
- Favor semantics over pixels and design tokens over raw style values.
- Avoid generic AI-dashboard defaults; examples stay task-first and product-appropriate.

## File model

A WireSpec document has four layers:

1. **Optional frontmatter** for metadata and repository bindings.
2. **Normal Markdown prose** for intent, rationale, notes, and acceptance criteria.
3. **One base `wirespec` fenced block** that defines the canonical UI tree.
4. **Zero or more variant `wirespec` fenced blocks** for states and breakpoints.

### Minimal example

```md
---
schema: wirespec/1.0-draft
id: login
route: /login
component: auth/LoginScreen
---

# Login

## Intent
Allow a returning user to sign in quickly and recover access easily.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        field id=password type=password name=password label="Password" required=true
        actions id=actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=state name=loading
patch target=submit label="Signing in…" busy=true disabled=true
patch target=login-form disabled=true
```

## Acceptance
- Keyboard-only user can complete sign-in.
- Error messages stay close to the field they belong to.
```

## Canonical section order

Use this order for files that represent full screens:

1. frontmatter
2. `# Title`
3. `## Intent`
4. base `wirespec` block
5. state `wirespec` blocks
6. breakpoint `wirespec` blocks
7. `## Acceptance`
8. optional `## Notes`

Parsers should tolerate extra prose sections, but generators should emit the canonical order.

## Core source rules

- One screen or component per file.
- Exactly one base block per file.
- Use **two spaces** per nesting level inside `wirespec` blocks.
- Tabs are invalid inside `wirespec` blocks.
- Keep one node or operation per line.
- Use explicit `key=value` attributes only. No shorthand classes or implicit trailing labels.
- Use double quotes for any value containing spaces or punctuation.
- Prefer kebab-case ids.
- Interactive nodes and any node referenced by variants **must** have explicit ids.
- The core syntax forbids raw CSS, hex colors, free-position coordinates, and arbitrary HTML.

## Supported block kinds

`wirespec` block info strings are tokenized as space-separated `key=value` pairs.

Required keys:
- `v=1`
- `kind=base|state|breakpoint|theme|mode`

Additional keys:
- `name=<token>` for named variants
- `min=<int>` and `max=<int>` for breakpoint ranges

Examples:
- ```` ```wirespec v=1 kind=base ````
- ```` ```wirespec v=1 kind=state name=loading ````
- ```` ```wirespec v=1 kind=breakpoint name=mobile max=599 ````

## Recommended node vocabulary

### Roots
- `screen`
- `component`

### Structure
- `header`
- `main`
- `aside`
- `footer`
- `section`
- `card`
- `panel`
- `form`
- `row`
- `column`
- `grid`
- `stack`
- `actions`
- `dialog`
- `drawer`

### Content
- `heading`
- `text`
- `helper`
- `alert`
- `badge`
- `divider`
- `breadcrumbs`
- `breadcrumb-item`
- `empty-state`
- `list`
- `list-item`
- `table`
- `table-header`
- `table-body`
- `table-row`
- `table-cell`
- `tabs`
- `tab-panel`

### Controls
- `field`
- `textarea`
- `select`
- `checkbox`
- `radio-group`
- `radio`
- `switch`
- `combobox`
- `button`
- `link`
- `pagination`
- `stepper`
- `step`

Parsers should preserve unknown node kinds for future extension.

## Recommended attribute names

### Common
- `id`
- `name`
- `title`
- `label`
- `text`
- `description`
- `role`
- `variant`
- `tone`
- `size`
- `density`
- `visible`

### Layout
- `width`
- `max`
- `min`
- `cols`
- `span`
- `align`
- `justify`
- `gap`
- `padding`
- `sticky`
- `order`

### Behavior and state
- `action`
- `href`
- `submit`
- `required`
- `disabled`
- `busy`
- `selected`
- `checked`
- `expanded`
- `current`
- `placeholder`
- `autocomplete`
- `sortable`
- `filterable`

### Data and bindings
- `source`
- `bind`
- `count`
- `status`

## Variant operations

WireSpec v1 keeps variants intentionally small.

### `patch`
Updates scalar or list-valued props on an existing node.

```wirespec v=1 kind=state name=loading
patch target=submit label="Saving…" busy=true disabled=true
```

### `show`
Makes a node visible in the derived variant.

```wirespec v=1 kind=state name=error
show target=form-error
```

### `hide`
Hides a node in the derived variant.

```wirespec v=1 kind=state name=empty
hide target=results-list
```

### `insert`
Adds a new node relative to an existing reference node.

```wirespec v=1 kind=state name=confirm-delete
insert position=inside-end ref=settings-screen
  dialog id=confirm-delete title="Delete workspace?" tone=critical
    text id=confirm-copy text="This action cannot be undone."
```

### `remove`
Deletes a node in the derived variant.

```wirespec v=1 kind=state name=compact
remove target=secondary-help
```

## Parsing model

1. Parse the file as CommonMark.
2. Collect frontmatter as `metadata` when present.
3. Read level-1 heading as `documentTitle` if frontmatter does not define one.
4. Collect `## Intent`, `## Acceptance`, and `## Notes` when present.
5. Parse the base `wirespec` block into the canonical UI tree.
6. Parse each variant block into a list of operations.
7. Compile Markdown acceptance bullets into `acceptance[]`.
8. Preserve source spans for diagnostics where possible.

## AST model

See `wirespec-ast.schema.json` for machine validation.

High-level shape:

```ts
type Scalar = string | number | boolean;
type ScalarValue = Scalar | Scalar[];

interface WireSpecDocument {
  schemaVersion: "1.0.0-draft";
  sourceFormat: "markdown+wirespec";
  metadata?: Record<string, Scalar | Scalar[]>;
  documentTitle?: string;
  intent?: string;
  notes?: string;
  root: WireNode;
  variants: WireVariant[];
  acceptance: AcceptanceRule[];
}

interface WireNode {
  kind: string;
  id?: string;
  name?: string;
  text?: string;
  props: Record<string, ScalarValue>;
  children: WireNode[];
  source?: SourceSpan;
  extensions?: Record<string, unknown>;
}

interface WireVariant {
  kind: "state" | "breakpoint" | "theme" | "mode";
  name: string;
  when?: Record<string, ScalarValue>;
  ops: VariantOp[];
  source?: SourceSpan;
}

type VariantOp =
  | { op: "patch"; target: string; props: Record<string, ScalarValue> }
  | { op: "show"; target: string }
  | { op: "hide"; target: string }
  | { op: "remove"; target: string }
  | { op: "insert"; position: "before" | "after" | "inside-start" | "inside-end"; ref: string; node: WireNode };

interface AcceptanceRule {
  id: string;
  text: string;
  tags?: string[];
}
```

## Canonical reference screens

The `screens/` directory contains 10 reference documents:

1. `01-login.md`
2. `02-workspace-onboarding.md`
3. `03-knowledge-search.md`
4. `04-fulfillment-queue.md`
5. `05-case-detail.md`
6. `06-security-settings.md`
7. `07-checkout.md`
8. `08-clinic-scheduler.md`
9. `09-support-conversation.md`
10. `10-article-editor.md`

These are intentionally task-first and domain-specific. They avoid filler KPI shells, fake analytics, and decorative side rails.

## Suggested next implementation steps

1. Build a lexer/parser for base and variant blocks only.
2. Compile to the JSON AST defined by `wirespec-ast.schema.json`.
3. Add a formatter that normalizes indentation, attribute ordering, and quoting.
4. Ship an HTML/SVG sketch renderer before any code generator.
5. Add lint rules for:
   - missing ids on interactive or patched nodes
   - duplicate ids
   - illegal tabs inside `wirespec`
   - raw style escapes
   - missing loading, error, and responsive coverage on full screens
