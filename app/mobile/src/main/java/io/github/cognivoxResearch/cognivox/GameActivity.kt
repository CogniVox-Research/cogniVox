package io.github.cognivoxResearch.cognivox

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import org.godotengine.godot.Godot
import org.godotengine.godot.GodotFragment
import org.godotengine.godot.GodotHost
import org.godotengine.godot.plugin.GodotPlugin


class GameActivity: AppCompatActivity(), GodotHost {

    private var godotFragment: GodotFragment? = null

    internal var appPlugin: AppPlugin? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)


        setContentView(R.layout.game_layout)

        val currentGodotFragment = supportFragmentManager.findFragmentById(R.id.godot_fragment_container)
        if (currentGodotFragment is GodotFragment) {
            godotFragment = currentGodotFragment
        } else {
            godotFragment = GodotFragment()
            supportFragmentManager.beginTransaction()
                .replace(R.id.godot_fragment_container, godotFragment!!)
                .commitNowAllowingStateLoss()
        }

        initAppPluginIfNeeded(godot!!)
    }

    override fun onResume() {
        super.onResume()
        supportActionBar?.hide()
        window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE // Immersive mode
                        or View.SYSTEM_UI_FLAG_FULLSCREEN // Hide notification bar
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // Hide navigation bar
                )
    }

    private fun initAppPluginIfNeeded(godot: Godot) {
        if (appPlugin == null) {
            appPlugin = AppPlugin(godot)
        }
    }

    override fun getActivity() = this

    override fun getGodot() = godotFragment?.godot

    override fun getHostPlugins(godot: Godot): Set<GodotPlugin> {
        initAppPluginIfNeeded(godot)

        return setOf(appPlugin!!)
    }
}
