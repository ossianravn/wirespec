import org.gradle.api.tasks.wrapper.Wrapper

plugins {
  kotlin("jvm") version "2.2.20"
  kotlin("plugin.serialization") version "2.2.20"
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

tasks.wrapper {
  gradleVersion = "8.13"
  distributionType = Wrapper.DistributionType.BIN
}
