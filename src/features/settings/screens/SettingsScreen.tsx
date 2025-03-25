import React from "react";
import {
  Box,
  Text,
  Button,
  Pressable,
  VStack,
  HStack,
  Icon,
  Center,
  Spinner,
} from "@/../components/ui";
import { User, Settings as SettingsIcon, LogOut } from "lucide-react-native";
import { useSignOut, useAuth } from "@features/auth/api";

const SettingsScreen = () => {
  const { data: user } = useAuth();
  const { mutate: signOut, isPending } = useSignOut();

  const handleLogout = () => {
    signOut();
  };

  return (
    <Box className="flex-1 p-4 flex">
      <Box className="flex-1">
        <VStack space="md">
          {user && (
            <Box className="bg-background-50 p-4 rounded-xl mb-4">
              <VStack space="sm">
                <Text className="text-lg font-semibold text-typography-900">
                  {user.name}
                </Text>
                <Text className="text-sm text-typography-600">
                  {user.email}
                </Text>
                <Text className="text-sm text-typography-600">
                  Role: {user.roleName}
                </Text>
              </VStack>
            </Box>
          )}

          <Pressable>
            <Box className="bg-background-50 p-4 rounded-xl">
              <HStack space="sm" className="items-center">
                <User size={24} color="#374151" />
                <Box className="ml-2">
                  <Text className="text-base font-normal text-typography-900">
                    Organization Profile
                  </Text>
                  <Text className="text-sm text-typography-600">
                    Manage organization details
                  </Text>
                </Box>
              </HStack>
            </Box>
          </Pressable>

          <Pressable>
            <Box className="bg-background-50 p-4 rounded-xl">
              <HStack space="sm" className="items-center">
                <SettingsIcon size={24} color="#374151" />
                <Box className="ml-2">
                  <Text className="text-base font-normal text-typography-900">
                    Preferences
                  </Text>
                  <Text className="text-sm text-typography-600">
                    App settings and notifications
                  </Text>
                </Box>
              </HStack>
            </Box>
          </Pressable>
        </VStack>
      </Box>

      <Button
        variant="solid"
        action="negative"
        className="mb-4"
        onPress={handleLogout}
        size="lg"
        isDisabled={isPending}
      >
        <HStack space="sm" className="items-center justify-center">
          {isPending ? (
            <Spinner color="white" size="small" />
          ) : (
            <>
              <LogOut size={20} color="white" />
              <Text className="text-white">Log Out</Text>
            </>
          )}
        </HStack>
      </Button>
    </Box>
  );
};

export default SettingsScreen;
