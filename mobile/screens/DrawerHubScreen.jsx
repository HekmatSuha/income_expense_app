import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView as RNScrollView,
  Switch as RNSwitch,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  View as RNView,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import AppHeader from "../components/AppHeader";
import { useLanguage } from "../context/LanguageContext";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const Switch = RNSwitch;

const SectionCard = ({ title, children }) => (
  <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 overflow-hidden">
    <View className="px-4 pt-4 pb-2">
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {title}
      </Text>
    </View>
    <View className="px-4 pb-2">{children}</View>
  </View>
);

const IconBadge = ({ name }) => (
  <View className="w-10 h-10 rounded-2xl bg-sky-50 items-center justify-center">
    <MaterialIcons name={name} size={20} color="#0288D1" />
  </View>
);

const ToggleRow = ({ icon, label, helper, value, onToggle }) => (
  <View className="flex-row items-center py-3">
    <IconBadge name={icon} />
    <View className="flex-1 ml-3">
      <Text className="text-base font-semibold text-slate-900">{label}</Text>
      {helper ? (
        <Text className="text-sm text-slate-500 mt-0.5">{helper}</Text>
      ) : null}
    </View>
    <Switch
      value={!!value}
      onValueChange={onToggle}
      trackColor={{ false: "#e2e8f0", true: "#0288D1" }}
      thumbColor="#ffffff"
    />
  </View>
);

const ActionRow = ({ icon, label, helper, onPress }) => (
  <TouchableOpacity
    className="flex-row items-center py-3"
    activeOpacity={0.82}
    onPress={onPress}
  >
    <IconBadge name={icon} />
    <View className="flex-1 ml-3">
      <Text className="text-base font-semibold text-slate-900">{label}</Text>
      {helper ? (
        <Text className="text-sm text-slate-500 mt-0.5">{helper}</Text>
      ) : null}
    </View>
    <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
  </TouchableOpacity>
);

