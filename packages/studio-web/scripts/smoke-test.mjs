import { readFile } from "node:fs/promises";
import {
  TEMPLATE_CATALOG,
  addAcceptanceCriterion,
  applyScopedNodeProp,
  deleteActiveVariant,
  fieldsForNode,
  getBreakpointOptions,
  getCanonicalSource,
  getDiagnostics,
  getNodeEntry,
  getStateOptions,
  getTemplateMeta,
  insertPaletteNode,
  moveNodeRelative,
  resetFromTemplateSource,
} from "../dist/studio-model.js";
import {
  defaultStudioReviewPaths,
  studioVariantKey,
} from "../dist/studio-review.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const loginMeta = getTemplateMeta("login");
const loginSource = await readFile(new URL(`../../../${loginMeta.sourceFile}`, import.meta.url), "utf8");
let session = resetFromTemplateSource(loginSource, loginMeta.sourceFile);

const distHtml = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const distApp = await readFile(new URL("../dist/studio-app.js", import.meta.url), "utf8");
assert(TEMPLATE_CATALOG.length === 10, "Studio web should expose the ten canonical reference templates.");
assert(distHtml.includes("WireSpec Studio"), "Built studio web HTML should embed the Studio shell.");
assert(distHtml.includes('"login"'), "Built studio web HTML should embed the template library.");
assert(distApp.includes("Review loop"), "Built Studio app should expose the review workflow.");
assert(distApp.includes("Review mode"), "Built Studio app should expose the review mode toggle.");
assert(distApp.includes("Implementation compare"), "Built Studio app should expose the implementation comparison workflow.");

const insertResult = insertPaletteNode(session, "login-form", "helper");
session = insertResult.session;
assert(
  getCanonicalSource(session).includes("helper id=helper-helpful-context-for-the-next-decision"),
  "Palette insertion should create semantic nodes through studio-core commands.",
);

const submitNode = getNodeEntry(session.document, "submit").node;
const submitLabelField = fieldsForNode(submitNode).find((field) => field.key === "label");
session = applyScopedNodeProp(
  session,
  "submit",
  { editScope: "base", stateName: "base", breakpointName: "desktop" },
  submitLabelField,
  "Continue",
);
assert(
  getCanonicalSource(session).includes("button id=submit action=submit label=Continue variant=primary"),
  "Base inspector edits should patch the base tree canonically.",
);

const alertNode = getNodeEntry(session.document, "form-error").node;
const visibleField = fieldsForNode(alertNode).find((field) => field.key === "visible");
session = applyScopedNodeProp(
  session,
  "form-error",
  { editScope: "state", stateName: "error", breakpointName: "desktop" },
  visibleField,
  true,
);
assert(
  getCanonicalSource(session).includes("```wirespec v=1 kind=state name=error"),
  "State-scope edits should write state variants, not duplicate the tree.",
);
assert(
  getCanonicalSource(session).includes("show target=form-error"),
  "Visibility edits in state mode should write show/hide ops.",
);

const actionsNode = getNodeEntry(session.document, "primary-actions").node;
const widthField = fieldsForNode(actionsNode).find((field) => field.key === "width");
session = applyScopedNodeProp(
  session,
  "primary-actions",
  { editScope: "breakpoint", stateName: "error", breakpointName: "mobile" },
  widthField,
  "fill",
);
assert(
  getCanonicalSource(session).includes("```wirespec v=1 kind=breakpoint name=mobile max=599"),
  "Responsive edits should write breakpoint variants with the preset viewport range.",
);
assert(
  getCanonicalSource(session).includes("patch target=primary-actions width=fill"),
  "Responsive edits should patch only the changed node props.",
);

session = moveNodeRelative(session, "forgot", "form-error", "after");
assert(
  getCanonicalSource(session).includes('alert id=form-error text="Incorrect email or password." visible=false tone=critical\n        link id=forgot href=/forgot-password label="Forgot password?"'),
  "Semantic reordering should move nodes by tree position rather than pixel coordinates.",
);

session = addAcceptanceCriterion(session, "Error recovery keeps the submit action visible.", "must");
assert(
  getCanonicalSource(session).includes("Error recovery keeps the submit action visible."),
  "Studio web should be able to append acceptance criteria through studio-core.",
);

session = deleteActiveVariant(session, {
  editScope: "breakpoint",
  stateName: "error",
  breakpointName: "mobile",
});
assert(
  !getCanonicalSource(session).includes("```wirespec v=1 kind=breakpoint name=mobile"),
  "Deleting the active breakpoint should remove only that variant block.",
);

const diagnostics = getDiagnostics(session.document);
assert(diagnostics.ok, "Studio templates and semantic edits should keep the document lint-clean.");
assert(getStateOptions(session.document).includes("loading"), "State tray options should include canonical states.");
assert(getBreakpointOptions(session.document).includes("mobile"), "Breakpoint tray options should include mobile.");

const reviewPaths = defaultStudioReviewPaths(session.projection.sourceMap);
assert(
  reviewPaths.annotationPath === ".wirespec/reviews/login.annotations.json",
  "Studio review defaults should target the document annotation sidecar path.",
);
assert(
  reviewPaths.taskPath === ".wirespec/reviews/login.agent-tasks.json",
  "Studio review defaults should target the document task export path.",
);
assert(
  studioVariantKey({ stateName: "error", breakpointName: "mobile" }) === "mobile+error",
  "Studio review comments should preserve combined breakpoint and state context.",
);

console.log("Studio web smoke test passed.");
