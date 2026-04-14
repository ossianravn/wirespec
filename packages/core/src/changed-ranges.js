function normalizeChangedRanges(ranges) {
  const cleaned = (ranges || [])
    .filter((range) => range && Number.isFinite(Number(range.start)) && Number.isFinite(Number(range.end)))
    .map((range) => ({
      start: Math.max(1, Number(range.start)),
      end: Math.max(Number(range.start), Number(range.end)),
    }))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const range of cleaned) {
    if (!merged.length) {
      merged.push({ ...range });
      continue;
    }
    const last = merged[merged.length - 1];
    if (range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

function parseRangeSpec(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return normalizeChangedRanges(value);
  }
  const parts = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const ranges = parts.map((part) => {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid range segment: ${part}`);
    }
    return {
      start: Number(match[1]),
      end: Number(match[2] || match[1]),
    };
  });

  return normalizeChangedRanges(ranges);
}

function formatRangeSpec(ranges) {
  return normalizeChangedRanges(ranges)
    .map((range) => (range.start === range.end ? String(range.start) : `${range.start}-${range.end}`))
    .join(",");
}

module.exports = {
  normalizeChangedRanges,
  parseRangeSpec,
  formatRangeSpec,
};
