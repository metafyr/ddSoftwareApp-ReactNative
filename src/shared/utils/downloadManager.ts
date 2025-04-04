import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";

// Configure notifications for downloads
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface DownloadOptions {
  url: string;
  name: string;
  mimeType: string;
}

interface DownloadCallbacks {
  onProgress?: (progress: number) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Callbacks for in-app toast notifications
interface ToastCallbacks {
  onProgressUpdate?: (progress: number, filename: string) => void;
  onSuccess?: (
    message: string,
    uri: string,
    mimeType: string,
    filename: string
  ) => void;
  onError?: (message: string) => void;
}

interface NotificationData {
  uri: string;
  mimeType: string;
  filename: string;
  isProgressNotification?: boolean;
}

export class DownloadManager {
  private downloadDirectory: string;
  // Flag to track if an intent activity is in progress
  private isIntentActivityInProgress = false;
  // Toast callbacks for in-app notifications
  private toastCallbacks: ToastCallbacks = {};

  constructor(toastCallbacks?: ToastCallbacks) {
    // Set download directory based on platform
    if (Platform.OS === "android") {
      // Use document directory for Android which is more accessible
      this.downloadDirectory = `${FileSystem.documentDirectory}downloads/`;
    } else {
      this.downloadDirectory = `${FileSystem.documentDirectory}downloads/`;
    }

    // Store toast callbacks if provided
    if (toastCallbacks) {
      this.toastCallbacks = toastCallbacks;
    }

    // Setup notification listener
    this.setupNotificationListener();
  }

  private async ensureDownloadDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.downloadDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadDirectory, {
          intermediates: true,
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to create download directory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission to access media library was denied");
      }
      return true;
    } catch (error) {
      throw new Error(
        `Failed to request permissions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async openFile(
    uri: string,
    mimeType: string,
    filename: string
  ): Promise<void> {
    try {
      if (Platform.OS === "android") {
        try {
          this.isIntentActivityInProgress = true;

          // Determine correct MIME type based on file extension
          const ext = filename.toLowerCase().split(".").pop() || "";
          let resolvedMimeType = mimeType;

          // If we have a generic MIME type or no MIME type, try to determine from extension
          if (!mimeType || mimeType === "application/octet-stream") {
            const mimeMap: Record<string, string> = {
              jpg: "image/jpeg",
              jpeg: "image/jpeg",
              png: "image/png",
              gif: "image/gif",
              pdf: "application/pdf",
              doc: "application/msword",
              docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              xls: "application/vnd.ms-excel",
              xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              txt: "text/plain",
              mp4: "video/mp4",
              mp3: "audio/mpeg",
            };

            resolvedMimeType = mimeMap[ext] || "application/octet-stream";
          }

          // Use a content URI for file access
          let contentUri: string;

          // Handle content:// URIs directly
          if (uri.startsWith("content://")) {
            contentUri = uri;
          }
          // Convert file:// URIs to content:// URIs
          else if (uri.startsWith("file://")) {
            try {
              contentUri = await FileSystem.getContentUriAsync(uri);
            } catch (error) {
              const asset = await MediaLibrary.createAssetAsync(uri);
              contentUri = asset.uri;
            }
          } else {
            contentUri = uri;
          }

          // Use direct VIEW intent with specific MIME type
          const flags = 0x00000001 | 0x00000001; // FLAG_ACTIVITY_NEW_TASK | FLAG_GRANT_READ_URI_PERMISSION

          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: flags,
              type: resolvedMimeType,
            }
          );

          this.isIntentActivityInProgress = false;
          return;
        } catch (error) {
          this.isIntentActivityInProgress = false;

          // If direct opening fails, fall back to sharing
          try {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri);
            } else {
              await Share.share({
                url: uri,
              });
            }
          } catch (shareError) {
            throw new Error(
              `Failed to share file: ${
                shareError instanceof Error
                  ? shareError.message
                  : "Unknown error"
              }`
            );
          }
        }
      } else {
        // iOS implementation
        try {
          if (await Linking.canOpenURL(uri)) {
            await Linking.openURL(uri);
          } else {
            await Sharing.shareAsync(uri);
          }
        } catch (error) {
          throw new Error(
            `Failed to open file on iOS: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to open file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      this.isIntentActivityInProgress = false;
    }
  }

