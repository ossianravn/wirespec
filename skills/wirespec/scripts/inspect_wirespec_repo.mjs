#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const ignoreDirs = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function rel(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

const files = exists(root) ? walk(root) : [];
const packageJsonFiles = files.filter((file) => path.basename(file) === "package.json");
const packageScripts = [];

for (const file of packageJsonFiles) {
  try {
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    const scripts = Object.entries(pkg.scripts || {})
      .filter(([name, command]) => /wirespec|review|bridge|annotation/i.test(`${name} ${command}`))
      .map(([name, command]) => ({ name, command }));
    if (scripts.length) packageScripts.push({ file: rel(file), scripts });
  } catch {
    // Ignore invalid package files in generated or fixture directories.
  }
}

const summary = {
  root,
  wirespecFiles: files.filter((file) => /\.wirespec\.md$/.test(file)).map(rel),
  reviewTaskFiles: files.filter((file) => /\.wirespec\/reviews\/.*\.agent-tasks\.json$/.test(rel(file))).map(rel),
  annotationFiles: files.filter((file) => /\.wirespec\/reviews\/.*\.annotations\.json$/.test(rel(file))).map(rel),
  bridgePackages: packageJsonFiles.filter((file) => rel(file).includes("bridge")).map(rel),
  runtimePackages: packageJsonFiles.filter((file) => rel(file).includes("runtime")).map(rel),
  coreCli: files.filter((file) => rel(file).endsWith("packages/core/bin/wirespec-ide-core.js")).map(rel),
  packageScripts,
};

console.log(JSON.stringify(summary, null, 2));
