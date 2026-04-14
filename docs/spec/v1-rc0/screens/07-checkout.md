---
schema: wirespec/1.0-rc0
id: checkout
route: /checkout
component: commerce/CheckoutScreen
canonical: true
patterns:
  - commerce
  - stepper
  - shipping-form
  - order-summary
---

# Checkout

## Intent
Let a buyer complete shipping and delivery choices with confidence, while keeping the order summary close enough to verify without hijacking the flow.

```wirespec v=1 kind=base
screen id=checkout route="/checkout" title="Checkout"
  main id=checkout-main padding=lg
    row id=checkout-layout align=start gap=lg
      section id=checkout-flow width=fill
        stepper id=checkout-steps
          step id=step-cart label="Cart"
          step id=step-shipping label="Shipping" current=true
          step id=step-review label="Review"
        form id=shipping-form submit=continue-to-review
          heading id=shipping-title level=1 text="Shipping details"
          field id=full-name type=text name=full-name label="Full name" required=true
          field id=address-line-1 type=text name=address-line-1 label="Address line 1" required=true
          field id=address-line-2 type=text name=address-line-2 label="Address line 2"
          row id=city-row gap=md
            field id=city type=text name=city label="City" required=true
            field id=postal-code type=text name=postal-code label="Postal code" required=true
          select id=country name=country label="Country" options=["Denmark","Sweden","Germany","Norway"]
          radio-group id=delivery-speed name=delivery-speed label="Delivery speed"
            radio id=delivery-standard value=standard label="Standard — 2 to 4 business days"
            radio id=delivery-express value=express label="Express — next business day"
          checkbox id=billing-same name=billing-same label="Billing address is the same"
          alert id=payment-error tone=critical text="Your payment authorization could not be completed." visible=false
          actions id=checkout-actions
            link id=return-to-cart href="/cart" label="Back to cart"
            button id=continue-to-review variant=primary action=submit label="Continue to review"
      aside id=order-summary width=md
        panel id=summary-panel
          heading id=summary-title level=2 text="Order summary"
          list id=summary-items
            list-item id=item-1
              text id=item-1-copy text="Trail jacket ×1"
            list-item id=item-2
              text id=item-2-copy text="Insulated bottle ×2"
          divider id=summary-divider
          text id=summary-total text="Total: 1,240 DKK"
```

```wirespec v=1 kind=state name=payment-failed
show target=payment-error
patch target=continue-to-review label="Try again"
```

```wirespec v=1 kind=state name=submitting
patch target=continue-to-review label="Saving details…" busy=true disabled=true
patch target=shipping-form disabled=true
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=checkout-layout direction=column
patch target=order-summary order=before
patch target=checkout-main padding=md
patch target=checkout-actions direction=column width=fill
```

## Acceptance
- Order summary stays available without stealing attention from the form.
- Delivery choices are explicit and readable, not compressed into unlabeled chips.
- Mobile layout preserves both verification and forward progress.
