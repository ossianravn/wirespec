---
route: /login
component: src/features/auth/LoginCard.tsx
---

# Login

## Intent
The user signs in with minimal friction and clear recovery paths.

## Notes
User signs in with minimal friction and clear recovery confidence.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      text id=intro text="Use your work email and password."
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        field id=password type=password name=password label="Password" required=true
        row id=options justify=between
          checkbox id=remember name=remember label="Remember me"
          link id=forgot href="/forgot-password" label="Forgot password?"
        alert id=form-error tone=error text="Incorrect email or password."
        actions id=primary-actions layout=stack-mobile
          button id=submit variant=primary action=submit label="Sign in"
```
