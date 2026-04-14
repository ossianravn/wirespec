package com.wirespec.ide

import com.intellij.AppTopics
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.EditorFactory
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.fileEditor.FileDocumentManagerListener
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.VirtualFileManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.wm.WindowManager
import java.io.File

@Service(Service.Level.PROJECT)
class WireSpecProjectService(private val project: Project) {
    private val bridge = WireSpecNodeBridge(project)
    private val tracker = WireSpecChangedLineTracker()
    @Volatile
    private var summary: SummaryPayload = SummaryPayload()

    fun start() {
        if (!bridge.isAvailable()) {
            return
        }

        refreshSummary()

        val connection = project.messageBus.connect()
        connection.subscribe(VirtualFileManager.VFS_CHANGES, BulkFileListener { events ->
            events
                .mapNotNull { it.file }
                .filter { it.path.endsWith(".agent-tasks.json") && it.path.contains("/.wirespec/reviews/") }
                .forEach { handleTaskFileChange(it.path) }
        })

        connection.subscribe(AppTopics.FILE_DOCUMENT_SYNC, object : FileDocumentManagerListener {
            override fun beforeDocumentSaving(document: com.intellij.openapi.editor.Document) {
                val virtualFile = FileDocumentManager.getInstance().getFile(document) ?: return
                resolveOnSave(virtualFile.path)
            }
        })

        EditorFactory.getInstance().eventMulticaster.addDocumentListener(DocumentListener { event ->
            tracker.note(event)
        }, project)
    }

    fun refreshSummary(): SummaryPayload {
        val response = bridge.run("summary") ?: return summary
        summary = response.summary
        updateStatusBar()
        return summary
    }

    fun currentSummary(): SummaryPayload = summary

    fun handleTaskFileChange(taskFilePath: String) {
        val response = bridge.run("task-change", listOf("--task-file", taskFilePath)) ?: return
        summary = response.summary
        updateStatusBar()
        openFile(taskFilePath)
    }

    fun openLatestTaskFile() {
        val response = bridge.run("open-latest")
        val taskFile = response?.latestTaskFile
        if (taskFile == null) {
            Messages.showInfoMessage(project, "No WireSpec task file found.", "WireSpec")
            return
        }
        openFile(taskFile)
    }

    fun openNextOpenTask() {
        val response = bridge.run("open-next")
        val target = response?.nextTask?.openInEditor
        if (target?.file == null) {
            Messages.showInfoMessage(project, "No open WireSpec task remains.", "WireSpec")
            return
        }
        openFile(target.file, target.line ?: 1, target.column ?: 1)
    }

    fun resolveTouchedThreadsForCurrentFile() {
        val editor = FileEditorManager.getInstance(project).selectedTextEditor ?: return
        val virtualFile = FileDocumentManager.getInstance().getFile(editor.document) ?: return
        resolveOnSave(virtualFile.path)
    }

    private fun resolveOnSave(savedPath: String) {
        val changedRanges = tracker.take(savedPath)
        if (changedRanges.isEmpty()) {
            return
        }
        val rangeSpec = changedRanges.joinToString(",") { range ->
            if (range.start == range.end) range.start.toString() else "${range.start}-${range.end}"
        }
        val response = bridge.run(
            "resolve-on-save",
            listOf("--saved-file", savedPath, "--ranges", rangeSpec, "--author", "WireSpec JetBrains Companion")
        ) ?: return

        summary = response.summary
        updateStatusBar()
    }

    private fun openFile(path: String, line: Int = 1, column: Int = 1) {
        val absolutePath = if (File(path).isAbsolute) path else File(project.basePath, path).absolutePath
        val virtualFile = VirtualFileManager.getInstance().findFileByNioPath(File(absolutePath).toPath()) ?: return
        OpenFileDescriptor(project, virtualFile, (line - 1).coerceAtLeast(0), (column - 1).coerceAtLeast(0)).navigate(true)
    }

    private fun updateStatusBar() {
        ApplicationManager.getApplication().invokeLater {
            val statusBar = WindowManager.getInstance().getStatusBar(project) ?: return@invokeLater
            val widget = statusBar.getWidget(WireSpecStatusBarWidgetFactory.WIDGET_ID)
            if (widget is WireSpecStatusBarWidget) {
                widget.update()
            }
            statusBar.updateWidget(WireSpecStatusBarWidgetFactory.WIDGET_ID)
        }
    }

    companion object {
        fun getInstance(project: Project): WireSpecProjectService = project.service()
    }
}
