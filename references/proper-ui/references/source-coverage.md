# Source coverage and precedence

This skill combines two inputs:
- a user-provided anti-generic-UI rule set that is strong at spotting common AI frontend habits
- a research taxonomy with explicit issue ids, review instructions, and observable signals

Use both together so the workflow stays complete instead of only stylistic.

## What is preserved from the anti-generic UI source
Keep these instincts active even when the user only asks for code:
- avoid floating dashboard shells, glass cards, glow haze, ornamental gradients, and other premium-by-decoration chrome
- avoid oversized radii, pill overload, cloned rounded rectangles, and one-style-fits-all geometry
- avoid hero sections inside internal tools, metric-card-first dashboards, filler side rails, quota panels, and fake charts
- avoid eyebrow labels, tiny uppercase metadata, decorative slogans, faux-enterprise copy, and template typography
- avoid hover translate or scale gimmicks, conic gradient ornaments, badge spam, and unnecessary wrapper layers
- prefer calm colors, simple borders, moderate shadows, plain controls, and product-appropriate structures
- match Figma or designer-made components instead of inventing your own when a reference exists

## What the taxonomy adds that anti-pattern rules alone miss
Treat these as mandatory, not optional extras:
- **reference fidelity:** match the supplied screenshot, Figma frame, or neighboring screen before “improving” it
- **design-system compliance:** reuse the existing tokens for color, spacing, radii, borders, shadows, type, and motion
- **local consistency:** audit the changed area against nearby surfaces so edits do not spill inconsistency into the page
- **theme integrity:** verify contrast and legibility across the chosen theme and relevant state changes
- **qa completeness:** run a deliberate pass for overflow, clipping, broken grouping, and missing interaction states
- **task clarity:** confirm the primary action and the most important information are obvious at a glance

## Precedence order
1. User instructions and product constraints
2. Existing design system, nearby components, and explicit references
3. Real task structure and information hierarchy
4. Review rubric findings in `review-rubric.md`
5. Personal taste last

## Default decision rules
- When a reference exists, choose fidelity over stylistic improvisation.
- When extending an existing product, fit the system while avoiding the system’s obvious defects.
- When no system exists, choose the plainest structure that serves the task and still feels product-specific.
- When a fix could be structural or decorative, do the structural fix first.
- When uncertain, remove decoration before adding it.

## Gap-closure checklist
Before shipping, make sure all of these are true:
- the screen no longer trips any obvious anti-generic UI patterns
- the change matches surrounding tokens and component rules
- desktop, tablet, and mobile all preserve grouping and operability
- hover, focus, selected, disabled, loading, empty, and error states are covered where relevant
- no local inconsistency remains around the changed area
- the user’s main job is clearer after the change than before it was
