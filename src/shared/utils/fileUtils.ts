/**
 * Utility functions for file handling
 */

/**
 * Sanitizes a filename for S3 storage while preserving core identity
 * Replaces spaces with underscores and removes invalid characters
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
};

/**
 * Gets the MIME type based on file extension
 */
export const getMimeType = (filename: string): string => {
  const extension = filename.split(".").pop()?.toLowerCase() || "";
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
    csv: "text/csv",
  };
  return mimeMap[extension] || "application/octet-stream";
};

/**
 * Validates that a string is a valid UUID
 */
export const isValidUuid = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    uuid
  );
};

/**
 * Returns a default or validated UUID
 */
export const getValidatedUuid = (uuid?: string): string => {
  return uuid && isValidUuid(uuid)
    ? uuid
    : "00000000-0000-0000-0000-000000000000";
};
