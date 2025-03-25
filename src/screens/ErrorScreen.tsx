import React from "react";
import { Box, Text, Button, VStack, Heading, Icon } from "../../components/ui";
import { AlertCircle } from "lucide-react-native";

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ message, onRetry }) => {
  return (
    <Box className="flex-1 justify-center items-center bg-background-50 p-6">
      <VStack space="lg" className="items-center max-w-sm">
        <Icon as={AlertCircle} size="xl" className="text-error-500" />

        <Heading size="lg" className="text-center">
          Something went wrong
        </Heading>

        <Text className="text-center text-gray-600 mb-4">{message}</Text>

        {onRetry && (
          <Button
            variant="solid"
            size="lg"
            className="bg-primary-600 w-full"
            onPress={onRetry}
          >
            <Text className="text-white">Try Again</Text>
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ErrorScreen;
