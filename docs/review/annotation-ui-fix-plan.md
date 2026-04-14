# Annotation UI Fix Plan

Status: audit-only. No implementation code changes should be made until this document has been reviewed.

## Intent

The annotation layer should help a reviewer mark a preview, understand open feedback, and save/export structured tasks without obscuring the screen they are reviewing. The current UI makes the preview, drawer, composer, pins, status chips, and controls compete for attention. It also exposes internal implementation details in ways that are useful to developers but unclear to a reviewer.

## Scope Reviewed

- `packages/bridge/src/review-overlay.js`
- `packages/runtime/src/review-overlay.ts`
- `packages/runtime/src/review-runtime.ts`
- `packages/bridge/outputs/login.local-bridge-demo.html`
- Live desktop viewport: `1440x1050`
- Live mobile viewport: `390x844`
- User screenshots showing drawer, composer, and thread-card states

The annotation UI exists in two places today:

- Bridge demo/runtime: one overlay file owns toolbar, drawer, pins, composer, save, and status sync.
- Runtime package: composer lives in `review-overlay.ts`; drawer, pins, filters, export/import, local persistence live in `review-runtime.ts`.

Fixing only one implementation will leave the same visual and interaction failures in the other.

## Audit Summary

Overall judgment: the annotation UI is functionally present but not yet product-usable. It reads as a debug overlay with oversized generic controls, duplicated visual treatments, unclear state hierarchy, and fragile overlay behavior. The reviewer cannot quickly tell what is interactive, what is metadata, what is status, or which surface currently owns focus.

Top risks, in order:

1. Overlay layering and focus are broken. Composer, drawer, pins, and preview can overlap without a clear active layer.
2. Buttons, chips, status labels, and form labels use nearly the same visual language.
3. The drawer is too large and too card-heavy, making feedback hard to scan.
4. Form controls overflow because inputs use `width: 100%` without a local box model.
5. Mobile behavior creates cramped overlays, double-scroll feeling, and horizontal overflow.
6. There are two divergent annotation UIs, so fixes can drift unless the UI primitives are unified.

## Findings

### [QA-01] Composer and Drawer Overlap — Critical

Evidence:

- In the first screenshot, the "New review note" composer sits over the thread drawer while drawer content remains visible underneath.
- The composer uses fixed positioning at the bottom; the drawer also uses fixed positioning, and neither establishes a single modal/overlay state.
- `packages/bridge/src/review-overlay.js` opens the composer without closing or suppressing the drawer.

Fix:

- Treat composer as the active task surface.
- When composer opens, either close the drawer or put the drawer into an inert background state.
- Add an overlay-layer rule: toolbar < pins < drawer < composer.
- Add Escape behavior for composer and drawer consistently.
- Prevent clicks behind the composer while composing.

### [LAY-02] Visual Hierarchy Does Not Separate Roles — Critical

Evidence:

- Labels, body text, metadata, button labels, and chip text use similar weight and size.
- "Title", "Severity", and "Comment" labels look like free text rather than form labels.
- In thread cards, severity/status chips compete with real actions.
- The toolbar gives "Review", "Threads", and "Save" similar weight, even though they represent mode, navigation, and persistence.

Fix:

- Define role-specific text styles:
  - screen/drawer title
  - thread title
  - target metadata
  - message body
  - form label
  - helper/status text
  - action label
- Make labels smaller and semibold, placed consistently above controls.
- Make metadata quieter and not button-like.
- Use status text or small badges for state; reserve buttons for actions.

### [FID-03] Same Geometry Reused Everywhere — High

Evidence:

- Toolbar, drawer, cards, composer, buttons, chips, and pins all use rounded rectangles or pills.
- Radii are mostly `10px`, `12px`, `14px`, `16px`, or `999px`, producing a soft generic interface.
- Status chips and action buttons share similar border treatments.

Fix:

- Use role-specific geometry:
  - toolbar: compact rectangular utility strip
  - drawer: flat panel with modest radius or no radius on edge-attached desktop mode
  - thread row/card: light list item, not a large card inside a panel
  - inputs: 6-8px radius
  - badges: minimal text label or small lozenge only where necessary
  - pins: small anchored count marker with better placement rules

### [LAY-01] Cards Inside Panels Fragment the Drawer — High

Evidence:

