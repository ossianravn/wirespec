---
schema: wirespec/1.0-rc0
id: workspace-onboarding
route: /welcome/workspace
component: onboarding/WorkspaceSetupScreen
canonical: true
patterns:
  - onboarding
  - stepper
  - setup-form
  - validation
---

# Workspace onboarding

## Intent
Help a new admin create a workspace with just the information needed to get started, without turning setup into a long wizard.

```wirespec v=1 kind=base
screen id=workspace-onboarding route="/welcome/workspace" title="Set up your workspace"
  main id=content width=fill align=center justify=center padding=lg
    column id=setup-column width=fill max=md gap=lg
      stepper id=setup-steps
        step id=step-account label="Account" current=true
        step id=step-workspace label="Workspace" current=true
        step id=step-invite label="Invite"
      card id=setup-card width=fill
        heading id=setup-title level=1 text="Create your workspace"
        text id=setup-copy text="Start with the details your team will see every day."
        form id=setup-form submit=create-workspace
          field id=workspace-name type=text name=workspace-name label="Workspace name" required=true
          helper id=name-help text="Use the team or company name people already recognize."
          select id=team-size name=team-size label="Team size" options=["2-10","11-50","51-200","200+"]
          select id=data-region name=data-region label="Data region" options=["EU","US","APAC"]
          checkbox id=sample-project name=sample-project label="Create a sample project"
          alert id=name-conflict tone=critical text="That workspace name is already taken." visible=false
          actions id=setup-actions
            button id=back variant=secondary action=back label="Back"
            button id=create-workspace variant=primary action=submit label="Create workspace"
```

```wirespec v=1 kind=state name=submitting
patch target=create-workspace label="Creating workspace…" busy=true disabled=true
patch target=setup-form disabled=true
```

```wirespec v=1 kind=state name=name-taken
show target=name-conflict
patch target=workspace-name invalid=true
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=setup-column padding=sm
patch target=setup-steps direction=column
patch target=setup-actions direction=column width=fill
```

## Acceptance
- Setup stays focused on one short form instead of a sprawling wizard shell.
- Workspace naming help is visible before the user submits.
- The stepper remains understandable on mobile without becoming decorative overhead.
