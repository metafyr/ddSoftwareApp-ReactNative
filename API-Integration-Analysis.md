# API Integration Analysis: Current State and Mismatches

## Overview

This document analyzes the current state of API integration between the React Native frontend and the backend API. It identifies mismatches, potential issues, and areas for improvement.

## Backend API Structure

The backend follows a RESTful API design with routes organized by domain:

- **QR Codes**: `/v1/qr` - Manage QR codes and their associated resources
- **Files**: `/v1/file` - Manage files and file metadata
- **Folders**: `/v1/folder` - Manage folder structures
- **Schedules**: `/v1/schedule` - Manage schedules and schedule results
- **Locations**: `/v1/location` - Manage locations
- **Organizations**: `/v1/organization` - Manage organizations
- **Users**: `/v1/user` - Manage users
- **Dashboard**: `/v1/dashboard` - Get dashboard statistics

The backend API routes are designed with proper resource hierarchies and consistently use RESTful patterns.

## Frontend API Integration

The frontend uses:

- React Query for data fetching and state management
- Custom hooks for API interactions
- API Client abstraction for making HTTP requests
- Environment-based configuration

### Current API Endpoints Structure

```javascript
export const API_ENDPOINTS = {
  // QR Code endpoints
  QR_CODES: "/protected/v1/qr",
  QR_CODE_BY_ID: (id: string) => `/protected/v1/qr/${id}`,
  QR_CODES_BY_LOCATION: (locationId: string) =>
    `/protected/v1/qr/location/${locationId}`,

  // Folder endpoints
  FOLDERS: "/protected/v1/folder",
  FOLDER_BY_ID: (id: string) => `/protected/v1/folder/${id}`,
  FOLDERS_BY_QR_CODE: (qrCodeId: string) =>
    `/protected/v1/folder/qr/${qrCodeId}`,

  // File endpoints
  FILES: "/protected/v1/file",
  FILE_BY_ID: (id: string) => `/protected/v1/file/${id}`,
  FILES_BY_FOLDER: (folderId: string) =>
    `/protected/v1/file/folder/${folderId}`,
  FILES_BY_QR_CODE: (qrCodeId: string) => `/protected/v1/file/qr/${qrCodeId}`,

  // ... other endpoints

  // Composite endpoints
  COMPLETE_QR_CODE: (id: string) => `/protected/v1/composite/qr/${id}`,
  DASHBOARD_DATA: "/protected/v1/composite/dashboard",
  USER_DETAILS: (email: string) =>
    `/protected/v1/composite/user-details?email=${encodeURIComponent(email)}`,
};
```

## Key Mismatches and Issues

### 1. Path Prefix Discrepancy

**Issue**: Frontend uses `/protected/v1/` while backend API routes are defined with `/v1/`

**Solution**: Configure the base URL in the environment file as mentioned, which will allow easy switching between different API base URLs.

### 2. Resource Path Mismatches

#### QR Codes by Location

- **Backend**: Expects location filter as a query parameter:
  `/v1/qr?locationId=123`
- **Frontend**: Uses a path parameter:
  `/protected/v1/qr/location/${locationId}`

#### Files by QR Code

- **Backend**: Uses query parameter:
  `/v1/file?qrCodeId=123`
- **Frontend**: Uses path parameter:
  `/protected/v1/file/qr/${qrCodeId}`

#### Folders by QR Code

- **Backend**: Uses query parameter:
  `/v1/folder?qrCodeId=123`
- **Frontend**: Uses path parameter:
  `/protected/v1/folder/qr/${qrCodeId}`

### 3. Missing Routes

#### Composite Endpoints

The frontend refers to composite endpoints that don't exist in the backend:

- `/protected/v1/composite/qr/${id}`
- `/protected/v1/composite/dashboard`
- `/protected/v1/composite/user-details`

These likely need to be implemented in the backend or modified in the frontend.

### 4. Data Type Inconsistencies

In `QRCodes.tsx`, there's a mismatch in location ID data types:

```typescript
// The frontend converts the location ID to a number
locationId: Number(apiQRCode.locationId), // Convert string to number
```

But when sending data to the API:

```typescript
// Then converts it back to a string
locationId: String(qrCode.locationId), // Convert number to string for API
```

This indicates potential type inconsistency issues.

### 5. Auth Flow Integration

The frontend uses Expo Auth Session for OAuth authentication, but it's unclear if the backend is properly configured to accept and validate these tokens.

## Next Steps

See the companion document "API Integration Plan" for a detailed approach to resolving these issues.
