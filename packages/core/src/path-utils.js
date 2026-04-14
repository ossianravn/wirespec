const path = require("path");

function normalizePath(value) {
  return path.resolve(String(value)).replace(/\\/g, "/");
}

function resolveWorkspaceRelative(workspaceRoot, candidate) {
  if (!candidate) {
    return "";
  }
  return normalizePath(path.isAbsolute(candidate) ? candidate : path.join(workspaceRoot, candidate));
}

function toWorkspaceRelative(workspaceRoot, candidate) {
  return path.relative(normalizePath(workspaceRoot), normalizePath(candidate)).replace(/\\/g, "/");
}

function replaceSuffix(value, from, to) {
  return String(value).endsWith(from) ? String(value).slice(0, -from.length) + to : String(value) + to;
}

module.exports = {
  normalizePath,
  resolveWorkspaceRelative,
  toWorkspaceRelative,
  replaceSuffix,
};
