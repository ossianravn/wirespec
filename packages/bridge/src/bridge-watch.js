function buildWatchSignal(options) {
  const controller = new AbortController();
  let timeoutId;
  let abortListener;

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort(options.signal.reason);
    } else {
      abortListener = () => controller.abort(options.signal.reason);
      options.signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  if (typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs) && options.timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new Error(`Timed out watching bridge events at ${options.url}.`));
    }, options.timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (options.signal && abortListener) {
        options.signal.removeEventListener("abort", abortListener);
      }
    },
  };
}

export async function watchBridgeEvents(options) {
  const maxEvents = options.maxEvents ?? Infinity;
  const { signal, cleanup } = buildWatchSignal(options);
  let reader;
  let connected = false;

  const notifyConnected = async () => {
    if (connected) {
      return;
    }
    connected = true;
    if (options.onConnected) {
      await options.onConnected();
    }
  };

  try {
    const response = await fetch(options.url, {
      headers: {
        accept: "text/event-stream",
      },
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Could not connect to bridge events at ${options.url}.`);
    }

    const decoder = new TextDecoder();
    reader = response.body.getReader();
    let buffer = "";
    let seen = 0;

    while (seen < maxEvents) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let marker = buffer.indexOf("\n\n");
      while (marker !== -1) {
        const block = buffer.slice(0, marker);
        buffer = buffer.slice(marker + 2);
        const lines = block.split("\n");
        const commentLines = lines.filter((line) => line.startsWith(":"));
        if (commentLines.some((line) => line.startsWith(": connected"))) {
          await notifyConnected();
        }
        const dataLines = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (dataLines) {
          const event = JSON.parse(dataLines);
          seen += 1;
          if (options.onEvent) {
            await options.onEvent(event);
          }
          if (seen >= maxEvents) {
            return seen;
          }
        }
        marker = buffer.indexOf("\n\n");
      }
    }

    return seen;
  } finally {
    cleanup();
    if (reader) {
      try {
        await reader.cancel();
      } catch {
        // ignore cancellation errors during shutdown
      }
    }
  }
}
