import { readFile } from "node:fs/promises";
import {
  addThread,
  buildSourceMap,
  buildVariantRefs,
  createEmptyReviewStore,
  createReviewThreadFromDraft,
  exportAgentTasks,
  formatWireSpecDocument,
  lintWireSpecDocument,
  parseWireSpecDocument,
  relinkStoreAgainstSourceMap,
  renderDocumentSelection,
  resolveDocument,
  reviewStoreToSidecar,
  sidecarToReviewStore,
} from "../dist/index.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const loginSource = await readFile(new URL("../fixtures/login.wirespec.md", import.meta.url), "utf8");
const loginDoc = parseWireSpecDocument(loginSource, "fixtures/login.wirespec.md");
const semanticsSource = await readFile(new URL("../fixtures/semantics.wirespec.md", import.meta.url), "utf8");
const semanticsDoc = parseWireSpecDocument(semanticsSource, "fixtures/semantics.wirespec.md");
const queueSource = await readFile(new URL("../../../docs/spec/v1-rc0/screens/04-fulfillment-queue.md", import.meta.url), "utf8");
const queueDoc = parseWireSpecDocument(queueSource, "docs/spec/v1-rc0/screens/04-fulfillment-queue.md");
const slopDashboardSource = await readFile(new URL("../fixtures/quality/slop-dashboard.wirespec.md", import.meta.url), "utf8");
const slopDashboardDoc = parseWireSpecDocument(slopDashboardSource, "fixtures/quality/slop-dashboard.wirespec.md");
const loginMissingStatesSource = await readFile(new URL("../fixtures/quality/login-missing-states.wirespec.md", import.meta.url), "utf8");
const loginMissingStatesDoc = parseWireSpecDocument(loginMissingStatesSource, "fixtures/quality/login-missing-states.wirespec.md");
const queueMissingStatesSource = await readFile(new URL("../fixtures/quality/queue-missing-states.wirespec.md", import.meta.url), "utf8");
const queueMissingStatesDoc = parseWireSpecDocument(queueMissingStatesSource, "fixtures/quality/queue-missing-states.wirespec.md");
const taskFirstSearchSource = await readFile(new URL("../fixtures/quality/task-first-search.wirespec.md", import.meta.url), "utf8");
const taskFirstSearchDoc = parseWireSpecDocument(taskFirstSearchSource, "fixtures/quality/task-first-search.wirespec.md");

assert(loginDoc.root.id === "login", "Expected the login root id.");
assert(loginDoc.variants.length === 3, "Expected loading, error, and mobile variants.");
assert(semanticsDoc.root.id === "semantics", "Expected the semantics root id.");
assert(queueDoc.root.id === "fulfillment-queue", "Expected canonical docs with list frontmatter to parse.");
assert(slopDashboardDoc.root.id === "slop-dashboard", "Expected the slop dashboard fixture root id.");
assert(loginMissingStatesDoc.root.id === "login-missing-states", "Expected the missing-state login fixture root id.");
assert(queueMissingStatesDoc.root.id === "queue-missing-states", "Expected the missing-state queue fixture root id.");
assert(taskFirstSearchDoc.root.id === "task-first-search", "Expected the task-first search fixture root id.");

const resolved = resolveDocument(loginDoc, { state: "error", breakpoint: "mobile" });
const authCard = resolved.root.children[0]?.children[0];
const loginForm = authCard?.children.find((child) => child.id === "login-form");
const formError = loginForm?.children.find((child) => child.id === "form-error");
const password = loginForm?.children.find((child) => child.id === "password");

assert(authCard?.props.max === "fill", "Mobile breakpoint should expand the auth card.");
assert(formError?.props.visible === true, "Error state should reveal the form error.");
assert(password?.props.invalid === true, "Error state should mark the password field invalid.");

const html = renderDocumentSelection(
  loginDoc,
  { state: "error", breakpoint: "mobile" },
  {
    includeDocumentShell: true,
    includeAcceptance: true,
  },
);
assert(html.includes('data-ws-id="submit"'), "Rendered HTML should expose data-ws-id hooks.");
assert(html.includes('data-ws-target="node:submit"'), "Rendered HTML should expose target ids.");

