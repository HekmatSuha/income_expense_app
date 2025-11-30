import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getLocales } from "expo-localization";
import { languages } from "../constants/languages";

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

const LanguagePickerModal = ({ visible, onClose, onSelect, currentLanguage }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return languages.filter(
      (lang) =>
        lang.label.toLowerCase().includes(query) ||
        lang.name.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Language</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerCloseButton}>
              <MaterialIcons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#94a3b8" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search languages..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const isSelected = item.code === currentLanguage;
              return (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemActive,
                  ]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.languageName,
                        isSelected && styles.languageNameActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.languageNative,
                        isSelected && styles.languageNativeActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check" size={20} color="#0288D1" />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No languages found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const NavbarDrawer = ({
  visible,
  onClose,
  onItemPress,
  user,
  language,
  onLanguageChange,
}) => {
  const drawerWidth = useMemo(() => {
    const { width } = Dimensions.get("window");
    return Math.min(width * 0.82, 320);
  }, []);

  const animation = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Determine the active language (prop or system default)
  const activeLanguageCode = useMemo(() => {
    if (language) return language;
    const locales = getLocales();
    return locales && locales.length > 0 ? locales[0].languageCode : "en";
  }, [language]);

  const activeLanguageLabel = useMemo(() => {
    const lang = languages.find((l) => l.code === activeLanguageCode);
    return lang ? lang.label : activeLanguageCode.toUpperCase();
  }, [activeLanguageCode]);

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
    <>
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
                <Text style={styles.avatarLabel}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
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
                        <MaterialIcons
                          name={item.icon}
                          size={20}
                          color="#0288D1"
                        />
                      </View>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={22}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Language</Text>
                <TouchableOpacity
                  style={styles.languageSelectorRow}
                  activeOpacity={0.8}
                  onPress={() => setPickerVisible(true)}
                >
                  <View style={styles.iconBox}>
                    <MaterialIcons name="language" size={20} color="#0288D1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>App Language</Text>
                    <Text style={styles.languageSubLabel}>
                      {activeLanguageLabel}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
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

      <LanguagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(code) => onLanguageChange?.(code)}
        currentLanguage={activeLanguageCode}
      />
    </>
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
  languageSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageSubLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
    paddingTop: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  pickerCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginHorizontal: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1e293b",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  languageItemActive: {
    backgroundColor: "#f0f9ff",
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
  },
  languageNameActive: {
    color: "#0288D1",
    fontWeight: "600",
  },
  languageNative: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  languageNativeActive: {
    color: "#0ea5e9",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    color: "#94a3b8",
    fontSize: 15,
  },
});

export default NavbarDrawer;