import { readFile } from "node:fs/promises";
import {
  buildSourceMap,
  buildVariantRefs,
  formatWireSpecDocument,
  parseWireSpecDocument,
} from "../../runtime/dist/index.js";
import {
  applyStudioCommandToSession,
  canInsertSemanticChild,
  createStudioNode,
  createStudioSession,
  formatStudioDocument,
  planSemanticInsert,
  projectStudioDocument,
  redoStudioSession,
  undoStudioSession,
} from "../dist/index.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const loginSource = await readFile(new URL("../../runtime/fixtures/login.wirespec.md", import.meta.url), "utf8");
const loginDoc = parseWireSpecDocument(loginSource, "packages/runtime/fixtures/login.wirespec.md");

const adapters = {
  entryFile: loginDoc.sourceFile,
  formatDocument: formatWireSpecDocument,
  buildVariantRefs,
  buildSourceMap,
};

let session = createStudioSession(loginDoc, adapters);
assert(session.projection?.canonicalSource?.includes("button id=submit"), "Studio session should hydrate the canonical formatter projection.");
assert(session.projection?.sourceMap?.targets.some((target) => target.targetId === "node:submit"), "Studio session should hydrate the source map projection.");

const emailHelp = createStudioNode("helper", {
  props: { text: "We will only use this email for sign-in." },
});
session = applyStudioCommandToSession(session, {
  type: "insert-node",
  parentId: "login-form",
  position: 1,
  node: emailHelp,
});
assert(
  formatStudioDocument(session).includes('helper id=helper-we-will-only-use-this-email-for-sign-in text="We will only use this email for sign-in."'),
  "Inserted helper content should round-trip through the runtime formatter.",
);

session = applyStudioCommandToSession(session, {
  type: "patch-node",
  nodeId: "submit",
  props: {
    label: "Continue",
  },
});
assert(formatStudioDocument(session).includes("button id=submit action=submit label=Continue variant=primary"), "Patch commands should update canonical source ordering.");

session = applyStudioCommandToSession(session, {
  type: "wrap-node",
  nodeId: "remember",
  wrapper: createStudioNode("row", {
    props: { gap: "sm", align: "center" },
  }),
});
assert(
  formatStudioDocument(session).includes("row id=row-row align=center gap=sm"),
  "Wrap commands should create a container around the target node.",
);

session = applyStudioCommandToSession(session, {
  type: "unwrap-node",
  nodeId: "row-row",
});
assert(!formatStudioDocument(session).includes("row id=row-row"), "Unwrap commands should remove the temporary wrapper.");

session = applyStudioCommandToSession(session, {
  type: "move-node",
  nodeId: "forgot",
  newParentId: "primary-actions",
  position: 0,
});
assert(
  formatStudioDocument(session).includes("actions id=primary-actions\n          link id=forgot href=/forgot-password label=\"Forgot password?\"\n          button id=submit action=submit label=Continue variant=primary"),
  "Move commands should update tree order semantically.",
);

session = applyStudioCommandToSession(session, {
  type: "add-variant-op",
  variant: {
    kind: "state",
    name: "success",
  },
  op: {
    op: "insert",
    ref: "login",
    position: "inside-end",
    node: createStudioNode("alert", {
      props: {
        tone: "positive",
        text: "You are signed in.",
        visible: true,
      },
    }),
    span: {
      file: "studio",
      lineStart: 1,
      columnStart: 1,
      lineEnd: 1,
      columnEnd: 1,
    },
  },
});
assert(
  formatStudioDocument(session).includes("```wirespec v=1 kind=state name=success"),
  "Adding a variant op should create missing variants.",
);
assert(
  session.projection?.variantRefs?.some((variant) => variant.key === "success" && variant.state === "success"),
  "Variant projections should refresh after variant commands.",
);

session = applyStudioCommandToSession(session, {
  type: "replace-variant",
  variant: {
    kind: "state",
    name: "success",
  },
  ops: [
    {
      op: "patch",
      target: "submit",
      props: {
        label: "Done",
      },
      span: {
        file: "studio",
        lineStart: 1,
        columnStart: 1,
        lineEnd: 1,
        columnEnd: 1,
      },
    },
  ],
});
assert(
  formatStudioDocument(session).includes("patch target=submit label=Done"),
  "Replacing a variant should rewrite its operations canonically.",
);

session = applyStudioCommandToSession(session, {
  type: "remove-variant",
  variant: {
    kind: "state",
    name: "success",
  },
});
assert(
  !formatStudioDocument(session).includes("```wirespec v=1 kind=state name=success"),
  "Removing a variant should delete only that variant block.",
);

session = applyStudioCommandToSession(session, {
  type: "add-acceptance",
  text: "Success confirmation is visible without hiding the form context.",
  level: "should",
  tags: ["success", "feedback"],
});
assert(session.document.acceptance.length === 4, "Acceptance commands should append new criteria.");
assert(
  formatStudioDocument(session).includes("Success confirmation is visible without hiding the form context."),
  "Acceptance commands should update canonical prose output.",
);

const sourceMapAfterEdit = session.projection?.sourceMap;
assert(
  sourceMapAfterEdit?.targets.some((target) => target.targetId === "node:helper-we-will-only-use-this-email-for-sign-in"),
  "Source maps should refresh after AST edits.",
);

const undoState = undoStudioSession(session);
assert(undoState.document.acceptance.length === 3, "Undo should revert the latest acceptance command.");
const redoState = redoStudioSession(undoState);
assert(redoState.document.acceptance.length === 4, "Redo should replay the reverted acceptance command.");

assert(canInsertSemanticChild("form", "field") === true, "Semantic rules should allow fields inside forms.");
assert(canInsertSemanticChild("table", "table-row") === false, "Semantic rules should reject rows directly inside tables.");

const queueSource = await readFile(new URL("../../../docs/spec/v1-rc0/screens/04-fulfillment-queue.md", import.meta.url), "utf8");
const queueDoc = parseWireSpecDocument(queueSource, "docs/spec/v1-rc0/screens/04-fulfillment-queue.md");
const queuePlan = planSemanticInsert(queueDoc, {
  parentId: "pick-table",
  nodeKind: "table-row",
});
assert(queuePlan.parentId === "pick-table-body", "Semantic insert planning should retarget table rows into table-body when available.");
assert(queuePlan.notice?.code === "STUDIO_AUTOCORRECT_TABLE_ROW", "Semantic insert planning should explain table-row autocorrection.");

const projected = projectStudioDocument(redoState.document, adapters);
assert(projected.canonicalSource?.includes("## Acceptance"), "Direct projection helpers should reuse the formatter adapter.");
assert(projected.sourceMap?.targets.some((target) => target.targetId === "node:forgot"), "Direct projection helpers should rebuild source maps.");

console.log("Studio core smoke test passed.");
