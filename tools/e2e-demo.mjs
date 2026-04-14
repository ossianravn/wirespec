import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  addThread,
  buildSourceMap,
  buildVariantRefs,
  createEmptyReviewStore,
  createReviewThreadFromDraft,
  parseWireSpecDocument,
  renderDocumentSelection,
  reviewStoreToSidecar,
} from "../packages/runtime/dist/index.js";
import { startReviewBridgeServer } from "../packages/bridge/src/bridge-server.js";

const require = createRequire(import.meta.url);
const {
  openNextTask,
  resolveOnSave,
  workspaceSnapshot,
} = require("../packages/core/src/core-service.js");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keepWorkspace = process.argv.includes("--keep");

function selectionKey(selection) {
  return (
    [selection.mode, selection.theme, selection.breakpoint, selection.state]
      .filter(Boolean)
      .join("+") || "base"
  );
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const implementationAnchors = {
  "node:primary-actions": {
    type: "source-span",
    file: "src/features/auth/LoginCard.tsx",
    lineStart: 21,
    lineEnd: 23,
    columnStart: 11,
    columnEnd: 16,
  },
  "node:form-error": {
    type: "source-span",
    file: "src/features/auth/LoginCard.tsx",
    lineStart: 17,
    lineEnd: 20,
    columnStart: 11,
    columnEnd: 16,
  },
};

function addImplementationAnchors(sidecar) {
  return {
    ...sidecar,
    threads: sidecar.threads.map((thread) => ({
      ...thread,
      target: {
        ...thread.target,
        anchors: [
          implementationAnchors[thread.target.targetId],
          ...(thread.target.anchors || []),
        ].filter(Boolean),
      },
    })),
  };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  assert.equal(response.status, 200, body.error || `Unexpected status ${response.status}`);
  assert.equal(body.ok, true, body.error || "Bridge response was not ok");
  return body;
}

async function main() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "wirespec-e2e-"));
  const workspaceRoot = path.join(tempRoot, "workspace");
  const previewDir = path.join(tempRoot, "preview");
  const bridge = startReviewBridgeServer({ workspaceRoot });
  let bridgeListening = false;

  try {
    await mkdir(path.join(workspaceRoot, "fixtures"), { recursive: true });
    await mkdir(previewDir, { recursive: true });
    await cp(
      path.join(repoRoot, "demo-workspace", "src"),
      path.join(workspaceRoot, "src"),
      { recursive: true },
    );

    const fixtureRelative = "fixtures/login.wirespec.md";
    const fixtureSource = await readFile(
      path.join(repoRoot, "packages", "runtime", "fixtures", "login.wirespec.md"),
      "utf8",
    );
    await writeFile(path.join(workspaceRoot, fixtureRelative), fixtureSource, "utf8");

    const document = parseWireSpecDocument(fixtureSource, fixtureRelative);
    const contentHash = `sha256:${createHash("sha256").update(fixtureSource).digest("hex")}`;
    const sourceMap = buildSourceMap(document, {
      entryFile: fixtureRelative,
      contentHash,
      generatedAt: "2026-04-14T00:00:00.000Z",
      variantRefs: buildVariantRefs(document),
    });

    const selection = { breakpoint: "mobile", state: "error" };
    const variantKey = selectionKey(selection);
    const html = renderDocumentSelection(document, selection, {
      includeDocumentShell: true,
      includeAcceptance: true,
      titleSuffix: `${variantKey} e2e`,
    });
    assert.match(html, /data-ws-screen="login"/);
    assert.match(html, /Incorrect email or password/);
    await writeFile(path.join(previewDir, "login.mobile+error.html"), html, "utf8");
    await writeFile(
      path.join(previewDir, "login.targets.json"),
      `${JSON.stringify(sourceMap, null, 2)}\n`,
      "utf8",
    );

    const screenId =
      sourceMap.targets.find((target) => target.scope === "screen")?.screenId ??
      sourceMap.documentId;
    let store = createEmptyReviewStore(sourceMap.documentId, screenId);
    const drafts = [
      {
        targetId: "node:primary-actions",
        title: "Keep the primary action above the fold",
        category: "responsive",
        severity: "must",
        taxonomy: ["LAY-10", "QA-03"],
        body: "Keep the sign-in action reachable on short mobile screens.",
      },
      {
        targetId: "node:form-error",
        title: "Error copy should preserve recovery confidence",
        category: "copy",
        severity: "should",
        taxonomy: ["QA-03"],
        body: "Keep the error direct and recoverable without sounding punitive.",
      },
    ];

    for (const [index, draft] of drafts.entries()) {
      store = addThread(
        store,
        createReviewThreadFromDraft(draft, sourceMap, {
          authorId: "reviewer",
          variantKey,
          now: `2026-04-14T10:0${index}:00.000Z`,
        }),
      );
    }

    const sidecar = addImplementationAnchors(reviewStoreToSidecar(store, sourceMap, {
      wireFile: fixtureRelative,
      component: "src/features/auth/LoginCard.tsx",
    }));

    const listener = await bridge.listen(0);
    bridgeListening = true;
    const health = await fetch(`${listener.url}/health`).then((response) => response.json());
    assert.equal(health.ok, true);

    const save = await postJson(`${listener.url}/api/reviews/save`, {
      documentId: sourceMap.documentId,
      sidecar,
      sourceMap,
      wireFile: fixtureRelative,
      componentFile: "src/features/auth/LoginCard.tsx",
    });
    assert.equal(save.counts.total, 2);
    assert.equal(save.counts.active, 2);

    const taskFile = path.join(workspaceRoot, save.paths.taskPath);
    const annotationFile = path.join(workspaceRoot, save.paths.annotationPath);
    const savedTasks = await readJson(taskFile);
    const savedSidecar = await readJson(annotationFile);
    assert.equal(savedTasks.tasks.length, 2);
    assert.equal(savedSidecar.threads.length, 2);

    const snapshot = workspaceSnapshot(workspaceRoot);
    assert.equal(snapshot.summary.openTasks, 2);

    const next = openNextTask(workspaceRoot, taskFile);
    assert.equal(next.nextTask.targetId, "node:primary-actions");
    assert.equal(next.nextTask.severity, "must");

    const firstResolve = resolveOnSave(
      workspaceRoot,
      path.join(workspaceRoot, "src/features/auth/LoginCard.tsx"),
      [{ start: 21, end: 23 }],
      {
        author: "WireSpec E2E",
        timestamp: "2026-04-14T10:10:00.000Z",
      },
    );
    assert.deepEqual(firstResolve.resolvedThreadIds, [next.nextTask.threadId]);
    assert.equal(firstResolve.summary.openTasks, 1);

    const secondResolve = resolveOnSave(
      workspaceRoot,
      path.join(workspaceRoot, "src/features/auth/LoginCard.tsx"),
      [{ start: 17, end: 20 }],
      {
        author: "WireSpec E2E",
        timestamp: "2026-04-14T10:11:00.000Z",
      },
    );
    assert.equal(secondResolve.summary.openTasks, 0);
    assert.equal(secondResolve.resolvedThreadIds.length, 1);

    const finalTasks = await readJson(taskFile);
    const finalSidecar = await readJson(annotationFile);
    assert.equal(finalTasks.tasks.length, 0);
    assert.equal(finalSidecar.threads.every((thread) => thread.status === "resolved"), true);

    console.log(
      JSON.stringify(
        {
          ok: true,
          workspace: keepWorkspace ? workspaceRoot : "(temporary workspace removed)",
          preview: keepWorkspace ? previewDir : "(temporary preview removed)",
          documentId: sourceMap.documentId,
          variant: variantKey,
          savedReviewPaths: save.paths,
          firstTask: {
            targetId: next.nextTask.targetId,
            severity: next.nextTask.severity,
          },
          resolvedThreads: [
            ...firstResolve.resolvedThreadIds,
            ...secondResolve.resolvedThreadIds,
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    if (bridgeListening) {
      await bridge.close();
    }
    if (!keepWorkspace) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