export default function DrawerHubScreen({ navigation, route }) {
  const { t } = useLanguage();
  const itemKey = route?.params?.itemKey || "settings";
  const [toggles, setToggles] = useState({
    darkMode: false,
    analytics: true,
    autoBackup: true,
    biometric: true,
    passcode: false,
    hideBalances: false,
    pushAlerts: true,
    emailAlerts: false,
    budgetNudges: true,
  });

  const toggleValue = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openUrl = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t("alerts.error"), "Unable to open the link right now.");
    });
  };

  const openMailTo = (subject) => {
    const url = `mailto:support@incomeexpense.app?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(t("alerts.error"), "No mail app found on this device.");
    });
  };

  const screens = useMemo(
    () => ({
      settings: {
        title: t("drawer.settings"),
        description: "Personalize how the app behaves and what you see on the home screen.",
        sections: [
          {
            key: "display",
            title: "Preferences",
            items: [
              {
                type: "toggle",
                key: "darkMode",
                icon: "nightlight-round",
                label: "Dark mode",
                helper: "Switch between light and dark surfaces.",
              },
              {
                type: "toggle",
                key: "analytics",
                icon: "insights",
                label: "Smart insights",
                helper: "Show tips based on your spending patterns.",
              },
              {
                type: "toggle",
                key: "autoBackup",
                icon: "cloud-upload",
                label: "Cloud backup",
                helper: "Securely sync data when you are online.",
              },
            ],
          },
          {
            key: "manage",
            title: "Manage",
            items: [
              {
                type: "action",
                key: "profile",
                icon: "person-outline",
                label: t("drawer.myProfile"),
                helper: "Update your name, avatar, and email address.",
                onPress: () => navigation.navigate("Profile"),
              },
              {
                type: "action",
                key: "bankAccounts",
                icon: "account-balance-wallet",
                label: t("navigation.bankAccounts"),
                helper: "Review balances and add new accounts.",
                onPress: () => navigation.navigate("BankAccounts"),
              },
            ],
          },
        ],
      },
      security: {
        title: t("drawer.security"),
        description: "Keep your data protected with biometric login and privacy controls.",
        sections: [
          {
            key: "auth",
            title: "Access",
            items: [
              {
                type: "toggle",
                key: "biometric",
                icon: "fingerprint",
                label: "Biometric login",
                helper: "Use Face ID or Touch ID when available.",
              },
              {
                type: "toggle",
                key: "passcode",
                icon: "lock-outline",
                label: "App passcode",
                helper: "Require a 4-digit code when opening the app.",
              },
            ],
          },
          {
            key: "privacy",
            title: "Privacy",
            items: [
              {
                type: "toggle",
                key: "hideBalances",
                icon: "visibility-off",
                label: "Hide balances",
                helper: "Blur totals until you tap to reveal them.",
              },
              {
                type: "action",
                key: "resetPassword",
                icon: "vpn-key",
                label: "Reset password",
                helper: "Send yourself a password reset email.",
                onPress: () => navigation.navigate("ForgotPassword"),
              },
            ],
          },
        ],
      },
      notifications: {
        title: t("drawer.notifications"),
        description: "Choose how you get alerts about activity and budgets.",
        sections: [
          {
            key: "alerts",
            title: "Alerts",
            items: [
              {
                type: "toggle",
                key: "pushAlerts",
                icon: "notifications-active",
                label: "Push alerts",
                helper: "In-app alerts for spending, income, and transfers.",
              },
              {
                type: "toggle",
                key: "emailAlerts",
                icon: "email",
                label: "Email summaries",
                helper: "Receive weekly snapshots in your inbox.",
              },
              {
                type: "toggle",
                key: "budgetNudges",
                icon: "timeline",
                label: "Budget nudges",
                helper: "Know when you are close to your limits.",
              },
            ],
          },
        ],
      },
      support: {
        title: t("drawer.support"),
        description: "Get help fast or read through common questions.",
        sections: [
          {
            key: "help",
            title: "Help & Support",
            items: [
              {
                type: "action",
                key: "faq",
                icon: "menu-book",
                label: "Docs & FAQs",
                helper: "Open the help center in your browser.",
                onPress: () => openUrl("https://incomeexpense.app/help"),
              },
              {
                type: "action",
                key: "email",
                icon: "support-agent",
                label: "Email support",
                helper: "support@incomeexpense.app",
                onPress: () => openMailTo("Support request"),
              },
              {
                type: "action",
                key: "status",
                icon: "rss-feed",
                label: "System status",
                helper: "Check whether all services are online.",
                onPress: () => openUrl("https://status.incomeexpense.app"),
              },
            ],
          },
        ],
      },
      feedback: {
        title: t("drawer.sendFeedback"),
        description: "Tell us what to improve next.",
        sections: [
          {
            key: "feedback",
            title: "Share Your Thoughts",
            items: [
              {
                type: "action",
                key: "feature",
                icon: "lightbulb-outline",
                label: "Request a feature",
                helper: "Share ideas that would save you time.",
                onPress: () => openMailTo("Feature request"),
              },
              {
                type: "action",
                key: "bug",
                icon: "bug-report",
                label: "Report a bug",
                helper: "Include screenshots or steps to reproduce.",
                onPress: () => openMailTo("Bug report"),
              },
              {
                type: "action",
                key: "community",
                icon: "forum",
                label: "Join the community",
                helper: "Swap tips with other users.",
                onPress: () => openUrl("https://community.incomeexpense.app"),
              },
            ],
          },
        ],
      },
    }),
    [t, navigation]
  );

  const screen = screens[itemKey] || screens.settings;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader
        title={screen.title}
        subtitle={screen.description}
        onMenuPress={() => navigation.goBack()}
        leftIconName="arrow-back"
        rightIconName="help-outline"
        onRightPress={() => openUrl("https://incomeexpense.app/help")}
      />

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
          <Text className="text-sky-900 font-semibold text-base">{screen.title}</Text>
          <Text className="text-sky-800 text-sm mt-1 leading-5">{screen.description}</Text>
        </View>

        {screen.sections.map((section) => (
          <SectionCard key={section.key} title={section.title}>
            {section.items.map((item) =>
              item.type === "toggle" ? (
                <ToggleRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  helper={item.helper}
                  value={toggles[item.key]}
                  onToggle={() => toggleValue(item.key)}
                />
              ) : (
                <ActionRow
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  helper={item.helper}
                  onPress={item.onPress}
                />
              )
            )}
          </SectionCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
