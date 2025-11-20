import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  ScrollView as RNScrollView,
} from "react-native";
import { styled } from "../packages/nativewind";
import { MaterialIcons } from "@expo/vector-icons";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const ScrollView = styled(RNScrollView);

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
];

const MENU_ITEMS = [
  {
    key: "settings",
    icon: "person-outline",
    label: "User Settings",
    helper: "Profile, accounts, and personalization",
  },
  {
    key: "security",
    icon: "lock-outline",
    label: "Security & Privacy",
    helper: "Passcode, biometrics, and data privacy",
  },
  {
    key: "notifications",
    icon: "notifications-none",
    label: "Notifications",
    helper: "Push, email, and reminders",
  },
  {
    key: "support",
    icon: "help-outline",
    label: "Help & Support",
    helper: "FAQ, chat, or email our team",
  },
];

const SECONDARY_LINKS = [
  { key: "theme", icon: "dark-mode", label: "Appearance" },
  { key: "feedback", icon: "feedback", label: "Feedback" },
];

const NavbarDrawer = ({
  visible,
  onClose,
  language = "en",
  onLanguageChange,
  user,
  onItemPress,
}) => {
  const drawerWidth = useMemo(() => {
    const screen = Dimensions.get("window").width;
    return Math.min(screen * 0.82, 320);
  }, []);
  const animation = useRef(new Animated.Value(visible ? 0 : 1)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShouldRender(false));
    }
  }, [animation, visible]);

  const handleClosePress = () => {
    if (visible) {
      onClose?.();
    }
  };

  if (!shouldRender) {
    return null;
  }

  const displayName = user?.displayName || "Guest";
  const email = user?.email || "Not signed in";

  const drawerStyle = {
    width: drawerWidth,
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -drawerWidth],
        }),
      },
    ],
  };

  return (
    <Modal transparent visible statusBarTranslucent animationType="fade">
      <View className="flex-1 bg-black/40">
        <TouchableOpacity
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel="Close navigation overlay"
          activeOpacity={1}
          onPress={handleClosePress}
        />
        <Animated.View
          style={drawerStyle}
          className="absolute left-0 top-0 bottom-0 bg-white rounded-r-3xl overflow-hidden shadow-2xl"
        >
          <View className="bg-primary/90 px-5 pt-12 pb-8">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                    <Text className="text-white text-lg font-semibold">
                      {displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white text-base font-semibold">{displayName}</Text>
                    <Text className="text-white/70 text-xs">{email}</Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mt-4 flex-wrap">
                  <View className="px-3 py-1 rounded-full bg-white/20">
                    <Text className="text-white text-[10px] tracking-widest font-semibold">
                      LANGUAGE · {language.toUpperCase()}
                    </Text>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-white/20">
                    <Text className="text-white text-[10px] tracking-widest font-semibold">
                      PREMIUM READY
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                className="p-2 rounded-full bg-white/25"
                onPress={handleClosePress}
                accessibilityLabel="Close navigation drawer"
              >
                <MaterialIcons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-white/15 rounded-2xl px-3 py-3"
                activeOpacity={0.85}
                onPress={() => onItemPress?.("profile")}
              >
                <Text className="text-white font-semibold text-sm">View Profile</Text>
                <Text className="text-white/70 text-xs mt-1">See goals & achievements</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-white/15 rounded-2xl px-3 py-3"
                activeOpacity={0.85}
                onPress={() => onItemPress?.("upgrade")}
              >
                <Text className="text-white font-semibold text-sm">Upgrade</Text>
                <Text className="text-white/70 text-xs mt-1">Unlock analytics</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-5 pt-6 pb-10"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="mb-7">
              <Text className="text-xs uppercase tracking-widest text-gray-400 mb-3">
                Quick Settings
              </Text>
              <View className="rounded-3xl border border-gray-100 overflow-hidden bg-white">
                {MENU_ITEMS.map((item, index) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.9}
                    className={`px-4 py-4 flex-row items-center ${
                      index !== 0 ? "border-t border-gray-100" : ""
                    }`}
                    onPress={() => onItemPress?.(item.key)}
                  >
                    <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center mr-3">
                      <MaterialIcons name={item.icon} size={22} color="#0288D1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">{item.label}</Text>
                      <Text className="text-xs text-gray-500 mt-1">{item.helper}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-7">
              <Text className="text-xs uppercase tracking-widest text-gray-400 mb-3">
                Language
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isActive = lang.code === language;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      activeOpacity={0.8}
                      className={`px-4 py-2 rounded-full border ${
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-gray-200 bg-white"
                      }`}
                      onPress={() => {
                        if (!isActive) {
                          onLanguageChange?.(lang.code);
                        }
                      }}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isActive ? "text-primary" : "text-gray-600"
                        }`}
                      >
                        {lang.label} · {lang.code.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-7">
              <Text className="text-xs uppercase tracking-widest text-gray-400 mb-3">
                Extras
              </Text>
              <View className="rounded-3xl border border-gray-100 bg-white overflow-hidden">
                {SECONDARY_LINKS.map((item, index) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.85}
                    className={`px-4 py-4 flex-row items-center ${
                      index !== 0 ? "border-t border-gray-100" : ""
                    }`}
                    onPress={() => onItemPress?.(item.key)}
                  >
                    <MaterialIcons name={item.icon} size={22} color="#475569" />
                    <Text className="ml-3 text-sm font-semibold text-gray-800">{item.label}</Text>
                    <View className="ml-auto">
                      <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              className="flex-row items-center justify-between px-4 py-4 rounded-3xl bg-gray-50 border border-gray-100"
              onPress={() => onItemPress?.("logout")}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-11 h-11 rounded-2xl bg-gray-200 items-center justify-center">
                  <MaterialIcons name="logout" size={22} color="#111827" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-gray-900">Sign out</Text>
                  <Text className="text-xs text-gray-500">Switch account or exit</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NavbarDrawer;
