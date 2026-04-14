import { readFile } from "node:fs/promises";
import {
  buildSourceMap,
  parseWireSpecDocument,
  renderDocumentSelection,
  resolveDocument,
  buildVariantRefs,
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
const formError = authCard?.children.find((child) => child.id === "intro")
  ? authCard.children.find((child) => child.id === "login-form")?.children.find((child) => child.id === "form-error")
  : undefined;

assert(authCard?.props.max === "fill", "Mobile breakpoint should expand the auth card.");
assert(formError?.props.visible === true, "Error state should reveal the form error.");
const password = authCard?.children.find((child) => child.id === "login-form")?.children.find((child) => child.id === "password");
assert(password?.props.invalid === true, "Error state should mark the password field invalid.");

const html = renderDocumentSelection(loginDoc, { state: "error", breakpoint: "mobile" }, {
  includeDocumentShell: true,
  includeAcceptance: true,
});
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

console.log("Smoke test passed.");
