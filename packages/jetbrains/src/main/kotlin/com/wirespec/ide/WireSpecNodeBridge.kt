package com.wirespec.ide

import com.intellij.openapi.project.Project
import kotlinx.serialization.json.Json
import java.io.File

class WireSpecNodeBridge(private val project: Project) {
    private val json = Json { ignoreUnknownKeys = true }

    private data class Invocation(
        val commandLine: List<String>,
        val reason: String? = null,
    )

    private fun workspaceRoot(): String? = project.basePath

    private fun settings(): WireSpecSettings.State = WireSpecSettings.getInstance(project).snapshot()

    private fun nodeExecutable(): String = settings().nodeExecutable.trim().ifBlank { "node" }

    private fun commandPattern(): Regex = Regex("""[^\s"']+|"[^"]*"|'[^']*'""")

    private fun parseCommand(value: String): List<String> = commandPattern()
        .findAll(value.trim())
        .map { token -> token.value.removeSurrounding("\"").removeSurrounding("'") }
        .filter { it.isNotBlank() }
        .toList()

    private fun resolvePath(root: String, candidate: String): File {
        val file = File(candidate)
        return if (file.isAbsolute) file else File(root, candidate)
    }

    private fun repoCoreScript(root: String): String? {
        val candidate = File(root, "packages/core/bin/wirespec-ide-core.js")
        return if (candidate.isFile) candidate.absolutePath else null
    }

    private fun installedCoreScript(root: String): String? {
        val candidate = File(root, "node_modules/wirespec/packages/core/bin/wirespec-ide-core.js")
        return if (candidate.isFile) candidate.absolutePath else null
    }

    private fun configuredCoreScript(root: String): String? {
        val configuredPath = settings().corePath.trim()
        if (configuredPath.isBlank()) {
            return null
        }
        val candidate = resolvePath(root, configuredPath)
        return if (candidate.isFile) candidate.absolutePath else null
    }

    private fun defaultCoreCommand(): String = "pnpm exec wirespec-ide-core"

    private fun configuredCoreCommand(): List<String> {
        val configured = settings().coreCommand.trim().ifBlank { defaultCoreCommand() }
        return parseCommand(configured)
    }

    private fun resolvedScriptPath(root: String): String? = listOfNotNull(
        repoCoreScript(root),
        installedCoreScript(root),
        configuredCoreScript(root),
    ).firstOrNull()

    private fun executableExists(command: String): Boolean {
        if (command.isBlank()) {
            return false
        }

        val candidate = File(command)
        if (candidate.isAbsolute || command.contains(File.separatorChar) || command.contains("/")) {
            return candidate.exists()
        }

        val searchPath = System.getenv("PATH") ?: return false
        val pathEntries = searchPath.split(File.pathSeparatorChar).filter { it.isNotBlank() }
        val windowsExtensions = if (System.getProperty("os.name").startsWith("Windows", ignoreCase = true)) {
            (System.getenv("PATHEXT") ?: ".COM;.EXE;.BAT;.CMD")
                .split(";")
                .filter { it.isNotBlank() }
        } else {
            emptyList()
        }
        val candidateNames = buildList {
            add(command)
            for (extension in windowsExtensions) {
                if (!command.endsWith(extension, ignoreCase = true)) {
                    add("$command$extension")
                }
            }
        }

        return pathEntries.any { entry ->
            candidateNames.any { name ->
                val file = File(entry, name)
                file.exists()
            }
        }
    }

    private fun resolveInvocation(command: String, args: List<String>): Invocation {
        val root = workspaceRoot()
            ?: return Invocation(emptyList(), "Open a project before using WireSpec.")

        val node = nodeExecutable()
        if (!executableExists(node)) {
            return Invocation(
                emptyList(),
                "WireSpec could not find the Node executable \"$node\". Update Settings | Tools | WireSpec.",
            )
        }

        val script = resolvedScriptPath(root)
        if (script != null) {
            return Invocation(listOf(node, script, command, "--workspace", root) + args)
        }

        val fallbackCommand = configuredCoreCommand()
        val fallbackLabel = fallbackCommand.joinToString(" ")
        val configuredPath = settings().corePath.trim()
        val reasonPrefix = if (configuredPath.isNotBlank()) {
            "Configured WireSpec core path \"$configuredPath\" was not found."
        } else {
            "Could not find wirespec-ide-core.js in the project checkout or node_modules."
        }

        if (fallbackCommand.isEmpty() || !executableExists(fallbackCommand.first())) {
            return Invocation(
                emptyList(),
                "$reasonPrefix Fallback command \"$fallbackLabel\" is not available. Update Settings | Tools | WireSpec.",
            )
        }

        return Invocation(fallbackCommand + listOf(command, "--workspace", root) + args)
    }

    fun unavailableReason(): String? = resolveInvocation("summary", emptyList()).reason

    fun isAvailable(): Boolean = unavailableReason() == null

    fun run(command: String, args: List<String> = emptyList()): CoreResponse? {
        val invocation = resolveInvocation(command, args)
        if (invocation.reason != null) {
            throw IllegalStateException(invocation.reason)
        }

        val root = workspaceRoot() ?: return null
        val process = ProcessBuilder(invocation.commandLine)
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
