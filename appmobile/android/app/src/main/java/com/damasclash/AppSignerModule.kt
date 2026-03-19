package com.damasclash

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

/**
 * NIP-55 Android App Signer native module.
 *
 * Uses startActivityForResult to communicate with any installed NIP-55 signer app
 * (e.g. Amber, nos2x-phone). Both intents carry FLAG_ACTIVITY_SINGLE_TOP |
 * FLAG_ACTIVITY_CLEAR_TOP so the signer's existing activity instance handles the
 * request — without these flags Android may create a fresh instance that has no
 * pending request and shows "Nothing to approve yet".
 *
 * URI format: Uri.parse("nostrsigner:<raw_json>") — the JSON is NOT percent-encoded
 * because signer apps typically do intent.dataString.removePrefix("nostrsigner:") and
 * feed the result straight into a JSON parser. Percent-encoding would break that.
 */
class AppSignerModule(private val reactCtx: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactCtx), ActivityEventListener {

    companion object {
        const val NAME = "AppSigner"
        private const val RC_GET_PUBKEY = 9001
        private const val RC_SIGN_EVENT = 9002
    }

    private var pendingPromise: Promise? = null
    private var pendingCode: Int = 0

    init {
        reactCtx.addActivityEventListener(this)
    }

    override fun getName(): String = NAME

    // -----------------------------------------------------------------------
    // get_public_key  (NIP-55)
    // -----------------------------------------------------------------------

    @ReactMethod
    fun getPublicKey(promise: Promise) {
      val activity = reactCtx.currentActivity
      if (activity == null) {
          promise.reject("NO_ACTIVITY", "No current activity")
          return
      }
      if (pendingPromise != null) {
          promise.reject("BUSY", "Another signer request is already in progress")
          return
      }
      pendingPromise = promise
      pendingCode = RC_GET_PUBKEY

      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("nostrsigner:"))
      intent.putExtra("type", "get_public_key")

      intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      activity.startActivityForResult(intent, RC_GET_PUBKEY)
    }

    // -----------------------------------------------------------------------
    // sign_event  (NIP-55)
    // -----------------------------------------------------------------------

    @ReactMethod
    fun signEvent(
        eventJson: String,
        currentUserPubkey: String,
        signerPackage: String,
        promise: Promise,
    ) {
        val activity = reactCtx.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        if (pendingPromise != null) {
            promise.reject("BUSY", "Another signer request is already in progress")
            return
        }
        pendingPromise = promise
        pendingCode = RC_SIGN_EVENT

        // Pass the raw JSON as the URI scheme-specific part — NOT percent-encoded.
        // Signer apps read intent.dataString.removePrefix("nostrsigner:") and parse
        // the result as JSON directly; encoding would make that fail silently.
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("nostrsigner:$eventJson"))
        if (signerPackage.isNotEmpty()) intent.`package` = signerPackage
        intent.putExtra("type", "sign_event")
        if (currentUserPubkey.isNotEmpty()) intent.putExtra("current_user", currentUserPubkey)
        // Bring the existing signer activity to front instead of creating a new instance.
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)

        activity.startActivityForResult(intent, RC_SIGN_EVENT)
    }

    // -----------------------------------------------------------------------
    // ActivityEventListener
    // -----------------------------------------------------------------------
    override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        if (requestCode != RC_GET_PUBKEY && requestCode != RC_SIGN_EVENT) return

        val promise = pendingPromise ?: return
        pendingPromise = null
        pendingCode = 0

        if (resultCode != Activity.RESULT_OK || data == null) {
            promise.reject("USER_REJECTED", "User rejected the signer request")
            return
        }

        when (requestCode) {
            RC_GET_PUBKEY -> {
                val pubkey = data.getStringExtra("result")
                val pkg = data.getStringExtra("package") ?: ""
                if (pubkey.isNullOrEmpty()) {
                    promise.reject("NO_RESULT", "Signer returned no pubkey")
                    return
                }
                val map = WritableNativeMap()
                map.putString("npub", pubkey)
                map.putString("package", pkg)
                promise.resolve(map)
            }

            RC_SIGN_EVENT -> {
                val signedEventJson = data.getStringExtra("event")
                if (signedEventJson.isNullOrEmpty()) {
                    promise.reject("NO_RESULT", "Signer returned no signed event")
                    return
                }
                promise.resolve(signedEventJson)
            }
        }
    }

    // Non-nullable as required by ActivityEventListener interface
    override fun onNewIntent(intent: Intent) {}
}
