package com.wirespec.ide

import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity

class WireSpecStartupActivity : ProjectActivity {
    override suspend fun execute(project: Project) {
        WireSpecProjectService.getInstance(project).start()
    }
}
