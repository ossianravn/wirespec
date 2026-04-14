const path = require("path");
const vscode = require("vscode");
const { discoverReviewPairs, loadReviewPair, writeReviewPair, appendIdeEvent, deriveAnnotationPath } = require("./src/review-files");
const { resolveThreadsForFile, summarizePairs, ACTIVE_STATUSES } = require("./src/thread-resolution");
const { ChangedLineTracker } = require("./src/changed-line-tracker");
const { normalizePath } = require("./src/path-utils");

function getConfig() {
  const config = vscode.workspace.getConfiguration("wirespec.ide");
  return {
    autoOpenTaskFiles: config.get("autoOpenTaskFiles", true),
    autoRevealFirstTarget: config.get("autoRevealFirstTarget", false),
    autoResolveOnSave: config.get("autoResolveOnSave", true),
    keepResolvedTasksInTaskFile: config.get("keepResolvedTasksInTaskFile", false),
    statusBarAlignment: config.get("statusBarAlignment", "left"),
  };
}

function chooseStatusBarAlignment(value) {
  return value === "right" ? vscode.StatusBarAlignment.Right : vscode.StatusBarAlignment.Left;
}

function severityRank(task) {
  return typeof task.severityRank === "number"
    ? task.severityRank
    : ({ must: 0, should: 1, could: 2, question: 3 }[task.severity] ?? 99);
}

async function openTaskFile(filePath) {
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
}

async function openTaskTarget(workspaceRoot, task) {
  if (!task?.openInEditor?.file) {
    return false;
  }
  const absoluteFile = path.isAbsolute(task.openInEditor.file)
    ? task.openInEditor.file
    : path.join(workspaceRoot, task.openInEditor.file);
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(absoluteFile));
  const line = Math.max(0, (task.openInEditor.line || 1) - 1);
  const column = Math.max(0, (task.openInEditor.column || 1) - 1);
  const position = new vscode.Position(line, column);
  const range = new vscode.Range(position, position);
  await vscode.window.showTextDocument(document, { preview: false, selection: range, preserveFocus: false });
  return true;
}

function pickNextOpenTask(pair) {
  const activeTasks = (pair?.tasks?.tasks || []).filter((task) => ACTIVE_STATUSES.has(task.status));
  if (!activeTasks.length) {
    return null;
  }
  return activeTasks.sort((a, b) => {
    if (severityRank(a) !== severityRank(b)) {
      return severityRank(a) - severityRank(b);
    }
    return String(a.threadId).localeCompare(String(b.threadId));
  })[0];
}

function buildIndex(pairs) {
  return new Map(pairs.map((pair) => [pair.taskFilePath, pair]));
}

function resolveWorkspaceRoot(uri) {
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  return folder?.uri?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "";
}

function collectRelevantPairs(index, workspaceRoot, savedPath) {
  const absoluteSavedPath = normalizePath(savedPath);
  return Array.from(index.values()).filter((pair) => {
    const sidecarThreads = pair.sidecar?.threads || [];
    return sidecarThreads.some((thread) => {
      const anchors = thread?.target?.anchors || [];
      return anchors.some((anchor) => anchor.type === "source-span" && normalizePath(path.join(workspaceRoot, anchor.file)) === absoluteSavedPath);
    }) || (pair.tasks?.tasks || []).some((task) => {
      if (!task.openInEditor?.file) {
        return false;
      }
      const taskFile = normalizePath(path.isAbsolute(task.openInEditor.file) ? task.openInEditor.file : path.join(workspaceRoot, task.openInEditor.file));
      return taskFile === absoluteSavedPath;
    });
  });
}

function log(output, message) {
  output.appendLine(message);
}

function updateStatusBar(statusBar, pairs) {
  const summary = summarizePairs(pairs);
  const docLabel = summary.documents.length === 1 ? ` · ${summary.documents[0]}` : "";
  statusBar.text = `WireSpec ${summary.openTasks} open${docLabel}`;
  statusBar.tooltip = `${summary.openTasks} open review tasks across ${summary.taskFiles} file(s)`;
}

