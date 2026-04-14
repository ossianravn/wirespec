---
schema: wirespec/1.0-draft
id: clinic-scheduler
route: /appointments/new
component: scheduling/AppointmentScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Clinic scheduler

## Intent
Help a patient choose a clinician, date, and time slot while making availability conflicts obvious and recoverable.

```wirespec v=1 kind=base
screen id=clinic-scheduler route="/appointments/new" title="Book appointment"
  header id=scheduler-header
    heading id=scheduler-title level=1 text="Book appointment"
    text id=scheduler-copy tone=subtle text="Choose a provider, date, and time that works for you."
  main id=scheduler-layout max=lg
    grid id=scheduler-grid cols=2 gap=lg
      form id=appointment-form submit=book-appointment span=1
        select id=provider name=provider label="Provider"
          option id=provider-nguyen label="Dr. Nguyen"
          option id=provider-khan label="Dr. Khan"
        field id=appointment-date type=date name=appointmentDate label="Date" required=true
        section id=time-slots
          heading id=time-slots-title level=2 text="Available times"
          list id=slot-list variant=choices
            button id=slot-0900 variant=secondary action=select-slot label="09:00"
            button id=slot-0930 variant=secondary action=select-slot label="09:30"
            button id=slot-1000 variant=secondary action=select-slot label="10:00"
        alert id=slot-error tone=critical visible=false text="That time is no longer available."
        actions id=scheduler-actions justify=end
          button id=book-appointment variant=primary action=submit label="Book appointment"
      card id=appointment-summary span=1
        heading id=summary-heading level=2 text="Appointment details"
        text id=summary-provider text="Provider: Not selected"
        text id=summary-date text="Date: Not selected"
        text id=summary-time text="Time: Not selected"
```

```wirespec v=1 kind=state name=slot-selected
patch target=slot-0930 selected=true
patch target=summary-provider text="Provider: Dr. Nguyen"
patch target=summary-date text="Date: 21 April 2026"
patch target=summary-time text="Time: 09:30"
```

```wirespec v=1 kind=state name=slot-conflict
show target=slot-error
patch target=slot-0930 disabled=true
patch target=summary-time text="Time: Not selected"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=scheduler-grid cols=1
patch target=appointment-form span=1
patch target=appointment-summary span=1
```

## Acceptance
- Available times are presented as direct choices rather than hidden in a secondary dialog.
- If a slot becomes unavailable, the message stays close to the time list and selection resets clearly.
- Summary content mirrors the current selections without adding extra steps.
