---
route: /login
component: src/features/auth/LoginCard.tsx
---

# Login

## Intent
User signs in quickly and recovers from failure without confusion.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content width=fill align=center justify=center padding=lg
    card id=auth-card width=fill max=sm
      heading id=title level=1 text="Welcome back"
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        field id=password type=password name=password label="Password" required=true
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=state name=error
patch target=form-error kind=alert variant=error text="Incorrect email or password."
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=primary-actions position=sticky edge=bottom
```

## Acceptance
- Keyboard-only user can submit without hidden controls.
- Recovery copy stays direct and calm.
