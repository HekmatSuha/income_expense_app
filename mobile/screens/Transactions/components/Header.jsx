import React from "react";
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { styled } from "../../../packages/nativewind";
import { useNavigation } from "@react-navigation/native";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const Header = ({ onExport }) => {
  const navigation = useNavigation();

  return (
    <View className="bg-card-light shadow-sm z-20 border-b border-gray-100">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            className="p-2 rounded-full bg-background-light"
            activeOpacity={0.7}
            onPress={() => {
              if (navigation.canGoBack?.()) {
                navigation.goBack();
              }
            }}
          >
            <Feather name="arrow-left" size={24} color="#212529" />
          </TouchableOpacity>
          <Text className="text-text-light text-xl font-semibold">
            Transactions
          </Text>
        </View>
        <TouchableOpacity
          className="p-2 bg-background-light rounded-full border border-gray-100"
          activeOpacity={0.7}
          onPress={onExport}
        >
          <Feather name="share" size={20} color="#007BFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
