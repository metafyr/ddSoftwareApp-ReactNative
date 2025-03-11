# API Integration Plan

## 1. Base URL Configuration

- Update apiConfig.ts to use environment variables
- Add path prefix support for '/protected'

## 2. Endpoint Structure Fixes

- Fix QR_CODES_BY_LOCATION to use query params
- Fix FILES_BY_QR_CODE to use query params
- Fix FOLDERS_BY_QR_CODE to use query params
- Update schedule endpoints format

## 3. API Hook Refactoring

- Update useQRCodes.ts to handle proper location filtering
- Ensure useFiles and useFolders use correct parameters
- Add proper error handling to all hooks

## 4. Composite API Handling

- Create backend implementations for composite endpoints
- Update COMPLETE_QR_CODE endpoint to match backend pattern

## 5. Authentication Flow

- Ensure token handling is consistent
- Confirm OAuth integration works with backend

## 6. Type Conversion Fixes

- Fix string/number conversion issues in location IDs
- Ensure consistent typing between frontend/backend
