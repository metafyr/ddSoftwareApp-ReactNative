import React from "react";
import { Box, Text, Card } from "@/../components/ui";
import { Icon } from "lucide-react-native";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  metricIcon: React.ElementType;
  metricText: string;
  metricValue: string | number;
  metricColor: string;
}

const DashboardCard = ({
  title,
  value,
  icon: IconComponent,
  iconColor,
  metricIcon: MetricIcon,
  metricText,
  metricValue,
  metricColor,
}: DashboardCardProps) => {
  // Define the type for the color map
  const colorMap: Record<string, string> = {
    "text-primary-500": "#3B82F6",
    "text-success-500": "#22C55E",
  };

  const getColorFromClass = (colorClass: string) => {
    return colorMap[colorClass] || "#000000";
  };

  return (
    <Card
      variant="elevated"
      size="md"
      className="flex-1 p-4 rounded-xl bg-white"
    >
      <Box className="flex-row items-center mb-2 justify-between">
        <Text className="text-sm font-medium text-typography-700">{title}</Text>
        <IconComponent
          strokeWidth={2}
          size={20}
          color={getColorFromClass(iconColor)}
        />
      </Box>
      <Text className="text-2xl font-semibold text-typography-900">
        {value}
      </Text>
      <Box className="flex-row items-center mt-1">
        <MetricIcon
          strokeWidth={2}
          size={16}
          color={getColorFromClass(metricColor)}
        />
        <Text className={`${metricColor} ml-1`}>
          {metricValue} {metricText}
        </Text>
      </Box>
    </Card>
  );
};

export default DashboardCard;
