---
schema: wirespec/1.0-rc0
id: knowledge-search
route: /knowledge/search
component: knowledge/SearchScreen
canonical: true
patterns:
  - search
  - filters
  - empty-state
  - mobile-drawer
---

# Knowledge search

## Intent
Support focused retrieval across articles, playbooks, and internal notes with filters that help without overpowering the search task.

```wirespec v=1 kind=base
screen id=knowledge-search route="/knowledge/search" title="Knowledge search"
  header id=search-header
    toolbar id=search-toolbar
      field id=query type=search name=query label="Search knowledge" placeholder="Search articles, notes, and playbooks"
      button id=run-search variant=primary action=submit-search label="Search"
      button id=open-filters variant=secondary action=open-filters label="Filters" visible=false
  main id=search-main width=fill padding=lg
    row id=search-layout align=start gap=lg
      aside id=filters-panel width=sm
        heading id=filters-title level=2 text="Filter results"
        form id=filter-form submit=apply-filters
          checkbox id=filter-articles name=type-articles label="Articles" checked=true
          checkbox id=filter-playbooks name=type-playbooks label="Playbooks" checked=true
          checkbox id=filter-notes name=type-notes label="Notes"
          combobox id=topic-filter name=topic label="Topic" placeholder="Choose a topic"
          actions id=filter-actions
            button id=clear-filters variant=secondary action=clear-filters label="Clear filters"
            button id=apply-filters variant=primary action=submit label="Apply filters"
      section id=results-panel width=fill
        row id=results-header justify=between align=center
          heading id=results-title level=2 text="Results"
          helper id=result-count text="24 results"
        list id=results-list
          list-item id=result-1
            link id=result-1-link href="/knowledge/articles/customer-refunds" label="Customer refunds by payment method"
            helper id=result-1-meta text="Article · Updated yesterday"
          list-item id=result-2
            link id=result-2-link href="/knowledge/playbooks/chargeback-response" label="Chargeback response checklist"
            helper id=result-2-meta text="Playbook · Updated 3 days ago"
        empty-state id=no-results title="No matching results" description="Try broader terms or fewer filters." visible=false
```

```wirespec v=1 kind=state name=loading
hide target=results-list
patch target=results-panel busy=true
insert position=inside-start ref=results-panel
  helper id=loading-copy text="Searching articles, notes, and playbooks…"
```

```wirespec v=1 kind=state name=empty
hide target=results-list
show target=no-results
patch target=result-count text="0 results"
```

```wirespec v=1 kind=state name=filters-open
insert position=inside-end ref=knowledge-search
  drawer id=filters-drawer title="Filters"
    heading id=filters-drawer-title level=2 text="Filter results"
    form id=filters-drawer-form submit=apply-filters
      checkbox id=drawer-filter-articles name=type-articles label="Articles" checked=true
      checkbox id=drawer-filter-playbooks name=type-playbooks label="Playbooks" checked=true
      checkbox id=drawer-filter-notes name=type-notes label="Notes"
      combobox id=drawer-topic-filter name=topic label="Topic" placeholder="Choose a topic"
      actions id=filters-drawer-actions
        button id=drawer-cancel variant=secondary action=close-filters label="Cancel"
        button id=drawer-apply variant=primary action=submit label="Apply filters"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
hide target=filters-panel
show target=open-filters
patch target=search-main padding=md
```

## Acceptance
- Search remains the primary task; filters help but never dominate the screen.
- Empty results explain what to do next without decorative filler.
- Mobile users can access filters through a drawer without losing the query context.
