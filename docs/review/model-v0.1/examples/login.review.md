# Login review projection

```wirecomment
annotation id=ann-login-001
target screen=login node=submit state=error breakpoint=mobile
title="Keep the primary action above the fold on mobile error state"
status=open
severity=must
motivation=change-request
category=responsive
taxonomy=["LAY-10","QA-03"]
author="reviewer"
createdAt="2026-04-11T17:20:00Z"
body="On short mobile heights, the error message pushes the submit button too low. Tighten the stack or move the error closer to the password field."
suggest patch target=primary-actions sticky=bottom
```

```wirecomment
annotation id=ann-login-002
target screen=login node=forgot
title="Explain password recovery timing more clearly"
status=accepted
severity=should
motivation=question
category=copy
taxonomy=["QA-03"]
author="reviewer"
createdAt="2026-04-11T17:23:00Z"
body="Could this link tell the user whether recovery happens by email immediately or after admin review?"
reply author="agent" at="2026-04-11T17:28:00Z" body="Proposed follow-up: add helper copy on the recovery screen rather than lengthening this link label."
```
