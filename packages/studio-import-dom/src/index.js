import { formatWireSpecDocument } from "../../runtime/dist/index.js";

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return collapseWhitespace(value).toLowerCase();
}

function slugify(value) {
  return collapseWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function syntheticSpan(file = "studio-import-dom") {
  return {
    file,
    lineStart: 1,
    columnStart: 1,
    lineEnd: 1,
    columnEnd: 1,
  };
}

function asAttributeMap(attributes = {}) {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
}

function textFromNode(node) {
  return collapseWhitespace(node.text);
}

function getAttribute(node, name) {
  return node.attributes?.[name.toLowerCase()];
}

function hasAttribute(node, name) {
  return Object.prototype.hasOwnProperty.call(node.attributes || {}, name.toLowerCase());
}

function styleValue(node) {
  return String(getAttribute(node, "style") || "").toLowerCase();
}

function isHiddenNode(node) {
  if (!node) {
    return false;
  }
  if (hasAttribute(node, "hidden")) {
    return true;
  }
  if (getAttribute(node, "aria-hidden") === "true") {
    return true;
  }
  const style = styleValue(node);
  return style.includes("display:none") || style.includes("display: none") || style.includes("visibility:hidden");
}

function tagNameOf(node) {
  return String(node.tagName || "div").toLowerCase();
}

function inputType(node) {
  return String(getAttribute(node, "type") || "text").toLowerCase();
}

function semanticRole(node) {
  const explicit = getAttribute(node, "role");
  if (explicit) {
    return explicit.toLowerCase();
  }

  const tag = tagNameOf(node);
  if (tag === "button") {
    return "button";
  }
  if (tag === "a" && getAttribute(node, "href")) {
    return "link";
  }
  if (tag === "textarea") {
    return "textbox";
  }
  if (tag === "select") {
    return "combobox";
  }
  if (tag === "input") {
    const type = inputType(node);
    if (type === "checkbox") {
      return "checkbox";
    }
    if (type === "radio") {
      return "radio";
    }
    return "textbox";
  }
  if (tag === "dialog") {
    return "dialog";
  }
  if (tag === "form") {
    return "form";
  }
  if (tag === "nav") {
    return "navigation";
  }
  if (tag === "main") {
    return "main";
  }
  if (tag === "table") {
    return "table";
  }
  if (tag === "th") {
    return "columnheader";
  }
  if (tag === "td") {
    return "cell";
  }
  if (tag === "li") {
    return "listitem";
  }
  return undefined;
}

function inferredKind(node) {
  const explicit = getAttribute(node, "data-ws-kind");
  if (explicit) {
    return explicit;
  }

  const role = semanticRole(node);
  if (role === "alert") {
    return "alert";
  }
  if (role === "dialog") {
    return "dialog";
  }
  if (role === "tablist") {
    return "tabs";
  }
  if (role === "tab") {
    return "tab";
  }
  if (role === "tabpanel") {
    return "tab-panel";
  }
  if (role === "switch") {
    return "switch";
  }
  if (role === "combobox") {
    return "combobox";
  }

  const tag = tagNameOf(node);
  if (tag === "main") {
    return "main";
  }
  if (tag === "header") {
    return "header";
  }
  if (tag === "footer") {
    return "footer";
  }
  if (tag === "aside") {
    return "aside";
  }
  if (tag === "nav") {
    const label = normalizeText(getAttribute(node, "aria-label"));
    if (label.includes("breadcrumb")) {
      return "breadcrumbs";
    }
    if (label.includes("pagination")) {
      return "pagination";
    }
    return "nav";
  }
  if (tag === "form") {
    return "form";
  }
  if (tag === "section" || tag === "article") {
    return "section";
  }
  if (tag === "dialog") {
    return "dialog";
  }
  if (tag === "table") {
    return "table";
  }
  if (tag === "thead") {
    return "table-header";
  }
  if (tag === "tbody") {
    return "table-body";
  }
  if (tag === "tr") {
    return "table-row";
  }
  if (tag === "th" || tag === "td") {
    return "table-cell";
  }
  if (tag === "ul" || tag === "ol") {
    return "list";
  }
  if (tag === "li") {
    return "list-item";
  }
  if (/^h[1-6]$/.test(tag)) {
    return "heading";
  }
  if (tag === "p") {
    return "text";
  }
  if (tag === "a") {
    return "link";
  }
  if (tag === "button") {
    return "button";
  }
  if (tag === "textarea") {
    return "textarea";
  }
  if (tag === "select") {
    return "select";
  }
  if (tag === "fieldset") {
    return "radio-group";
  }
  if (tag === "input") {
    const type = inputType(node);
    if (type === "checkbox") {
      return "checkbox";
    }
    if (type === "radio") {
      return "radio";
    }
    return "field";
  }
  if (tag === "label") {
    return "text";
  }
  if (tag === "div") {
    if (role === "alert") {
      return "alert";
    }
    return "section";
  }
  return "text";
}

function isMeaningfulNode(node) {
  const tag = tagNameOf(node);
  if (tag === "script" || tag === "style" || tag === "template" || tag === "noscript") {
    return false;
  }
  if (getAttribute(node, "data-ws-id") || getAttribute(node, "data-ws-target")) {
    return true;
  }
  if (semanticRole(node)) {
    return true;
  }
  if (
    [
      "main",
      "header",
      "footer",
      "aside",
      "nav",
      "form",
      "section",
      "article",
      "dialog",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "ul",
      "ol",
      "li",
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "label",
      "fieldset",
      "legend",
      "p",
    ].includes(tag)
  ) {
    return true;
  }
  return Boolean(textFromNode(node));
}

function snapshotRecord(node, parentRecord, path, records) {
  const record = {
    id: path.join("."),
    node,
    parentId: parentRecord?.id,
    index: path[path.length - 1] ?? 0,
    tagName: tagNameOf(node),
    kind: inferredKind(node),
    role: semanticRole(node),
    text: textFromNode(node),
    hidden: isHiddenNode(node),
    hookWireId: getAttribute(node, "data-ws-id"),
    hookTargetId: getAttribute(node, "data-ws-target"),
    htmlId: getAttribute(node, "id"),
    parentHookWireId: parentRecord?.hookWireId,
    parentHookTargetId: parentRecord?.hookTargetId,
    children: [],
  };
  records.push(record);
  for (const [index, child] of (node.children || []).entries()) {
    const childRecord = snapshotRecord(child, record, [...path, index], records);
    record.children.push(childRecord.id);
  }
  return record;
}

function flattenSnapshot(root) {
  const records = [];
  snapshotRecord(root, undefined, [0], records);
  const byId = new Map(records.map((record) => [record.id, record]));
  return {
    records,
    byId,
  };
}

function labelAssociations(records) {
  const byFor = new Map();
  for (const record of records) {
    if (record.tagName !== "label") {
      continue;
    }
    const targetId = getAttribute(record.node, "for");
    if (targetId) {
      byFor.set(targetId, record.text);
    }
  }
  return byFor;
}

function comparableRecords(records) {
  return records.filter((record) => isMeaningfulNode(record.node));
}

function guessLabel(record, context) {
  const ariaLabel = getAttribute(record.node, "aria-label");
  if (ariaLabel) {
    return collapseWhitespace(ariaLabel);
  }

  if (["button", "link", "heading", "text", "alert", "status", "badge"].includes(record.kind)) {
    return record.text;
  }

  if (["field", "textarea", "select", "checkbox", "radio", "switch", "combobox"].includes(record.kind)) {
    if (record.parentId) {
      const parent = context.byId.get(record.parentId);
      if (parent?.tagName === "label") {
        return parent.text.replace(record.text, "").trim() || parent.text;
      }
    }
    if (record.htmlId && context.labelsByFor.has(record.htmlId)) {
      return context.labelsByFor.get(record.htmlId);
    }
    const placeholder = getAttribute(record.node, "placeholder");
    if (placeholder) {
      return collapseWhitespace(placeholder);
    }
    const name = getAttribute(record.node, "name");
    if (name) {
      return collapseWhitespace(name);
    }
  }

  return record.text;
}

function compareableSourceTargets(sourceMap, variantKey) {
  return sourceMap.targets.filter((target) => {
    if (target.scope === "prose" || target.scope === "acceptance") {
      return false;
    }
    if (!variantKey) {
      return true;
    }
    if (!target.variants || target.variants.length === 0) {
      return true;
    }
    return target.variants.includes(variantKey);
  });
}

function looksPrimaryAction(target) {
  const text = normalizeText(target.label || target.signature?.text || target.wireId || target.targetId);
  return (
    target.kind === "button" &&
    (text.includes("sign in") ||
      text.includes("submit") ||
      text.includes("continue") ||
      text.includes("save") ||
      text.includes("primary"))
  );
}

function screenTargetId(sourceMap) {
  return sourceMap.targets.find((target) => target.scope === "screen")?.targetId;
}

function driftItem(kind, severity, title, message, extras = {}) {
  return {
    id: `${kind}:${slugify(title)}:${Math.random().toString(36).slice(2, 8)}`,
    kind,
    severity,
    title,
    message,
    ...extras,
  };
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [
      item.kind,
      item.targetId || "",
      item.preferredTargetId || "",
      normalizeText(item.title),
      normalizeText(item.message),
    ].join("|");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function hasWireSpecHooks(root) {
  const { records } = flattenSnapshot(root);
  return records.some((record) => record.hookWireId || record.hookTargetId);
}

export function compareImplementationToSourceMap(sourceMap, root, options = {}) {
  const variantKey = options.variantKey || "base";
  const expectedTargets = compareableSourceTargets(sourceMap, variantKey);
  const expectedByTargetId = new Map(expectedTargets.map((target) => [target.targetId, target]));
  const expectedByWireId = new Map(
    expectedTargets
      .filter((target) => target.wireId)
      .map((target) => [target.wireId, target]),
  );
  const screenId = screenTargetId(sourceMap);
  const { records, byId } = flattenSnapshot(root);
  const labelsByFor = labelAssociations(records);
  const context = { byId, labelsByFor };
  const actualRecords = comparableRecords(records);
  const hooksFound = actualRecords.some((record) => record.hookWireId || record.hookTargetId);
  if (!hooksFound) {
    return {
      ok: false,
      hooksFound: false,
      variantKey,
      summary: {
        linked: 0,
        missing: 0,
        unexpected: 0,
        mismatched: 0,
        total: 0,
      },
      items: [],
      matchedTargetIds: [],
    };
  }
  const matchedExpected = new Map();
  const expectedForRecord = new Map();
  const items = [];

  for (const record of actualRecords) {
    let expectedTarget = undefined;
    if (record.hookTargetId && expectedByTargetId.has(record.hookTargetId)) {
      expectedTarget = expectedByTargetId.get(record.hookTargetId);
    } else if (record.hookWireId && expectedByWireId.has(record.hookWireId)) {
      expectedTarget = expectedByWireId.get(record.hookWireId);
    }

    if (expectedTarget) {
      if (matchedExpected.has(expectedTarget.targetId)) {
        items.push(
          driftItem(
            "unexpected-node",
            "should",
            `Duplicate hook for ${expectedTarget.wireId || expectedTarget.targetId}`,
            "More than one implementation element points at the same spec node.",
            {
              targetId: expectedTarget.targetId,
              preferredTargetId: expectedTarget.targetId,
            },
          ),
        );
        continue;
      }
      matchedExpected.set(expectedTarget.targetId, record);
      expectedForRecord.set(record.id, expectedTarget);
      continue;
    }

    if (hooksFound && record !== actualRecords[0]) {
      const label = guessLabel(record, context) || record.hookWireId || record.kind;
      const parentExpected = record.parentId ? expectedForRecord.get(record.parentId) : undefined;
      items.push(
        driftItem(
          "unexpected-node",
          "could",
          `Implementation node "${label}" is not linked`,
          "Implementation element is not linked to any approved spec node.",
          {
            preferredTargetId: parentExpected?.targetId || screenId,
            actualLabel: label,
          },
        ),
      );
    }
  }

  for (const target of expectedTargets) {
    if (target.scope === "screen") {
      continue;
    }
    const actual = matchedExpected.get(target.targetId);
    if (!actual) {
      const isPrimary = looksPrimaryAction(target);
      const variantSpecific = variantKey !== "base" && target.variants?.includes(variantKey);
      items.push(
        driftItem(
          isPrimary ? "primary-action-missing" : variantSpecific ? "missing-state-node" : "missing-node",
          isPrimary || target.kind === "field" || target.kind === "button" ? "must" : "should",
          isPrimary
            ? `Primary action "${target.label || target.wireId || target.targetId}" is missing`
            : variantSpecific
              ? `"${target.label || target.wireId || target.targetId}" is missing in ${variantKey}`
              : `"${target.label || target.wireId || target.targetId}" is not implemented`,
          isPrimary
            ? "The implementation removed the primary action the spec expects."
            : variantSpecific
              ? "The current implementation does not render this state-specific spec node."
              : "A spec node has no linked implementation element.",
          {
            targetId: target.targetId,
            preferredTargetId: target.targetId,
          },
        ),
      );
      continue;
    }

    if (looksPrimaryAction(target) && actual.hidden) {
      items.push(
        driftItem(
          "primary-action-hidden",
          "must",
          `Primary action "${target.label || target.wireId || target.targetId}" is hidden`,
          "The implementation still has the primary action hook, but the action is hidden.",
          {
            targetId: target.targetId,
            preferredTargetId: target.targetId,
          },
        ),
      );
    }

    const expectedLabel = collapseWhitespace(target.label || target.signature?.text);
    const actualLabel = collapseWhitespace(guessLabel(actual, context));
    if (expectedLabel && actualLabel && normalizeText(expectedLabel) !== normalizeText(actualLabel)) {
      items.push(
        driftItem(
          "label-mismatch",
          target.kind === "button" || target.kind === "field" ? "should" : "could",
          `Label drift on "${target.wireId || target.targetId}"`,
          `Expected "${expectedLabel}" but implementation shows "${actualLabel}".`,
          {
            targetId: target.targetId,
            preferredTargetId: target.targetId,
            expectedLabel,
            actualLabel,
          },
        ),
      );
    }
  }

  const actualByParentTargetId = new Map();
  for (const [targetId, record] of matchedExpected.entries()) {
    let ancestor = record.parentId ? byId.get(record.parentId) : undefined;
    while (ancestor && !expectedForRecord.has(ancestor.id)) {
      ancestor = ancestor.parentId ? byId.get(ancestor.parentId) : undefined;
    }
    const parentExpected = ancestor ? expectedForRecord.get(ancestor.id) : undefined;
    const parentTargetId = parentExpected?.targetId;
    if (!parentTargetId) {
      continue;
    }
    if (!actualByParentTargetId.has(parentTargetId)) {
      actualByParentTargetId.set(parentTargetId, []);
    }
    actualByParentTargetId.get(parentTargetId).push(targetId);
  }

  for (const [parentTargetId, actualOrder] of actualByParentTargetId.entries()) {
    const expectedOrder = expectedTargets
      .filter((target) => target.parentTargetId === parentTargetId && matchedExpected.has(target.targetId))
      .map((target) => target.targetId);
    for (let index = 0; index < Math.min(actualOrder.length, expectedOrder.length); index += 1) {
      if (actualOrder[index] === expectedOrder[index]) {
        continue;
      }
      const target = expectedByTargetId.get(actualOrder[index]) || expectedByTargetId.get(expectedOrder[index]);
      if (!target) {
        continue;
      }
      const siblingLabel = expectedByTargetId.get(expectedOrder[index])?.label || expectedOrder[index];
      items.push(
        driftItem(
          "order-mismatch",
          "could",
          `Order drift near "${target.label || target.wireId || target.targetId}"`,
          `Implementation order differs from the spec. "${target.label || target.wireId || target.targetId}" should appear near "${siblingLabel}".`,
          {
            targetId: target.targetId,
            preferredTargetId: target.parentTargetId || target.targetId,
          },
        ),
      );
    }
  }

  const dedupedItems = uniqueItems(items);
  const summary = {
    linked: matchedExpected.size,
    missing: dedupedItems.filter((item) => item.kind === "missing-node" || item.kind === "missing-state-node" || item.kind === "primary-action-missing").length,
    unexpected: dedupedItems.filter((item) => item.kind === "unexpected-node").length,
    mismatched: dedupedItems.filter((item) => item.kind === "label-mismatch" || item.kind === "order-mismatch" || item.kind === "primary-action-hidden").length,
    total: dedupedItems.length,
  };

  return {
    ok: dedupedItems.length === 0,
    hooksFound,
    variantKey,
    summary,
    items: dedupedItems,
    matchedTargetIds: Array.from(matchedExpected.keys()),
  };
}

function nodeForText(kind, text, usedIds, file) {
  const clean = collapseWhitespace(text);
  if (!clean) {
    return null;
  }
  const id = `${kind}-${slugify(clean).slice(0, 32)}`;
  const stableId = usedIds.has(id) ? `${id}-${usedIds.size + 1}` : id;
  usedIds.add(stableId);
  return {
    kind,
    id: stableId,
    props: kind === "heading"
      ? { level: 2, text: clean }
      : { text: clean },
    children: [],
    span: syntheticSpan(file),
  };
}

function nextId(kind, seed, usedIds) {
  const base = `${kind}-${slugify(seed || kind)}`;
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }
  let suffix = 2;
  while (usedIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  const value = `${base}-${suffix}`;
  usedIds.add(value);
  return value;
}

function optionTexts(node) {
  return (node.children || [])
    .filter((child) => tagNameOf(child) === "option")
    .map((child) => collapseWhitespace(getAttribute(child, "label") || child.text))
    .filter(Boolean);
}

function inferFormSubmit(children) {
  const submitButton = children.find((child) => child.kind === "button" && child.props.action === "submit");
  if (!submitButton) {
    return undefined;
  }
  return slugify(submitButton.props.label || submitButton.id || "submit");
}

function mapDomNodeToWireNodes(node, context, parentRecord) {
  if (!node || isHiddenNode(node)) {
    return [];
  }

  const tag = tagNameOf(node);
  if (tag === "script" || tag === "style" || tag === "template" || tag === "noscript") {
    return [];
  }

  if (tag === "html" || tag === "body") {
    return node.children.flatMap((child) => mapDomNodeToWireNodes(child, context, parentRecord));
  }

  if (tag === "label") {
    const controls = (node.children || []).flatMap((child) => mapDomNodeToWireNodes(child, context, node));
    if (controls.length > 0) {
      return controls;
    }
    const textNode = nodeForText("text", node.text, context.usedIds, context.file);
    return textNode ? [textNode] : [];
  }

  const record = {
    node,
    kind: inferredKind(node),
    role: semanticRole(node),
    text: textFromNode(node),
  };
  const label = guessLabel(
    {
      ...record,
      parentId: undefined,
      htmlId: getAttribute(node, "id"),
      tagName: tag,
    },
    context.labelContext,
  );
  const idSeed = getAttribute(node, "data-ws-id") || label || record.text || record.kind;
  const wireId = nextId(record.kind, idSeed, context.usedIds);
  const span = syntheticSpan(context.file);

  if (/^h[1-6]$/.test(tag)) {
    return [
      {
        kind: "heading",
        id: wireId,
        props: {
          level: Number(tag.slice(1)),
          text: collapseWhitespace(node.text),
        },
        children: [],
        span,
      },
    ];
  }

  if (tag === "p" || tag === "span" || tag === "small" || tag === "strong" || tag === "em") {
    const textNode = nodeForText("text", node.text, context.usedIds, context.file);
    return textNode ? [textNode] : [];
  }

  if (tag === "a") {
    return [
      {
        kind: "link",
        id: wireId,
        props: {
          label: collapseWhitespace(label || node.text || "Link"),
          href: getAttribute(node, "href") || "#",
        },
        children: [],
        span,
      },
    ];
  }

  if (tag === "button") {
    return [
      {
        kind: "button",
        id: wireId,
        props: {
          label: collapseWhitespace(label || node.text || "Action"),
          action: getAttribute(node, "type") === "submit" ? "submit" : "press",
        },
        children: [],
        span,
      },
    ];
  }

  if (tag === "textarea") {
    return [
      {
        kind: "textarea",
        id: wireId,
        props: {
          name: getAttribute(node, "name") || wireId,
          label: collapseWhitespace(label || getAttribute(node, "placeholder") || "Details"),
          rows: Number(getAttribute(node, "rows") || 3),
          placeholder: getAttribute(node, "placeholder") || undefined,
          required: hasAttribute(node, "required"),
        },
        children: [],
        span,
      },
    ];
  }

  if (tag === "select") {
    const options = optionTexts(node);
    return [
      {
        kind: "select",
        id: wireId,
        props: {
          name: getAttribute(node, "name") || wireId,
          label: collapseWhitespace(label || "Select"),
          options,
          required: hasAttribute(node, "required"),
        },
        children: [],
        span,
      },
    ];
  }

  if (tag === "input") {
    const type = inputType(node);
    if (type === "hidden") {
      return [];
    }
    if (type === "checkbox") {
      return [
        {
          kind: "checkbox",
          id: wireId,
          props: {
            name: getAttribute(node, "name") || wireId,
            label: collapseWhitespace(label || "Checkbox"),
            checked: hasAttribute(node, "checked"),
          },
          children: [],
          span,
        },
      ];
    }
    if (type === "radio") {
      return [
        {
          kind: "radio",
          id: wireId,
          props: {
            name: getAttribute(node, "name") || wireId,
            label: collapseWhitespace(label || "Option"),
            checked: hasAttribute(node, "checked"),
          },
          children: [],
          span,
        },
      ];
    }
    return [
      {
        kind: "field",
        id: wireId,
        props: {
          type,
          name: getAttribute(node, "name") || wireId,
          label: collapseWhitespace(label || getAttribute(node, "placeholder") || "Field"),
          placeholder: getAttribute(node, "placeholder") || undefined,
          required: hasAttribute(node, "required"),
        },
        children: [],
        span,
      },
    ];
  }

  if (tag === "fieldset") {
    const legend = (node.children || []).find((child) => tagNameOf(child) === "legend");
    const radioChildren = node.children.flatMap((child) => {
      if (tagNameOf(child) === "legend") {
        return [];
      }
      return mapDomNodeToWireNodes(child, context, node);
    });
    return [
      {
        kind: radioChildren.some((child) => child.kind === "radio") ? "radio-group" : "section",
        id: wireId,
        props: legend ? { label: collapseWhitespace(legend.text) } : {},
        children: radioChildren,
        span,
      },
    ];
  }

  if (tag === "ul" || tag === "ol") {
    return [
      {
        kind: "list",
        id: wireId,
        props: {},
        children: node.children.flatMap((child) => mapDomNodeToWireNodes(child, context, node)),
        span,
      },
    ];
  }

  if (tag === "li") {
    const children = node.children.flatMap((child) => mapDomNodeToWireNodes(child, context, node));
    if (children.length === 0) {
      const textNode = nodeForText("text", node.text, context.usedIds, context.file);
      return [
        {
          kind: "list-item",
          id: wireId,
          props: {},
          children: textNode ? [textNode] : [],
          span,
        },
      ];
    }
    return [
      {
        kind: "list-item",
        id: wireId,
        props: {},
        children,
        span,
      },
    ];
  }

  if (tag === "table" || tag === "thead" || tag === "tbody" || tag === "tr" || tag === "th" || tag === "td") {
    const kind = inferredKind(node);
    const children = node.children.flatMap((child) => mapDomNodeToWireNodes(child, context, node));
    const props = {};
    if (kind === "table-cell" && collapseWhitespace(node.text) && children.length === 0) {
      props.text = collapseWhitespace(node.text);
    }
    return [
      {
        kind,
        id: wireId,
        props,
        children,
        span,
      },
    ];
  }

  const containerKind = inferredKind(node);
  const children = node.children.flatMap((child) => mapDomNodeToWireNodes(child, context, node));
  const props = {};
  if (containerKind === "alert") {
    props.tone = "critical";
    props.text = collapseWhitespace(node.text);
  }
  if ((containerKind === "section" || containerKind === "main" || containerKind === "dialog" || containerKind === "aside") && !children.length && collapseWhitespace(node.text)) {
    const textNode = nodeForText("text", node.text, context.usedIds, context.file);
    if (textNode) {
      children.push(textNode);
    }
  }
  if (containerKind === "form") {
    const submit = inferFormSubmit(children);
    if (submit) {
      props.submit = submit;
    }
  }

  return [
    {
      kind: containerKind,
      id: wireId,
      props,
      children,
      span,
    },
  ];
}

function createDocumentFromDom(root, options = {}) {
  const file = options.sourceFile || "inferred-dom.wirespec.md";
  const usedIds = new Set();
  const flat = flattenSnapshot(root);
  const labelContext = {
    byId: flat.byId,
    labelsByFor: labelAssociations(flat.records),
  };
  const title = options.title || collapseWhitespace(options.documentTitle) || "Imported implementation";
  const screenId = options.documentId || slugify(title || "imported-screen");
  usedIds.add(screenId);

  const children = mapDomNodeToWireNodes(root, {
    file,
    usedIds,
    labelContext,
  });

  const warnings = [
    "Inferred from DOM without a canonical WireSpec source map.",
    "Semantic mapping is approximate and should be confirmed before replacing an approved spec.",
  ];

  return {
    document: {
      schemaVersion: "1.0.0-rc0",
      sourceFormat: "markdown+wirespec",
      sourceFile: file,
      metadata: {
        imported: "dom-inferred",
      },
      documentTitle: title,
      notes: warnings.join("\n"),
      sections: [
        {
          id: "notes",
          title: "Notes",
          kind: "notes",
          body: warnings.map((warning) => `- ${warning}`).join("\n"),
          span: syntheticSpan(file),
        },
      ],
      acceptance: [],
      root: {
        kind: "screen",
        id: screenId,
        props: {
          title,
        },
        children: children.length > 0
          ? children
          : [
              {
                kind: "main",
                id: nextId("main", "content", usedIds),
                props: {},
                children: [
                  nodeForText("text", "Imported DOM content needs review.", usedIds, file),
                ].filter(Boolean),
                span: syntheticSpan(file),
              },
            ],
        span: syntheticSpan(file),
      },
      variants: [],
    },
    warnings,
  };
}

export function inferWireSpecFromDom(root, options = {}) {
  const { document, warnings } = createDocumentFromDom(root, options);
  return {
    inferred: true,
    warnings,
    document,
    source: formatWireSpecDocument(document),
  };
}

function snapshotElement(element) {
  return {
    tagName: element.tagName.toLowerCase(),
    attributes: asAttributeMap(
      Object.fromEntries(Array.from(element.attributes).map((attr) => [attr.name, attr.value])),
    ),
    text: collapseWhitespace(element.textContent || ""),
    children: Array.from(element.children).map((child) => snapshotElement(child)),
  };
}

export function snapshotDomSubtree(element) {
  return snapshotElement(element);
}

export function snapshotHtmlDocument(html) {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is not available in this environment.");
  }
  const parser = new DOMParser();
  const document = parser.parseFromString(String(html || ""), "text/html");
  return {
    tagName: "body",
    attributes: {},
    text: collapseWhitespace(document.body.textContent || ""),
    children: Array.from(document.body.children).map((child) => snapshotElement(child)),
  };
}

export function compareImplementationHtml(sourceMap, html, options = {}) {
  return compareImplementationToSourceMap(sourceMap, snapshotHtmlDocument(html), options);
}

export function inferWireSpecFromHtml(html, options = {}) {
  return inferWireSpecFromDom(snapshotHtmlDocument(html), options);
}
