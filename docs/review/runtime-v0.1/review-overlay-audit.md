# Review surface audit against Proper UI rubric

Audit summary:
- The review surface is intentionally task-first: preview dominant, slim controls, optional secondary surfaces.
- The main remaining risk is letting the thread drawer become permanent and heavier than the page being reviewed.

Findings:
- [LAY-01] Pass — no generic app shell; the layout is a focused review workspace.
- [LAY-02] Pass — the composition is driven by the task: select variant, inspect preview, leave feedback.
- [LAY-05] Pass — no hero, banner, or decorative welcome area in the review surface.
- [LAY-08] Guardrail — the thread drawer is optional and hidden by default; keep it that way.
- [LAY-10] Covered — narrow widths collapse the drawer into an overlay sheet instead of shrinking the preview.
- [FID-04] Pass — no filler analytics or faux dashboards.
- [FID-05] Pass — thread counts and statuses stay subtle; no badge spam.
- [FID-06] Pass — only a small set of containers is used: bar, preview stage, popover, optional drawer.
- [FID-07] Pass — controls stay plain and functional.
- [QA-02] Covered — states are explicitly designed for comment mode, stale preview, selected thread, and orphaned thread.
- [QA-03] Pass — the preview and current review task remain visually primary.

Fix order:
1. keep the preview dominant across widths
2. prevent permanent side-rail drift
3. keep empty and stale states lightweight
4. make retarget / orphan flows explicit