const loginBaseHtml = renderDocumentSelection(loginDoc, {}, { includeDocumentShell: false });
assert(loginBaseHtml.includes('max-width:26rem'), "Semantic max width tokens should render to usable card widths.");
assert(loginBaseHtml.includes('data-ws-submit="sign-in"'), "Forms should preserve submit actions in stable data attributes.");

const loginLoadingHtml = renderDocumentSelection(loginDoc, { state: "loading" }, { includeDocumentShell: false });
assert(loginLoadingHtml.includes('type="submit"'), "Submit buttons should render with submit semantics.");
assert(loginLoadingHtml.includes('aria-busy="true"'), "Busy buttons should expose aria-busy.");
assert(loginLoadingHtml.includes('disabled=""'), "Disabled button states should render the disabled attribute.");

const semanticsHtml = renderDocumentSelection(semanticsDoc, {}, { includeDocumentShell: false });
assert(semanticsHtml.includes('gap:12px'), "Gap tokens should continue to render as spacing.");
assert(semanticsHtml.includes('padding:24px'), "Padding tokens should continue to render as spacing.");
assert(semanticsHtml.includes("<textarea"), "Textarea nodes should render as native textarea elements.");
assert(!semanticsHtml.includes('type="textarea"'), "Textarea nodes should not render as input type=textarea.");
assert(semanticsHtml.includes('rows="4"'), "Textarea rows should be preserved.");
assert(semanticsHtml.includes('<option value="Open">Open</option>'), "Select controls should render their options.");
assert(semanticsHtml.includes('role="combobox"'), "Combobox controls should render combobox semantics.");
assert(semanticsHtml.includes('datalist id="ws-input-semantics-assignee-options"'), "Combobox controls should keep a machine-readable option list.");
assert(semanticsHtml.includes('data-ws-action="cancel"'), "Non-submit button actions should be preserved on rendered buttons.");
assert(semanticsHtml.includes("<fieldset"), "Radio groups should render as fieldsets.");
assert(semanticsHtml.includes("<legend"), "Radio groups should render accessible legends.");
assert(semanticsHtml.includes('aria-controls="ws-semantics-overview-panel"'), "Tabs should point to their controlled panels.");
assert(semanticsHtml.includes('aria-labelledby="ws-semantics-overview-tab"'), "Tab panels should point back to their controlling tabs.");
assert(semanticsHtml.includes("<table"), "Table nodes should render as native table elements.");
assert(semanticsHtml.includes("<thead"), "Table header nodes should render as thead.");
assert(semanticsHtml.includes("<tbody"), "Table body nodes should render as tbody.");
assert(semanticsHtml.includes("<th "), "Header cells should render as table headers.");
assert(semanticsHtml.includes("<nav"), "Navigation vocabulary should render as nav elements.");
assert(semanticsHtml.includes('aria-label="Pagination"'), "Pagination should expose a pagination navigation landmark.");
assert(semanticsHtml.includes('role="dialog"'), "Dialogs should render dialog semantics.");
assert(semanticsHtml.includes('aria-labelledby="ws-semantics-assign-dialog-title"'), "Dialogs should use contained headings as accessible names.");

const sourceMap = buildSourceMap(loginDoc, {
  entryFile: "fixtures/login.wirespec.md",
  variantRefs: buildVariantRefs(loginDoc),
});
assert(sourceMap.targets.some((target) => target.targetId === "node:submit"), "Source map should include the submit button.");
assert(
  sourceMap.targets.some((target) => target.targetId.startsWith("acceptance:login-")),
  "Source map should include acceptance entries.",
);

let store = createEmptyReviewStore(sourceMap.documentId, "login");
const thread = createReviewThreadFromDraft(
  {
    targetId: "node:submit",
    title: "Button stays visible",
    category: "responsive",
    severity: "must",
    body: "Keep the action visible on mobile error states.",
    taxonomy: ["LAY-10"],
  },
  sourceMap,
  {
    authorId: "reviewer",
    variantKey: "mobile+error",
    now: new Date(Date.UTC(2026, 3, 11, 19, 0)).toISOString(),
  },
);
store = addThread(store, thread);

const sidecar = reviewStoreToSidecar(store, sourceMap, {
  wireFile: "fixtures/login.wirespec.md",
});
assert(sidecar.threads.length === 1, "Sidecar should contain the created thread.");
assert(sidecar.threads[0].target.anchors?.length >= 2, "Persisted threads should carry multiple anchors.");

