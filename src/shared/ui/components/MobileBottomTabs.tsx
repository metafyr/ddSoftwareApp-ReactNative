import React, { useEffect, useCallback } from "react";
import {
  Text,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/../components/ui";
import { Home, QrCode, Calendar, Settings, Scan } from "lucide-react-native";
import { StyleSheet, Dimensions, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@shared/types";
import { QRCodeScanner, useQRCodeScanner } from "@/features/qr-scanner";

// Get screen dimensions
const { width } = Dimensions.get("window");

interface BottomTab {
  label: string;
  value: string;
  icon: string;
  disabled?: boolean;
}

interface MobileBottomTabsProps {
  bottomTabs: BottomTab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface TabItemProps {
  tab: BottomTab;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getIcon: (icon: string, isActive: boolean) => React.ReactNode;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MobileBottomTabs: React.FC<MobileBottomTabsProps> = ({
  bottomTabs,
  activeTab,
  setActiveTab,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const toast = useToast();

  // QR code scanner hook
  const {
    isVisible,
    scannedUUID,
    openScanner,
    closeScanner,
    handleUUIDDetected,
  } = useQRCodeScanner();

  // Handle the scanned QR code
  const handleQRScan = useCallback(() => {
    openScanner();
  }, [openScanner]);

  // Check if the QR code exists
  const checkQRCodeExists = useCallback(
    async (uuid: string) => {
      try {
        // Navigate to QR details page with isPhysicalId set to true
        navigation.navigate("QRCodeDetails", {
          qrId: uuid,
          isPhysicalId: true,
        });
      } catch (error) {
        toast.show({
          render: () => (
            <Toast action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>Failed to process QR code</ToastDescription>
            </Toast>
          ),
          placement: "top",
          duration: 3000,
        });
      }
    },
    [navigation, toast]
  );

  // Handle when a UUID is detected
  useEffect(() => {
    if (scannedUUID) {
      checkQRCodeExists(scannedUUID);
    }
  }, [scannedUUID, checkQRCodeExists]);

  const getIcon = useCallback((icon: string, isActive: boolean) => {
    const color = isActive ? "#2563EB" : "#6B7280";
    const size = 24;

    switch (icon) {
      case "home":
        return <Home size={size} color={color} />;
      case "qrcode":
        return <QrCode size={size} color={color} />;
      case "calendar":
        return <Calendar size={size} color={color} />;
      case "settings":
        return <Settings size={size} color={color} />;
      default:
        return <Home size={size} color={color} />;
    }
  }, []);

  return (
    <>
      <View style={styles.container}>
        {/* First two tabs */}
        <View style={styles.tabGroup}>
          {bottomTabs.slice(0, 2).map((tab: BottomTab) => (
            <TabItem
              key={tab.label}
              tab={tab}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              getIcon={getIcon}
            />
          ))}
        </View>

        {/* Center spacing for scan button */}
        <View style={styles.centerSpace} />

        {/* Last two tabs */}
        <View style={styles.tabGroup}>
          {bottomTabs.slice(2, 4).map((tab: BottomTab) => (
            <TabItem
              key={tab.label}
              tab={tab}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              getIcon={getIcon}
            />
          ))}
        </View>

        {/* Center scan button */}
        <Pressable
          onPress={handleQRScan}
          style={[styles.scanButton, { left: width / 2 - 28 }]}
          accessibilityRole="button"
          accessibilityLabel="Scan QR code"
        >
          <View style={styles.scanButtonInner}>
            <Scan size={24} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      {/* QR Code Scanner Modal */}
      {isVisible && (
        <QRCodeScanner
          isVisible={true}
          onClose={closeScanner}
          onUUIDDetected={handleUUIDDetected}
        />
      )}
    </>
  );
};

// Tab item component
const TabItem: React.FC<TabItemProps> = ({
  tab,
  activeTab,
  setActiveTab,
  getIcon,
}) => {
  const isDisabled = tab.disabled;
  const isActive = activeTab === tab.label && !isDisabled;

  return (
    <Pressable
      onPress={() => !isDisabled && setActiveTab(tab.label)}
      style={[styles.tabItem, { opacity: isDisabled ? 0.5 : 1 }]}
      disabled={isDisabled}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
    >
      <View
        style={[
          styles.iconContainer,
          isActive ? styles.activeIconContainer : {},
        ]}
      >
        {getIcon(tab.icon, isActive)}
      </View>
      <Text
        size="xs"
        style={[
          styles.tabText,
          isDisabled
            ? styles.disabledText
            : isActive
            ? styles.activeText
            : styles.inactiveText,
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 72,
    backgroundColor: "white",
  },
  tabGroup: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
  },
  centerSpace: {
    width: 60, // Space for the scan button
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  activeIconContainer: {
    backgroundColor: "rgba(37, 99, 235, 0.1)", // bg-primary-50
  },
  tabText: {
    marginTop: 2,
  },
  activeText: {
    color: "#2563EB", // text-primary-900
  },
  inactiveText: {
    color: "#6B7280", // text-outline-400
  },
  disabledText: {
    color: "#CCCCCC", // text-outline-200
  },
  scanButton: {
    position: "absolute",
    top: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  scanButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MobileBottomTabs;
