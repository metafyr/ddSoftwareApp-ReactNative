# ddSoftwareApp-ReactNative

A React Native application for managing QR codes, schedules, and locations. Built with Expo and Gluestack UI, following the Feature-Slice Architecture pattern.

## Architecture

This application follows the **Feature-Slice Architecture (FSA)** pattern, which organizes code by feature first, then by technical concerns. This architecture promotes:

- Better organization and discoverability
- Improved maintainability
- Enhanced scalability
- Clear separation of concerns

For detailed information about the architecture, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overview of the application structure
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Guide for developers working on the codebase

## Features

- **Authentication**: User login and session management
- **Dashboard**: Overview of QR codes, schedules, and activities
- **QR Codes**: Create, view, and manage QR codes
- **Schedules**: Schedule management with results tracking
- **Settings**: User settings and application configuration

## Tech Stack

- **React Native**: Core framework
- **Expo**: Development platform
- **Gluestack UI**: UI component library
- **React Navigation**: Navigation library
- **React Query**: Data fetching and state management
- **TypeScript**: Type safety

## Project Structure

```
src/
├── app/                    # Application entry point and global config
│   ├── providers/          # Top-level providers
│   ├── navigation/         # Navigation setup
│   └── App.tsx             # Main App component
│
├── features/               # Feature modules
│   ├── auth/               # Authentication feature
│   ├── dashboard/          # Dashboard feature
│   ├── qr-codes/           # QR code feature
│   ├── schedules/          # Schedules feature
│   └── settings/           # Settings feature
│
└── shared/                 # Shared resources
    ├── api/                # API client and hooks
    ├── ui/                 # Shared UI components
    └── types/              # Shared type definitions
```

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
yarn install

# Start the development server
yarn start
```

## Development

For information on developing with this codebase, see the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).

## Contributing

1. Create a new branch for your feature or fix
2. Follow the architecture patterns established in the codebase
3. Write tests for your changes
4. Submit a pull request with a clear description of your changes

## License

This project is licensed under the MIT License.
