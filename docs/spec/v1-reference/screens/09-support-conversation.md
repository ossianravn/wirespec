---
schema: wirespec/1.0-draft
id: support-conversation
route: /inbox/732
component: support/ConversationScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Support conversation

## Intent
Help a support agent read the thread, see customer context, and send a reply without losing the conversation flow.

```wirespec v=1 kind=base
screen id=support-conversation route="/inbox/732" title="Conversation 732"
  header id=conversation-header
    row id=conversation-header-row justify=between align=start
      column id=conversation-title-block
        heading id=conversation-title level=1 text="Refund request for duplicate shipment"
        text id=conversation-meta tone=subtle text="Customer: Marta Olsen · Started yesterday"
      actions id=conversation-actions
        button id=close-case variant=secondary action=close-case label="Close case"
  main id=conversation-layout max=xl
    grid id=conversation-grid cols=12 gap=lg
      section id=thread-column span=8
        list id=message-list source=messages
          list-item id=message-1
            text id=message-1-author text="Marta Olsen"
            text id=message-1-body text="I received the same order twice and was charged twice."
          list-item id=message-2
            text id=message-2-author text="Support"
            text id=message-2-body text="Thanks for reporting this. I am checking the shipment records now."
        form id=reply-composer submit=send-reply
          textarea id=reply-input name=replyInput label="Reply" rows=6 required=true
          row id=composer-tools justify=between align=center
            button id=attach-file variant=secondary action=attach-file label="Attach file"
            actions id=composer-actions
              button id=save-reply-draft variant=secondary action=save-draft label="Save draft"
              button id=send-reply-button variant=primary action=submit label="Send"
      aside id=customer-context span=4
        card id=customer-card
          heading id=customer-card-title level=2 text="Customer context"
          text id=customer-order-count text="Orders: 12"
          text id=customer-last-order text="Last order: 8 April 2026"
          text id=customer-status text="Plan: Pro"
```

```wirespec v=1 kind=state name=attachment-uploading
patch target=attach-file label="Uploading…" busy=true disabled=true
```

```wirespec v=1 kind=state name=reply-failed
insert position=before ref=reply-composer
  alert id=reply-failed tone=critical text="Reply failed to send. Your draft is still available."
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=conversation-grid cols=1
patch target=thread-column span=1
patch target=customer-context span=1
```

## Acceptance
- Reading order stays thread first, composer second, context third.
- The customer context card contains only information that helps reply to this case.
- Upload and send states do not remove the draft text field unexpectedly.
