package com.oxarderp

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileInputStream
import java.io.OutputStream

class MediaStoreModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "MediaStoreModule" // 👈 must match JS name

  @ReactMethod
  fun saveFileToDownloads(localPath: String, fileName: String, mimeType: String, promise: Promise) {
    try {
      val context: Context = reactApplicationContext
      val collection: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
      } else {
        MediaStore.Files.getContentUri("external")
      }

      val values = ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
        put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
        put(MediaStore.MediaColumns.RELATIVE_PATH, "Download/")
      }

      val fileUri = context.contentResolver.insert(collection, values)
      val input = FileInputStream(File(localPath))
      val output: OutputStream? = context.contentResolver.openOutputStream(fileUri!!)

      val buffer = ByteArray(4096)
      var bytesRead: Int
      while (input.read(buffer).also { bytesRead = it } != -1) {
        output?.write(buffer, 0, bytesRead)
      }

      output?.flush()
      input.close()
      output?.close()

      promise.resolve(fileUri.toString())
    } catch (e: Exception) {
      promise.reject("SAVE_FAILED", e)
    }
  }
}
