package com.wirespec.ide

import com.intellij.openapi.project.Project
import kotlinx.serialization.json.Json
import java.io.File

class WireSpecNodeBridge(private val project: Project) {
    private val json = Json { ignoreUnknownKeys = true }

    private fun workspaceRoot(): String? = project.basePath

    private fun nodeExecutable(): String = "node"

    private fun scriptPath(): String? {
        val root = workspaceRoot() ?: return null
        val candidate = File(root, "packages/core/bin/wirespec-ide-core.js")
        return if (candidate.exists()) candidate.absolutePath else null
    }

    fun isAvailable(): Boolean = workspaceRoot() != null && scriptPath() != null

    fun run(command: String, args: List<String> = emptyList()): CoreResponse? {
        val root = workspaceRoot() ?: return null
        val script = scriptPath() ?: return null
        val process = ProcessBuilder(listOf(nodeExecutable(), script, command, "--workspace", root) + args)
            .directory(File(root))
            .redirectErrorStream(true)
            .start()

        val output = process.inputStream.bufferedReader().use { it.readText() }
        val exitCode = process.waitFor()
        if (exitCode != 0) {
            throw IllegalStateException(output)
        }
        return json.decodeFromString(CoreResponse.serializer(), output)
    }
}