- The drawer is already a panel, then each thread is another bordered card with large padding.
- The screenshot shows large empty blocks around sparse content.
- The second screenshot shows one thread occupying a large area while the drawer has a mostly empty bottom.

Fix:

- Convert thread cards into a denser thread list.
- Use separators or subtle row backgrounds instead of full card chrome.
- Keep only one container level: drawer panel + thread rows.
- Put thread state/actions in predictable columns or rows.

### [QA-01] Input Controls Overflow Their Container — High

Evidence:

- The first screenshot shows title/comment inputs visually expanding beyond the composer edge.
- Current CSS sets `width: 100%` plus padding and border for inputs/select/textarea without setting `box-sizing: border-box`.
- The mobile browser audit reported document scroll width `405px` in a `390px` viewport.

Fix:

- Add local `box-sizing: border-box` for all annotation UI elements.
- Apply `max-width: 100%` to inputs/select/textarea.
- Keep composer content inside a stable internal grid.
- Test at 320, 390, 768, 1024, and 1440 widths.

### [LAY-09] Mixed Alignment Logic — High

Evidence:

- Toolbar controls align left inside a floating pill, while status text stretches to the right.
- Drawer headers, card titles, severity chips, body text, and action rows all use different horizontal starts.
- Status chips sometimes appear on the right, sometimes below, sometimes next to buttons.

Fix:

- Define one drawer grid:
  - header title and count
  - optional filter/status row
  - thread list
  - footer actions
- Align all thread titles, metadata, body, and action rows to one column.
- Put severity/status in a consistent secondary column or inline metadata position.

### [QA-03] Primary Task Is Hidden Behind Chrome — High

Evidence:

- The reviewer’s primary task is either "add a note", "inspect threads", or "save changes", but all controls compete equally.
- "Review" is ambiguous: it means comment mode, not a review page.
- The status string `Loaded .wirespec/reviews/login.annotations.json` consumes toolbar space and reads like developer diagnostics.

Fix:

- Rename "Review" to "Add note" or "Comment".
- Make active mode visually clear without making it look like the primary action.
- Move bridge/file-path status into a subdued status menu or tooltip.
- Use reviewer-facing copy in the UI; keep file paths available as technical detail only when needed.

### [FID-05] Status Chips and Badges Are Overproduced — Medium

Evidence:

- Pins, severity chips, status chips, filter chips, and count chips all compete visually.
- "open", "resolved", "must", and "should" look like controls in several states.

Fix:

- Reserve badges for severity only, and make status textual or a small muted label.
- Use one count indicator in the toolbar and one pin per target.
- Avoid pill styling for every metadata value.

### [LAY-10] Mobile Drawer Is Fragile — High

Evidence:

- Mobile audit at `390x844`: drawer starts around `207px` and takes `610px` height, while content inside extends beyond visible bounds.
- The page becomes wider than the viewport.
- Screenshots show scrollbars and content clipping; the drawer feels like a nested page rather than a contained review tool.

Fix:

- On mobile, use a bottom sheet or full-height sheet with one scroll container.
- Keep toolbar compact and prevent it from consuming the full top width with long status text.
- Make drawer footer sticky only inside the drawer, not in page flow.
- Ensure body scroll is locked or clearly separate when drawer/composer is active.

### [QA-02] Interaction States Are Incomplete — Medium

Evidence:

- Disabled state exists for create button, but hover/focus/pressed states are not consistently specified.
- Drawer close, resolve, reopen, save, and comment-mode actions lack consistent focus affordances.
- Status changes update the store, but the visible state change is not clearly confirmed beyond toolbar text.

Fix:

- Add visible focus rings for all annotation controls.
- Define hover/active/disabled states for buttons and inputs.
- Add inline save/status feedback near the action that changed.
- Use `aria-expanded`, `aria-controls`, and `aria-live` for toolbar/drawer/status.

### [FID-09] Runtime and Bridge UIs Drift — High

Evidence:

- `packages/bridge/src/review-overlay.js` implements toolbar, drawer, composer, and pins.
- `packages/runtime/src/review-overlay.ts` implements a separate toolbar/composer.
- `packages/runtime/src/review-runtime.ts` implements a separate drawer/pins/export surface.
- The same concepts use different labels: "Create note", "Create draft", "Threads", "Threads (n)", "Annotations JSON".

Fix:

