# Annotation fixture index for the 10 canonical screens

This file extends the canonical screen set with **review scenarios** that should become test fixtures for annotation storage, browser pins, agent grouping, and resolution.

| Screen | Must-have annotation fixture coverage |
| --- | --- |
| `01-login` | node-level on `submit`; node-level on `forgot`; screen-level hierarchy comment; mobile error-state thread |
| `02-workspace-onboarding` | step-level thread on current step; acceptance-level comment on setup assumptions; screen-level comment on sequencing |
| `03-knowledge-search` | empty-state thread; filter rail mobile thread; result-card copy thread; screen-level comment on scanability |
| `04-fulfillment-queue` | table-header sort clarity thread; row-action placement thread; breakpoint collapse thread on bulk actions |
| `05-case-detail` | split-pane hierarchy thread; sidebar task clarity thread; inserted dialog confirmation thread |
| `06-security-settings` | tab naming thread; destructive-action warning thread; a11y thread on switch labels |
| `07-checkout` | stepper progress clarity thread; error-summary placement thread; mobile payment-actions thread |
| `08-clinic-scheduler` | dense-grid spacing thread; provider filter discoverability thread; day-switch mobile thread |
| `09-support-conversation` | composer affordance thread; details-sidebar necessity thread; state-specific loading reply thread |
| `10-article-editor` | toolbar grouping thread; preview-mode distinction thread; publish-panel task-order thread |

## Coverage by target level

Every screen suite should include at least:

- 1 screen-level annotation
- 2 node-level annotations
- 1 variant-scoped annotation
- 1 thread with agent reply
- 1 resolved thread
- 1 orphaned-thread simulation in parser tests

## Coverage by motivation

Across the 10 screens, make sure fixtures include:

- `question`
- `change-request`
- `issue`
- `approval`
- `blocking`

## Coverage by taxonomy

Use at least these Proper UI issue ids across the fixture set:

- `LAY-02`
- `LAY-10`
- `FID-02`
- `FID-09`
- `QA-02`
- `QA-03`

## Why this matters

The annotation system will only feel stable if it is tested against realistic review patterns:

- compact auth forms
- dense internal tools
- multi-step workflows
- settings and destructive actions
- editor / preview products
- split-pane operational details
