import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  addThread,
  buildSourceMap,
  buildVariantRefs,
  createEmptyReviewStore,
  createReviewThreadFromDraft,
  exportAgentTasks,
  parseWireSpecDocument,
  renderDocumentSelection,
  resolveDocument,
  reviewStoreToSidecar,
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

function stableIdPart(value) {
  return String(value)
    .replace(/^node:/, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function withStableThreadIds(thread, stem, draft, index) {
  const suffix = `${stem}-${stableIdPart(draft.targetId)}`;
  return {
    ...thread,
    id: `ann-${suffix}`,
    messages: thread.messages.map((message, messageIndex) => ({
      ...message,
      messageId: `msg-${suffix}-${messageIndex + 1}`,
    })),
  };
}

function seededStore(stem, sourceMap, variantKey) {
  const screenId =
    sourceMap.targets.find((target) => target.scope === "screen")?.screenId ?? sourceMap.documentId;
  let store = createEmptyReviewStore(sourceMap.documentId, screenId);

  if (stem === "login") {
    const drafts = [
      {
        targetId: "node:primary-actions",
        title: "Keep the primary action above the fold",
        category: "responsive",
        severity: "must",
        taxonomy: ["LAY-10", "QA-03"],
        body: "On short mobile heights, the error message pushes the submit action too low. Keep the action visible without making the card feel like a dashboard shell.",
      },
      {
        targetId: "node:form-error",
        title: "Error copy should preserve recovery confidence",
        category: "copy",
        severity: "should",
        taxonomy: ["QA-03"],
        body: "The inline error should stay direct and calm. It should acknowledge failure without sounding punitive or hiding the recovery path.",
      },
    ];
    drafts.forEach((draft, index) => {
      const thread = withStableThreadIds(createReviewThreadFromDraft(draft, sourceMap, {
        authorId: "reviewer",
        variantKey,
        now: new Date(Date.UTC(2026, 3, 11, 18, 40 + index)).toISOString(),
      }), stem, draft, index);
      store = addThread(store, thread);
    });
    return store;
  }

  const drafts = [
    {
      targetId: "node:preview-panel",
      title: "Preview should stay the dominant surface",
      category: "layout",
      severity: "must",
      taxonomy: ["LAY-08", "QA-03"],
      body: "Keep the preview visually primary even when there are multiple open notes. The review tooling should not permanently shrink the canvas.",
    },
    {
      targetId: "node:open-threads",
      title: "Thread access should be obvious but quiet",
      category: "behavior",
      severity: "should",
      taxonomy: ["FID-07"],
      body: "Make it clear where open feedback lives, but avoid turning the header into a collaboration dashboard. One calm entry point is enough.",
    },
  ];
  drafts.forEach((draft, index) => {
    const thread = withStableThreadIds(createReviewThreadFromDraft(draft, sourceMap, {
      authorId: "reviewer",
      variantKey,
      now: new Date(Date.UTC(2026, 3, 11, 18, 50 + index)).toISOString(),
    }), stem, draft, index);
    store = addThread(store, thread);
  });
  return store;
}

async function buildRuntimeDemo(stem, html, sourceMap, initialSidecar, variantKey) {
  const moduleSnippet = `
<script type="module">
  import { mountReviewRuntime } from "../dist/review-runtime.js";
  const sourceMap = ${JSON.stringify(sourceMap)};
  const initialSidecar = ${JSON.stringify(initialSidecar)};
  mountReviewRuntime({ sourceMap, initialSidecar, variantKey: ${JSON.stringify(variantKey)} });
</script>`;
  const demo = html.replace("</body>", `${moduleSnippet}</body>`);
  await writeFile(new URL(`${stem}.review-runtime.html`, outputsDir), demo, "utf8");
}

async function buildFixture(filename, selections, reviewSelection = {}) {
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

  const reviewKey = selectionKey(reviewSelection);
  const reviewHtml = renderDocumentSelection(document, reviewSelection, {
    includeDocumentShell: true,
    includeAcceptance: true,
    titleSuffix: `${reviewKey} · review-runtime`,
  });

  const store = seededStore(stem, sourceMap, reviewKey);
  const sidecar = reviewStoreToSidecar(store, sourceMap, {
    wireFile: `fixtures/${filename}`,
  });
  const tasks = exportAgentTasks(store, sourceMap);

  await writeFile(
    new URL(`${stem}.annotations.json`, outputsDir),
    `${JSON.stringify(sidecar, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    new URL(`${stem}.agent-tasks.json`, outputsDir),
    `${JSON.stringify(tasks, null, 2)}\n`,
    "utf8",
  );
  await buildRuntimeDemo(stem, reviewHtml, sourceMap, sidecar, reviewKey);
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

console.log("Generated example HTML, source maps, seeded annotation sidecars, and review runtime demos in outputs/.");
