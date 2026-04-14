async function decodeJson(response) {
  const payload = await response.json();
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Bridge request failed with ${response.status}`);
  }
  return payload;
}

export async function pingBridge(baseUrl) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`);
  return decodeJson(response);
}

export async function loadReviewFromBridge(baseUrl, payload) {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/api/reviews/load`);
  url.searchParams.set("documentId", payload.documentId);
  if (payload.annotationPath) {
    url.searchParams.set("annotationPath", payload.annotationPath);
  }
  const response = await fetch(url.toString());
  return decodeJson(response);
}

export async function saveReviewToBridge(baseUrl, payload) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reviews/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return decodeJson(response);
}

export async function updateReviewStatusInBridge(baseUrl, payload) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reviews/status`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return decodeJson(response);
}

export function listenToBridgeEvents(baseUrl, onEvent) {
  if (typeof EventSource === "undefined") {
    return {
      close() {},
    };
  }
  const stream = new EventSource(`${baseUrl.replace(/\/$/, "")}/api/events`);
  stream.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data));
    } catch {
      // noop
    }
  };
  return {
    close() {
      stream.close();
    },
  };
}
