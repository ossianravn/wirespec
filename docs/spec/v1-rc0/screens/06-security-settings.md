---
schema: wirespec/1.0-rc0
id: security-settings
route: /settings/security
component: settings/SecuritySettingsScreen
canonical: true
patterns:
  - settings
  - tabs
  - switches
  - list-management
---

# Security settings

## Intent
Give administrators a calm, policy-first place to manage account protection and approved access without turning settings into a decorative dashboard.

```wirespec v=1 kind=base
screen id=security-settings route="/settings/security" title="Security settings"
  header id=settings-header
    heading id=settings-title level=1 text="Security settings"
  main id=settings-main padding=lg
    column id=settings-content gap=lg
      tabs id=settings-tabs
        tab id=policies-tab label="Policies" controls=policies-panel selected=true
        tab id=access-tab label="Access" controls=access-panel
        tab id=audit-tab label="Audit" controls=audit-panel
      tab-panel id=policies-panel
        section id=sign-in-policy
          heading id=sign-in-policy-title level=2 text="Sign-in policy"
          switch id=require-sso name=require-sso label="Require SSO for all members"
          switch id=require-passkeys name=require-passkeys label="Require passkeys for admins"
          select id=session-timeout name=session-timeout label="Session timeout" options=["4 hours","8 hours","24 hours","7 days"]
        section id=password-reset-policy
          heading id=password-reset-title level=2 text="Password reset"
          checkbox id=notify-admin name=notify-admin label="Notify admins when a privileged account resets a password"
      tab-panel id=access-panel visible=false
        section id=approved-domains
          row id=domain-header justify=between align=center
            heading id=approved-domains-title level=2 text="Approved domains"
            button id=add-domain variant=secondary action=open-add-domain label="Add domain"
          list id=domain-list
            list-item id=domain-1
              text id=domain-1-copy text="acme-logistics.com"
            list-item id=domain-2
              text id=domain-2-copy text="acme-warehouse.eu"
      tab-panel id=audit-panel visible=false
        section id=audit-alerts
          heading id=audit-alerts-title level=2 text="Audit alerts"
          switch id=alert-new-admin name=alert-new-admin label="Alert on new admin role grants"
          switch id=alert-suspicious-login name=alert-suspicious-login label="Alert on suspicious sign-ins"
```

```wirespec v=1 kind=state name=access
hide target=policies-panel
show target=access-panel
hide target=audit-panel
patch target=policies-tab selected=false
patch target=access-tab selected=true
patch target=audit-tab selected=false
```

```wirespec v=1 kind=state name=audit
hide target=policies-panel
hide target=access-panel
show target=audit-panel
patch target=policies-tab selected=false
patch target=access-tab selected=false
patch target=audit-tab selected=true
```

```wirespec v=1 kind=state name=add-domain
insert position=inside-end ref=security-settings
  dialog id=add-domain-dialog title="Add approved domain"
    heading id=add-domain-dialog-title level=2 text="Add approved domain"
    form id=add-domain-form submit=save-domain
      field id=domain-input type=text name=domain label="Domain" placeholder="example.com" required=true
      actions id=add-domain-dialog-actions
        button id=cancel-domain variant=secondary action=cancel-domain label="Cancel"
        button id=save-domain variant=primary action=submit label="Save domain"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=settings-main padding=md
patch target=settings-tabs direction=column
patch target=domain-header direction=column
```

## Acceptance
- Security policy controls are grouped by decision area, not by component type.
- Tabs switch clear sections without leaving multiple competing panels on screen.
- Domain management includes a focused add-domain dialog rather than inline clutter.
