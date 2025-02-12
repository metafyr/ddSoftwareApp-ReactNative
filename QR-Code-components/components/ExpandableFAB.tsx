import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Fab, FabIcon, Box } from "../../components/ui";
import { Plus, X, Scan, Upload, Calendar } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
} from "react-native-reanimated";

const AnimatedBox = Animated.createAnimatedComponent(Box);

interface ExpandableFABProps {
  onScanPress: () => void;
  onUploadPress: () => void;
  onSchedulePress: () => void;
}

const SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 120,
};

const ExpandableFAB: React.FC<ExpandableFABProps> = ({
  onScanPress,
  onUploadPress,
  onSchedulePress,
}) => {
  const isExpanded = useSharedValue(false);

  const toggleFAB = () => {
    isExpanded.value = !isExpanded.value;
  };

  const createAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const offset = index * 60;
      const translateY = isExpanded.value
        ? withSpring(-offset, SPRING_CONFIG)
        : withSpring(0);
      const scale = isExpanded.value
        ? withDelay(index * 100, withSpring(1, SPRING_CONFIG))
        : withSpring(0);
      const opacity = isExpanded.value
        ? withDelay(index * 100, withSpring(1))
        : withSpring(0);

      return {
        transform: [{ translateY }, { scale }],
        opacity,
      };
    });
  };

  const rotationStyle = useAnimatedStyle(() => {
    const rotate = interpolate(Number(isExpanded.value), [0, 1], [0, 45]);

    return {
      transform: [{ rotate: withTiming(`${rotate}deg`) }],
    };
  });

  const renderSecondaryFAB = (
    index: number,
    icon: typeof Scan,
    onPress: () => void
  ) => (
    <AnimatedBox style={[styles.fabItem, createAnimatedStyle(index)]}>
      <Fab
        size="sm"
        onPress={() => {
          onPress();
          toggleFAB();
        }}
        placement="bottom right"
      >
        <FabIcon as={icon} color="white" />
      </Fab>
    </AnimatedBox>
  );

  return (
    <Box className="absolute bottom-4 right-4" style={styles.container}>
      {renderSecondaryFAB(3, Scan, onScanPress)}
      {renderSecondaryFAB(2, Upload, onUploadPress)}
      {renderSecondaryFAB(1, Calendar, onSchedulePress)}

      <Fab size="lg" onPress={toggleFAB} placement="bottom right">
        <Animated.View style={rotationStyle}>
          <FabIcon as={Plus} color="white" />
        </Animated.View>
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
    zIndex: 1,
  },
});

export default ExpandableFAB;
