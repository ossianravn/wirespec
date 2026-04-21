---
schema: wirespec/1.0-rc0
id: queue-missing-states
route: /warehouse/queue
component: warehouse/QueueScreen
---

# Queue missing states

## Intent
Help an operator claim the next order from the queue.

```wirespec v=1 kind=base
screen id=queue-missing-states route="/warehouse/queue" title="Orders queue"
  header id=queue-header
    toolbar id=queue-toolbar
      field id=query type=search name=query label="Search orders" placeholder="Order number or customer"
      button id=run-search variant=primary action=submit-search label="Search"
  main id=queue-main padding=lg
    section id=queue-table-region width=fill
      table id=queue-table
        table-header id=queue-table-header
          table-row id=queue-head-row
            table-cell id=head-order text="Order"
            table-cell id=head-status text="Status"
            table-cell id=head-action text="Action"
        table-body id=queue-table-body
          table-row id=order-1001-row
            table-cell id=order-1001-number text="#1001"
            table-cell id=order-1001-status text="Ready"
            table-cell id=order-1001-action
              button id=claim-1001 variant=primary action=claim-order label="Claim"
      pagination id=queue-pagination current=1 count=8
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=queue-main padding=md
```

## Acceptance
- Queue actions stay clear at a glance.
- Search stays close to the table.
