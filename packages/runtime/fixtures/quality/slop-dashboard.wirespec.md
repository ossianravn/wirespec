---
schema: wirespec/1.0-rc0
id: slop-dashboard
route: /dashboard
component: analytics/OverviewScreen
---

# Team dashboard

## Intent
Give a high-level overview.

```wirespec v=1 kind=base
screen id=slop-dashboard route="/dashboard" title="Dashboard"
  header id=dashboard-header
    row id=dashboard-header-row justify=between align=center
      heading id=dashboard-title level=1 text="Overview"
      toolbar id=dashboard-toolbar
        button id=open-report variant=primary action=open-report label="Open report"
        button id=open-settings variant=primary action=open-settings label="Open settings"
  main id=dashboard-main padding=lg
    row id=dashboard-layout align=start gap=lg
      section id=overview-grid width=fill
        row id=kpi-row gap=lg
          card id=revenue-card
            heading id=revenue-title level=2 text="Revenue"
            text id=revenue-value text="128k"
          card id=active-users-card
            heading id=active-users-title level=2 text="Active users"
            text id=active-users-value text="4,320"
          card id=conversion-card
            heading id=conversion-title level=2 text="Conversion"
            text id=conversion-value text="6.2%"
          card id=performance-card
            heading id=performance-title level=2 text="Performance"
            text id=performance-value text="98%"
        row id=filler-row gap=lg
          panel id=filler-panel-1
            heading id=filler-panel-1-title level=2 text="Section 1"
            text id=filler-panel-1-copy text="Placeholder"
          panel id=filler-panel-2
            heading id=filler-panel-2-title level=2 text="Section 2"
            text id=filler-panel-2-copy text="Content goes here"
          panel id=filler-panel-3
            heading id=filler-panel-3-title level=2 text="Section 3"
            text id=filler-panel-3-copy text="Your data"
          panel id=filler-panel-4
            heading id=filler-panel-4-title level=2 text="Section 4"
            text id=filler-panel-4-copy text="Placeholder"
      aside id=insights-sidebar width=md
        panel id=insights-panel
          heading id=insights-title level=2 text="Insights"
          text id=insights-copy text="React chart coming soon"
```

## Acceptance
- Looks good.
