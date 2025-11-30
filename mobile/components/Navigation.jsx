import React from "react";
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { styled } from "../packages/nativewind";
import { useLanguage } from "../context/LanguageContext";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

export default function Navigation({ activeTab, onTabChange }) {
  const { t } = useLanguage();
  
  const tabs = [
    { key: "home", label: t("navigation.home") },
    { key: "bankAccounts", label: t("navigation.bankAccounts") },
    { key: "notebook", label: t("navigation.notebook") },
  ];

  return (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row items-center justify-around px-4 py-3">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              className="items-center"
              activeOpacity={0.8}
              onPress={() => onTabChange?.(tab.key)}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? "text-[#0288D1]" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
              <View
                className={`mt-2 h-0.5 w-12 rounded-full ${
                  isActive ? "bg-[#0288D1]" : "bg-transparent"
                }`}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
