export async function watchBridgeEvents(options) {
  const maxEvents = options.maxEvents ?? Infinity;
  const response = await fetch(options.url, {
    headers: {
      accept: "text/event-stream",
    },
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Could not connect to bridge events at ${options.url}.`);
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
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
          reader.cancel().catch(() => {});
          return seen;
        }
      }
      marker = buffer.indexOf("\n\n");
    }
  }

  return seen;
}
