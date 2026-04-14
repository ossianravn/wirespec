# WireSpec Authoring Reference

Use this reference when creating or editing `.wirespec.md` files.

## Document Shape

```md
---
schema: wirespec/1.0-rc0
id: login
route: /login
component: src/features/auth/LoginCard.tsx
---

# Login

## Intent
User signs in quickly and recovers from failure without confusion.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=state name=loading
patch target=submit label="Signing in..." busy=true disabled=true
```

## Acceptance
- Keyboard-only user can submit without hidden controls.
```

## Core Kinds

Roots: `screen`, `component`

Layout: `header`, `nav`, `main`, `aside`, `footer`, `section`, `toolbar`, `card`, `panel`, `form`, `row`, `column`, `grid`, `stack`, `actions`, `dialog`, `drawer`

Collections: `breadcrumbs`, `breadcrumb-item`, `tabs`, `tab`, `tab-panel`, `list`, `list-item`, `table`, `table-header`, `table-body`, `table-row`, `table-cell`, `pagination`, `stepper`, `step`

Content: `heading`, `text`, `helper`, `alert`, `badge`, `divider`, `status`, `empty-state`, `avatar`, `icon`

Controls: `field`, `textarea`, `select`, `checkbox`, `radio-group`, `radio`, `switch`, `combobox`, `button`, `link`

Use `x-...` only when the core vocabulary would misrepresent the UI, such as `x-code-editor` or `x-canvas-annotation`.

## Common Props

Identity/copy: `id`, `name`, `title`, `label`, `text`, `description`, `placeholder`

Navigation/action: `route`, `href`, `action`, `submit`, `controls`

State: `visible`, `disabled`, `busy`, `selected`, `checked`, `expanded`, `current`, `invalid`, `readonly`, `required`

Layout: `width`, `min`, `max`, `height`, `cols`, `span`, `order`, `direction`, `align`, `justify`, `gap`, `padding`, `sticky`

Semantic styling: `variant`, `tone`, `size`, `density`

Data hints: `source`, `bind`, `count`, `status`, `autocomplete`, `sortable`, `filterable`, `options`

## Variants

Supported kinds: `mode`, `theme`, `breakpoint`, `state`

Resolver precedence: `mode` -> `theme` -> `breakpoint` -> `state`.

Use variants for deltas:

```wirespec v=1 kind=state name=error
show target=form-error
patch target=password invalid=true
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=auth-card max=fill
patch target=primary-actions direction=column width=fill
```

## Operations

- `patch target=<id> prop=value`: update props; never change `id`.
- `show target=<id>`: make an existing hidden node visible.
- `hide target=<id>`: keep node addressable but not visible.
- `remove target=<id>`: delete node and subtree from resolved tree.
- `insert ref=<id> position=before|after|inside-start|inside-end <node...>`: add new subtree relative to a reference node.

## Editing Checklist

- Preserve stable ids.
- Keep one node or operation per line.
- Keep acceptance criteria outside the structural tree.
- Use base block for default structure.
- Use variants for state and breakpoint changes.
- Avoid raw CSS, utility classes, pixel values, and component-library leakage.
- Verify the primary action, error/empty/loading states, and mobile behavior.
