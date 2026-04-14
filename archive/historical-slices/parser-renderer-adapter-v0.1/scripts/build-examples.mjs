
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  buildSourceMap,
  parseWireSpecDocument,
  renderDocumentSelection,
  resolveDocument,
  buildVariantRefs,
} from "../dist/index.js";

const fixturesDir = new URL("../fixtures/", import.meta.url);
const outputsDir = new URL("../outputs/", import.meta.url);

await mkdir(outputsDir, { recursive: true });

function selectionKey(selection) {
  return (
    [selection.mode, selection.theme, selection.breakpoint, selection.state]
      .filter(Boolean)
      .join("+") || "base"
  );
}

async function buildReviewDemo(stem, html, sourceMap) {
  const moduleSnippet = `
<script type="module">
  import { mountReviewOverlay } from "../dist/review-overlay.js";
  const sourceMap = ${JSON.stringify(sourceMap)};
  mountReviewOverlay({ sourceMap });
  window.addEventListener("wirespec.review.draftSubmitted", (event) => {
    console.log("Review draft submitted", event.detail);
  });
</script>`;
  const demo = html.replace("</body>", `${moduleSnippet}</body>`);
  await writeFile(new URL(`${stem}.review-demo.html`, outputsDir), demo, "utf8");
}

async function buildFixture(filename, selections, reviewDemoSelection = {}) {
  const fileUrl = new URL(filename, fixturesDir);
  const source = await readFile(fileUrl, "utf8");
  const document = parseWireSpecDocument(source, `fixtures/${filename}`);
  const contentHash = `sha256:${createHash("sha256").update(source).digest("hex")}`;
  const variantRefs = buildVariantRefs(document);
  const sourceMap = buildSourceMap(document, {
    entryFile: `fixtures/${filename}`,
    contentHash,
    variantRefs,
  });

  const stem = basename(filename, ".wirespec.md");
  await writeFile(
    new URL(`${stem}.targets.json`, outputsDir),
    `${JSON.stringify(sourceMap, null, 2)}\n`,
    "utf8",
  );

  for (const selection of selections) {
    const key = selectionKey(selection);
    const html = renderDocumentSelection(document, selection, {
      includeDocumentShell: true,
      includeAcceptance: true,
      titleSuffix: key,
    });
    await writeFile(new URL(`${stem}.${key}.html`, outputsDir), html, "utf8");

    const resolved = resolveDocument(document, selection);
    await writeFile(
      new URL(`${stem}.${key}.resolved.json`, outputsDir),
      `${JSON.stringify(resolved, null, 2)}\n`,
      "utf8",
    );
  }

  const reviewHtml = renderDocumentSelection(document, reviewDemoSelection, {
    includeDocumentShell: true,
    includeAcceptance: true,
    titleSuffix: `${selectionKey(reviewDemoSelection)} · review`,
  });
  await buildReviewDemo(stem, reviewHtml, sourceMap);
}

await buildFixture(
  "login.wirespec.md",
  [{}, { state: "error", breakpoint: "mobile" }, { state: "loading" }],
  { state: "error", breakpoint: "mobile" },
);

await buildFixture(
  "review-surface.wirespec.md",
  [{}, { state: "commenting" }, { state: "drawer-open", breakpoint: "mobile" }, { state: "stale-preview" }],
  { state: "commenting" },
);

console.log("Generated example HTML, resolved trees, source maps, and review demos in outputs/.");
