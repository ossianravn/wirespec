import { mkdir, readFile, writeFile } from "node:fs/promises";
import { TEMPLATE_CATALOG } from "../src/studio-model.js";

const distDir = new URL("../dist/", import.meta.url);
const outputsDir = new URL("../outputs/", import.meta.url);
const srcDir = new URL("../src/", import.meta.url);

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("</script", "<\\/script");
}

async function copyAsset(filename) {
  const contents = await readFile(new URL(filename, srcDir), "utf8");
  await writeFile(new URL(filename, distDir), contents, "utf8");
}

async function copyExternalAsset(sourceUrl, outputFilename) {
  const contents = await readFile(sourceUrl, "utf8");
  await writeFile(new URL(outputFilename, distDir), contents, "utf8");
}

async function buildTemplateLibrary() {
  const library = {};
  for (const entry of TEMPLATE_CATALOG) {
    const source = await readFile(new URL(`../../../${entry.sourceFile}`, import.meta.url), "utf8");
    library[entry.id] = {
      ...entry,
      source,
    };
  }
  return library;
}

async function buildHtml(assetPrefix, templateLibrary) {
  const template = await readFile(new URL("index.template.html", srcDir), "utf8");
  return template
    .replaceAll("__ASSET_PREFIX__", assetPrefix)
    .replace("__WS_STUDIO_TEMPLATE_LIBRARY__", serializeForInlineScript(templateLibrary));
}

await mkdir(distDir, { recursive: true });
await mkdir(outputsDir, { recursive: true });

const templateLibrary = await buildTemplateLibrary();

await copyAsset("studio-app.js");
await copyAsset("studio-model.js");
await copyAsset("studio-review.js");
await copyAsset("studio.css");
await copyExternalAsset(new URL("../../studio-import-dom/src/index.js", import.meta.url), "studio-import-dom.js");

await writeFile(new URL("index.html", distDir), await buildHtml(".", templateLibrary), "utf8");
await writeFile(new URL("studio-demo.html", outputsDir), await buildHtml("../dist", templateLibrary), "utf8");
await writeFile(
  new URL("studio.templates.json", outputsDir),
  `${JSON.stringify(
    TEMPLATE_CATALOG.map(({ id, label, category, summary, sourceFile }) => ({
      id,
      label,
      category,
      summary,
      sourceFile,
    })),
    null,
    2,
  )}\n`,
  "utf8",
);

console.log("Generated WireSpec Studio web demo in dist/ and outputs/.");
