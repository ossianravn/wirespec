---
schema: wirespec/1.0-draft
id: fulfillment-queue
route: /orders/queue
component: fulfillment/QueueScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Fulfillment queue

## Intent
Help warehouse staff triage unshipped orders, apply a few high-value filters, and take bulk actions without extra dashboard ceremony.

```wirespec v=1 kind=base
screen id=fulfillment-queue route="/orders/queue" title="Orders to pack"
  header id=queue-header
    heading id=queue-title level=1 text="Orders to pack"
    row id=queue-filters gap=md align=end
      select id=status-filter name=status label="Status"
        option id=status-open label="Open"
        option id=status-hold label="On hold"
        option id=status-priority label="Priority"
      field id=picker-filter type=text name=picker label="Assigned picker"
      button id=refresh variant=secondary action=refresh label="Refresh"
  main id=queue-main
    section id=bulk-actions visible=false
      row id=bulk-actions-row justify=between align=center
        text id=bulk-count text="3 orders selected"
        actions id=bulk-actions-buttons
          button id=mark-packed variant=primary action=bulk-pack label="Mark packed"
          button id=print-packing-slips variant=secondary action=bulk-print label="Print slips"
    table id=queue-table source=orders
      table-header id=queue-table-header
        table-row id=queue-head-row
          table-cell id=head-select text="Select"
          table-cell id=head-order text="Order"
          table-cell id=head-customer text="Customer"
          table-cell id=head-items text="Items"
          table-cell id=head-due text="Ship by"
          table-cell id=head-status text="Status"
      table-body id=queue-table-body
        table-row id=order-1042
          table-cell id=order-1042-select text="□"
          table-cell id=order-1042-number text="#1042"
          table-cell id=order-1042-customer text="A. Nguyen"
          table-cell id=order-1042-items text="3"
          table-cell id=order-1042-due text="Today"
          table-cell id=order-1042-status text="Priority"
        table-row id=order-1043
          table-cell id=order-1043-select text="□"
          table-cell id=order-1043-number text="#1043"
          table-cell id=order-1043-customer text="L. Santos"
          table-cell id=order-1043-items text="1"
          table-cell id=order-1043-due text="Tomorrow"
          table-cell id=order-1043-status text="Open"
    empty-state id=queue-empty visible=false
      heading id=queue-empty-title level=2 text="No orders need packing"
      text id=queue-empty-copy text="New orders will appear here when they are ready."
```

```wirespec v=1 kind=state name=rows-selected
show target=bulk-actions
patch target=order-1042 selected=true
patch target=order-1043 selected=true
```

```wirespec v=1 kind=state name=empty
hide target=queue-table
show target=queue-empty
```

```wirespec v=1 kind=breakpoint name=tablet max=1023
patch target=queue-filters align=stretch
patch target=queue-header gap=md
```

```wirespec v=1 kind=breakpoint name=mobile max=767
hide target=head-items
hide target=head-due
hide target=order-1042-items
hide target=order-1042-due
hide target=order-1043-items
hide target=order-1043-due
patch target=queue-filters align=start
```

## Acceptance
- No KPI strip appears ahead of the actual queue.
- Bulk actions are hidden until selection gives them meaning.
- Mobile keeps the table scannable by collapsing secondary columns instead of shrinking text.
