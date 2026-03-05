package io.github.cognivoxResearch.cognivox.game

import org.godotengine.godot.plugin.SignalInfo

object GameSignals {
    // (session_id, scene, audience_size, difficulty, distractions)
    val INIT_SCENE = SignalInfo(
        "init_scene",
        String::class.java,
        String::class.java,
        String::class.java,
        String::class.java,
        String::class.java,
    )
    val SCENE_START = SignalInfo("start_scene")
    val STRESS_SUGGESTION = SignalInfo("stress_suggestion", String::class.java)
    val SPEECH_STUCK = SignalInfo("speech_stuck")
    val SPEECH_UNSTUCK = SignalInfo("speech_unstuck")
    val STUCK_SUGGESTION = SignalInfo("speech_stuck_suggestion", String::class.java)

    val ALL_SIGNALS = setOf(
        STRESS_SUGGESTION,
        SPEECH_UNSTUCK,
        SPEECH_STUCK,
        STUCK_SUGGESTION,
        SCENE_START,
        INIT_SCENE
    )
}
