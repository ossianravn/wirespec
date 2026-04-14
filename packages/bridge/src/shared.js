import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
export { escapeHtml, nowIso, shortId, textQuoteForTarget } from "./browser-shared.js";

export function sanitizeDocumentId(value) {
  const safe = String(value || "document")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "document";
}

export async function ensureDirForFile(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeJsonFile(filePath, payload) {
  await ensureDirForFile(filePath);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readJsonFile(filePath) {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text);
}

export function allowedOrigin(origin) {
  if (!origin || origin === "null" || origin === "file://") {
    return true;
  }
  try {
    const url = new URL(origin);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1" ||
      url.protocol === "vscode-webview:"
    );
  } catch {
    return false;
  }
}

export function safePathUnderRoot(workspaceRoot, requestedPath, fallbackRelative) {
  const root = path.resolve(workspaceRoot);
  const candidate = requestedPath
    ? path.isAbsolute(requestedPath)
      ? path.resolve(requestedPath)
      : path.resolve(root, requestedPath)
    : path.resolve(root, fallbackRelative);

  const relative = path.relative(root, candidate);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative.includes(`..${path.sep}`)
  ) {
    throw new Error(`Refusing to access a path outside the workspace root: ${requestedPath}`);
  }

  return {
    absolute: candidate,
    relative: relative.split(path.sep).join("/"),
  };
}