function createController(context) {
  const tracker = new ChangedLineTracker();
  const output = vscode.window.createOutputChannel("WireSpec");
  let config = getConfig();

  function createStatusBar() {
    const item = vscode.window.createStatusBarItem(chooseStatusBarAlignment(config.statusBarAlignment), 20);
    item.command = "wirespec.showReviewSummary";
    item.show();
    return item;
  }

  let statusBar = createStatusBar();
  let pairs = [];
  let pairIndex = new Map();
  let latestTaskFile = null;

  function refreshPairs() {
    const roots = vscode.workspace.workspaceFolders || [];
    const nextPairs = roots.flatMap((folder) => discoverReviewPairs(folder.uri.fsPath));
    pairs = nextPairs.sort((a, b) => b.mtimeMs - a.mtimeMs);
    pairIndex = buildIndex(pairs);
    latestTaskFile = pairs[0]?.taskFilePath || latestTaskFile;
    updateStatusBar(statusBar, pairs);
    return pairs;
  }

  async function openLatestTaskFile() {
    if (!latestTaskFile) {
      vscode.window.showInformationMessage("No WireSpec task file found.");
      return;
    }
    await openTaskFile(latestTaskFile);
  }

  async function openNextOpenTaskTarget() {
    const pair = latestTaskFile ? pairIndex.get(latestTaskFile) : pairs[0];
    if (!pair) {
      vscode.window.showInformationMessage("No WireSpec review tasks found.");
      return;
    }
    const task = pickNextOpenTask(pair);
    if (!task) {
      vscode.window.showInformationMessage("No open WireSpec task remains in the latest file.");
      return;
    }
    const workspaceRoot = resolveWorkspaceRoot(vscode.Uri.file(pair.taskFilePath));
    const ok = await openTaskTarget(workspaceRoot, task);
    if (ok) {
      log(output, `[jump-next] ${task.openInEditor.file}:${task.openInEditor.line}:${task.openInEditor.column || 1}`);
    }
  }

  async function resolveTouchedThreadsForDocument(document, changedRangesOverride) {
    if (!document || document.isUntitled) {
      return 0;
    }
    const workspaceRoot = resolveWorkspaceRoot(document.uri);
    if (!workspaceRoot) {
      return 0;
    }
    const savedPath = document.uri.fsPath;
    const relevantPairs = collectRelevantPairs(pairIndex, workspaceRoot, savedPath);
    if (!relevantPairs.length) {
      return 0;
    }

    const changedRanges = changedRangesOverride || tracker.take(document.uri.toString());
    let resolvedCount = 0;
    for (const pair of relevantPairs) {
      const resolution = resolveThreadsForFile(pair, workspaceRoot, savedPath, changedRanges, {
        keepResolvedTasksInTaskFile: config.keepResolvedTasksInTaskFile,
        author: "WireSpec IDE Companion",
      });
      if (!resolution.resolvedThreadIds.length) {
        continue;
      }
      writeReviewPair(resolution.pair);
      appendIdeEvent(workspaceRoot, {
        eventId: `evt-${Math.random().toString(16).slice(2, 14)}`,
        kind: "threads-resolved",
        documentId: resolution.pair.documentId,
        threadIds: resolution.resolvedThreadIds,
        file: path.relative(workspaceRoot, savedPath).replace(/\\/g, "/"),
        changedRanges,
        remainingOpenTasks: resolution.remainingOpenTasks,
        createdAt: new Date().toISOString(),
      });
      pairIndex.set(resolution.pair.taskFilePath, loadReviewPair(resolution.pair.taskFilePath));
      resolvedCount += resolution.resolvedThreadIds.length;
      log(output, `[resolved] ${resolution.pair.documentId} ${resolution.resolvedThreadIds.join(", ")}`);
    }
    pairs = Array.from(pairIndex.values()).sort((a, b) => b.mtimeMs - a.mtimeMs);
    updateStatusBar(statusBar, pairs);
    return resolvedCount;
  }

  function showSummary() {
    const summary = summarizePairs(pairs);
    const documents = summary.documents.length ? summary.documents.join(", ") : "none";
    vscode.window.showInformationMessage(`WireSpec: ${summary.openTasks} open task(s) across ${summary.taskFiles} file(s) — ${documents}`);
  }

  refreshPairs();

  const reviewWatcher = vscode.workspace.createFileSystemWatcher("**/.wirespec/reviews/*.agent-tasks.json");
  const annotationWatcher = vscode.workspace.createFileSystemWatcher("**/.wirespec/reviews/*.annotations.json");

  const refreshFromPath = async (uri, kind) => {
    config = getConfig();
    refreshPairs();
    latestTaskFile = uri.fsPath.endsWith(".agent-tasks.json") ? uri.fsPath : deriveAnnotationPath(uri.fsPath).replace(".annotations.json", ".agent-tasks.json");
    log(output, `[${kind}] ${uri.fsPath}`);
    if (config.autoOpenTaskFiles && uri.fsPath.endsWith(".agent-tasks.json")) {
      await openTaskFile(uri.fsPath);
      log(output, `[auto-opened] ${uri.fsPath}`);
      if (config.autoRevealFirstTarget) {
        await openNextOpenTaskTarget();
      }
    }
  };

  context.subscriptions.push(
    output,
    statusBar,
    reviewWatcher,
    annotationWatcher,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("wirespec.ide")) {
        config = getConfig();
        statusBar.dispose();
        statusBar = createStatusBar();
        updateStatusBar(statusBar, pairs);
      }
    }),
    reviewWatcher.onDidChange((uri) => { void refreshFromPath(uri, "task-file-changed"); }),
    reviewWatcher.onDidCreate((uri) => { void refreshFromPath(uri, "task-file-created"); }),
    annotationWatcher.onDidChange((uri) => { void refreshFromPath(uri, "annotations-changed"); }),
    annotationWatcher.onDidCreate((uri) => { void refreshFromPath(uri, "annotations-created"); }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      tracker.noteChange(event.document.uri.toString(), event.contentChanges);
    }),
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.uri.fsPath.endsWith(".agent-tasks.json")) {
        if (config.autoOpenTaskFiles) {
          await openTaskFile(document.uri.fsPath);
          log(output, `[auto-opened] ${document.uri.fsPath}`);
        }
        refreshPairs();
        return;
      }
      if (!config.autoResolveOnSave) {
        tracker.clear(document.uri.toString());
        return;
      }
      const resolvedCount = await resolveTouchedThreadsForDocument(document);
      if (resolvedCount > 0) {
        vscode.window.setStatusBarMessage(`WireSpec resolved ${resolvedCount} thread(s)`, 3000);
      }
    }),
    vscode.commands.registerCommand("wirespec.openLatestTaskFile", openLatestTaskFile),
    vscode.commands.registerCommand("wirespec.openNextOpenTaskTarget", openNextOpenTaskTarget),
    vscode.commands.registerCommand("wirespec.refreshReviewFiles", () => {
      refreshPairs();
      log(output, `[refresh] ${pairs.length} task file(s)`);
    }),
    vscode.commands.registerCommand("wirespec.showReviewSummary", showSummary),
    vscode.commands.registerCommand("wirespec.resolveTouchedThreads", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("Open a target file first.");
        return;
      }
      const ranges = tracker.peek(editor.document.uri.toString());
      const resolvedCount = await resolveTouchedThreadsForDocument(editor.document, ranges.length ? ranges : undefined);
      if (resolvedCount === 0) {
        vscode.window.showInformationMessage("No open WireSpec thread matched the active file.");
      } else {
        vscode.window.showInformationMessage(`Resolved ${resolvedCount} WireSpec thread(s).`);
      }
    })
  );

  return {
    refreshPairs,
  };
}

function activate(context) {
  createController(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
