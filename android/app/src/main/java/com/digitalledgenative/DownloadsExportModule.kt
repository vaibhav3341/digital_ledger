package com.digitalledgenative

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class DownloadsExportModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DownloadsExportModule"

  @ReactMethod
  fun savePdfToDownloads(sourceFilePath: String, fileName: String, promise: Promise) {
    val sourceFile = File(sourceFilePath)
    if (!sourceFile.exists()) {
      promise.reject("ENOENT", "Source PDF does not exist: $sourceFilePath")
      return
    }

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val resolver = reactContext.contentResolver
        val contentValues = ContentValues().apply {
          put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
          put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
          put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
          put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
        if (uri == null) {
          promise.reject("EINSERT", "Failed to create file in Downloads.")
          return
        }

        try {
          FileInputStream(sourceFile).use { input ->
            resolver.openOutputStream(uri)?.use { output ->
              input.copyTo(output)
            } ?: throw IOException("Failed to open output stream for Downloads URI.")
          }
          contentValues.clear()
          contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
          resolver.update(uri, contentValues, null, null)
          promise.resolve(uri.toString())
        } catch (copyError: Exception) {
          resolver.delete(uri, null, null)
          promise.reject("ECOPY", "Failed to copy PDF to Downloads.", copyError)
        }
        return
      }

      val downloadsDir =
        Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
      if (!downloadsDir.exists() && !downloadsDir.mkdirs()) {
        promise.reject("EACCESS", "Could not access Downloads directory.")
        return
      }

      val destination = File(downloadsDir, fileName)
      FileInputStream(sourceFile).use { input ->
        FileOutputStream(destination).use { output ->
          input.copyTo(output)
        }
      }
      promise.resolve(destination.absolutePath)
    } catch (error: Exception) {
      promise.reject("EDOWNLOAD", "Failed to save PDF to Downloads.", error)
    }
  }
}
