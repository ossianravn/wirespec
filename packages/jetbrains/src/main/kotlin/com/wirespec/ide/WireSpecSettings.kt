package com.wirespec.ide

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.StoragePathMacros
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project

@Service(Service.Level.PROJECT)
@State(name = "WireSpecSettings", storages = [Storage(StoragePathMacros.WORKSPACE_FILE)])
class WireSpecSettings : PersistentStateComponent<WireSpecSettings.State> {
    data class State(
        var nodeExecutable: String = "node",
        var corePath: String = "",
        var coreCommand: String = "pnpm exec wirespec-ide-core",
    )

    private var state = State()

    override fun getState(): State = state

    override fun loadState(state: State) {
        this.state = state
    }

    fun snapshot(): State = state.copy()

    companion object {
        fun getInstance(project: Project): WireSpecSettings = project.service()
    }
}
