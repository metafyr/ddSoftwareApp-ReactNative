# Developer Guide for ddSoftwareApp-ReactNative

## Getting Started

This guide will help you understand how to work with the codebase, following our Feature-Slice Architecture pattern.

### Prerequisites

- Node.js (v14 or higher)
- Yarn
- Expo CLI

### Installation

1. Clone the repository
2. Run `yarn install` to install dependencies
3. Run `yarn start` to start the development server

## Project Architecture

We follow the **Feature-Slice Architecture** pattern, which organizes code by feature first, then by technical concerns. See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview.

## Key Directories

- **src/app**: Application entry point, providers, and navigation
- **src/features**: Feature modules (auth, dashboard, qr-codes, etc.)
- **src/shared**: Shared utilities, components, and types

## Working with Features

### Anatomy of a Feature

Each feature directory follows a consistent structure:

```
features/feature-name/
├── api/            # API hooks and services
├── components/     # UI components specific to the feature
├── screens/        # Screen components
└── index.ts        # Public exports
```

### Adding a New Feature

1. Create a new directory in `src/features/`
2. Set up the standard subdirectories:
   ```bash
   mkdir -p src/features/new-feature/api
   mkdir -p src/features/new-feature/components
   mkdir -p src/features/new-feature/screens
   touch src/features/new-feature/index.ts
   ```
3. Implement your feature's components, screens, and API hooks
4. Export them in your `index.ts` file:
   ```typescript
   // src/features/new-feature/index.ts
   export * from './api';
   export * from './components';
   export * from './screens';
   ```
5. Update navigation as needed in `src/app/navigation/`

### Working with Existing Features

When modifying an existing feature:

1. Keep changes isolated to the feature's directory
2. Avoid creating dependencies on other features
3. Use the shared layer for code that might be needed by other features
4. Update the feature's exports in `index.ts` if necessary

## Navigation

### Adding a New Screen

1. Create your screen component in the appropriate feature:
   ```typescript
   // src/features/your-feature/screens/YourScreen.tsx
   import React from 'react';
   import { Box, Text } from '@/components/ui';

   const YourScreen = () => {
     return (
       <Box>
         <Text>Your new screen</Text>
       </Box>
     );
   };

   export default YourScreen;
   ```

2. Export it in the feature's screens index:
   ```typescript
   // src/features/your-feature/screens/index.ts
   export { default as YourScreen } from './YourScreen';
   ```

3. Add it to the navigation:
   ```typescript
   // In the appropriate navigator file
   import { YourScreen } from '@features/your-feature/screens';

   // ...
   <Stack.Screen name="YourScreen" component={YourScreen} />
   ```

## State Management

### Server State with React Query

Use React Query hooks for API requests:

```typescript
// src/features/your-feature/api/useYourData.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { API_ENDPOINTS } from '@shared/api/endpoints';

export const useYourData = (id: string) => {
  return useQuery({
    queryKey: ['your-data', id],
    queryFn: async () => {
      return apiClient.request(API_ENDPOINTS.YOUR_DATA(id));
    },
  });
};
```

### UI State

Use React's state management hooks for component-level state:

```typescript
// For simple state
const [isOpen, setIsOpen] = useState(false);

// For complex state
const [state, dispatch] = useReducer(reducer, initialState);
```

## Working with Shared Components

### Using Shared UI Components

```typescript
import { ErrorScreen, LoadingScreen } from '@shared/ui/components';

// In your component
if (isLoading) {
  return <LoadingScreen message="Loading data..." />;
}

if (error) {
  return <ErrorScreen message="Failed to load data" onRetry={refetch} />;
}
```

### Adding a New Shared Component

1. Create your component in `src/shared/ui/components/`:
   ```typescript
   // src/shared/ui/components/YourComponent.tsx
   import React from 'react';
   import { Box } from '@/components/ui';

   interface YourComponentProps {
     // props...
   }

   const YourComponent: React.FC<YourComponentProps> = (props) => {
     return <Box>...</Box>;
   };

   export default YourComponent;
   ```

2. Export it in the shared components index:
   ```typescript
   // src/shared/ui/components/index.ts
   export { default as YourComponent } from './YourComponent';
   ```

## UI Components

### Gluestack UI Components

We use Gluestack UI for our core components. Import them from `@/components/ui`:

```typescript
import { Box, Text, Button, HStack, VStack } from '@/components/ui';
```

### Styling with Classes

We use utility classes for styling components:

```typescript
<Box className="flex-1 p-4 bg-white">
  <Text className="text-lg font-semibold text-gray-900">Title</Text>
</Box>
```

## Testing

### Running Tests

- `yarn test`: Run all tests
- `yarn test:watch`: Run tests in watch mode

### Writing Tests

1. Create a test file next to the file you want to test:
   ```
   Component.tsx
   Component.test.tsx
   ```

2. Write your test:
   ```typescript
   import { render, screen } from '@testing-library/react-native';
   import Component from './Component';

   describe('Component', () => {
     it('renders correctly', () => {
       render(<Component />);
       expect(screen.getByText('Example')).toBeOnTheScreen();
     });
   });
   ```

## Best Practices

1. **Keep features isolated**: Features should only depend on the shared layer, not on other features.

2. **Use path aliases**: Use the configured path aliases for clearer imports:
   ```typescript
   // Good
   import { Something } from '@shared/utils';
   
   // Avoid
   import { Something } from '../../../shared/utils';
   ```

3. **Component organization**: Group related components in the same directory.

4. **Export through index files**: Use index.ts files to create a clear public API for each module.

5. **Named exports vs. default exports**:
   - Use named exports for multiple exports from a file
   - Use default exports for main components in their own files

6. **Code splitting**: Keep files focused on a single responsibility.

7. **Consistent naming**: Use consistent naming patterns:
   - Component files: PascalCase (e.g., `Button.tsx`)
   - Hook files: camelCase with 'use' prefix (e.g., `useAuth.tsx`)
   - Utility files: camelCase (e.g., `formatDate.ts`)

## Common Issues and Solutions

### Path Alias Issues

If you're experiencing issues with path aliases, check:
- `tsconfig.json` has the correct path configuration
- `babel.config.js` has the correct module-resolver settings

### React Query Caching

If you're having issues with stale data, you might need to invalidate queries:

```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries(['key']);
```

### Navigation Issues

If screens aren't appearing as expected, check:
- The component is properly exported from its feature
- The navigation route is correctly defined
- The component is imported correctly in the navigator

## Contributing

1. Create a new branch for your feature or fix
2. Follow the architecture patterns established in the codebase
3. Write tests for your changes
4. Submit a pull request with a clear description of your changes

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Feature-Slice Architecture](https://feature-sliced.design/)
