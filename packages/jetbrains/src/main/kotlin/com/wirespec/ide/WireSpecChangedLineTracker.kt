package com.wirespec.ide

import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.fileEditor.FileDocumentManager
import kotlin.math.max

data class LineRange(val start: Int, val end: Int)

class WireSpecChangedLineTracker {
    private val byFile: MutableMap<String, MutableList<LineRange>> = linkedMapOf()

    fun note(event: DocumentEvent) {
        val document = event.document
        val virtualFile = FileDocumentManager.getInstance().getFile(document) ?: return
        val start = document.getLineNumber(event.offset) + 1
        val endOffset = max(event.offset, event.offset + event.newLength)
        val end = document.getLineNumber(endOffset.coerceAtMost(document.textLength)) + 1
        val existing = byFile.getOrPut(virtualFile.path) { mutableListOf() }
        existing += LineRange(start, max(start, end))
        byFile[virtualFile.path] = merge(existing)
    }

    fun take(path: String): List<LineRange> = byFile.remove(path)?.toList() ?: emptyList()

    private fun merge(ranges: List<LineRange>): MutableList<LineRange> {
        val sorted = ranges.sortedBy { it.start }
        if (sorted.isEmpty()) return mutableListOf()
        val merged = mutableListOf(sorted.first())
        for (range in sorted.drop(1)) {
            val last = merged.last()
            if (range.start <= last.end + 1) {
                merged[merged.lastIndex] = LineRange(last.start, max(last.end, range.end))
            } else {
                merged += range
            }
        }
        return merged
    }
}
