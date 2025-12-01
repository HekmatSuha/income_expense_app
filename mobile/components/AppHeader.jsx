import React from "react";
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const AppHeader = ({
  title,
  subtitle,
  onMenuPress,
  onRightPress,
  rightIconName = "notifications",
  leftIconName = "menu",
  backgroundColor = "#0288D1",
}) => {
  return (
    <View style={{ backgroundColor }}>
      <View className="px-4 py-3 flex-row items-center justify-between" style={{ minHeight: 72 }}>
        {onMenuPress ? (
          <TouchableOpacity className="p-2" activeOpacity={0.7} onPress={onMenuPress}>
            <MaterialIcons name={leftIconName} size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        <View className="items-center">
          <Text className="text-white text-xl font-bold">{title}</Text>
          {subtitle ? (
            <View className="flex-row items-center mt-1">
              <Text className="text-white text-sm font-medium" numberOfLines={1}>
                {subtitle}
              </Text>
              <MaterialIcons name="expand-more" size={18} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        {onRightPress ? (
          <TouchableOpacity className="p-2" activeOpacity={0.7} onPress={onRightPress}>
            <MaterialIcons name={rightIconName} size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </View>
  );
};

export default AppHeader;
