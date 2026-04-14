const path = require("path");

function normalizePath(value) {
  if (!value) {
    return "";
  }
  return path.resolve(String(value)).replace(/\\/g, "/");
}

function resolveWorkspaceRelative(workspaceRoot, value) {
  if (!value) {
    return "";
  }
  if (path.isAbsolute(value)) {
    return normalizePath(value);
  }
  return normalizePath(path.join(workspaceRoot, value));
}

function toWorkspaceRelative(workspaceRoot, filePath) {
  const absRoot = normalizePath(workspaceRoot);
  const absFile = normalizePath(filePath);
  if (!absRoot || !absFile) {
    return absFile;
  }
  if (!absFile.startsWith(absRoot + "/") && absFile !== absRoot) {
    return absFile;
  }
  const rel = absFile.slice(absRoot.length).replace(/^\//, "");
  return rel || ".";
}

function replaceSuffix(filePath, suffixFrom, suffixTo) {
  if (filePath.endsWith(suffixFrom)) {
    return filePath.slice(0, -suffixFrom.length) + suffixTo;
  }
  return filePath;
}

module.exports = {
  normalizePath,
  resolveWorkspaceRelative,
  toWorkspaceRelative,
  replaceSuffix,
};
