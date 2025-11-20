import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  ScrollView as RNScrollView,
  Platform,
} from "react-native";
import { styled } from "../packages/nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const ScrollView = styled(RNScrollView);

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
];

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      {
        key: "profile",
        icon: "person",
        label: "My Profile",
        color: "#4F46E5", // Indigo
      },
      {
        key: "settings",
        icon: "settings",
        label: "Settings",
        color: "#64748B", // Slate
      },
    ],
  },
  {
    title: "Security & Privacy",
    items: [
      {
        key: "security",
        icon: "security",
        label: "Security",
        color: "#10B981", // Emerald
      },
      {
        key: "notifications",
        icon: "notifications",
        label: "Notifications",
        color: "#F59E0B", // Amber
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        key: "support",
        icon: "help",
        label: "Help & Support",
        color: "#3B82F6", // Blue
      },
      {
        key: "feedback",
        icon: "feedback",
        label: "Send Feedback",
        color: "#8B5CF6", // Violet
      },
    ],
  },
];

const NavbarDrawer = ({
  visible,
  onClose,
  language = "en",
  onLanguageChange,
  user,
  onItemPress,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = Math.min(screenWidth * 0.85, 340);

  const animation = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        mass: 1,
        stiffness: 100,
        overshootClamping: false,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShouldRender(false));
    }
  }, [visible, animation]);

  const handleClosePress = () => {
    if (visible) {
      onClose?.();
    }
  };

  if (!shouldRender) {
    return null;
  }

  const displayName = user?.displayName || "Guest User";
  const email = user?.email || "Sign in to sync data";
  const initial = displayName.charAt(0).toUpperCase();

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <Modal transparent visible={shouldRender} onRequestClose={handleClosePress} animationType="none">
      <View className="flex-1 flex-row">
        {/* Backdrop */}
        <Animated.View
          style={{ opacity: backdropOpacity }}
          className="absolute inset-0 bg-black"
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={handleClosePress}
          />
        </Animated.View>

        {/* Drawer Content */}
        <Animated.View
          style={{
            width: drawerWidth,
            transform: [{ translateX }],
          }}
          className="h-full bg-white shadow-2xl"
        >
          <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'bottom']}>
            {/* Header Section */}
            <View className="px-6 pt-4 pb-6 border-b border-gray-100">
              <View className="flex-row justify-between items-start mb-6">
                <View className="w-14 h-14 rounded-full bg-primary items-center justify-center shadow-sm">
                  <Text className="text-white text-2xl font-bold">{initial}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClosePress}
                  className="p-2 -mr-2 rounded-full bg-gray-50"
                >
                  <MaterialIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View>
                <Text className="text-xl font-bold text-gray-900 mb-1">{displayName}</Text>
                <Text className="text-sm text-gray-500 font-medium">{email}</Text>
              </View>

              {!user && (
                <TouchableOpacity
                  onPress={() => onItemPress?.('login')}
                  className="mt-4 bg-primary py-2.5 px-4 rounded-xl flex-row items-center justify-center"
                >
                  <Text className="text-white font-semibold mr-2">Sign In / Register</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingVertical: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Menu Items */}
              {MENU_SECTIONS.map((section, sectionIndex) => (
                <View key={section.title} className="mb-6 px-4">
                  <Text className="px-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </Text>
                  <View className="bg-gray-50 rounded-2xl overflow-hidden">
                    {section.items.map((item, index) => (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => {
                          onItemPress?.(item.key);
                          // Optional: Close drawer on item press? Usually better UX to keep open or let parent decide.
                          // But for navigation items, closing is standard.
                          // handleClosePress(); 
                        }}
                        className={`flex-row items-center p-4 ${index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        activeOpacity={0.7}
                      >
                        <View
                          className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                          style={{ backgroundColor: `${item.color}15` }}
                        >
                          <MaterialIcons name={item.icon} size={20} color={item.color} />
                        </View>
                        <Text className="flex-1 text-base font-medium text-gray-700">
                          {item.label}
                        </Text>
                        <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Language Selector */}
              <View className="px-6 mb-6">
                <Text className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Language
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const isSelected = language === opt.code;
                    return (
                      <TouchableOpacity
                        key={opt.code}
                        onPress={() => onLanguageChange?.(opt.code)}
                        className={`mr-3 px-4 py-2 rounded-full border flex-row items-center ${isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-white border-gray-200'
                          }`}
                      >
                        <Text className="text-base mr-2">{opt.flag}</Text>
                        <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'
                          }`}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="p-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => onItemPress?.('logout')}
                className="flex-row items-center justify-center p-4 rounded-2xl bg-red-50"
              >
                <MaterialIcons name="logout" size={20} color="#EF4444" />
                <Text className="ml-2 font-semibold text-red-500">Sign Out</Text>
              </TouchableOpacity>
              <Text className="text-center text-xs text-gray-400 mt-4">
                Version 1.0.0
              </Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NavbarDrawer;
