import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  access,
  copyFile,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
const tarballPath = path.resolve(
  process.argv[2] || path.join(repoRoot, "dist", `wirespec-${packageJson.version}.tgz`),
);
const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env,
    },
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

await access(tarballPath);

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "wirespec-consumer-"));
const tempEnv = {
  pnpm_config_store_dir: path.join(tempRoot, ".pnpm-store"),
  npm_config_store_dir: path.join(tempRoot, ".pnpm-store"),
};
try {
  const installTarballPath = path.join(
    tempRoot,
    `wirespec-${packageJson.version}-${Date.now()}.tgz`,
  );
  await copyFile(tarballPath, installTarballPath);

  await writeFile(
    path.join(tempRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "wirespec-consumer-smoke",
        private: true,
        type: "module",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await writeFile(
    path.join(tempRoot, "login.wirespec.md"),
    `---
schema: wirespec/1.0-rc0
id: login
route: /login
component: src/features/auth/LoginCard.tsx
---

# Login

## Intent
Let a returning user sign in quickly.

\`\`\`wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content align=center justify=center padding=lg
    card id=auth-card max=sm
      heading id=title level=1 text="Welcome back"
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        field id=password type=password name=password label="Password" required=true
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
\`\`\`

## Acceptance
- Keyboard-only user can sign in.
`,
    "utf8",
  );

  run(pnpmBin, ["add", "-D", installTarballPath], { cwd: tempRoot, env: tempEnv });

  const lintOutput = run(
    pnpmBin,
    ["exec", "wirespec", "lint", "login.wirespec.md", "--json"],
    { cwd: tempRoot, env: tempEnv },
  );
  const lint = JSON.parse(lintOutput);
  assert.equal(lint.ok, true);
  assert(lint.diagnostics.every((diagnostic) => diagnostic.level !== "error"));

  const formatted = run(
    pnpmBin,
    ["exec", "wirespec", "format", "login.wirespec.md"],
    { cwd: tempRoot, env: tempEnv },
  );
  assert.match(formatted, /screen id=login/);

  const summary = JSON.parse(
    run(
      pnpmBin,
      ["exec", "wirespec", "summary", "--workspace", "."],
      { cwd: tempRoot, env: tempEnv },
    ),
  );
  assert.equal(summary.ok, true);
  assert.equal(summary.command, "summary");

  const inspectOutput = run(pnpmBin, ["exec", "wirespec-inspect", "."], { cwd: tempRoot, env: tempEnv });
  assert.match(inspectOutput, /login\.wirespec\.md/);

  const esmCheck = run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      [
        "import { parseWireSpecDocument, renderDocumentSelection } from 'wirespec';",
        "import { readFileSync } from 'node:fs';",
        "const source = readFileSync('login.wirespec.md', 'utf8');",
        "const doc = parseWireSpecDocument(source, 'login.wirespec.md');",
        "const html = renderDocumentSelection(doc, {}, { includeDocumentShell: false });",
        "if (!html.includes('Welcome back')) throw new Error('render failed');",
        "console.log(JSON.stringify({ ok: true, root: doc.root.kind }));",
      ].join(" "),
    ],
    { cwd: tempRoot },
  );
  assert.deepEqual(JSON.parse(esmCheck), { ok: true, root: "screen" });

  const contractVersion = run(
    process.execPath,
    [
      "-e",
      [
        "const contract = require('wirespec/review-contract');",
        "if (!contract.ANNOTATION_SIDECAR_SCHEMA_VERSION) throw new Error('missing schema version');",
        "console.log(contract.ANNOTATION_SIDECAR_SCHEMA_VERSION);",
      ].join(" "),
    ],
    { cwd: tempRoot },
  );
  assert.equal(contractVersion, "0.3.0");

  console.log(
    JSON.stringify(
      {
        ok: true,
        tarball: path.basename(tarballPath),
      },
      null,
      2,
    ),
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
