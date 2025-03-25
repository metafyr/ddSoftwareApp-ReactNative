# ddSoftwareApp-ReactNative Architecture

## Overview

This application follows the **Feature-Slice Architecture (FSA)** pattern, which organizes code by feature first, then by technical concerns. This architecture promotes:

- Better organization and discoverability
- Improved maintainability
- Enhanced scalability
- Clear separation of concerns
- Independence between features

## Directory Structure

```
src/
├── app/                    # Application entry point and global config
│   ├── providers/          # Top-level providers (Auth, Theme, Location, etc.)
│   ├── navigation/         # Navigation setup and config
│   └── App.tsx             # Main App component
│
├── features/               # Feature modules
│   ├── auth/               # Authentication feature
│   │   ├── api/            # Auth-specific API hooks and services
│   │   ├── components/     # Auth-specific UI components
│   │   ├── screens/        # Auth-related screens
│   │   └── index.ts        # Feature entry point and exports
│   │
│   ├── dashboard/          # Dashboard feature
│   │   ├── api/            # Dashboard API hooks
│   │   ├── components/     # Dashboard UI components
│   │   ├── screens/        # Dashboard screens
│   │   └── index.ts        # Feature entry point and exports
│   │
│   ├── qr-codes/           # QR code feature
│   │   ├── api/            # QR code API hooks
│   │   ├── components/     # QR code UI components
│   │   ├── screens/        # QR code screens
│   │   └── index.ts        # Feature entry point and exports
│   │
│   ├── schedules/          # Schedules feature
│   │   ├── api/            # Schedules API hooks
│   │   ├── components/     # Schedules UI components
│   │   ├── screens/        # Schedules screens
│   │   └── index.ts        # Feature entry point and exports
│   │
│   └── settings/           # Settings feature
│       ├── screens/        # Settings screens
│       └── index.ts        # Feature entry point and exports
│
├── shared/                 # Shared resources between features
│   ├── api/                # API client and base hooks
│   │   ├── client/         # Base API client
│   │   └── endpoints.ts    # API endpoints
│   │
│   ├── ui/                 # Shared UI components
│   │   └── components/     # Reusable UI components
│   │
│   └── types/              # Shared type definitions
│
└── config/                 # Environment configuration
```

## Core Architecture Layers

### App Layer

The App layer serves as the application entry point and configures global providers, navigation, and application bootstrapping.

- **App.tsx**: Main application component
- **providers/**: Context providers for app-wide state
- **navigation/**: Navigation configuration and routing

### Features Layer

The Features layer contains all feature-specific code, with each feature being a self-contained module.

Each feature directory includes:
- **api/**: API hooks and data fetching logic for the feature
- **components/**: UI components specific to the feature
- **screens/**: Screen components that are navigated to
- **index.ts**: Public exports for the feature

Features should only import from the shared layer and their own internal modules. Cross-feature dependencies should be avoided.

### Shared Layer

The Shared layer contains code that is used across multiple features:

- **api/**: Common API client and utilities
- **ui/**: Reusable UI components
- **types/**: Shared TypeScript interfaces and types

## State Management

- **Server State**: React Query for data fetching and caching
- **UI State**: React's useState and useReducer for component-level state
- **Global State**: Context API for app-wide state (auth, location, etc.)

## Navigation Structure

Navigation is centralized in the app layer, with screens imported from features:

- **AppNavigator.tsx**: Top-level navigator that handles authentication flow
- **MainPage.tsx**: Main application screen with tab navigation

## Data Flow

1. API requests are made using hooks from the `api/` directories
2. Data flows down from providers and screens to components
3. User interactions trigger callbacks that update state or send API requests

## Adding New Features

To add a new feature:

1. Create a new directory in `src/features/`
2. Add the necessary subdirectories (`api/`, `components/`, `screens/`)
3. Implement the feature's components and logic
4. Export the feature through an `index.ts` file
5. Update navigation as needed

## Best Practices

1. **Imports**:
   - Use path aliases (`@app/`, `@features/`, `@shared/`) for better readability
   - Avoid cyclic dependencies between features

2. **Components**:
   - Keep components small and focused
   - Use composition over inheritance
   - Prefer functional components with hooks

3. **State Management**:
   - Co-locate state with the components that need it
   - Lift state up only when necessary
   - Use React Query for server state management

4. **Styling**:
   - Use utility-based styling with class names
   - Keep styles close to the components they affect

5. **Testing**:
   - Write tests for isolated components
   - Mock dependencies for unit tests
   - Use integration tests for feature workflows

## Feature Examples

### QR Codes Feature

The QR Codes feature implements functionality for managing QR codes:

- **api/**: Hooks for fetching, creating, and modifying QR codes
- **components/**: UI components like QRCodeCard, SwipeableQRCode, etc.
- **screens/**: Main QR code list, details, and scanning screens

### Auth Feature

The Auth feature handles user authentication:

- **api/**: Authentication hooks for sign-in, sign-out, and session management
- **screens/**: Sign-in screen and related authentication screens

## Conclusion

The Feature-Slice Architecture provides a scalable and maintainable structure for the application. By organizing code by feature, developers can quickly locate relevant files and understand how components relate to each other.
