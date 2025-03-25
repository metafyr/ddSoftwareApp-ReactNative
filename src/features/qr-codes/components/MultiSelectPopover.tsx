import React from "react";
import {
  Popover,
  PopoverBackdrop,
  PopoverContent,
  Box,
  Text,
  Pressable,
  Icon,
  VStack,
  HStack,
} from "@/../components/ui";
import { Check, ChevronsUpDown, X } from "lucide-react-native";

export type Option = {
  value: string;
  label: string;
};

interface MultiSelectPopoverProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function MultiSelectPopover({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
}: MultiSelectPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedItems = options.filter((option) =>
    selected.includes(option.value)
  );

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={(triggerProps) => (
        <Pressable
          {...triggerProps}
          onPress={() => setIsOpen(true)}
          className="border border-outline-300 rounded-lg p-2 flex-row items-center justify-between"
        >
          <HStack className="flex-1 flex-wrap gap-1">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Box
                  key={item.value}
                  className="bg-primary-50 rounded-full px-2 py-1 flex-row items-center mr-1 mb-1"
                >
                  <Text className="text-sm text-primary-900">{item.label}</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleOption(item.value);
                    }}
                    className="ml-1"
                  >
                    <Icon as={X} size="xs" color="#1E40AF" />
                  </Pressable>
                </Box>
              ))
            ) : (
              <Text className="text-typography-400">{placeholder}</Text>
            )}
          </HStack>
          <Icon as={ChevronsUpDown} size="sm" className="opacity-50" />
        </Pressable>
      )}
    >
      <PopoverBackdrop />
      <PopoverContent className="w-72">
        <VStack space="xs" className="p-2">
          <VStack>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => toggleOption(option.value)}
                className="flex-row items-center p-2 hover:bg-primary-50 rounded-md"
              >
                <Box className="w-4 h-4 mr-2">
                  {selected.includes(option.value) && (
                    <Icon as={Check} size="sm" color="#2563EB" />
                  )}
                </Box>
                <Text>{option.label}</Text>
              </Pressable>
            ))}
          </VStack>
        </VStack>
      </PopoverContent>
    </Popover>
  );
}

export default MultiSelectPopover;
