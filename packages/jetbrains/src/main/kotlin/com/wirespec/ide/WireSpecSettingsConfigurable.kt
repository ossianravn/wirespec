package com.wirespec.ide

import com.intellij.openapi.fileChooser.FileChooserDescriptorFactory
import com.intellij.openapi.options.Configurable
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.TextFieldWithBrowseButton
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JComponent
import javax.swing.JPanel

class WireSpecSettingsConfigurable(private val project: Project) : Configurable, Configurable.NoScroll {
    private var component: WireSpecSettingsComponent? = null

    override fun getDisplayName(): String = "WireSpec"

    override fun createComponent(): JComponent {
        val created = WireSpecSettingsComponent(project)
        component = created
        return created.panel
    }

    override fun getPreferredFocusedComponent(): JComponent? = component?.preferredFocusedComponent

    override fun isModified(): Boolean {
        val ui = component ?: return false
        val state = WireSpecSettings.getInstance(project).snapshot()
        return ui.nodeExecutable != state.nodeExecutable ||
            ui.corePath != state.corePath ||
            ui.coreCommand != state.coreCommand
    }

    override fun apply() {
        val ui = component ?: return
        WireSpecSettings.getInstance(project).loadState(
            WireSpecSettings.State(
                nodeExecutable = ui.nodeExecutable,
                corePath = ui.corePath,
                coreCommand = ui.coreCommand,
            )
        )
        WireSpecProjectService.getInstance(project).refreshSummary(showErrors = false)
    }

    override fun reset() {
        component?.reset(WireSpecSettings.getInstance(project).snapshot())
    }

    override fun disposeUIResources() {
        component = null
    }
}

private class WireSpecSettingsComponent(project: Project) {
    private val nodeExecutableField = JBTextField()
    private val corePathField = TextFieldWithBrowseButton()
    private val coreCommandField = JBTextField()
    val panel: JPanel

    init {
        corePathField.addBrowseFolderListener(
            "WireSpec Core Script",
            "Choose wirespec-ide-core.js to override the repo and node_modules lookup.",
            project,
            FileChooserDescriptorFactory.createSingleFileNoJarsDescriptor(),
        )

        val helpLabel = JBLabel(
            "<html>Resolution order: project checkout, node_modules install, explicit core path, then fallback command.</html>",
        )

        panel = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Node executable"), nodeExecutableField, 1, false)
            .addLabeledComponent(JBLabel("Core script path"), corePathField, 1, false)
            .addLabeledComponent(JBLabel("Fallback core command"), coreCommandField, 1, false)
            .addComponent(helpLabel, 1)
            .addComponentFillVertically(JPanel(), 0)
            .panel
    }

    val preferredFocusedComponent: JComponent
        get() = nodeExecutableField

    val nodeExecutable: String
        get() = nodeExecutableField.text.trim().ifBlank { "node" }

    val corePath: String
        get() = corePathField.text.trim()

    val coreCommand: String
        get() = coreCommandField.text.trim().ifBlank { "pnpm exec wirespec-ide-core" }

    fun reset(state: WireSpecSettings.State) {
        nodeExecutableField.text = state.nodeExecutable
        corePathField.text = state.corePath
        coreCommandField.text = state.coreCommand
    }
}
