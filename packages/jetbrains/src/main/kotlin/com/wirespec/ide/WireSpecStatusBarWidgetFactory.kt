package com.wirespec.ide

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.CustomStatusBarWidget
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidgetFactory
import com.intellij.util.Consumer
import javax.swing.JLabel
import javax.swing.JPanel

class WireSpecStatusBarWidgetFactory : StatusBarWidgetFactory {
    override fun getId(): String = WIDGET_ID

    override fun getDisplayName(): String = "WireSpec"

    override fun isAvailable(project: Project): Boolean = true

    override fun createWidget(project: Project): CustomStatusBarWidget = WireSpecStatusBarWidget(project)

    override fun disposeWidget(widget: com.intellij.openapi.wm.StatusBarWidget) = Unit

    override fun canBeEnabledOn(statusBar: StatusBar): Boolean = true

    companion object {
        const val WIDGET_ID = "WireSpecStatusBar"
    }
}

class WireSpecStatusBarWidget(private val project: Project) : CustomStatusBarWidget {
    private val label = JLabel()

    override fun ID(): String = WireSpecStatusBarWidgetFactory.WIDGET_ID

    override fun install(statusBar: StatusBar) {
        update()
    }

    override fun getComponent(): JPanel = JPanel().apply { add(label) }

    override fun dispose() = Unit

    fun update() {
        val service = WireSpecProjectService.getInstance(project)
        val unavailableReason = service.bridgeUnavailableReason()
        if (unavailableReason != null) {
            label.text = "WireSpec setup"
            label.toolTipText = unavailableReason
            return
        }

        val summary = service.currentSummary()
        val docLabel = summary.latestDocumentId?.let { " · $it" } ?: ""
        label.text = "WireSpec ${summary.openTasks} open$docLabel"
        label.toolTipText = "${summary.openTasks} open review tasks across ${summary.taskFiles} file(s)"
    }
}
