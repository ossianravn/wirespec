---
schema: wirespec/1.0-rc0
id: support-conversation
route: /support/conversations/551
component: support/ConversationScreen
canonical: true
patterns:
  - support
  - thread
  - composer
  - details-drawer
---

# Support conversation

## Intent
Help a support agent reply with context, while keeping the conversation thread primary and the case details secondary.

```wirespec v=1 kind=base
screen id=support-conversation route="/support/conversations/551" title="Support conversation"
  header id=conversation-header
    row id=conversation-header-row justify=between align=center
      column id=conversation-title-block
        heading id=conversation-title level=1 text="Refund status for order #4821"
        helper id=conversation-subtitle text="Customer waiting 2 hours · Medium priority"
      button id=open-details variant=secondary action=open-details label="Details" visible=false
  main id=conversation-main padding=lg
    row id=conversation-layout align=start gap=lg
      section id=thread-region width=fill
        list id=thread-list
          list-item id=message-1
            text id=message-1-copy text="Customer: I still have not received the refund confirmation."
          list-item id=message-2
            text id=message-2-copy text="Agent: I’m checking the payout status with finance now."
        form id=composer-form submit=send-reply
          textarea id=reply-body name=reply-body label="Reply" required=true
          alert id=send-error tone=critical text="Reply could not be sent. Please try again." visible=false
          actions id=composer-actions
            button id=save-draft variant=secondary action=save-draft label="Save draft"
            button id=send-reply variant=primary action=submit label="Send reply"
      aside id=details-sidebar width=md
        panel id=details-panel
          heading id=details-title level=2 text="Case details"
          text id=details-copy text="Refund approved. Waiting for payout confirmation from finance."
```

```wirespec v=1 kind=state name=sending
patch target=send-reply label="Sending…" busy=true disabled=true
patch target=composer-form disabled=true
```

```wirespec v=1 kind=state name=send-failed
show target=send-error
patch target=reply-body invalid=true
```

```wirespec v=1 kind=state name=details-open
insert position=inside-end ref=support-conversation
  drawer id=details-drawer title="Case details"
    heading id=details-drawer-title level=2 text="Case details"
    text id=details-drawer-copy text="Refund approved. Waiting for payout confirmation from finance."
    actions id=details-drawer-actions
      button id=close-details variant=primary action=close-details label="Close"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
hide target=details-sidebar
show target=open-details
patch target=conversation-layout direction=column
patch target=conversation-main padding=md
```

## Acceptance
- Conversation thread stays primary; case details remain available without becoming a competing rail on mobile.
- Error state is close to the reply box and does not erase draft text.
- The send action remains obvious and keyboard-reachable.
