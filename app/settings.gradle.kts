pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url =  java.net.URI("https://plugins.gradle.org/m2/") }
        maven { url = java.net.URI("https://central.sonatype.com/repository/maven-snapshots/") }
    }
}

rootProject.name = "Cognivox"
include(":mobile")
include(":wear")
