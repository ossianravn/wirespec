function mergeRanges(ranges) {
  const sorted = [...ranges]
    .filter((range) => range && Number.isFinite(range.start) && Number.isFinite(range.end))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const range of sorted) {
    if (!merged.length) {
      merged.push({ start: range.start, end: range.end });
      continue;
    }
    const last = merged[merged.length - 1];
    if (range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ start: range.start, end: range.end });
    }
  }
  return merged;
}

function rangesFromContentChanges(contentChanges) {
  const ranges = [];
  for (const change of contentChanges || []) {
    if (!change.range) {
      continue;
    }
    const insertedLines = String(change.text || "").split(/\r?\n/).length - 1;
    const start = change.range.start.line + 1;
    const replacedEnd = change.range.end.line + 1;
    const insertedEnd = start + insertedLines;
    ranges.push({ start, end: Math.max(replacedEnd, insertedEnd, start) });
  }
  return mergeRanges(ranges);
}

class ChangedLineTracker {
  constructor() {
    this.byDocument = new Map();
  }

  noteChange(documentKey, contentChanges) {
    const nextRanges = rangesFromContentChanges(contentChanges);
    if (!nextRanges.length) {
      return [];
    }
    const existing = this.byDocument.get(documentKey) || [];
    const merged = mergeRanges([...existing, ...nextRanges]);
    this.byDocument.set(documentKey, merged);
    return merged;
  }

  peek(documentKey) {
    return this.byDocument.get(documentKey) || [];
  }

  take(documentKey) {
    const ranges = this.peek(documentKey);
    this.byDocument.delete(documentKey);
    return ranges;
  }

  clear(documentKey) {
    this.byDocument.delete(documentKey);
  }
}

module.exports = {
  mergeRanges,
  rangesFromContentChanges,
  ChangedLineTracker,
};
