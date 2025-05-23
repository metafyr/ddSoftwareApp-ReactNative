import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Fab, FabIcon, Box, Spinner } from "@/../components/ui";
import { Plus, X, Scan, Upload, Calendar } from "lucide-react-native";

interface ExpandableFABProps {
  onScanPress: () => void;
  onUploadPress: () => void;
  onSchedulePress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ExpandableFAB: React.FC<ExpandableFABProps> = ({
  onScanPress,
  onUploadPress,
  onSchedulePress,
  disabled = false,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFAB = () => {
    console.log("FAB toggle pressed, current state:", isExpanded);
    setIsExpanded(!isExpanded);
  };

  const handleScanPress = () => {
    console.log("Scan button pressed, disabled:", disabled);
    if (!disabled) {
      setTimeout(() => {
        onScanPress();
        toggleFAB();
      }, 300);
    }
  };

  const handleUploadPress = () => {
    console.log("Upload button pressed, disabled:", disabled);
    if (!disabled) {
      onUploadPress();
      toggleFAB();
    }
  };

  const renderSecondaryFAB = (
    index: number,
    icon: typeof Scan,
    onPress: () => void
  ) => (
    <Box
      style={[
        styles.fabItem,
        {
          bottom: isExpanded ? index * 60 : 0,
          opacity: isExpanded ? 1 : 0,
          zIndex: isExpanded ? 1000 + index : 0,
          pointerEvents: isExpanded ? "auto" : "none",
        },
      ]}
    >
      <Fab
        size="sm"
        onPress={onPress}
        placement="bottom right"
        isDisabled={disabled}
      >
        <FabIcon as={icon} color="white" />
      </Fab>
    </Box>
  );

  return (
    <Box className="absolute bottom-4 right-4" style={styles.container}>
      {renderSecondaryFAB(3, Scan, handleScanPress)}
      {renderSecondaryFAB(2, Upload, handleUploadPress)}
      {/* {renderSecondaryFAB(1, Calendar, onSchedulePress)} */}

      <Fab
        size="lg"
        onPress={toggleFAB}
        placement="bottom right"
        isDisabled={disabled}
      >
        {isLoading ? (
          <Spinner color="white" size="small" />
        ) : (
          <FabIcon as={isExpanded ? X : Plus} color="white" />
        )}
      </Fab>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 999,
  },
  fabItem: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
});

export default ExpandableFAB;
