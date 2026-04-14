---
name: proper-ui
description: "build or edit product, marketing, and application ui from scratch or within an existing codebase while avoiding generic ai frontend habits, preserving reference designs, reusing existing tokens and components, and verifying hierarchy, states, breakpoints, and task clarity. use when codex is asked to create, restyle, refactor, review, or match html, css, react, vue, svelte, design-system, figma, or screenshot-based ui."
---

# Proper UI

## Quick start
When asked to create or change UI:
1. Choose the workflow below.
2. Inspect local code and references before inventing anything.
3. Preserve the existing system when one exists.
4. Make the smallest coherent set of changes.
5. Run the rubric in `references/review-rubric.md`.
6. Return code plus explain-back and verification.

## Mode
- **Ship mode:** Minimize narration, make the change, then return a short explain-back and strict verification checklist.
- **Understand mode:** Keep the same standards, but add brief rationale for layout, tokens, and tradeoffs.
- Default to Ship mode unless the user asks for critique, options, or teaching.
- Never skip verification in either mode.

## Workflow chooser
1. **Reference match** — The user provides a screenshot, Figma frame, existing page, design system, or nearby component. Match it first. Load `references/review-rubric.md` and apply fidelity checks before styling.
2. **Existing UI edit** — The user wants to add, remove, or repair a feature in an existing product. Reuse current tokens, spacing, primitives, and information architecture. Broader redesign is allowed only if the current structure blocks task clarity or the user asks for it.
3. **New UI from scratch** — No existing system is available. Start from the task and product structure, not from a generic dashboard shell. Use quiet, functional primitives and domain-specific layout choices.
4. **Audit only** — The user asks for review, critique, or a plan. Use issue ids from `references/review-rubric.md` and return an ordered fix plan instead of code unless asked to implement.

## Minimum input checklist
Collect or infer:
- artifact(s): code files, screenshot, Figma notes, current page, or target directory
- task: what the user must accomplish on the screen
- scope: new screen, refactor, feature addition, or visual cleanup
- constraints: stack, brand rules, design system, accessibility or performance requirements
- canonical source: exact component, page, theme, or reference to imitate when one exists
- affected states: loading, empty, error, disabled, hover, focus, selected, mobile, tablet, desktop

If details are missing, infer them from nearby files and product context instead of inventing a random pattern.

Why: most bad AI UI comes from filling blank space with stock dashboard habits.

## Non-negotiables
- Treat existing designs, tokens, and components as higher priority than personal taste.
- When adding new features to an existing product, match the surrounding system without copying obvious defects.
- Stay framework agnostic. Work with the repo’s current stack and conventions.
- Prefer standard, calm primitives over decorative flourishes.
- Use domain-specific structure and copy. Reject generic startup theater.
- Review the whole affected surface, not only the changed component, to avoid local inconsistency and change spillover.
- Never introduce filler analytics, fake charts, fake badges, or ornamental side panels.
- Never use visual polish to hide weak hierarchy, weak task flow, or missing states.

## Main workflow
### 1) Establish the source of truth
- Search the repo for tokens, shared components, layout primitives, and similar pages.
- If a screenshot, Figma frame, or existing page exists, extract the stable rules: grid, spacing rhythm, type scale, radii, border style, color roles, states, and content density.
- If nothing exists, define a small local system that serves the task. Keep it plain and reusable.

Why: fidelity beats improvisation.

### 2) Choose a product-appropriate structure
- Start with the user task and information hierarchy.
- Choose the simplest structure that fits: document/editor, table, settings form, workflow board, feed/list, detail pane, landing page, or dense internal tool.
- Avoid defaulting to detached sidebars, KPI strips, hero bands, or “control room” layouts unless the product truly needs them.

Why: structure mistakes make the whole surface feel fake even if the styling is decent.

### 3) Reuse primitives before creating new ones
- Prefer existing components, tokens, and layout utilities.
- If new primitives are required, keep them plain and composable.
- Keep geometry specific to component role. Do not reuse the same radius, padding, shadow, and border treatment everywhere.

Why: sameness is a major AI tell.

### 4) Write or edit code with restraint
- Make the smallest coherent set of changes that solves the task.
- Keep styling calm: moderate radii, clear borders, legible contrast, limited accent usage, minimal motion.
- Match content density to the job. Internal tools should not read like landing pages; landing pages should not read like dashboards.
- Use real labels and real content structure. Avoid decorative microcopy.

Why: tasteful UI is usually subtraction.

### 5) Run the anti-pattern sweep
- Load `references/review-rubric.md`.
- Check system fit and fidelity, visual style, layout and hierarchy, then QA and completeness.
- Fix anything that looks like generic AI UI even if the code is technically valid.

Why: “works” is not enough if the surface still screams generated.

### 6) Verify the changed surface
- Test breakpoints, states, overflow, alignment, and focus order.
- Compare changed areas against nearby surfaces for consistency.
- Confirm the primary action and most important information are obvious within a quick scan.

