# Review rubric

Use this file as the final sweep after creating or editing UI, or as the backbone for audit-only requests.

Recommended order:
1. Run `FID-01` and `FID-02` first whenever a reference or existing design system exists.
2. Sweep visual style (`VIS-*`) to remove generic AI UI moves.
3. Sweep layout and hierarchy (`LAY-*`) to fix structure and density.
4. Sweep remaining system-fit items (`FID-*`) for token drift, wrapper bloat, and faux-product details.
5. Finish with QA (`QA-*`) for defects, missing states, and task clarity.

## Visual style

### VIS-01 — Generic AI aesthetic
- **Check:** Flag when the UI relies on stock AI-dashboard tropes instead of product-specific design decisions.
- **Signals:** Interchangeable SaaS look; generic premium tone; no domain-specific structure, copy, or visual language
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use product-specific information architecture, copy, and component choices so the screen could not belong to any random SaaS app.

### VIS-02 — Generic dark-SaaS shell
- **Check:** Flag when the screen defaults to a blue-black or gray-black 'premium dashboard' look without a product reason.
- **Signals:** Dark gradient canvas; cyan/purple accents; detached floating surfaces; style feels imported rather than owned
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use the project theme or a restrained neutral base. Do not default to blue-black “premium dashboard” styling without product evidence.

### VIS-03 — Premium-by-decoration chrome
- **Check:** Flag when polish is coming from decorative effects rather than strong layout, hierarchy, and content choices.
- **Signals:** Glassmorphism; glows; blur haze; frosted panels; gradient borders; dramatic shadows
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Let hierarchy, spacing, and content do the work. Remove glass, glow, blur, and gradient chrome unless the product already uses them.

### VIS-04 — Excessive roundness / pill overload
- **Check:** Flag when large radii or pill shapes are used across too many components, making the interface soft and toy-like.
- **Signals:** Pill buttons, tabs, badges, chips, and cards everywhere; 20px+ radii used as a default
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use role-appropriate radii. Keep pills rare and purposeful instead of making every surface soft and toy-like.

### VIS-05 — Template typography / weak type hierarchy
- **Check:** Flag when typography feels unbranded or the hierarchy is weak, with headings, labels, body, and metadata too similar.
- **Signals:** Default-stack feel; unclear heading structure; weak contrast between heading/body/label roles
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Build a clear type system with visible differences between headings, labels, body, and metadata.

### VIS-06 — Weak color judgment / low contrast
- **Check:** Flag when the palette hurts readability or feels arbitrary rather than intentional and calm.
- **Signals:** Low-contrast text; muddy surfaces; accents that fight; muted gray-blue text that is hard to scan
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Choose calm, readable colors with reliable contrast. Make accent colors support meaning instead of competing for attention.

### VIS-07 — Ornamental microcopy / fake product voice
- **Check:** Flag decorative copy that sounds clever or premium but does not help the user complete a task.
- **Signals:** Taglines, slogans, explanatory filler, or faux-poetic copy that could be removed without losing function
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Replace decorative slogans with task-helpful labels, instructions, and status text.

### VIS-08 — Eyebrow-label / uppercase-metadata habit
- **Check:** Flag tiny uppercase labels, letter-spaced metadata, or mini-notes used as decoration rather than structure.
- **Signals:** Small uppercase pre-headings; muted section notes; decorative metadata above otherwise simple content
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use small metadata only when it adds structure. Avoid tiny uppercase flourishes that serve decoration rather than comprehension.

### VIS-09 — Low distinctiveness / template feel
- **Check:** Flag screens that could belong to almost any generic SaaS product because the design lacks domain-specific choices.
- **Signals:** Familiar dashboard composition; generic labels; no product-specific information architecture or character
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Express the product’s domain through layout, content, and component emphasis rather than through generic dashboard styling.

### VIS-10 — Gimmicky hover / micro-motion
- **Check:** Flag motion that adds flair but not clarity, especially default translate, scale, or bounce behaviors.
- **Signals:** Hover translateX/Y; scale-on-hover; motion used everywhere instead of only where feedback is needed
- **Scope note:** Inspect all interactive states that affect clarity or usability.
- **Prefer instead:** Use motion only for feedback or orientation. Prefer subtle color, opacity, or border changes over bounce, translate, or scale effects.


## Layout & hierarchy

