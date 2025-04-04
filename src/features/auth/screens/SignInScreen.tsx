import React from "react";
import {
  Box,
  Button,
  Text,
  Heading,
  VStack,
  Image,
} from "../../../../components/ui";
import { Link, LinkText } from "../../../../components/ui/link";
import { useSignIn } from "../api/useAuth";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "@shared/types";

type SignInScreenProps = {
  navigation: NavigationProp<RootStackParamList, "SignIn">;
};

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { mutate: signIn, isPending, error } = useSignIn();

  const handleSignIn = () => {
    signIn(undefined);
  };

  return (
    <Box className="flex-1 flex-col justify-between p-6 bg-background-50">
      {/* Top section with logo - positioned lower */}
      <Box className="flex-1 items-center justify-center pt-[25%]">
        <Image
          source={require("../../../../assets/icon.png")}
          alt="Logo"
          className="w-20 h-20 mb-6"
        />

        {/* Welcome and sign-in content - positioned in middle section */}
        <Heading size="xl" className="mb-6 text-center">
          Welcome
        </Heading>

        <Text className="text-center mb-8 text-gray-600">
          Sign in to DD Software
        </Text>

        {error && (
          <Box className="bg-red-100 p-3 rounded-md mb-4 w-full">
            <Text className="text-red-500">{error.message}</Text>
          </Box>
        )}

        <Button
          variant="solid"
          size="lg"
          className="bg-primary-600 w-full mt-4 mb-8"
          onPress={handleSignIn}
          isDisabled={isPending}
        >
          <Text className="text-white">
            {isPending ? "Signing in..." : "Sign in with Google"}
          </Text>
        </Button>
      </Box>

      {/* Register link with spacer to push to bottom */}
      <Box className="w-full items-center pb-6">
        <Link
          href="https://ddsoftware.com.sg"
          className="text-gray-400 text-sm"
        >
          <LinkText>Visit ddsoftware.com.sg to register</LinkText>
        </Link>
      </Box>
    </Box>
  );
};

export default SignInScreen;
