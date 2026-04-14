# Frozen vocabulary for v1 rc0

This file freezes the **core vocabulary** that v1 tools should understand natively.

The goals are:

- keep the language small enough for agents to learn quickly
- keep the semantics rich enough for real product screens
- avoid leaking implementation details like CSS classes or pixel coordinates

## Naming rules

- Reserved core kinds are listed below.
- Custom node kinds must use the prefix `x-`.
- Future official additions should not use `x-`; that prefix is reserved for local extensions.
- Kinds use kebab-case.
- Ids should use kebab-case.

## Reserved root kinds

- `screen`
- `component`

## Reserved region and layout kinds

- `header`
- `nav`
- `main`
- `aside`
- `footer`
- `section`
- `toolbar`
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

## Reserved navigation and collection kinds

- `breadcrumbs`
- `breadcrumb-item`
- `tabs`
- `tab`
- `tab-panel`
- `list`
- `list-item`
- `table`
- `table-header`
- `table-body`
- `table-row`
- `table-cell`
- `pagination`
- `stepper`
- `step`

## Reserved content kinds

- `heading`
- `text`
- `helper`
- `alert`
- `badge`
- `divider`
- `status`
- `empty-state`
- `avatar`
- `icon`

## Reserved control kinds

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

## Required props by kind

These are the minimum required props for validation and generator support.

### Roots

- `screen`: `id`
- `component`: `id`

### Text and status

- `heading`: `level`, `text`
- `text`: `text`
- `helper`: `text`
- `alert`: `text`
- `badge`: `text`
- `status`: `text`
- `empty-state`: `title`

### Controls

- `field`: `id`, `type`, `name`, `label`
- `textarea`: `id`, `name`, `label`
- `select`: `id`, `name`, `label`
- `checkbox`: `id`, `name`, `label`
- `radio-group`: `id`, `name`, `label`
- `radio`: `id`, `value`, `label`
- `switch`: `id`, `name`, `label`
- `combobox`: `id`, `name`, `label`
- `button`: `id`, `label`
- `link`: `id`, `label`, `href`

### Navigation and collections

- `breadcrumb-item`: `id`, `label`
- `tab`: `id`, `label`, `controls`
- `tab-panel`: `id`
- `step`: `id`, `label`
- `pagination`: `id`, `current`, `count`

Layout containers and collection wrappers do not have mandatory props beyond `id` when they are interactive or targetable.

## Structural constraints

These are semantic constraints. Parsers may preserve documents that violate them, but linters should report them.

- `screen` and `component` are single-root constructs.
- `tabs` should contain only `tab` children.
- `tab-panel` should be paired with a `tab` via `controls`.
- `table` should contain `table-header` and / or `table-body`.
- `table-row` should contain only `table-cell`.
- `list` should contain only `list-item`.
- `stepper` should contain only `step`.
- `actions` should usually contain `button` and `link`.
- `radio-group` should contain only `radio`.
- `dialog` and `drawer` should usually contain `heading`, `text`, `form`, `list`, `section`, and `actions`.

## Shared prop families

v1 keeps prop names generic and semantic. Design systems can map them to tokens later.

### Identity and copy

- `id`
- `name`
- `title`
- `label`
- `text`
- `description`
- `placeholder`

### Navigation and action

- `route`
- `href`
- `action`
- `submit`
- `controls`

### State

- `visible`
- `disabled`
- `busy`
- `selected`
- `checked`
- `expanded`
- `current`
- `invalid`
- `readonly`
- `required`

### Layout

- `width`
- `min`
- `max`
- `height`
- `cols`
- `span`
- `order`
- `direction`
- `align`
- `justify`
- `gap`
- `padding`
- `sticky`

### Semantic styling

- `variant`
- `tone`
- `size`
- `density`

### Data and binding hints

- `source`
- `bind`
- `count`
- `status`
- `autocomplete`
- `sortable`
- `filterable`
- `options`

## Recommended token sets

These token sets are intentionally small and agent-friendly.

- `tone`: `neutral`, `info`, `success`, `warning`, `critical`
- `variant`: `primary`, `secondary`, `tertiary`, `danger`
- `size`: `xs`, `sm`, `md`, `lg`
- `density`: `compact`, `comfortable`, `spacious`
- `width` / `min` / `max`: `fill`, `content`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- `align`: `start`, `center`, `end`, `stretch`
- `justify`: `start`, `center`, `end`, `between`
- `direction`: `row`, `column`
- `gap` / `padding`: `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`

Tools may support project-specific tokens beyond these, but the formatter should preserve explicit values instead of normalizing them away.

## Id rules

The following nodes should always have ids:

- every interactive control
- every tab and tab-panel
- every step
- every dialog or drawer
- every node referenced by a variant operation
- any node that a test, story, or code adapter may need to target

In practice, full-screen fixtures should assign ids to nearly all meaningful nodes. Stable ids are part of the authoring contract for agents.

## Canonical attribute order

To reduce diff churn, formatters should emit props in this order when present:

1. `id`
2. `name`
3. `type`
4. `route`, `href`, `action`, `submit`, `controls`
5. `label`, `title`, `text`, `description`, `placeholder`
6. state flags
7. semantic styling props
8. layout props
9. data / binding props
10. unknown `x-...` props in alphabetical order

## Extension guidance

Use an `x-...` node only when the core vocabulary would become misleading.

Good extension cases:

- a domain-specific composite control such as `x-payment-method`
- a specialized renderer-only annotation node
- a local design-system component with stable semantics

Bad extension cases:

- replacing `button`, `link`, `field`, or `table` just to mirror framework component names
- sneaking raw CSS, utility classes, or pixel geometry into the language
