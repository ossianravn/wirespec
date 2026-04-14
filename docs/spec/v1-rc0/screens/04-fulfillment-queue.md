---
schema: wirespec/1.0-rc0
id: fulfillment-queue
route: /warehouse/queue
component: warehouse/FulfillmentQueueScreen
canonical: true
patterns:
  - operations
  - queue
  - tabs
  - table
  - pagination
---

# Fulfillment queue

## Intent
Help a warehouse operator move work forward from the queue itself, with the next action and shipment context visible at a glance.

```wirespec v=1 kind=base
screen id=fulfillment-queue route="/warehouse/queue" title="Fulfillment queue"
  header id=queue-header
    row id=queue-header-row justify=between align=center
      heading id=queue-title level=1 text="Fulfillment queue"
      toolbar id=queue-tools
        field id=queue-search type=search name=queue-search label="Search orders" placeholder="Order number, customer, or SKU"
        select id=station-filter name=station label="Station" options=["All","Packing","Labeling","Exceptions"]
  main id=queue-main padding=lg
    column id=queue-content gap=lg
      tabs id=queue-tabs
        tab id=unassigned-tab label="Unassigned" controls=unassigned-panel selected=true
        tab id=packing-tab label="Packing" controls=packing-panel
        tab id=exceptions-tab label="Exceptions" controls=exceptions-panel
      tab-panel id=unassigned-panel
        row id=queue-layout align=start gap=lg
          section id=queue-table-region width=fill
            table id=pick-table
              table-header id=pick-table-header
                table-row id=pick-head-row
                  table-cell id=head-order text="Order"
                  table-cell id=head-customer text="Customer"
                  table-cell id=head-service text="Service"
                  table-cell id=head-sla text="SLA"
                  table-cell id=head-action text="Action"
              table-body id=pick-table-body
                table-row id=order-4821-row
                  table-cell id=order-4821-number text="#4821"
                  table-cell id=order-4821-customer text="Nordic Trail Supply"
                  table-cell id=order-4821-service text="Standard"
                  table-cell id=order-4821-sla
                    badge id=order-4821-sla-badge tone=warning text="Due in 42 min"
                  table-cell id=order-4821-action
                    button id=claim-4821 variant=primary action=claim-order label="Claim"
                table-row id=order-4827-row
                  table-cell id=order-4827-number text="#4827"
                  table-cell id=order-4827-customer text="Akers Food Hall"
                  table-cell id=order-4827-service text="Cold chain"
                  table-cell id=order-4827-sla
                    badge id=order-4827-sla-badge tone=critical text="Due in 12 min"
                  table-cell id=order-4827-action
                    button id=claim-4827 variant=primary action=claim-order label="Claim"
            pagination id=queue-pagination current=1 count=14
          aside id=shipment-summary width=md
            panel id=shipment-panel
              heading id=shipment-panel-title level=2 text="Selected shipment"
              text id=shipment-panel-copy text="Choose an order to see pick notes, handling requirements, and the next step."
```

```wirespec v=1 kind=state name=loading
patch target=pick-table busy=true
patch target=claim-4821 disabled=true
patch target=claim-4827 disabled=true
```

```wirespec v=1 kind=state name=row-selected
patch target=order-4827-row selected=true
patch target=shipment-panel-copy text="Cold chain order. Verify insulated packaging before sealing."
```

```wirespec v=1 kind=breakpoint name=tablet max=1023
hide target=shipment-summary
patch target=queue-main padding=md
```

## Acceptance
- The queue leads with actionable work rather than summary cards or ornamental status panels.
- SLA urgency is clear in the row without requiring the operator to open a detail screen first.
- Tablet layout preserves the queue as the primary surface without side-panel clutter.