const roundTripped = sidecarToReviewStore(sidecar, sourceMap);
assert(roundTripped.threads.length === 1, "Round-tripped store should preserve thread count.");
assert(roundTripped.threads[0].target.targetId === "node:submit", "Round-tripped thread should preserve its target.");

const orphanedClone = structuredClone(sidecar);
if (orphanedClone.threads[0]) {
  orphanedClone.threads[0].target.targetId = "node:missing-submit";
}
const relinked = sidecarToReviewStore(orphanedClone, sourceMap);
assert(relinked.threads[0].target.targetId === "node:submit", "Anchor relinking should recover the original node target.");
assert(relinked.threads[0].orphaned !== true, "Recovered threads should not remain orphaned.");

const taskExport = exportAgentTasks(relinked, sourceMap);
assert(taskExport.tasks.length === 1, "Open threads should export to agent tasks.");
assert(taskExport.tasks[0].wireId === "submit", "Agent task export should preserve the resolved wire id.");
assert(taskExport.tasks[0].openInEditor?.file === "fixtures/login.wirespec.md", "Agent task export should include editor locations.");

const semanticsSourceMap = buildSourceMap(semanticsDoc, {
  entryFile: "fixtures/semantics.wirespec.md",
  variantRefs: buildVariantRefs(semanticsDoc),
});
const autoTextTargets = semanticsSourceMap.targets.filter((target) => target.targetId.startsWith("node:auto:text-"));
assert(autoTextTargets.length === 2, "Un-id'd text nodes should receive distinct auto target ids.");
assert(new Set(autoTextTargets.map((target) => target.targetId)).size === 2, "Auto-generated target ids should be unique.");
assert(
  autoTextTargets.every((target) => target.dom?.selector.includes("data-ws-target")),
  "Auto-generated targets should resolve back to rendered data-ws-target hooks.",
);
assert(
  semanticsSourceMap.targets.find((target) => target.targetId === "node:status")?.signature?.role === "combobox",
  "Select controls should report combobox-like semantics in the source map.",
);
assert(
  semanticsSourceMap.targets.find((target) => target.targetId === "node:assignee")?.signature?.role === "combobox",
  "Combobox controls should report combobox semantics in the source map.",
);
assert(
  semanticsSourceMap.targets.find((target) => target.targetId === "node:assign-dialog")?.signature?.role === "dialog",
  "Dialogs should report dialog semantics in the source map.",
);
assert(
  sourceMap.targets.find((target) => target.targetId === "node:form-error")?.signature?.role === "alert",
  "Alerts should report alert semantics in the source map.",
);

const loginLint = lintWireSpecDocument(loginDoc);
assert(loginLint.ok, "The login fixture should pass linting.");
assert(loginLint.diagnostics.length === 0, "The login fixture should not emit lint diagnostics.");

const queueLint = lintWireSpecDocument(queueDoc);
assert(queueLint.ok, "The canonical queue fixture should pass linting.");
assert(
  !queueLint.diagnostics.some((diagnostic) => diagnostic.code.startsWith("SLP-")),
  "The canonical queue fixture should not emit Proper UI quality warnings.",
);

const taskFirstLint = lintWireSpecDocument(taskFirstSearchDoc);
assert(taskFirstLint.ok, "The task-first quality fixture should pass linting.");
assert(
  !taskFirstLint.diagnostics.some((diagnostic) => diagnostic.code.startsWith("SLP-")),
  "Task-first quality fixtures should stay free of Proper UI warnings.",
);

const slopLint = lintWireSpecDocument(slopDashboardDoc);
assert(slopLint.ok, "Quality warnings alone should not fail the overall lint result.");
for (const code of ["SLP-01", "SLP-02", "SLP-03", "SLP-04", "SLP-05", "SLP-07", "SLP-08", "SLP-09", "SLP-10"]) {
  assert(
    slopLint.diagnostics.some((diagnostic) => diagnostic.code === code),
    `The slop dashboard fixture should trigger ${code}.`,
  );
}
const slopStructuralLint = lintWireSpecDocument(slopDashboardDoc, { includeQualityWarnings: false });
assert(
  !slopStructuralLint.diagnostics.some((diagnostic) => diagnostic.code.startsWith("SLP-")),
  "Quality warnings should be disable-able independently of syntax and vocabulary lint.",
);

