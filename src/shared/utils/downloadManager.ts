import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";

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
  notificationId: string; // Add unique ID for notifications
}

// Create a singleton instance to prevent multiple notification listeners
let downloadManagerInstance: DownloadManager | null = null;

export class DownloadManager {
  private downloadDirectory: string;
  private isIntentActivityInProgress = false;
  private toastCallbacks: ToastCallbacks = {};
  private notificationListener: any = null;
  private recentNotifications: Set<string> = new Set();

  constructor(toastCallbacks?: ToastCallbacks) {
    // Return existing instance if available (Singleton pattern)
    if (downloadManagerInstance) {
      if (toastCallbacks) {
        downloadManagerInstance.setToastCallbacks(toastCallbacks);
      }
      return downloadManagerInstance;
    }

    // Set download directory based on platform
    if (Platform.OS === "android") {
      this.downloadDirectory = `${FileSystem.documentDirectory}downloads/`;
    } else {
      this.downloadDirectory = `${FileSystem.documentDirectory}downloads/`;
    }

    // Store toast callbacks if provided
    if (toastCallbacks) {
      this.toastCallbacks = toastCallbacks;
    }

    // Setup notification listener only once
    this.setupNotificationListener();

    // Save instance to singleton
    downloadManagerInstance = this;
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
    filename: string,
    notificationId?: string
  ): Promise<void> {
    try {
      if (Platform.OS === "android") {
        if (this.isIntentActivityInProgress) {
          console.log("Intent activity already in progress. Skipping.");
          return;
        }

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
          } catch (contentError) {
            const asset = await MediaLibrary.createAssetAsync(uri);
            contentUri = asset.uri;
          }
        } else {
          contentUri = uri;
        }

        // Use direct VIEW intent with specific MIME type
        const flags = 0x00000001 | 0x00000001; // FLAG_ACTIVITY_NEW_TASK | FLAG_GRANT_READ_URI_PERMISSION

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: flags,
          type: resolvedMimeType,
        });

        this.isIntentActivityInProgress = false;
        return;
      } else {
        // iOS implementation
        if (await Linking.canOpenURL(uri)) {
          await Linking.openURL(uri);
        } else {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (error) {
      // Unified error handling
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Only show one error notification with unique ID if provided
      if (notificationId) {
        await this.showNotification(
          "Error Opening File",
          `Could not open ${filename}: ${errorMessage}`,
          {
            uri,
            mimeType,
            filename,
            notificationId: `error-${notificationId}`,
          }
        );
      } else if (this.toastCallbacks.onError) {
        this.toastCallbacks.onError(`Failed to open file: ${errorMessage}`);
      }
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

  // Check if a notification was recently shown to avoid duplicates
  private async hasRecentNotification(
    notificationId: string
  ): Promise<boolean> {
    // Check in-memory set first (for fast checking)
    if (this.recentNotifications.has(notificationId)) {
      return true;
    }

    try {
      // Check in secure storage (for persistent checking)
      const storedValue = await SecureStore.getItemAsync(
        `notification_${notificationId}`
      );
      return storedValue !== null;
    } catch (error) {
      console.warn("Error checking notification history:", error);
      return false;
    }
  }

  // Record a notification to avoid duplicates
  private async recordNotification(notificationId: string): Promise<void> {
    // Add to in-memory set
    this.recentNotifications.add(notificationId);

    try {
      // Store with expiration time (24 hours)
      const expiration = Date.now() + 24 * 60 * 60 * 1000;
      await SecureStore.setItemAsync(
        `notification_${notificationId}`,
        expiration.toString()
      );

      // Clean up old notifications periodically
      this.cleanupOldNotifications();
    } catch (error) {
      console.warn("Error recording notification:", error);
    }
  }

  // Clean up old notifications
  private async cleanupOldNotifications(): Promise<void> {
    try {
      // This would be better with a proper key-value store that supports iteration
      // For SecureStore, we'll have to implement a separate mechanism to track keys
    } catch (error) {
      console.warn("Error cleaning up old notifications:", error);
    }
  }

  private async showNotification(
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> {
    try {
      // Skip if no data
      if (!data) {
        return;
      }

      // Use a unique ID for the notification
      const notificationId =
        data.notificationId ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Check for duplicate notifications
      if (await this.hasRecentNotification(notificationId)) {
        console.log(`Skipping duplicate notification: ${notificationId}`);
        return;
      }

      // Record this notification to prevent duplicates
      await this.recordNotification(notificationId);

      // Schedule the notification with the unique ID
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            mimeType: data.mimeType || "application/octet-stream",
            notificationId,
          },
        },
        identifier: notificationId,
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
    const downloadId = `download-${Date.now()}-${name}`;

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

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        downloadPath,
        {
          headers: {
            Accept: mimeType || "*/*",
          },
        },
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

      // Verify file exists and has content
      const downloadedFileInfo = await FileSystem.getInfoAsync(result.uri);
      if (!downloadedFileInfo.exists) {
        throw new Error("Downloaded file not found");
      }
      if (downloadedFileInfo.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Determine the proper MIME type
      const actualMimeType =
        result.headers["Content-Type"] ||
        mimeType ||
        this.getMimeTypeFromFilename(name);

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

      // Call toast callback to notify download completion
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
        notificationId: `complete-${downloadId}`,
      });

      // Automatically open the file immediately after download
      // Small delay ensures UI updates before opening the file
      setTimeout(() => {
        this.openFile(finalUri, actualMimeType, name);
      }, 500);

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
        `Failed to download ${name}: ${errorMessage}`,
        {
          notificationId: `error-${downloadId}`,
          uri: "",
          mimeType: "",
          filename: name,
        }
      );

      onError?.(error instanceof Error ? error : new Error("Download failed"));
    }
  }

  public setupNotificationListener() {
    // Remove existing listener if it exists
    if (this.notificationListener) {
      this.notificationListener.remove();
    }

    // Create new listener
    this.notificationListener =
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
          const notificationId = data.notificationId;

          // Check if an intent activity is already in progress
          if (this.isIntentActivityInProgress) {
            console.log(
              "Intent activity already in progress. Skipping file open."
            );
            return;
          }

          // Open file with a slight delay to ensure UI is ready
          setTimeout(() => {
            this.openFile(uri, mimeType, filename, notificationId);
          }, 300);
        }
      });
  }

  // Clean up method to remove listeners
  public cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
  }
}
