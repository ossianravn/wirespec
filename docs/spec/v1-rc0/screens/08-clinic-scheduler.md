---
schema: wirespec/1.0-rc0
id: clinic-scheduler
route: /schedule/clinic
component: clinic/DaySchedulerScreen
canonical: true
patterns:
  - scheduler
  - table
  - filters
  - mobile-agenda
---

# Clinic scheduler

## Intent
Help front-desk staff manage the day schedule quickly, with clear slot occupancy, provider context, and a workable mobile fallback.

```wirespec v=1 kind=base
screen id=clinic-scheduler route="/schedule/clinic" title="Clinic scheduler"
  header id=scheduler-header
    row id=scheduler-header-row justify=between align=center
      heading id=scheduler-title level=1 text="Clinic scheduler"
      toolbar id=scheduler-tools
        button id=previous-day variant=secondary action=previous-day label="Previous day"
        field id=schedule-date type=date name=schedule-date label="Date"
        button id=next-day variant=secondary action=next-day label="Next day"
        combobox id=provider-filter name=provider label="Provider" placeholder="All providers"
        select id=room-filter name=room label="Room" options=["All rooms","Room 1","Room 2","Room 3"]
  main id=scheduler-main padding=lg
    row id=scheduler-layout align=start gap=lg
      section id=scheduler-grid-region width=fill
        table id=schedule-grid
          table-header id=schedule-grid-header
            table-row id=schedule-grid-head-row
              table-cell id=head-time text="Time"
              table-cell id=head-provider-1 text="Dr. Park"
              table-cell id=head-provider-2 text="Dr. Silva"
          table-body id=schedule-grid-body
            table-row id=row-0900
              table-cell id=time-0900 text="09:00"
              table-cell id=park-0900
                button id=appt-0900-park variant=secondary action=open-appointment label="Nguyen — follow-up"
              table-cell id=silva-0900
                button id=open-slot-0900-silva variant=tertiary action=create-appointment label="Open slot"
            table-row id=row-0930
              table-cell id=time-0930 text="09:30"
              table-cell id=park-0930
                button id=open-slot-0930-park variant=tertiary action=create-appointment label="Open slot"
              table-cell id=silva-0930
                button id=appt-0930-silva variant=secondary action=open-appointment label="Larsen — annual review"
      aside id=appointment-sidebar width=md
        panel id=appointment-panel
          heading id=appointment-title level=2 text="Appointment details"
          text id=appointment-copy text="Select an appointment or open slot to review notes and booking options."
```

```wirespec v=1 kind=state name=appointment-selected
patch target=appt-0900-park selected=true
patch target=appointment-copy text="Nguyen — follow-up visit. Interpreter requested. Arrive 10 minutes early."
```

```wirespec v=1 kind=breakpoint name=mobile max=767
hide target=schedule-grid
hide target=appointment-sidebar
insert position=inside-end ref=scheduler-grid-region
  list id=mobile-agenda
    list-item id=mobile-item-0900-park
      button id=mobile-appt-0900-park variant=secondary action=open-appointment label="09:00 — Nguyen with Dr. Park"
    list-item id=mobile-item-0930-silva
      button id=mobile-appt-0930-silva variant=secondary action=open-appointment label="09:30 — Larsen with Dr. Silva"
```

```wirespec v=1 kind=state name=appointment-drawer
insert position=inside-end ref=clinic-scheduler
  drawer id=appointment-drawer title="Appointment details"
    heading id=appointment-drawer-title level=2 text="Appointment details"
    text id=appointment-drawer-copy text="Nguyen — follow-up visit. Interpreter requested. Arrive 10 minutes early."
    actions id=appointment-drawer-actions
      button id=reschedule-visit variant=secondary action=reschedule-visit label="Reschedule"
      button id=check-in variant=primary action=check-in label="Check in"
```

## Acceptance
- The day schedule reads as a working schedule, not as a KPI dashboard.
- Occupied and open slots are clearly distinguishable.
- Mobile fallback switches to an agenda list instead of forcing a cramped time grid.
