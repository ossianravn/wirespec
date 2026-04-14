# Canonical screen index

These fixtures are designed to cover realistic product work without falling into generic dashboard patterns.

| File | Domain | Main job | Core patterns exercised | Variant ops exercised |
| --- | --- | --- | --- | --- |
| `01-login.md` | auth | sign in quickly | compact form, helper text, inline error, primary action | `patch`, `show` |
| `02-workspace-onboarding.md` | onboarding | create a workspace | stepper, select fields, setup form | `patch`, `show` |
| `03-knowledge-search.md` | search | find and filter content | search bar, filter rail, results list, empty state | `patch`, `hide`, `show`, `insert` |
| `04-fulfillment-queue.md` | operations | work a queue | tabs, table, row actions, pagination | `patch`, `hide` |
| `05-case-detail.md` | service ops | understand and act on a case | breadcrumbs, split detail layout, timeline, task sidebar | `insert`, `patch` |
| `06-security-settings.md` | settings | manage security policy | tabs, switches, domain list, policy sections | `show`, `hide`, `insert`, `patch` |
| `07-checkout.md` | commerce | complete a purchase | stepper, shipping form, delivery options, order summary | `show`, `patch` |
| `08-clinic-scheduler.md` | healthcare ops | manage a day schedule | date navigation, provider filters, appointment grid | `patch`, `hide`, `insert` |
| `09-support-conversation.md` | support | reply with context | conversation thread, composer, details sidebar | `patch`, `show`, `hide`, `insert` |
| `10-article-editor.md` | publishing | write and publish content | toolbar, editor body, preview tab, publish settings | `patch`, `show`, `hide`, `insert` |

## Coverage goals

Together, the fixtures cover:

- fields, selects, comboboxes, checkboxes, radios, switches, textareas
- tabs, steppers, tables, lists, breadcrumbs, dialogs, drawers
- loading, error, empty, selected, confirm, mobile, and tablet treatments
- task-first information architecture for distinct product domains

## Review principle

Every fixture should pass this human smell test:

> It should look like a plausible product screen for its domain, not a generic AI-generated dashboard shell.