### LAY-01 — Card/panel nesting and wrapper bloat
- **Check:** Flag unnecessary container layers that fragment content and make the layout feel overbuilt.
- **Signals:** Cards inside cards; panels inside panels; many shells that add chrome but not structure
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Remove wrappers that add chrome but not structure. Keep only the containers needed for layout and grouping.

### LAY-02 — Weak spacing, alignment, hierarchy, and positioning
- **Check:** Flag inconsistent spacing or placement that makes the screen look off-grid, uneven, or accidentally composed.
- **Signals:** Misaligned baselines; uneven gaps; overlapping elements; headings and content not sharing a grid
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Put the screen on a stable grid. Normalize gaps, baselines, column starts, and alignment logic.

### LAY-03 — Wasted space / density problems
- **Check:** Flag oversized padding, large empty regions, or sparse composition that reduces clarity rather than improving it.
- **Signals:** Huge margins; dead zones; overpadded sections; low information density with no readability gain
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Tune density to the task. Reduce dead space and overpadding that hide the real work.

### LAY-04 — Detached dashboard-shell cliché
- **Check:** Flag the stock composition of floating rounded sidebar plus detached main shell when it is not driven by the product.
- **Signals:** Floating sidebar shell; brand block at top; detached content card; ornamental outer framing
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use a standard app shell only when the product architecture needs it. Detached rounded shells should not be the default composition.

### LAY-05 — Hero-inside-dashboard mistake
- **Check:** Flag marketing-style hero sections or decorative header bands inside internal tools or dense product views.
- **Signals:** Large welcome banner; decorative hero copy; oversized dashboard header taking space from real work
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Keep internal tools task-first. Reserve big hero treatments for places that genuinely need them.

### LAY-06 — Invented layouts instead of product-appropriate structures
- **Check:** Flag layouts that are visually clever but worse for scanning, navigation, or task completion than a standard product structure.
- **Signals:** Asymmetric composition with no payoff; unusual section ordering; structure feels invented for style
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Choose familiar, scannable structures before clever asymmetry or invented composition tricks.

### LAY-07 — Metric-card / KPI-grid-first instinct
- **Check:** Flag top-row KPI cards used as filler or ceremony when the primary user task is not metric monitoring.
- **Signals:** Three- or four-card stat strip; generic numbers; metrics that do not drive the screen's main job
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Lead with the primary task, not with filler metrics. Add KPI cards only when they actually drive the page’s main job.

### LAY-08 — Filler side-panels and rails
- **Check:** Flag side panels or rails that mostly exist to fill space instead of supporting a real workflow.
- **Signals:** Today rails; recent activity blocks; quota widgets; side CTA panels with weak task value
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Remove side rails, activity panels, and quota widgets that do not support an actual workflow.

### LAY-09 — Mixed alignment logic
- **Check:** Flag screens where some blocks follow a strict grid while others float center-ish or use unrelated alignment rules.
- **Signals:** Left-aligned content mixed with centered shells; inconsistent column starts; wandering edges
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Commit to one alignment system so edges, columns, and content starts feel intentional.

### LAY-10 — Breakpoint fragility / mobile collapse
- **Check:** Across widths, flag layouts that collapse into a long stack, lose grouping, overflow, or become hard to operate.
- **Signals:** Single-column beige sandwich; broken grouping; clipped content; tiny tap targets; horizontal overflow
- **Scope note:** Check at least desktop, tablet, and mobile widths.
- **Prefer instead:** Design breakpoints deliberately. Preserve grouping, readable density, tap targets, and overflow handling across widths.


## System fit & fidelity

### FID-01 — Reference fidelity
- **Check:** When a screenshot, Figma frame, or designer reference is provided, compare against it and flag drift toward generic Codex UI.
- **Signals:** Changed composition; spacing drift; wrong typography; token drift; different components; genericized styling
- **Scope note:** Compare directly against the provided screenshot, Figma frame, or neighboring product surface.
- **Prefer instead:** When a reference exists, match its composition, spacing, typography, and states before adding personal improvements.

### FID-02 — Design-system / token compliance
- **Check:** Flag components that ignore the product's spacing scale, radii, typography, border treatment, elevation, or color tokens.
- **Signals:** Random radii; new hex codes; inconsistent borders; mismatched type scale; components that do not belong
- **Scope note:** Compare directly against the provided screenshot, Figma frame, or neighboring product surface.
- **Prefer instead:** Reuse the existing design tokens and component variants for color, spacing, radii, borders, shadows, and motion.

