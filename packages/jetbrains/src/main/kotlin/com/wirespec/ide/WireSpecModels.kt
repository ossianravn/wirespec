package com.wirespec.ide

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SummaryPayload(
    val taskFiles: Int = 0,
    val documents: List<String> = emptyList(),
    val openTasks: Int = 0,
    val latestDocumentId: String? = null,
    val latestTaskFile: String? = null,
)

@Serializable
data class OpenTarget(
    val file: String? = null,
    val line: Int? = null,
    val column: Int? = null,
)

@Serializable
data class CoreTask(
    val taskId: String? = null,
    val threadId: String? = null,
    val status: String? = null,
    val severity: String? = null,
    val summary: String? = null,
    val openInEditor: OpenTarget? = null,
)

@Serializable
data class CoreResponse(
    val summary: SummaryPayload = SummaryPayload(),
    val latestTaskFile: String? = null,
    val latestDocumentId: String? = null,
    val nextTask: CoreTask? = null,
    val resolvedThreadIds: List<String> = emptyList(),
)
