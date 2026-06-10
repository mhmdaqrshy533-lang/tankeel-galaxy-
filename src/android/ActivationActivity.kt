package com.tankeel.game

import android.content.Context
import android.content.SharedPreferences
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

// هندسة المحركات للمهندس سهيل الهزبري
// برمجة المهندس/ سهيل الهزبري

class ActivationActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var mediaPlayer: MediaPlayer
    private lateinit var audioManager: AudioManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Setup Glassmorphic UI layout (Assuming R.layout.activity_activation represents it)
        setContentView(R.layout.activity_activation)

        prefs = getSharedPreferences("TankeelPrefs", Context.MODE_PRIVATE)
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager

        val inputCode = findViewById<EditText>(R.id.activationCodeInput)
        val btnActivate = findViewById<Button>(R.id.btnActivate)
        val tvWarning = findViewById<TextView>(R.id.tvWarning)

        btnActivate.setOnClickListener {
            val code = inputCode.text.toString()
            if (code == "715846133") {
                prefs.edit().putBoolean("MasterMode", false).apply()
                launchStandardMode()
            } else if (code == "715562996") {
                prefs.edit().putBoolean("MasterMode", true).apply()
                launchMasterMode()
            } else {
                tvWarning.visibility = View.VISIBLE
                tvWarning.text = "تم رفض الوصول"
                // تجميد مؤقت للرسالة
                inputCode.isEnabled = false
                btnActivate.isEnabled = false
                inputCode.postDelayed({
                    inputCode.isEnabled = true
                    btnActivate.isEnabled = true
                    tvWarning.visibility = View.GONE
                }, 3000)
            }
        }

        checkWiredHeadphones()
    }

    private fun checkWiredHeadphones() {
        val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
        val hasWiredHeadset = devices.any { 
            it.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || 
            it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
            it.type == AudioDeviceInfo.TYPE_USB_HEADSET 
        }

        if (!hasWiredHeadset) {
            Toast.makeText(this, "⚠️ تنبيه عسكري: يرجى توصيل سماعة الأذن السلكية الجديدة لعيش جو الحرب الحماسي!", Toast.LENGTH_LONG).show()
        } else {
            playZamilAudio()
        }
    }

    private fun playZamilAudio() {
        try {
            val descriptor = assets.openFd("zamil.mp3")
            mediaPlayer = MediaPlayer()
            mediaPlayer.setDataSource(descriptor.fileDescriptor, descriptor.startOffset, descriptor.length)
            descriptor.close()
            
            mediaPlayer.prepare()
            mediaPlayer.isLooping = true
            mediaPlayer.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun launchStandardMode() {
        Toast.makeText(this, "Standard Mode Authorized", Toast.LENGTH_SHORT).show()
        // Intent to Game Activity
    }

    private fun launchMasterMode() {
        Toast.makeText(this, "Master Mode Authorized. Superpower Unlocked.", Toast.LENGTH_SHORT).show()
        // Intent to Game Activity with Master flags
    }

    override fun onDestroy() {
        super.onDestroy()
        if (this::mediaPlayer.isInitialized) {
            mediaPlayer.release()
        }
    }
}

// هندسة المحركات للمهندس سهيل الهزبري
// برمجة المهندس/ سهيل الهزبري
