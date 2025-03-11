/**
 * Utilities for consistent type handling between frontend and backend
 */

/**
 * Ensures an ID is always handled as a string
 * @param id The ID to normalize
 * @returns The ID as a string
 */
export const normalizeId = (id: string | number | undefined): string => {
  if (id === undefined || id === null) {
    throw new Error("ID cannot be undefined or null");
  }
  return String(id);
};

/**
 * Sanitizes an object's ID fields to be strings
 * @param obj Object containing ID fields
 * @returns Object with string IDs
 */
export const sanitizeIds = <T extends Record<string, any>>(obj: T): T => {
  const result = { ...obj };
  const idFields = ["id", "locationId", "organizationId", "qrCodeId", "folderId", "scheduleId", "userId"];
  
  idFields.forEach(field => {
    if (field in result && result[field] !== undefined && result[field] !== null) {
      result[field] = String(result[field]);
    }
  });

  return result;
};

/**
 * Ensures dates are properly formatted for API requests
 * @param date Date to format
 * @returns ISO string date
 */
export const formatDate = (date: Date | string): string => {
  if (typeof date === "string") {
    return date;
  }
  return date.toISOString();
};

/**
 * Parses API response dates into Date objects
 * @param obj Object containing date fields
 * @returns Object with parsed dates
 */
export const parseDates = <T extends Record<string, any>>(obj: T): T => {
  const result = { ...obj };
  const dateFields = ["createdAt", "updatedAt", "startDate", "endDate", "nextOccurrence"];
  
  dateFields.forEach(field => {
    if (field in result && result[field]) {
      result[field] = new Date(result[field]);
    }
  });

  return result;
};