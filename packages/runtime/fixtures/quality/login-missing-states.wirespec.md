---
schema: wirespec/1.0-rc0
id: login-missing-states
route: /login
component: auth/LoginScreen
---

# Login missing states

## Intent
Let a returning user sign in without confusion.

```wirespec v=1 kind=base
screen id=login-missing-states route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        field id=password type=password name=password label="Password" required=true
        alert id=form-error tone=critical text="Incorrect email or password." visible=false
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=auth-card max=fill
patch target=primary-actions direction=column width=fill
```

## Acceptance
- Keyboard-only user can complete sign-in.
- Primary action stays visible on common mobile widths.