const loginMissingStatesLint = lintWireSpecDocument(loginMissingStatesDoc);
const loginStateWarnings = loginMissingStatesLint.diagnostics.filter((diagnostic) => diagnostic.code === "SLP-06");
assert(loginMissingStatesLint.ok, "Missing-state quality warnings should not fail linting.");
assert(loginStateWarnings.length === 2, "Missing-state login fixture should emit loading and failure warnings.");
assert(
  loginStateWarnings.some((diagnostic) => diagnostic.message.includes("loading state") && diagnostic.fixHint?.includes("loading")),
  "Missing-state login fixture should suggest a loading state name.",
);
assert(
  loginStateWarnings.some((diagnostic) => diagnostic.message.includes("failure state") && diagnostic.fixHint?.includes("error")),
  "Missing-state login fixture should suggest an error state name.",
);

const queueMissingStatesLint = lintWireSpecDocument(queueMissingStatesDoc);
const queueStateWarnings = queueMissingStatesLint.diagnostics.filter((diagnostic) => diagnostic.code === "SLP-06");
assert(queueMissingStatesLint.ok, "Missing-state queue warnings should not fail linting.");
assert(queueStateWarnings.length === 2, "Missing-state queue fixture should emit loading and empty warnings.");
assert(
  queueStateWarnings.some((diagnostic) => diagnostic.message.includes("loading state") && diagnostic.fixHint?.includes("loading")),
  "Missing-state queue fixture should suggest a loading variant name.",
);
assert(
  queueStateWarnings.some((diagnostic) => diagnostic.message.includes("empty state") && diagnostic.fixHint?.includes("empty")),
  "Missing-state queue fixture should suggest an empty state name.",
);

const invalidSource = `---
id: lint-failure
patterns:
  - lint
  - smoke
---

# Lint failure

## Intent
Trip the linter on purpose.

\`\`\`wirespec v=1 kind=base
screen id=lint-failure
  tabs id=bad-tabs
    button id=not-a-tab label="Wrong child"
  table id=bad-table
    table-row id=bad-row
      text text="Wrong child"
  foo id=bar
  form
    button label="Missing id"
  x-local-widget id=custom-widget
\`\`\`

\`\`\`wirespec v=1 kind=state name=error
patch target=missing-target visible=false
\`\`\`
`;
const invalidDoc = parseWireSpecDocument(invalidSource, "fixtures/invalid-lint.wirespec.md");
const invalidLint = lintWireSpecDocument(invalidDoc);
assert(!invalidLint.ok, "Invalid fixtures should fail linting.");
assert(
  invalidLint.diagnostics.some((diagnostic) => diagnostic.code === "VOCAB-UNKNOWN-KIND"),
  "Unknown non-x-* kinds should fail linting.",
);
assert(
  invalidLint.diagnostics.some((diagnostic) => diagnostic.code === "STRUCT-INVALID-CHILD"),
  "Invalid parent/child structures should fail linting.",
);
assert(
  invalidLint.diagnostics.some((diagnostic) => diagnostic.code === "ID-MISSING-STABLE"),
  "Interactive nodes without ids should produce stable-id diagnostics.",
);
assert(
  invalidLint.diagnostics.some((diagnostic) => diagnostic.code === "STRUCT-UNKNOWN-TARGET"),
  "Variant targets should be linted against known ids.",
);
assert(
  !invalidLint.diagnostics.some((diagnostic) => diagnostic.targetId === "custom-widget" && diagnostic.code === "VOCAB-UNKNOWN-KIND"),
  "x-* extension kinds should be allowed by the linter.",
);

const formattedLogin = formatWireSpecDocument(loginDoc);
const reformattedLogin = formatWireSpecDocument(parseWireSpecDocument(formattedLogin, "fixtures/login.wirespec.md"));
assert(formattedLogin === reformattedLogin, "Formatting should be stable across parse/format round-trips.");
assert(
  formattedLogin.includes('button id=submit action=submit label="Sign in" variant=primary'),
  "Formatter should emit canonical attribute order.",
);

const formattedQueue = formatWireSpecDocument(queueDoc);
assert(
  formattedQueue.includes("patterns:\n  - operations\n  - queue"),
  "Formatter should preserve multi-line frontmatter list values.",
);

console.log("Smoke test passed.");
