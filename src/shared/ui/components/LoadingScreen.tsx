import React from "react";
import { Box, Spinner, Text, VStack } from "@/../components/ui";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
}) => {
  return (
    <Box className="flex-1 justify-center items-center bg-background-50">
      <VStack space="md" className="items-center">
        <Spinner size="large" color="primary.500" />
        <Text className="text-gray-600">{message}</Text>
      </VStack>
    </Box>
  );
};

export default LoadingScreen;
