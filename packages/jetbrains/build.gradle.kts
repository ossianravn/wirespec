plugins {
  kotlin("jvm") version "1.9.24"
  kotlin("plugin.serialization") version "1.9.24"
  id("org.jetbrains.intellij.platform") version "2.5.0"
}

group = "dev.wirespec"
version = "0.5.0"

repositories {
  mavenCentral()
  intellijPlatform {
    defaultRepositories()
  }
}

dependencies {
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
  intellijPlatform {
    intellijIdeaCommunity("2025.3")
  }
}

kotlin {
  jvmToolchain(21)
}

intellijPlatform {
  pluginConfiguration {
    ideaVersion {
      sinceBuild = "253"
    }
  }
}
