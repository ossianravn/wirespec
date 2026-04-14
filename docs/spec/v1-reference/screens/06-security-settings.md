---
schema: wirespec/1.0-draft
id: security-settings
route: /settings/security
component: settings/SecurityScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Security settings

## Intent
Let an account owner review authentication settings, active sessions, and high-risk actions in a single predictable place.

```wirespec v=1 kind=base
screen id=security-settings route="/settings/security" title="Security"
  header id=security-header
    heading id=security-title level=1 text="Security"
    text id=security-intro tone=subtle text="Manage sign-in methods, sessions, and recovery options."
  main id=security-main max=lg
    stack id=security-sections gap=lg
      card id=password-card
        heading id=password-title level=2 text="Password"
        text id=password-updated tone=subtle text="Last changed 42 days ago"
        actions id=password-actions
          button id=change-password variant=secondary action=open-change-password label="Change password"
      card id=mfa-card
        heading id=mfa-title level=2 text="Two-factor authentication"
        row id=mfa-row justify=between align=center
          text id=mfa-status text="Authenticator app connected"
          switch id=mfa-toggle name=mfaEnabled checked=true label="Two-factor authentication"
      card id=sessions-card
        heading id=sessions-title level=2 text="Active sessions"
        list id=session-list source=sessions
          list-item id=session-1
            text id=session-1-device text="Chrome on macOS · Copenhagen"
            button id=session-1-revoke variant=secondary action=revoke-session label="Sign out"
          list-item id=session-2
            text id=session-2-device text="Safari on iPhone · Copenhagen"
            button id=session-2-revoke variant=secondary action=revoke-session label="Sign out"
      card id=delete-card tone=critical
        heading id=delete-title level=2 text="Delete account"
        text id=delete-copy text="Permanently delete this account and all workspace data."
        actions id=delete-actions
          button id=delete-account variant=destructive action=open-delete-confirmation label="Delete account"
```

```wirespec v=1 kind=state name=confirm-disable-mfa
insert position=inside-end ref=security-settings
  dialog id=disable-mfa-dialog title="Disable two-factor authentication?" tone=critical
    text id=disable-mfa-copy text="You will remove an important layer of protection from your account."
    actions id=disable-mfa-actions justify=end
      button id=disable-mfa-cancel variant=secondary action=close-dialog label="Cancel"
      button id=disable-mfa-confirm variant=destructive action=disable-mfa label="Disable"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=security-main max=fill
patch target=mfa-row justify=start
```

## Acceptance
- Security sections stay clearly separated by task, not by decoration.
- Destructive actions are isolated at the end of the page.
- The confirmation dialog uses plain language and makes the safe option easy to find.
