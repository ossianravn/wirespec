import { readFile } from "node:fs/promises";
import {
  addThread,
  buildSourceMap,
  buildVariantRefs,
  createEmptyReviewStore,
  createReviewThreadFromDraft,
  exportAgentTasks,
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

assert(loginDoc.root.id === "login", "Expected the login root id.");
assert(loginDoc.variants.length === 3, "Expected loading, error, and mobile variants.");

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

console.log("Smoke test passed.");
