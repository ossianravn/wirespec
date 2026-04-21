#!/usr/bin/env node
const { emitCliError, main } = require("../src/cli");

main().catch((error) => emitCliError(process.argv.slice(2), error));
