---
schema: wirespec/1.0-rc0
id: task-first-search
route: /knowledge/search
component: knowledge/SearchScreen
---

# Task-first search

## Intent
Help a support user find the right article quickly and recover when results are missing.

```wirespec v=1 kind=base
screen id=task-first-search route="/knowledge/search" title="Knowledge search"
  header id=search-header
    toolbar id=search-toolbar
      field id=query type=search name=query label="Search knowledge" placeholder="Search articles and playbooks"
      button id=run-search variant=primary action=submit-search label="Search"
      button id=open-filters variant=secondary action=open-filters label="Filters" visible=false
  main id=search-main padding=lg
    row id=search-layout align=start gap=lg
      aside id=filters-panel width=sm
        heading id=filters-title level=2 text="Filter results"
        form id=filter-form submit=apply-filters
          checkbox id=filter-articles name=articles label="Articles" checked=true
          checkbox id=filter-playbooks name=playbooks label="Playbooks" checked=true
          actions id=filter-actions
            button id=apply-filters variant=primary action=submit label="Apply filters"
      section id=results-panel width=fill
        row id=results-header justify=between align=center
          heading id=results-title level=2 text="Results"
          helper id=result-count text="12 results"
        list id=results-list
          list-item id=result-1
            link id=result-1-link href="/knowledge/articles/refunds" label="Refund timing guide"
            helper id=result-1-meta text="Article"
        empty-state id=no-results title="No matching results" description="Try broader terms or fewer filters." visible=false
```

```wirespec v=1 kind=state name=loading
hide target=results-list
patch target=results-panel busy=true
insert position=inside-start ref=results-panel
  helper id=loading-copy text="Searching articles and playbooks…"
```

```wirespec v=1 kind=state name=empty
hide target=results-list
show target=no-results
patch target=result-count text="0 results"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
hide target=filters-panel
show target=open-filters
patch target=search-main padding=md
```

## Acceptance
- Search stays primary while filters stay secondary.
- Empty results tell the user what to do next.
- Mobile users can reach filters without losing the query context.
