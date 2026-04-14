---
schema: wirespec/1.0-draft
id: checkout
route: /checkout
component: commerce/CheckoutScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Checkout

## Intent
Help a shopper complete shipping and payment with minimal friction while keeping the order summary visible but secondary.

```wirespec v=1 kind=base
screen id=checkout route="/checkout" title="Checkout"
  header id=checkout-header
    heading id=checkout-title level=1 text="Checkout"
  main id=checkout-layout max=xl
    grid id=checkout-grid cols=12 gap=lg
      form id=checkout-form submit=place-order span=8
        section id=shipping-section
          heading id=shipping-title level=2 text="Shipping"
          field id=full-name type=text name=fullName label="Full name" required=true
          field id=address-line-1 type=text name=address1 label="Address line 1" required=true
          field id=postal-code type=text name=postalCode label="Postal code" required=true
          field id=city type=text name=city label="City" required=true
        section id=payment-section
          heading id=payment-title level=2 text="Payment"
          field id=card-number type=text name=cardNumber label="Card number" required=true
          row id=payment-row gap=md
            field id=expiry type=text name=expiry label="Expiry" required=true
            field id=cvc type=text name=cvc label="CVC" required=true
        alert id=payment-error tone=critical visible=false text="Your card could not be authorized."
        actions id=checkout-actions justify=end
          button id=place-order variant=primary action=submit label="Place order"
      aside id=order-summary span=4
        card id=summary-card
          heading id=summary-title level=2 text="Order summary"
          text id=summary-items text="3 items"
          text id=summary-subtotal text="Subtotal: 74.00"
          text id=summary-shipping text="Shipping: 5.00"
          text id=summary-total text="Total: 79.00"
```

```wirespec v=1 kind=state name=payment-declined
show target=payment-error
patch target=card-number invalid=true description="Check the card number or try another card"
```

```wirespec v=1 kind=state name=submitting
patch target=place-order label="Placing order…" busy=true disabled=true
patch target=checkout-form disabled=true
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=checkout-grid cols=1
patch target=checkout-form span=1
patch target=order-summary span=1
```

## Acceptance
- Form fields stay in the main column and the summary never competes with the primary task.
- Payment errors appear near the payment section and preserve the entered shipping data.
- Mobile stacks the summary below the form without changing field order.
