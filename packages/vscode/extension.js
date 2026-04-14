const path = require("path");
const cp = require("child_process");
const vscode = require("vscode");
const { ChangedLineTracker } = require("./src/changed-line-tracker");

function getConfig() {
  const config = vscode.workspace.getConfiguration("wirespec.ide");
  return {
    autoOpenTaskFiles: config.get("autoOpenTaskFiles", true),
    autoRevealFirstTarget: config.get("autoRevealFirstTarget", false),
    nodeExecutable: config.get("nodeExecutable", "node"),
  };
}

function getWorkspaceRoot() {
  return vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "";
}

function coreScript(workspaceRoot) {
  return path.join(workspaceRoot, "packages", "core", "bin", "wirespec-ide-core.js");
}

function runCore(command, args = []) {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return Promise.reject(new Error("No workspace folder is open."));
  }
  const config = getConfig();
  return new Promise((resolve, reject) => {
    const child = cp.execFile(
      config.nodeExecutable,
      [coreScript(workspaceRoot), command, "--workspace", workspaceRoot, ...args],
      { cwd: workspaceRoot },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }
        resolve(JSON.parse(stdout));
      }
    );
    child.stdin?.end();
  });
}

async function openFileTarget(target) {
  if (!target?.file) {
    return false;
  }
  const workspaceRoot = getWorkspaceRoot();
  const absolutePath = path.isAbsolute(target.file) ? target.file : path.join(workspaceRoot, target.file);
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(absolutePath));
  const line = Math.max(0, (target.line || 1) - 1);
  const column = Math.max(0, (target.column || 1) - 1);
  const position = new vscode.Position(line, column);
  await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
    selection: new vscode.Range(position, position),
  });
  return true;
}

function createController(context) {
  const tracker = new ChangedLineTracker();
  const output = vscode.window.createOutputChannel("WireSpec");
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);
  statusBar.command = "wirespec.showReviewSummary";
  statusBar.show();

  async function refreshSummary() {
    try {
      const result = await runCore("summary");
      const docLabel = result.summary.latestDocumentId ? ` · ${result.summary.latestDocumentId}` : "";
      statusBar.text = `WireSpec ${result.summary.openTasks} open${docLabel}`;
      statusBar.tooltip = `${result.summary.openTasks} open review tasks across ${result.summary.taskFiles} file(s)`;
      return result;
    } catch (error) {
      output.appendLine(`[summary-error] ${error.message}`);
      statusBar.text = "WireSpec unavailable";
      statusBar.tooltip = error.message;
      return null;
    }
  }

  async function handleTaskFileChange(uri) {
    const config = getConfig();
    const result = await runCore("task-change", ["--task-file", uri.fsPath]);
    output.appendLine(`[task-file-changed] ${uri.fsPath}`);
    await refreshSummary();
    if (config.autoOpenTaskFiles) {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(uri.fsPath));
      await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
      if (config.autoRevealFirstTarget && result.nextTask?.openInEditor) {
        await openFileTarget(result.nextTask.openInEditor);
      }
    }
  }

  async function openLatestTaskFile() {
    const result = await runCore("open-latest");
    if (!result.latestTaskFile) {
      vscode.window.showInformationMessage("No WireSpec task file found.");
      return;
    }
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(result.latestTaskFile));
    await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
  }

  async function openNextOpenTask() {
    const result = await runCore("open-next");
    if (!result.nextTask?.openInEditor) {
      vscode.window.showInformationMessage("No open WireSpec task remains.");
      return;
    }
    await openFileTarget(result.nextTask.openInEditor);
  }

  async function resolveTouchedThreadsForDocument(document, changedRangesOverride) {
    if (!document || document.isUntitled) {
      return 0;
    }
    const changedRanges = changedRangesOverride || tracker.take(document.uri.toString());
    if (!changedRanges.length) {
      return 0;
    }
    const rangeSpec = changedRanges.map((range) => (range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`)).join(",");
    const result = await runCore("resolve-on-save", [
      "--saved-file",
      document.uri.fsPath,
      "--ranges",
      rangeSpec,
      "--author",
      "WireSpec VS Code Companion",
    ]);
    if (result.resolvedThreadIds.length) {
      output.appendLine(`[resolved] ${result.resolvedThreadIds.join(", ")}`);
      await refreshSummary();
    }
    return result.resolvedThreadIds.length;
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => refreshSummary()),
    vscode.workspace.onDidChangeTextDocument((event) => tracker.noteChange(event.document.uri.toString(), event.contentChanges)),
    vscode.workspace.onDidSaveTextDocument((document) => resolveTouchedThreadsForDocument(document)),
    vscode.workspace.createFileSystemWatcher("**/.wirespec/reviews/*.agent-tasks.json")
  );

  const taskWatcher = vscode.workspace.createFileSystemWatcher("**/.wirespec/reviews/*.agent-tasks.json");
  context.subscriptions.push(taskWatcher);
  context.subscriptions.push(taskWatcher.onDidCreate(handleTaskFileChange));
  context.subscriptions.push(taskWatcher.onDidChange(handleTaskFileChange));

  context.subscriptions.push(vscode.commands.registerCommand("wirespec.openLatestTaskFile", openLatestTaskFile));
  context.subscriptions.push(vscode.commands.registerCommand("wirespec.openNextOpenTask", openNextOpenTask));
  context.subscriptions.push(vscode.commands.registerCommand("wirespec.resolveTouchedThreadsForActiveFile", async () => {
    const document = vscode.window.activeTextEditor?.document;
    const count = await resolveTouchedThreadsForDocument(document, tracker.take(document?.uri.toString() || ""));
    vscode.window.showInformationMessage(`WireSpec resolved ${count} thread(s).`);
  }));
  context.subscriptions.push(vscode.commands.registerCommand("wirespec.showReviewSummary", async () => {
    const result = await refreshSummary();
    if (result) {
      vscode.window.showInformationMessage(`WireSpec: ${result.summary.openTasks} open task(s) across ${result.summary.taskFiles} file(s).`);
    }
  }));
  context.subscriptions.push(statusBar, output);

  refreshSummary();
}

function activate(context) {
  createController(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
