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
  assert.equal(contract.reviewCountSummary({ active: 2, total: 3 }), "2 active · 3 total");
  assert.equal(contract.reviewPinTitle(1), "1 active review thread");
  assert.equal(contract.reviewPinTitle(2), "2 active review threads");
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
