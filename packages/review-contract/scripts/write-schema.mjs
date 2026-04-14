import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import reviewContract from "../index.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

const schemaText = `${JSON.stringify(reviewContract.annotationSidecarSchema, null, 2)}\n`;

const targets = [
  path.join(packageRoot, "schemas", "wirespec-annotation-sidecar-v0.3.schema.json"),
  path.join(repoRoot, "packages", "runtime", "schemas", "wirespec-annotation-sidecar-v0.3.schema.json"),
  path.join(repoRoot, "packages", "bridge", "schemas", "wirespec-annotation-sidecar-v0.3.schema.json"),
];

for (const target of targets) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, schemaText, "utf8");
}

console.log(`Wrote annotation sidecar schema to ${targets.length} locations.`);
