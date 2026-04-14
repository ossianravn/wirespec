---
schema: wirespec/1.0-draft
id: knowledge-search
route: /knowledge
component: knowledge/SearchScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Knowledge search

## Intent
Let a user search internal documentation, narrow results by type and team, and understand clearly when nothing matches.

```wirespec v=1 kind=base
screen id=knowledge-search route="/knowledge" title="Search knowledge"
  header id=search-header
    heading id=search-title level=1 text="Search knowledge"
    row id=search-bar align=end gap=md
      field id=query type=search name=query label="Search" placeholder="Search articles, runbooks, and policies"
      button id=run-search variant=primary action=submit-search label="Search"
  main id=search-main max=xl
    grid id=search-layout cols=12 gap=lg
      aside id=filter-rail span=3
        section id=filter-type
          heading id=filter-type-title level=2 text="Content type"
          checkbox id=type-article name=typeArticle label="Articles"
          checkbox id=type-runbook name=typeRunbook label="Runbooks"
          checkbox id=type-policy name=typePolicy label="Policies"
        section id=filter-team
          heading id=filter-team-title level=2 text="Team"
          checkbox id=team-support name=teamSupport label="Support"
          checkbox id=team-ops name=teamOps label="Operations"
          checkbox id=team-platform name=teamPlatform label="Platform"
      section id=results-pane span=9
        row id=results-toolbar justify=between align=center
          text id=result-count tone=subtle text="124 results"
          select id=sort-order name=sort label="Sort by"
            option id=sort-relevance label="Relevance"
            option id=sort-updated label="Recently updated"
        list id=results-list source=results
          list-item id=result-1
            heading id=result-1-title level=2 text="Escalation paths for weekend incidents"
            text id=result-1-meta tone=subtle text="Runbook · Updated 4 days ago"
          list-item id=result-2
            heading id=result-2-title level=2 text="How to rotate API credentials safely"
            text id=result-2-meta tone=subtle text="Policy · Updated 2 weeks ago"
        empty-state id=no-results visible=false
          heading id=no-results-title level=2 text="No results found"
          text id=no-results-copy text="Try a broader search or remove one of the filters."
```

```wirespec v=1 kind=state name=loading
hide target=results-list
patch target=result-count text="Searching…"
```

```wirespec v=1 kind=state name=empty
hide target=results-list
show target=no-results
patch target=result-count text="0 results"
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=search-layout cols=1
hide target=filter-rail
patch target=results-pane span=1
insert position=after ref=search-bar
  button id=open-filters variant=secondary action=open-filter-drawer label="Filters"
```

## Acceptance
- The search field and submit action stay grouped and obvious.
- Filters remain optional support, not the visual focal point.
- Empty results use plain recovery guidance instead of decorative illustrations.