### FID-03 — Same geometry reused everywhere
- **Check:** Flag interfaces where every major surface and control shares the same shell treatment, creating sameness.
- **Signals:** Same radius, padding, and border treatment on sidebar, cards, buttons, panels, and modals
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Vary geometry by role. A card, button, tab, badge, and sidebar should not all share one cloned style recipe.

### FID-04 — Fake analytics / filler data viz
- **Check:** Flag charts, donut visuals, progress bars, or percentages that look decorative or disconnected from a real task.
- **Signals:** Hand-wavy percentages; unlabeled charts; generic pipeline bars; visual metrics that exist mainly to fill space
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use real charts and metrics only when they are needed and labeled. Otherwise choose a better structure for the task.

### FID-05 — Badge/tag/status-dot overproduction
- **Check:** Flag screens that wrap too many statuses, rows, or nav items in chips, badges, counts, or colored dots.
- **Signals:** Tag on every row; nav count badges everywhere; live dots; status chips creating visual noise
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use badges, tags, status dots, and count chips only when they convey essential state or priority.

### FID-06 — Wrapper / panel-style proliferation
- **Check:** Flag screens that use too many near-identical surface styles instead of a small, coherent set of containers.
- **Signals:** Panel, rail-panel, table-panel, shell, workspace block, and other one-off surface treatments on one screen
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Prefer a short list of container styles. Do not mint new panel species for every section.

### FID-07 — Overdecorated controls instead of plain functional primitives
- **Check:** Flag controls that are stylized beyond their functional role when a simpler primitive would be clearer.
- **Signals:** Fancy tabs; animated inputs; decorative icon backgrounds; ornamental dropdowns; stylized controls for no task reason
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Choose plain functional controls over decorative versions with extra shells, icon plates, or animations.

### FID-08 — Theme integrity / dark-mode legibility
- **Check:** Flag theme issues that break readability or consistency, especially in dark mode or across surface levels.
- **Signals:** Unreadable text; muddy backgrounds; invisible borders; washed-out accents; inconsistent surface contrast
- **Scope note:** Check both the chosen theme and state changes within that theme.
- **Prefer instead:** Keep theme integrity across text, surfaces, borders, and focus states so dark and light themes stay legible and calm.

### FID-09 — Local inconsistency / change spillover
- **Check:** Flag individual sections or components that look edited in isolation and no longer match the surrounding UI language.
- **Signals:** One card or form uses a different radius, spacing, type scale, shadow, or interaction pattern than the rest
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Review the changed area against its neighbors to catch inconsistent radius, spacing, typography, or color drift.

### FID-10 — Placeholder or faux-product content
- **Check:** Flag labels and content that feel fabricated, ornamental, or disconnected from a plausible product vocabulary.
- **Signals:** Live pulse; operator checklist; night shift; team focus; decorative labels that do not map to real product concepts
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Use real product language, labels, and examples. Remove faux enterprise jargon, placeholder content, and invented analytics.


## QA & completeness

### QA-01 — Obvious visual defects left unreviewed
- **Check:** Flag visible defects that a basic UI review should have caught before shipping.
- **Signals:** Clipped text; overflow; broken corner joins; inconsistent radii; spacing glitches; unfinished-looking edges
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Do a final visual defect pass for overflow, clipping, broken corners, alignment bugs, contrast issues, and awkward wrapping.

### QA-02 — Missing component states / incomplete interaction design
- **Check:** Flag components that appear to have only a default state, with little evidence of considered interaction design.
- **Signals:** Missing or inconsistent hover, focus, selected, disabled, loading, empty, or error states
- **Scope note:** Inspect all interactive states that affect clarity or usability.
- **Prefer instead:** Complete the interaction model: hover, focus, selected, disabled, loading, empty, and error states where relevant.

### QA-03 — Task clarity hidden behind decoration
- **Check:** Flag screens where decorative structure or style makes the primary task harder to find, scan, or execute.
- **Signals:** Primary action buried; important data secondary to chrome; ornamental sections competing with functional content
- **Scope note:** Check the current screen as rendered, not just the local component in isolation.
- **Prefer instead:** Make the primary action and the important information obvious without decorative wrappers or copy getting in the way.
