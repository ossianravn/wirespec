import path from "node:path";
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { startReviewBridgeServer } from "../src/bridge-server.js";
import { watchBridgeEvents } from "../src/bridge-watch.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outputs = path.join(root, "outputs");
const workspace = path.join(outputs, "demo-workspace");

await rm(workspace, { recursive: true, force: true });
await mkdir(workspace, { recursive: true });

const sourceMap = JSON.parse(await readFile(path.join(root, "fixtures/login.targets.json"), "utf8"));
const sidecar = JSON.parse(await readFile(path.join(root, "fixtures/login.seed.annotations.json"), "utf8"));

let nextEventId = 1;
const bridge = startReviewBridgeServer({
  workspaceRoot: workspace,
  now: () => "2026-04-14T10:00:00.000Z",
  createId: (prefix) => `${prefix}-example-${String(nextEventId++).padStart(2, "0")}`,
});
const listener = await bridge.listen(0);

const captured = [];
const watcher = watchBridgeEvents({
  url: `${listener.url}/api/events`,
  maxEvents: 1,
  onEvent(event) {
    captured.push(event);
  },
});

const saveResponse = await fetch(`${listener.url}/api/reviews/save`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    documentId: "login",
    sidecar,
    sourceMap,
    wireFile: sourceMap.entryFile,
  }),
});
const savePayload = await saveResponse.json();
await watcher;
await bridge.close();

const annotationPath = path.join(workspace, savePayload.paths.annotationPath);
const taskPath = path.join(workspace, savePayload.paths.taskPath);
const eventLogPath = path.join(workspace, savePayload.paths.eventLogPath);

const annotationText = await readFile(annotationPath, "utf8");
const taskText = await readFile(taskPath, "utf8");
const eventLogText = await readFile(eventLogPath, "utf8");

await writeFile(path.join(outputs, "login.saved.annotations.json"), annotationText, "utf8");
await writeFile(path.join(outputs, "login.saved.agent-tasks.json"), taskText, "utf8");
await writeFile(path.join(outputs, "bridge.events.ndjson"), eventLogText, "utf8");
await writeFile(
  path.join(outputs, "bridge-watch.transcript.txt"),
  [
    `Watching ${listener.url}/api/events`,
    ...captured.map((event) => {
      const parts = [
        `[${event.kind}]`,
        event.documentId,
        `annotations=${event.annotationPath}`,
        `tasks=${event.taskPath}`,
        `active=${event.activeThreads}`,
      ];
      return parts.join(" ");
    }),
    "",
  ].join("\n"),
  "utf8",
);

const demoHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>WireSpec local bridge demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      :root {
        color-scheme: light;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        background: #f7f7f5;
        color: #111;
        font: 400 16px/1.45 Inter, ui-sans-serif, system-ui, sans-serif;
      }
      main[data-ws-screen="login"] {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px 20px;
      }
      [data-ws-id="auth-card"] {
        width: min(420px, 100%);
        background: #fff;
        border: 1px solid rgba(17,17,17,0.10);
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 10px 24px rgba(17,17,17,0.05);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 30px;
        line-height: 1.1;
      }
      p {
        margin: 0;
      }
      form {
        display: grid;
        gap: 14px;
        margin-top: 20px;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
      }
      input {
        border: 1px solid rgba(17,17,17,0.14);
        border-radius: 10px;
        min-height: 42px;
        padding: 0 12px;
        font: inherit;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .error {
        padding: 10px 12px;
        border: 1px solid rgba(17,17,17,0.14);
        border-radius: 10px;
        background: #fbfbfb;
        color: rgba(17,17,17,0.80);
        font-size: 14px;
      }
      button.primary {
        appearance: none;
        min-height: 44px;
        border: 1px solid #111;
        border-radius: 10px;
        background: #111;
        color: #fff;
        font: 600 15px/1 Inter, ui-sans-serif, system-ui, sans-serif;
        padding: 0 14px;
      }
      .subtle-link {
        color: #111;
        font-size: 14px;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main data-ws-screen="login" data-ws-target="screen:login" data-ws-kind="screen">
      <section data-ws-id="content" data-ws-target="node:content" data-ws-kind="main">
        <article data-ws-id="auth-card" data-ws-target="node:auth-card" data-ws-kind="card">
          <h1 data-ws-id="title" data-ws-target="node:title" data-ws-kind="heading">Welcome back</h1>
          <p data-ws-id="intro" data-ws-target="node:intro" data-ws-kind="text">Use your work email and password.</p>

          <form data-ws-id="login-form" data-ws-target="node:login-form" data-ws-kind="form">
            <label data-ws-id="email-field" data-ws-target="node:email-field" data-ws-kind="field">
              <span>Work email</span>
              <input type="email" value="alex@example.com">
            </label>

            <label data-ws-id="password-field" data-ws-target="node:password-field" data-ws-kind="field">
              <span>Password</span>
              <input type="password" value="password">
            </label>

            <div class="error" data-ws-id="form-error" data-ws-target="node:form-error" data-ws-kind="alert">
              Incorrect email or password.
            </div>

            <div class="row" data-ws-id="secondary-row" data-ws-target="node:secondary-row" data-ws-kind="row">
              <label style="display:flex;align-items:center;gap:8px">
                <input type="checkbox" checked style="min-height:auto">
                <span>Remember me</span>
              </label>
              <a class="subtle-link" href="#" data-ws-id="forgot-password" data-ws-target="node:forgot-password" data-ws-kind="link">Forgot password?</a>
            </div>

            <div data-ws-id="primary-actions" data-ws-target="node:primary-actions" data-ws-kind="actions">
              <button class="primary" type="button" data-ws-id="submit" data-ws-target="node:submit" data-ws-kind="button">Sign in</button>
            </div>
          </form>
        </article>
      </section>
    </main>

    <script type="module">
      import { createReviewRuntime } from "../src/review-runtime.js";
      const sourceMap = ${JSON.stringify(sourceMap, null, 2)};
      const initialSidecar = ${JSON.stringify(sidecar, null, 2)};
      createReviewRuntime({
        documentId: "login",
        sourceMap,
        initialSidecar,
        bridgeUrl: "http://127.0.0.1:4317",
        wireFile: sourceMap.entryFile,
      });
    </script>
  </body>
</html>
`;

await writeFile(path.join(outputs, "login.local-bridge-demo.html"), demoHtml, "utf8");
