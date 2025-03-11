import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Box, Button, Text, Heading, VStack, Image } from "../../components/ui";
import { useSignIn } from "../api/hooks/useAuth";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";

type SignInScreenProps = {
  navigation: NavigationProp<RootStackParamList, "SignIn">;
};

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { mutate: signIn, isPending, error } = useSignIn();

  const handleSignIn = () => {
    signIn(undefined);
  };

  return (
    <Box className="flex-1 justify-center items-center p-6 bg-background-50">
      <VStack space="lg" className="w-full max-w-sm items-center">
        <Image
          source={require("../../assets/light-logo.svg")}
          alt="Logo"
          className="w-24 h-24 mb-6"
        />

        <Heading size="xl" className="mb-6 text-center">
          Welcome
        </Heading>

        <Text className="text-center mb-8 text-gray-600">
          Sign in to access your QR codes, files, and schedules
        </Text>

        {error && (
          <Box className="bg-red-100 p-3 rounded-md mb-4 w-full">
            <Text className="text-red-500">{error.message}</Text>
          </Box>
        )}

        <Button
          variant="solid"
          size="lg"
          className="bg-primary-600 w-full"
          onPress={handleSignIn}
          isDisabled={isPending}
        >
          <Text className="text-white">
            {isPending ? "Signing in..." : "Sign in with Cognito"}
          </Text>
        </Button>
      </VStack>
    </Box>
  );
};

export default SignInScreen;
