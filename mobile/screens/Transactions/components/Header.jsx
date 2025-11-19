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

const Header = ({ onAddTransaction, onSearch }) => {
  const navigation = useNavigation();

  return (
    <View className="bg-white shadow-sm">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            className="p-2"
            activeOpacity={0.7}
            onPress={() => {
              if (navigation.canGoBack?.()) {
                navigation.goBack();
              }
            }}
          >
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-gray-800 text-xl font-semibold">
            Transactions
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="p-2"
            activeOpacity={0.7}
            onPress={onAddTransaction}
          >
            <Feather name="plus" size={22} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            activeOpacity={0.7}
            onPress={onSearch}
          >
            <Feather name="search" size={22} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Header;
