package io.github.cognivoxResearch.cognivox

import org.godotengine.godot.Godot
import org.godotengine.godot.plugin.GodotPlugin
import org.godotengine.godot.plugin.SignalInfo


class AppPlugin(godot: Godot) : GodotPlugin(godot) {

    companion object {
        val SHOW_GLTF_SIGNAL = SignalInfo("show_gltf", String::class.java)
    }

    override fun getPluginName() = "AppPlugin"

    override fun getPluginSignals() = setOf(SHOW_GLTF_SIGNAL)

    internal fun showGLTF(glbFilepath: String) {
        emitSignal(SHOW_GLTF_SIGNAL.name, glbFilepath)
    }
}
