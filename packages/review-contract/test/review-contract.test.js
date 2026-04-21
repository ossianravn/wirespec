const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const contract = require("../index.js");

const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

test("review status aliases normalize to the canonical active status", () => {
  assert.equal(contract.normalizeReviewStatus("in_progress"), "in-progress");
  assert.equal(contract.isActiveReviewStatus("in_progress"), true);
  assert.equal(contract.isActiveReviewStatus("resolved"), false);
});

test("severity ranking is shared by task exporters and core sorting", () => {
  assert.equal(contract.reviewSeverityRank("must"), 0);
  assert.equal(contract.reviewSeverityRank("should"), 1);
  assert.equal(contract.reviewSeverityRank("unknown"), 99);
});

test("review UI helpers keep status labels and transitions consistent", () => {
  const thread = {
    id: "thread-1",
    title: "",
    status: "open",
    severity: "must",
    target: { targetId: "target-1", variantKey: "<desktop>" },
    messages: [{ body: "First" }, { body: "Fix <button>" }],
  };

  assert.equal(contract.reviewStatusLabel("in_progress"), "In progress");
  assert.equal(contract.reviewStatusLabel("wontfix"), "Won't fix");
  assert.deepEqual(contract.reviewThreadStatusAction("open"), {
    label: "Resolve",
    nextStatus: "resolved",
  });
  assert.deepEqual(contract.reviewThreadStatusAction("resolved"), {
    label: "Reopen",
    nextStatus: "open",
  });
  assert.equal(contract.reviewCountSummary({ active: 2, total: 3 }), "2 open · 3 total");
  assert.equal(contract.reviewPinTitle(1), "1 open note");
  assert.equal(contract.reviewPinTitle(2), "2 open notes");
  assert.match(contract.reviewToolbarHtml({ includeThreads: true }), /data-action="threads"/);
  assert.match(
    contract.reviewComposerHtml({
      target: { scope: "element", kind: "button", label: "<Sign in>" },
    }),
    /&lt;Sign in&gt;/,
  );
  assert.equal(
    contract.reviewTargetContextText(
      { scope: "screen", kind: "screen", variantKey: "mobile" },
      "Checkout",
    ),
    "Page: Checkout · mobile view",
  );
  assert.equal(contract.reviewLatestMessageBody(thread), "Fix <button>");
  assert.equal(contract.reviewThreadSummary(thread), "Fix <button>");
  assert.equal(contract.reviewScopeLabel("screen"), "page");
  assert.match(contract.reviewSeverityBadgeHtml("<must>", "badge"), /data-severity="&lt;must&gt;"/);
  assert.match(contract.reviewStatusBadgeHtml("in_progress", "status"), />In progress</);
  assert.match(contract.reviewVariantPillHtml(thread.target.variantKey), /&lt;desktop&gt;/);
  assert.match(
    contract.reviewThreadActionButtonHtml({
      action: "toggle-status",
      actionAttribute: "data-thread-action",
      threadId: "thread-1",
      label: "Resolve",
    }),
    /data-thread-action="toggle-status"/,
  );
  assert.match(
    contract.reviewThreadCardHtml({
      thread,
      articleClass: "thread",
      title: "Unsafe <title>",
      targetMeta: "element · <target>",
      severityClass: "badge",
      statusClass: "status",
      statusContainerClass: "state",
      actionsHtml: contract.reviewThreadActionButtonHtml({
        action: "toggle-status",
        threadId: thread.id,
        label: "Resolve",
      }),
    }),
    /Unsafe &lt;title&gt;/,
  );
  assert.match(
    contract.reviewDrawerFilterHtml({
      showClosed: true,
      filterTargetText: "Filtered to <target>",
    }),
    /aria-pressed="true">All/,
  );
  assert.match(contract.reviewDrawerFilterHtml({ filterTargetText: "<target>" }), /&lt;target&gt;/);
  assert.match(
    contract.reviewDrawerEmptyHtml({
      container: "div",
      message: "No <notes>",
    }),
    /<div class="ws-review-empty"><p>No &lt;notes&gt;<\/p><\/div>/,
  );
  assert.match(
    contract.reviewDrawerFooterHtml({
      actionsClass: "actions",
      actions: [{ action: "close", label: "Close" }],
    }),
    /class="actions"/,
  );
  assert.match(
    contract.reviewDrawerShellHtml({
      titleClass: "title",
      titleRowClass: "row",
      metaClass: "meta",
      metaRole: "meta",
      includeHeaderClose: true,
      filterHtml: contract.reviewDrawerFilterHtml(),
      bodyRole: "body",
      bodyHtml: "<p>Body</p>",
    }),
    /data-role="body"/,
  );
});

test("browser ESM contract exposes the same UI primitives", async () => {
  const browserContract = await import("../browser.mjs");
  assert.equal(browserContract.default.ANNOTATION_SIDECAR_SCHEMA_VERSION, contract.ANNOTATION_SIDECAR_SCHEMA_VERSION);
  assert.equal(browserContract.default.reviewThreadStatusAction("resolved").nextStatus, "open");
  assert.match(browserContract.default.reviewToolbarHtml({ includeSave: true }), /data-action="save"/);
  assert.equal(browserContract.default.reviewLatestMessageBody({ messages: [{ body: "Latest" }] }), "Latest");
  assert.match(browserContract.default.reviewThreadCardHtml({
    thread: {
      id: "thread-browser",
      title: "Browser",
      status: "resolved",
      severity: "should",
      target: { targetId: "target-browser" },
      messages: [],
    },
  }), /Browser/);
  assert.match(browserContract.default.reviewDrawerEmptyHtml(), /No notes in this view/);
  assert.match(browserContract.default.reviewDrawerShellHtml({ bodyHtml: "Body" }), /ws-review-drawer-body/);
});

test("annotation sidecar schema uses the canonical version and anchor names", () => {
  assert.equal(
    contract.annotationSidecarSchema.properties.schemaVersion.const,
    contract.ANNOTATION_SIDECAR_SCHEMA_VERSION,
  );
  assert.deepEqual(
    contract.annotationSidecarSchema.$defs.lineSpanAnchor.properties.type.enum,
    ["source-span", "wire-source-span"],
  );
});

test("runtime and bridge schema copies match the canonical contract schema", () => {
  const expected = JSON.stringify(contract.annotationSidecarSchema, null, 2) + "\n";
  const schemaPaths = [
    path.join(packageRoot, "schemas", "wirespec-annotation-sidecar-v0.3.schema.json"),
    path.join(repoRoot, "packages", "runtime", "schemas", "wirespec-annotation-sidecar-v0.3.schema.json"),
    path.join(repoRoot, "packages", "bridge", "schemas", "wirespec-annotation-sidecar-v0.3.schema.json"),
  ];

  for (const schemaPath of schemaPaths) {
    assert.equal(fs.readFileSync(schemaPath, "utf8"), expected, schemaPath);
  }
});
