---
schema: wirespec/1.0-rc0
id: article-editor
route: /content/articles/new
component: content/ArticleEditorScreen
canonical: true
patterns:
  - editor
  - toolbar
  - tabs
  - publish-settings
---

# Article editor

## Intent
Help an editor write, preview, and publish an article from one focused workspace without turning the editor into a decorative content dashboard.

```wirespec v=1 kind=base
screen id=article-editor route="/content/articles/new" title="New article"
  header id=editor-header
    row id=editor-header-row justify=between align=center
      heading id=editor-title level=1 text="New article"
      actions id=editor-top-actions
        button id=discard-draft variant=secondary action=discard-draft label="Discard"
        button id=publish-now variant=primary action=publish-now label="Publish"
  main id=editor-main padding=lg
    row id=editor-layout align=start gap=lg
      section id=editor-body width=fill
        toolbar id=editor-toolbar
          button id=toolbar-bold variant=secondary action=toggle-bold label="Bold"
          button id=toolbar-italic variant=secondary action=toggle-italic label="Italic"
          link id=editor-style-guide href="/content/style-guide" label="Style guide"
        field id=article-title-input type=text name=article-title label="Title" required=true
        textarea id=article-summary name=article-summary label="Summary"
        tabs id=editor-tabs
          tab id=write-tab label="Write" controls=write-panel selected=true
          tab id=preview-tab label="Preview" controls=preview-panel
        tab-panel id=write-panel
          textarea id=article-body name=article-body label="Body" required=true
        tab-panel id=preview-panel visible=false
          panel id=preview-surface
            heading id=preview-surface-title level=2 text="Preview"
            text id=preview-surface-copy text="Rendered article preview appears here."
      aside id=publish-sidebar width=md
        panel id=publish-panel
          heading id=publish-panel-title level=2 text="Publishing"
          field id=slug type=text name=slug label="Slug" required=true
          select id=article-audience name=article-audience label="Audience" options=["All customers","Enterprise customers","Internal only"]
          helper id=autosave-status text="Saved just now"
```

```wirespec v=1 kind=state name=autosaving
patch target=autosave-status text="Saving draft…"
patch target=publish-now disabled=true
```

```wirespec v=1 kind=state name=preview
hide target=write-panel
show target=preview-panel
patch target=write-tab selected=false
patch target=preview-tab selected=true
```

```wirespec v=1 kind=state name=publish-validation-error
insert position=inside-start ref=publish-panel
  alert id=publish-alert tone=critical text="Title, body, and slug are required before publishing."
patch target=publish-now disabled=true
```

```wirespec v=1 kind=breakpoint name=mobile max=767
hide target=publish-sidebar
insert position=inside-end ref=article-editor
  drawer id=publish-drawer title="Publishing"
    heading id=publish-drawer-title level=2 text="Publishing"
    field id=drawer-slug type=text name=slug label="Slug" required=true
    select id=drawer-audience name=article-audience label="Audience" options=["All customers","Enterprise customers","Internal only"]
    actions id=publish-drawer-actions
      button id=close-publish-drawer variant=secondary action=close-publish-drawer label="Close"
      button id=drawer-publish-now variant=primary action=publish-now label="Publish"
patch target=editor-main padding=md
patch target=editor-layout direction=column
```

## Acceptance
- Writing remains the primary workspace; publishing controls are nearby but secondary.
- Preview is a clear alternate mode, not a second competing screen.
- Mobile users can still publish through a drawer without losing the editing context.
