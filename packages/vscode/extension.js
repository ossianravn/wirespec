const fs = require("fs");
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
    corePath: config.get("corePath", ""),
    coreCommand: config.get("coreCommand", ["pnpm", "exec", "wirespec-ide-core"]),
  };
}

function getWorkspaceRoot() {
  return vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath || "";
}

function firstExistingPath(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function resolveCoreInvocation(context, workspaceRoot, config) {
  const bundledScript = firstExistingPath([
    path.join(context.extensionPath, "bin", "wirespec-ide-core.js"),
    path.join(context.extensionPath, "dist", "wirespec-ide-core.js"),
  ]);
  if (bundledScript) {
    return {
      kind: "node-script",
      label: "bundled extension asset",
      executable: config.nodeExecutable,
      args: [bundledScript],
    };
  }

  const repoScript = firstExistingPath([
    path.join(workspaceRoot, "packages", "core", "bin", "wirespec-ide-core.js"),
  ]);
  if (repoScript) {
    return {
      kind: "node-script",
      label: "workspace repo checkout",
      executable: config.nodeExecutable,
      args: [repoScript],
    };
  }

  const installedScript = firstExistingPath([
    path.join(workspaceRoot, "node_modules", "wirespec", "packages", "core", "bin", "wirespec-ide-core.js"),
  ]);
  if (installedScript) {
    return {
      kind: "node-script",
      label: "workspace node_modules package",
      executable: config.nodeExecutable,
      args: [installedScript],
    };
  }

  if (typeof config.corePath === "string" && path.isAbsolute(config.corePath) && fs.existsSync(config.corePath)) {
    return {
      kind: "node-script",
      label: "configured absolute core path",
      executable: config.nodeExecutable,
      args: [config.corePath],
    };
  }

  const commandTokens = Array.isArray(config.coreCommand) && config.coreCommand.length > 0
    ? config.coreCommand
    : ["pnpm", "exec", "wirespec-ide-core"];
  if (commandTokens.length > 0) {
    const [executable, ...baseArgs] = commandTokens;
    return {
      kind: "command",
      label: "configured core command",
      executable,
      args: baseArgs,
    };
  }

  return null;
}

function missingCoreMessage(workspaceRoot) {
  return [
    "WireSpec core could not be found.",
    `Checked the extension bundle, ${path.join(workspaceRoot, "packages", "core", "bin", "wirespec-ide-core.js")}, and ${path.join(workspaceRoot, "node_modules", "wirespec", "packages", "core", "bin", "wirespec-ide-core.js")}.`,
    "Install wirespec in the workspace, package the extension with a bundled core, or configure wirespec.ide.coreCommand / wirespec.ide.corePath.",
  ].join(" ");
}

function runCore(context, command, args = []) {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return Promise.reject(new Error("No workspace folder is open."));
  }
  const config = getConfig();
  const invocation = resolveCoreInvocation(context, workspaceRoot, config);
  if (!invocation) {
    return Promise.reject(new Error(missingCoreMessage(workspaceRoot)));
  }

  return new Promise((resolve, reject) => {
    const child = cp.execFile(
      invocation.executable,
      [...invocation.args, command, "--workspace", workspaceRoot, ...args],
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
      const result = await runCore(context, "summary");
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
    const result = await runCore(context, "task-change", ["--task-file", uri.fsPath]);
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
    const result = await runCore(context, "open-latest");
    if (!result.latestTaskFile) {
      vscode.window.showInformationMessage("No WireSpec task file found.");
      return;
    }
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(result.latestTaskFile));
    await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
  }

  async function openNextOpenTask() {
    const result = await runCore(context, "open-next");
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
    const result = await runCore(context, "resolve-on-save", [
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
