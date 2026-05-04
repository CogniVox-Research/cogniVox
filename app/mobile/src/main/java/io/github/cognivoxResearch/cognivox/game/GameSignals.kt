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
        String::class.java,
    )
    val DISABLE_DISTRACTIONS = SignalInfo("distractions_off")
    val STRESS_SUGGESTION = SignalInfo("stress_suggestion", String::class.java, String::class.java)
    val SPEECH_UNSTUCK = SignalInfo("speech_unstuck")
    val STUCK_SUGGESTION = SignalInfo("speech_stuck_suggestion", String::class.java)
    val AUDIENCE_INTEREST = SignalInfo("audience_interest")

    val ALL_SIGNALS = setOf(
        STRESS_SUGGESTION,
        SPEECH_UNSTUCK,
        STUCK_SUGGESTION,
        INIT_SCENE,
        DISABLE_DISTRACTIONS,
        AUDIENCE_INTEREST
    )
}
