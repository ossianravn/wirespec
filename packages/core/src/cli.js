const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { workspaceSnapshot, handleTaskFileChange, openLatestTaskFile, openNextTask, resolveOnSave } = require("./core-service");
const { parseRangeSpec } = require("./changed-ranges");

const IDE_JSON_COMMANDS = new Set(["summary", "task-change", "open-latest", "open-next", "resolve-on-save"]);

function parseArgs(argv) {
  const args = { _: [] };
  const booleanFlags = new Set(["write", "json", "keep-resolved-tasks"]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (booleanFlags.has(key) || !next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
      continue;
    }
    args._.push(token);
  }
  return args;
}

async function loadRuntime() {
  const runtimePath = path.resolve(__dirname, "../../runtime/dist/index.js");
  return import(pathToFileURL(runtimePath).href);
}

function relativeToWorkspace(workspaceRoot, filePath) {
  const relative = path.relative(workspaceRoot, filePath);
  return relative && !relative.startsWith("..") ? relative : filePath;
}

function formatDiagnosticLine(filePath, diagnostic) {
  const line = diagnostic.span?.lineStart ?? 1;
  const column = diagnostic.span?.columnStart ?? 1;
  return `${filePath}:${line}:${column} ${diagnostic.level} ${diagnostic.message} [${diagnostic.code}]`;
}

async function runLintCommand(workspaceRoot, filePath, args) {
  const runtime = await loadRuntime();
  const absolutePath = path.resolve(filePath);
  const displayPath = relativeToWorkspace(workspaceRoot, absolutePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const document = runtime.parseWireSpecDocument(source, displayPath);
  const result = runtime.lintWireSpecDocument(document);
  const payload = {
    file: absolutePath,
    ...result,
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  } else if (result.diagnostics.length === 0) {
    process.stdout.write(`${displayPath}: OK\n`);
  } else {
    process.stdout.write(
      `${result.diagnostics.map((diagnostic) => formatDiagnosticLine(displayPath, diagnostic)).join("\n")}\n`,
    );
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

async function runFormatCommand(workspaceRoot, filePath, args) {
  const runtime = await loadRuntime();
  const absolutePath = path.resolve(filePath);
  const displayPath = relativeToWorkspace(workspaceRoot, absolutePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const document = runtime.parseWireSpecDocument(source, displayPath);
  const formatted = runtime.formatWireSpecDocument(document);

  if (args.write) {
    fs.writeFileSync(absolutePath, formatted, "utf8");
    process.stdout.write(`${displayPath}\n`);
    return;
  }

  process.stdout.write(formatted);
}

function wrapCommandResult(command, result) {
  return {
    ok: true,
    command,
    ...result,
  };
}

function writeJson(payload, stream = process.stdout) {
  stream.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function emitCliError(argv, error) {
  const args = parseArgs(argv);
  const command = args._[0] || null;
  const message = error instanceof Error ? error.message : String(error);

  if (args.json || IDE_JSON_COMMANDS.has(command)) {
    writeJson({
      ok: false,
      command,
      error: {
        message,
      },
    });
  } else {
    process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  }
  process.exit(1);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const command = args._[0];
  const workspaceRoot = path.resolve(args.workspace || process.cwd());

  if (command === "lint") {
    const targetFile = args._[1];
    if (!targetFile) {
      throw new Error("lint requires a path to a .wirespec.md file");
    }
    await runLintCommand(workspaceRoot, targetFile, args);
    return;
  }

  if (command === "format") {
    const targetFile = args._[1];
    if (!targetFile) {
      throw new Error("format requires a path to a .wirespec.md file");
    }
    await runFormatCommand(workspaceRoot, targetFile, args);
    return;
  }

  let result;
  switch (command) {
    case "summary":
      result = workspaceSnapshot(workspaceRoot);
      delete result.pairs;
      break;
    case "task-change":
      if (!args["task-file"]) {
        throw new Error("--task-file is required for task-change");
      }
      result = handleTaskFileChange(workspaceRoot, path.resolve(args["task-file"]), {
        writeAudit: args["write-audit"] !== "false",
        timestamp: args.timestamp,
        eventId: args["event-id"],
      });
      break;
    case "open-latest":
      result = openLatestTaskFile(workspaceRoot);
      break;
    case "open-next":
      result = openNextTask(workspaceRoot, args["task-file"] ? path.resolve(args["task-file"]) : undefined);
      break;
    case "resolve-on-save":
      if (!args["saved-file"]) {
        throw new Error("--saved-file is required for resolve-on-save");
      }
      result = resolveOnSave(workspaceRoot, path.resolve(args["saved-file"]), parseRangeSpec(args.ranges || ""), {
        keepResolvedTasksInTaskFile: Boolean(args["keep-resolved-tasks"]),
        author: args.author,
        timestamp: args.timestamp,
        eventId: args["event-id"],
        messageId: args["message-id"],
      });
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  writeJson(wrapCommandResult(command, result));
}

module.exports = { emitCliError, main, parseArgs, wrapCommandResult };

if (require.main === module) {
  main().catch((error) => emitCliError(process.argv.slice(2), error));
}