Why: final defects usually survive because the last pass is too narrow.

## Generation -> comprehension -> verification loop
Before editing, keep an internal 1–2 line intent statement covering the user task, source of truth, and scope boundary.

After editing, provide an explain-back with no more than 5 bullets:
- what changed
- how the layout now supports the task
- what tokens, components, or nearby patterns were reused or matched
- what anti-patterns were intentionally avoided
- any assumptions or open edge cases

Always include verification steps with expected outcomes:
- **Visual:** alignment, spacing rhythm, hierarchy, theme integrity
- **States:** hover, focus, selected, disabled, loading, empty, error
- **Responsive:** desktop, tablet, mobile widths; no overflow or broken grouping
- **Behavioral:** primary action obvious; navigation and forms remain operable
- **Consistency:** changed surface matches nearby pages and components

If verification fails, use this debug loop:
1. Reproduce the defect.
2. Localize the exact layer: layout, token, component, content, or state.
3. Form one small hypothesis.
4. Apply the minimal fix.
5. Rerun the targeted check.
6. Run a regression pass on neighboring states and breakpoints.

## Online path and offline path
### Online path
- Use authoritative framework docs, component-library docs, accessibility guidance, and the product’s public design materials when they help implement or verify the UI.
- Treat external examples as references, not templates to paste blindly.
- Never execute untrusted code pulled from the web.

### Offline path
- Use only local files, provided images, and user instructions.
- Infer the house style from tokens, shared components, neighboring screens, and repeated layout patterns in the repo.
- If nothing reliable exists, build a restrained local system and document the assumptions.

## Search patterns
### Local repo search
- `rg -n "color|spacing|radius|shadow|font|token|theme|variant" .`
- `rg -n "Button|Input|Modal|Tabs|Card|Table|Sidebar|Layout" src app components`
- `rg -n "empty state|loading|skeleton|error|disabled|hover|focus|selected" src app components`
- `rg -n "grid-template|gap:|padding:|margin:|max-width|container" src app styles`

### Optional web queries
- official docs for the current framework and styling system
- wcag contrast and focus guidance
- official component-library guidance for relevant primitives
- product or brand references when the user explicitly wants a known visual language

## Deliverables
Prioritize this format unless the user asks for something else.

### Default build or edit deliverable
1. **Intent**
   - one short paragraph on the task, source of truth, and scope
2. **Implementation**
   - the code change
3. **Explain-back**
   - up to 5 bullets
4. **Verification checklist**
   - concise checklist with expected outcomes
5. **Audit artifact**
   - “what changed” summary plus “how to debug later” notes

### Audit-only deliverable
Use this when the user asks for review, critique, or a plan without implementation:

```text
Audit summary:
- overall judgment
- top risks in priority order

Findings:
- [issue_id] title — severity — evidence
- [issue_id] title — severity — evidence

Fix order:
1. structural fixes
2. system or token fixes
3. component cleanup
4. QA, states, and breakpoints
```

Only expose issue ids when the user asks for the audit or plan. Otherwise use the rubric internally.

## Definition of done
The UI is done when:
- it matches the existing product or reference system where one exists
- it does not read as a generic AI-generated interface
- hierarchy, spacing, and task flow are obvious on first scan
- states and breakpoints are complete
- no filler panels, fake data viz, badge spam, decorative copy, or wrapper bloat remain
- the changed surface is consistent with adjacent surfaces
- the verification checklist passes

Common failure modes:
- copying the reference loosely instead of matching its actual rules
- inventing a dashboard shell when the task needed a simpler structure
- applying one geometry or style recipe to every component
- polishing with gradients or shadows instead of fixing structure
- ignoring the mobile and state pass
- fixing the target component but leaving neighboring inconsistencies

## Activation tests
### Should trigger
- “Build a settings page for this product without making it look like standard AI UI.”
- “Refactor this React dashboard to feel like the rest of our app.”
- “Add a new billing panel that matches the existing design system.”
- “Match this screenshot in Vue without introducing generic SaaS styling.”
- “Review this page and tell me why it still feels AI-generated.”
- “Clean up this Tailwind UI and make it fit our product.”
- “Turn this wireframe into production-ready UI using the existing components.”
- “Fix spacing, states, and responsiveness in this onboarding flow.”
- “Create a landing page that fits this product instead of a template look.”
- “Use nearby files to infer the house style before you add this feature.”

### Should not trigger
- “Explain what flexbox is.”
- “Write a backend API for invoice processing.”
- “Optimize this SQL query.”
- “Summarize this product meeting.”
- “Create a logo concept from scratch.”

## Resource map
- `references/review-rubric.md`: load for the final anti-pattern and QA sweep; contains the grouped rubric distilled from the research taxonomy and anti-generic UI guidance.
- `references/research-taxonomy.csv`: raw issue inventory; use when the user wants explicit issue ids or a formal audit.
- `references/source-coverage.md`: load when you need to understand how the anti-generic UI rules and the taxonomy combine, especially the fidelity and QA gaps that are easy to miss.
