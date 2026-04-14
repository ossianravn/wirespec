# WireSpec local bridge v0.3

This pack turns browser review into repo files and terminal-visible events.

## What it adds
- A localhost bridge that writes annotation sidecars and agent-task JSON into the repo
- A browser client and review runtime that can load and save through that bridge
- An SSE event stream plus a small terminal watcher so a terminal agent can react to fresh review feedback
- A lean review UI that stays close to the Proper UI guidance: preview stays primary, controls stay small, no dashboard shell

## Repo layout
By default the bridge writes:

- `.wirespec/reviews/<documentId>.annotations.json`
- `.wirespec/reviews/<documentId>.agent-tasks.json`
- `.wirespec/reviews/events.ndjson`

You can override the annotation or task path per save request, but the path must stay inside the workspace root.

## Endpoints
- `GET /health`
- `GET /api/events` — server-sent events
- `GET /api/reviews/load?documentId=<id>[&annotationPath=<relative>]`
- `POST /api/reviews/save`
- `POST /api/reviews/status`

## Quick run
From this folder:

```bash
node ./src/cli-bridge-server.js --workspace ./outputs/demo-workspace --port 4317
```

Then in another terminal:

```bash
node ./src/cli-bridge-watch.js --url http://127.0.0.1:4317/api/events
```

Then open the demo page in a local server and point it at `http://127.0.0.1:4317`.

## Example assets
- `outputs/login.local-bridge-demo.html`
- `outputs/demo-workspace/.wirespec/reviews/login.annotations.json`
- `outputs/demo-workspace/.wirespec/reviews/login.agent-tasks.json`
- `outputs/demo-workspace/.wirespec/reviews/events.ndjson`
- `outputs/bridge-watch.transcript.txt`

## Verification
- `npm test`
- `npm run generate:examples`

Both were run for this pack.