- Create one shared annotation UI contract before restyling:
  - toolbar controls
  - thread row schema
  - composer fields
  - pin behavior
  - status/update messaging
- Either move shared styling/render helpers to one package or document the bridge/runtime parity requirements explicitly.
- Keep labels and states identical across both surfaces.

### [VIS-04] Pill and Roundness Overload — Medium

Evidence:

- Toolbar controls, chips, pins, filters, and some containers use pill-like radii.
- The result looks like a generic prototype rather than a precise product tool.

Fix:

- Remove most pill shapes.
- Use small radius controls and list rows.
- Keep round pins only if they remain small, anchored, and visually secondary.

### [VIS-05] Type Scale Is Too Blunt — Medium

Evidence:

- Screenshot headings are huge relative to drawer width.
- Thread titles and composer titles dominate more than the content being reviewed.
- Labels and body copy lack clear scale separation.

Fix:

- Reduce drawer title size.
- Use a tighter thread title size.
- Make body text comfortable but not oversized.
- Treat metadata as secondary information, not a competing heading.

### [QA-03] Target Context Is Too Developer-Centric — Medium

Evidence:

- The UI shows `primary-actions · mobile+error`, `element · heading · Welcome back`, and raw file-path status.
- These are useful for implementers, but the reviewer needs a simpler explanation of what they selected and what state they are reviewing.

Fix:

- Show target context as a readable sentence or compact breadcrumb:
  - `Button group in mobile error state`
  - `Heading: Welcome back`
- Hide raw target ids and file paths behind a details disclosure.
- Preserve source identifiers in exports/tasks, not as the main UI language.

## Fix Order

1. **Structure and layering**
   - Define the annotation surfaces and z-index/focus rules.
   - Make drawer and composer mutually coherent.
   - Decide whether mobile uses bottom sheet or full-screen panel.

2. **Shared UI contract**
   - Align bridge/runtime labels, fields, status names, and actions.
   - Decide whether the code should share primitives or keep two implementations with parity tests.

3. **Component primitives**
   - Redefine toolbar, drawer, thread row, composer field, button, badge, and pin styles.
   - Add local box model rules.
   - Remove card-inside-panel styling.

4. **Copy and information hierarchy**
   - Replace developer-centric toolbar status with reviewer-facing labels.
   - Rework target metadata and thread summaries.
   - Make status/severity/action roles visually distinct.

5. **States and accessibility**
   - Add focus, hover, selected, disabled, loading, empty, resolved, wontfix, and error states.
   - Add ARIA state attributes and live status behavior.

6. **Responsive QA**
   - Verify desktop, tablet, and mobile.
   - Confirm no horizontal overflow.
   - Confirm drawer/composer scrolling is contained and understandable.

## Proposed Acceptance Criteria

- A reviewer can tell within 3 seconds whether they are adding a note, reading threads, or saving review state.
- Buttons look like actions; labels look like labels; badges/statuses do not look clickable unless they are.
- Opening the composer never leaves drawer content visibly competing beneath it.
- Drawer thread list remains scannable with 1, 3, 10, and 25 threads.
- Inputs never overflow the composer at mobile or desktop widths.
- Mobile has no horizontal overflow and no confusing nested scrollbars.
- Bridge and runtime annotation surfaces use the same labels, hierarchy, and state model.

## Verification Plan Before Any Code Is Considered Done

- Visual:
  - Compare drawer, composer, toolbar, pins, and thread rows at desktop and mobile widths.
  - Confirm alignment, spacing rhythm, type hierarchy, and role clarity.
- States:
  - Test open, resolved, wontfix, empty, saving, saved, bridge unavailable, disabled submit, hover, focus, selected comment mode.
- Responsive:
  - Test 320, 390, 768, 1024, and 1440 widths.
  - Confirm no horizontal overflow and no hidden footer actions.
- Behavioral:
  - Add note, cancel note, open drawer from toolbar, open drawer from pin, resolve, reopen, won't fix, save, bridge offline.
- Consistency:
  - Run the same checks against `packages/bridge` and `packages/runtime` generated demos.
  - Confirm toolbar labels, thread metadata, and action language match.

## Implementation Notes For Later

Do not start by changing colors. The first implementation pass should fix structure, box model, layering, role-specific primitives, and duplicate UI contracts. Color and polish should come after hierarchy and behavior are correct.