  // Helper method to determine MIME type from filename
  private getMimeTypeFromFilename(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      txt: "text/plain",
      csv: "text/csv",
      html: "text/html",
      htm: "text/html",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      json: "application/json",
      xml: "application/xml",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  // Method to register toast callbacks after constructor
  public setToastCallbacks(callbacks: ToastCallbacks): void {
    this.toastCallbacks = { ...this.toastCallbacks, ...callbacks };
  }

  private async showNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            mimeType: data?.mimeType || "application/octet-stream",
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error("[DownloadManager] Error showing notification:", error);
    }
  }

  public async downloadFile(
    options: DownloadOptions,
    callbacks: DownloadCallbacks = {}
  ): Promise<void> {
    const { url, name, mimeType } = options;
    const { onProgress, onSuccess, onError } = callbacks;

    try {
      // Show initial progress via toast callback
      if (this.toastCallbacks.onProgressUpdate) {
        this.toastCallbacks.onProgressUpdate(0, name);
      }

      // Ensure directory exists and request permissions
      await this.ensureDownloadDirectory();
      await this.requestPermissions();

      const downloadPath = `${this.downloadDirectory}${name}`;

      // Check if file already exists and remove it
      const fileInfo = await FileSystem.getInfoAsync(downloadPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(downloadPath, { idempotent: true });
      }

      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        downloadPath,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;

          // Update progress via toast callback
          if (this.toastCallbacks.onProgressUpdate) {
            this.toastCallbacks.onProgressUpdate(progress, name);
          }

          onProgress?.(progress);
        }
      );

      // Start download
      const result = await downloadResumable.downloadAsync();
      if (!result) {
        throw new Error("Download failed");
      }

      // Determine the proper MIME type
      const actualMimeType = mimeType || this.getMimeTypeFromFilename(name);

      // For Android, find the best URI to use
      let finalUri = result.uri;
      if (Platform.OS === "android") {
        try {
          finalUri = await FileSystem.getContentUriAsync(result.uri);
        } catch (contentError) {
          try {
            // For images, videos, and audio files, save to media library
            if (
              actualMimeType.startsWith("image/") ||
              actualMimeType.startsWith("video/") ||
              actualMimeType.startsWith("audio/")
            ) {
              const asset = await MediaLibrary.createAssetAsync(result.uri);
              const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
              finalUri = assetInfo.uri;
            }
          } catch (mediaError) {
            // If all else fails, use the original file URI
            finalUri = result.uri;
          }
        }
      }

      // Show success notification via toast callback
      if (this.toastCallbacks.onSuccess) {
        this.toastCallbacks.onSuccess(
          `${name} downloaded successfully`,
          finalUri,
          actualMimeType,
          name
        );
      }

      // Create system notification for when app is in background
      await this.showNotification("Download Complete", `Tap to open ${name}`, {
        uri: finalUri,
        mimeType: actualMimeType,
        filename: name,
      });

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Show error via toast callback
      if (this.toastCallbacks.onError) {
        this.toastCallbacks.onError(
          `Failed to download ${name}: ${errorMessage}`
        );
      }

      // Create system notification for when app is in background
      await this.showNotification(
        "Download Failed",
        `Failed to download ${name}: ${errorMessage}`
      );

      onError?.(error instanceof Error ? error : new Error("Download failed"));
    }
  }

  public setupNotificationListener() {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content
        .data as NotificationData;

      // Skip actions for progress notifications
      if (data.isProgressNotification) {
        return;
      }

      if (data && data.uri) {
        const uri = data.uri;
        const mimeType =
          data.mimeType ||
          this.getMimeTypeFromFilename(data.filename || "file");
        const filename = data.filename || "file";

        // Check if an intent activity is already in progress
        if (this.isIntentActivityInProgress) {
          // Show a notification to try again
          this.showNotification("Please try again", `Tap to open ${filename}`, {
            uri,
            mimeType,
            filename,
          });
          return;
        }

        // Open file with a slight delay to ensure UI is ready
        setTimeout(() => {
          this.openFile(uri, mimeType, filename).catch((error) => {
            this.showNotification(
              "Error Opening File",
              `Could not open ${filename}: ${error.message}`,
              { uri, mimeType, filename }
            );
          });
        }, 300);
      }
    });
  }
}
