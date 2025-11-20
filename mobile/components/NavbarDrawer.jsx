import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "Account",
    items: [
      { key: "profile", icon: "person-outline", label: "My Profile" },
      { key: "settings", icon: "settings", label: "Settings" },
    ],
  },
  {
    title: "Security & Privacy",
    items: [
      { key: "security", icon: "security", label: "Security" },
      { key: "notifications", icon: "notifications-none", label: "Notifications" },
    ],
  },
  {
    title: "Support",
    items: [
      { key: "support", icon: "help-outline", label: "Help & Support" },
      { key: "feedback", icon: "feedback", label: "Send Feedback" },
    ],
  },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
];

const NavbarDrawer = ({
  visible,
  onClose,
  onItemPress,
  user,
  language = "en",
  onLanguageChange,
}) => {
  const drawerWidth = useMemo(() => {
    const { width } = Dimensions.get("window");
    return Math.min(width * 0.82, 320);
  }, []);

  const animation = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(animation, {
        toValue: 1,
        damping: 18,
        stiffness: 120,
        mass: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShouldRender(false));
    }
  }, [animation, visible]);

  const handleClose = () => {
    if (visible) {
      onClose?.();
    }
  };

  if (!shouldRender) {
    return null;
  }

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [drawerWidth, 0],
  });
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const displayName = user?.displayName || "Guest";
  const email = user?.email || "Not signed in";

  return (
    <Modal transparent visible statusBarTranslucent animationType="none">
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[
            StyleSheet.absoluteFillObject,
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            { width: drawerWidth, transform: [{ translateX }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.row}
                    activeOpacity={0.8}
                    onPress={() => {
                      onItemPress?.(item.key);
                      handleClose();
                    }}
                  >
                    <View style={styles.iconBox}>
                      <MaterialIcons name={item.icon} size={20} color="#0288D1" />
                    </View>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.languageGrid}>
                {LANGUAGES.map((lang) => {
                  const isActive = lang.code === language;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageChip,
                        isActive && styles.languageChipActive,
                      ]}
                      onPress={() => {
                        onLanguageChange?.(lang.code);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.languageLabel,
                          isActive && styles.languageLabelActive,
                        ]}
                      >
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.footerButton}
            activeOpacity={0.8}
            onPress={() => {
              onItemPress?.("logout");
              handleClose();
            }}
          >
            <MaterialIcons name="logout" size={20} color="#ef4444" />
            <Text style={styles.footerButtonLabel}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionLabel}>Income Expense · v1.0.0</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: -2, height: 0 },
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0288D1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  userEmail: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  languageChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  languageChipActive: {
    backgroundColor: "#0288D1",
    borderColor: "#0288D1",
  },
  languageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  languageLabelActive: {
    color: "#fff",
  },
  footerButton: {
    marginHorizontal: 20,
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fecdd3",
    backgroundColor: "#fff1f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerButtonLabel: {
    color: "#ef4444",
    fontWeight: "700",
  },
  versionLabel: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 11,
    color: "#94a3b8",
  },
});

export default NavbarDrawer;
