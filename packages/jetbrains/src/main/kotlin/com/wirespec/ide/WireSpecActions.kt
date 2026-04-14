package com.wirespec.ide

import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.project.DumbAwareAction

abstract class WireSpecActionBase : DumbAwareAction() {
    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT
    protected fun projectService(event: AnActionEvent): WireSpecProjectService? = event.project?.let { WireSpecProjectService.getInstance(it) }
    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = event.project != null
    }
}

class OpenLatestTaskAction : WireSpecActionBase() {
    override fun actionPerformed(event: AnActionEvent) {
        projectService(event)?.openLatestTaskFile()
    }
}

class OpenNextTaskAction : WireSpecActionBase() {
    override fun actionPerformed(event: AnActionEvent) {
        projectService(event)?.openNextOpenTask()
    }
}

class ResolveTouchedThreadsAction : WireSpecActionBase() {
    override fun actionPerformed(event: AnActionEvent) {
        projectService(event)?.resolveTouchedThreadsForCurrentFile()
    }
}

class ShowSummaryAction : WireSpecActionBase() {
    override fun actionPerformed(event: AnActionEvent) {
        projectService(event)?.refreshSummary()
    }
}
