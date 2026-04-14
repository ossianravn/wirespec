---
schema: wirespec/1.0-rc0
id: login
route: /login
component: auth/LoginScreen
canonical: true
---

# Login

## Intent
Let a returning user sign in quickly, recover access easily, and understand failures without losing context.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      text id=intro text="Use your work email and password."
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true autocomplete=email
        field id=password type=password name=password label="Password" required=true autocomplete=current-password
        row id=assistive-row justify=between align=center
          checkbox id=remember name=remember label="Remember me"
          link id=forgot href="/forgot-password" label="Forgot password?"
        alert id=form-error tone=critical text="Incorrect email or password." visible=false
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=state name=loading
patch target=submit label="Signing in…" busy=true disabled=true
patch target=login-form disabled=true
```

```wirespec v=1 kind=state name=error
show target=form-error
patch target=password invalid=true
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=auth-card max=fill
patch target=primary-actions direction=column width=fill
```

## Acceptance
- Keyboard-only user can complete sign-in and trigger password recovery.
- Inline error stays close to the password field and does not replace the field label.
- Primary action remains visible without scrolling on common mobile widths.
