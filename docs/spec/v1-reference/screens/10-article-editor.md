---
schema: wirespec/1.0-draft
id: article-editor
route: /articles/new
component: content/ArticleEditorScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Article editor

## Intent
Help an editor draft, preview, and publish a knowledge-base article without burying the writing area under extra chrome.

```wirespec v=1 kind=base
screen id=article-editor route="/articles/new" title="New article"
  header id=editor-header
    row id=editor-header-row justify=between align=start
      column id=editor-title-block
        heading id=editor-title level=1 text="New article"
        text id=editor-status tone=subtle text="Draft not published"
      actions id=editor-header-actions
        button id=save-draft-header variant=secondary action=save-draft label="Save draft"
        button id=publish-header variant=primary action=publish label="Publish"
  main id=editor-layout max=xl
    grid id=editor-grid cols=12 gap=lg
      section id=editor-workspace span=8
        field id=article-title type=text name=title label="Title" required=true
        tabs id=editor-tabs current=write
          button id=tab-write variant=quiet selected=true action=switch-tab label="Write"
          button id=tab-preview variant=quiet action=switch-tab label="Preview"
        tab-panel id=write-panel
          textarea id=article-body name=body label="Body" rows=18 required=true
        tab-panel id=preview-panel visible=false
          card id=preview-surface
            heading id=preview-title level=2 text="Preview"
            text id=preview-copy text="Rendered article content appears here."
      aside id=publish-settings span=4
        card id=publish-card
          heading id=publish-card-title level=2 text="Publishing"
          select id=article-category name=category label="Category"
            option id=cat-billing label="Billing"
            option id=cat-integrations label="Integrations"
            option id=cat-troubleshooting label="Troubleshooting"
          checkbox id=notify-followers name=notifyFollowers label="Notify followers"
```

```wirespec v=1 kind=state name=validation-missing-title
patch target=article-title invalid=true description="Add a title before publishing"
```

```wirespec v=1 kind=state name=preview-mode
patch target=tab-write selected=false
patch target=tab-preview selected=true
hide target=write-panel
show target=preview-panel
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=editor-grid cols=1
patch target=editor-workspace span=1
patch target=publish-settings span=1
```

## Acceptance
- The writing area remains the dominant surface in write mode.
- Preview is a real alternate state, not a second full page with duplicated actions.
- Publishing controls are present but visually secondary to drafting.
