---
schema: wirespec/1.0-draft
id: login
route: /login
component: auth/LoginScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Login

## Intent
Allow a returning user to sign in quickly, recover access easily, and understand failures without losing their place.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      text id=intro tone=subtle text="Use your work email and password."
      alert id=form-error tone=critical visible=false text="Check your credentials and try again."
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" autocomplete=email required=true
        field id=password type=password name=password label="Password" autocomplete=current-password required=true
        row id=assist justify=between align=center
          checkbox id=remember name=remember label="Remember me"
          link id=forgot href="/forgot-password" label="Forgot password?"
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=state name=loading
patch target=submit label="Signing in…" busy=true disabled=true
patch target=login-form disabled=true
```

```wirespec v=1 kind=state name=error-invalid-credentials
show target=form-error
patch target=password invalid=true description="Incorrect password"
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=content padding=md
patch target=auth-card max=fill
patch target=assist align=start
patch target=primary-actions width=fill
```

## Acceptance
- Keyboard-only user can complete sign-in and reach the recovery link.
- Error message remains adjacent to the form and does not replace field labels.
- Primary action is visible without horizontal scrolling on mobile.
