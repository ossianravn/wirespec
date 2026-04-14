const path = require("path");
const { workspaceSnapshot, handleTaskFileChange, openLatestTaskFile, openNextTask, resolveOnSave } = require("./core-service");
const { parseRangeSpec } = require("./changed-ranges");

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
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

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const command = args._[0];
  const workspaceRoot = path.resolve(args.workspace || process.cwd());

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

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

module.exports = { main };

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  });
}
