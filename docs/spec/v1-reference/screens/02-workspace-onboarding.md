---
schema: wirespec/1.0-draft
id: workspace-onboarding
route: /setup/workspace
component: onboarding/WorkspaceSetupScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Workspace onboarding

## Intent
Help a team create a workspace, capture only the minimum setup details, and invite collaborators without overwhelming the first-run flow.

```wirespec v=1 kind=base
screen id=workspace-onboarding route="/setup/workspace" title="Create your workspace"
  header id=setup-header
    heading id=setup-title level=1 text="Create your workspace"
    stepper id=setup-steps current=2
      step id=step-account label="Account" status=complete
      step id=step-workspace label="Workspace" status=current
      step id=step-invite label="Invite" status=upcoming
  main id=setup-main width=fill max=lg
    grid id=setup-grid cols=2 gap=lg
      form id=workspace-form submit=create-workspace span=1
        field id=workspace-name type=text name=workspaceName label="Workspace name" required=true
        select id=team-size name=teamSize label="Team size"
          option id=team-size-1 label="1–5 people"
          option id=team-size-2 label="6–20 people"
          option id=team-size-3 label="21+ people"
        textarea id=use-case name=useCase label="What will your team use this for?" rows=4
        actions id=setup-actions justify=between
          button id=back variant=secondary action=go-back label="Back"
          button id=continue variant=primary action=submit label="Continue"
      card id=invite-preview span=1
        heading id=invite-preview-title level=2 text="Invite teammates now or later"
        text id=invite-preview-copy tone=subtle text="You can start alone and invite people after setup."
        field id=invite-email-1 type=email name=inviteEmail1 label="Teammate email"
        field id=invite-email-2 type=email name=inviteEmail2 label="Second teammate email"
```

```wirespec v=1 kind=state name=validation-missing-name
patch target=workspace-name invalid=true description="Enter a workspace name"
```

```wirespec v=1 kind=state name=submitting
patch target=continue label="Creating workspace…" busy=true disabled=true
patch target=workspace-form disabled=true
patch target=invite-preview disabled=true
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=setup-grid cols=1
patch target=setup-actions justify=stretch
patch target=invite-preview span=1
```

## Acceptance
- The current step is visible and understandable without decorative copy.
- Only one primary action appears at the bottom of the form.
- The secondary invite section never blocks setup completion.
