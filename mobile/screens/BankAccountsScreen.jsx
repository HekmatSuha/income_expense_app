import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import {
  addBankAccount,
  getBankAccounts,
  updateBankAccount,
  deleteBankAccount,
} from "../services/bankAccountRepository";
import Navigation from "../components/Navigation";
import NavbarDrawer from "../components/NavbarDrawer";
import AccountActionsMenu from "../components/menus/AccountActionsMenu";
import { currencies } from "../constants/currencies";
import AppHeader from "../components/AppHeader";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const TouchableOpacity = styled(RNTouchableOpacity);

function formatCurrency(value, currency) {
  return (Number(value) || 0).toLocaleString(undefined, {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const formatCurrencyLabel = (amount, currencyCode) => {
  const numeric = Number(amount) || 0;
  const formatted = Math.abs(numeric).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = numeric < 0 ? "-" : "";
  return currencyCode
    ? `${prefix}${currencyCode} ${formatted}`
    : `${prefix}${formatted}`;
};

const CurrencyPickerModal = ({
  visible,
  onClose,
  onSelect,
  selectedCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [visible]);

  const filteredCurrencies = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return currencies;
    return currencies.filter((item) => {
      const label = (item.label || "").toLowerCase();
      const value = (item.value || item.code || "").toLowerCase();
      return label.includes(term) || value.includes(term);
    });
  }, [searchQuery]);

  const currentValue =
    selectedCurrency?.value ||
    selectedCurrency?.code ||
    selectedCurrency?.label ||
    "USD";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={currencyPickerStyles.modalOverlay}>
        <View style={currencyPickerStyles.pickerContainer}>
          <View style={currencyPickerStyles.pickerHeader}>
            <Text style={currencyPickerStyles.pickerTitle}>Select currency</Text>
            <TouchableOpacity
              onPress={onClose}
              style={currencyPickerStyles.pickerCloseButton}
            >
              <MaterialIcons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={currencyPickerStyles.searchContainer}>
            <MaterialIcons name="search" size={18} color="#94a3b8" />
            <TextInput
              ref={inputRef}
              style={currencyPickerStyles.searchInput}
              placeholder="Search currency or code"
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
            data={filteredCurrencies}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const isSelected =
                (item.value || item.code || item.label) === currentValue;
              return (
                <TouchableOpacity
                  style={[
                    currencyPickerStyles.currencyItem,
                    isSelected && currencyPickerStyles.currencyItemActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View>
                    <Text
                      style={[
                        currencyPickerStyles.currencyCode,
                        isSelected && currencyPickerStyles.currencyCodeActive,
                      ]}
                    >
                      {item.value}
                    </Text>
                    <Text
                      style={[
                        currencyPickerStyles.currencyLabel,
                        isSelected && currencyPickerStyles.currencyLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected ? (
                    <MaterialIcons name="check" size={20} color="#0288D1" />
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={currencyPickerStyles.emptyState}>
                <Text style={currencyPickerStyles.emptyStateText}>
                  No currency found
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default function BankAccountsScreen({ navigation }) {
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState(currencies[0]);
  const [isCurrencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isNavbarVisible, setNavbarVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getBankAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch bank accounts", error);
      setFetchError("Unable to load bank accounts. Pull to refresh or try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts])
  );

  const currencyBreakdownLabel = useMemo(() => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return formatCurrencyLabel(0, "USD");
    }
    const totals = accounts.reduce((acc, account) => {
      const code = account?.currency || "USD";
      const amount = Number(account?.balance);
      if (!Number.isFinite(amount)) {
        return acc;
      }
      acc[code] = (acc[code] || 0) + amount;
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([code, amount]) => formatCurrencyLabel(amount, code))
      .join(", ");
  }, [accounts]);

  const handleSaveAccount = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedType = type.trim();
    const parsedBalance = Number(balance.replace(/,/g, ""));

    if (!trimmedName || !trimmedType || Number.isNaN(parsedBalance)) {
      setFormError("Please provide a name, type, and numeric balance.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const accountCurrency = currency?.value || currency?.code || currency?.label || "USD";
      const accountPayload = {
        name: trimmedName,
        type: trimmedType,
        startingBalance: parsedBalance,
        currency: accountCurrency,
      };

      let savedAccount;
      if (editingAccount) {
        savedAccount = await updateBankAccount(editingAccount.id, {
          id: editingAccount.id,
          ...accountPayload,
        });
        setAccounts((prev) =>
          prev.map((account) => (account.id === savedAccount.id ? savedAccount : account))
        );
      } else {
        savedAccount = await addBankAccount(accountPayload);
        setAccounts((prev) => [savedAccount, ...prev]);
      }

      setName("");
      setType("");
      setBalance("");
      setFormError("");
      setEditingAccount(null);
      setAddAccountModalVisible(false);
    } catch (error) {
      console.error("Failed to save bank account", error);
      setFormError("Unable to save bank account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [balance, name, type, currency, editingAccount]);

  const openCreateAccountModal = useCallback(() => {
    setEditingAccount(null);
    setName("");
    setType("");
    setBalance("");
    setCurrency(currencies[0]);
    setFormError("");
    setAddAccountModalVisible(true);
  }, []);

  const handleEditAccountPress = useCallback((account) => {
    if (!account) {
      return;
    }
    setEditingAccount(account);
    setName(account?.name || "");
    setType(account?.type || "");
    const resolvedBalance =
      account?.startingBalance ?? account?.balance ?? "";
    setBalance(
      resolvedBalance === "" || resolvedBalance === null
        ? ""
        : String(resolvedBalance)
    );
    const match =
      currencies.find((item) => {
        const value = item.value || item.code || item.label;
        return value === (account?.currency || "USD");
      }) || { label: account?.currency || "USD", value: account?.currency || "USD" };
    setCurrency(match);
    setFormError("");
    setAddAccountModalVisible(true);
  }, []);

  const handleDeleteAccount = useCallback(
    async (accountId) => {
      try {
        await deleteBankAccount(accountId);
        setAccounts((prev) => prev.filter((account) => account.id !== accountId));
      } catch (error) {
        console.error("Failed to delete bank account", error);
        Alert.alert("Unable to delete", "Please try again in a moment.");
      }
    },
    []
  );

  const confirmDeleteAccount = useCallback(
    (account) => {
      if (!account) {
        return;
      }
      Alert.alert(
        "Delete bank account",
        `Are you sure you want to remove ${account.name}? This won't delete past transactions.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => handleDeleteAccount(account.id),
          },
        ]
      );
    },
    [handleDeleteAccount]
  );

  const handleTabChange = (tab) => {
    if (tab === "bankAccounts") {
      return;
    }
    if (tab === "home") {
      navigation.navigate("Home");
    }
    if (tab === "notebook") {
      navigation.navigate("Notebook");
    }
  };

  const handleDrawerItemPress = useCallback((itemKey) => {
    setNavbarVisible(false);
    switch (itemKey) {
      case "profile":
        navigation.navigate("Profile");
        break;
      case "settings":
        Alert.alert(
          "User Settings",
          "Navigate to your profile to update personal details and app preferences."
        );
        break;
      case "security":
        Alert.alert(
          "Security & Privacy",
          "Biometric login, passcodes, and other security controls live here."
        );
        break;
      case "notifications":
        Alert.alert(
          "Notifications",
          "Configure push and email alerts from the notifications panel."
        );
        break;
      case "support":
        Alert.alert(
          "Help & Support",
          "Reach support@incomeexpense.app or browse FAQs from the help center."
        );
        break;
      case "theme":
        Alert.alert("Appearance", "Theme customization is coming soon!");
        break;
      case "feedback":
        Alert.alert(
          "Feedback",
          "We'd love to hear your ideas. Send feedback from the help center."
        );
        break;
      case "logout":
        try {
          auth.signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        } catch (error) {
          console.error("Sign out failed", error);
          Alert.alert("Error", "Failed to sign out. Please try again.");
        }
        break;
      default:
        break;
    }
  }, [navigation]);

  const handleLanguageChange = useCallback((langCode) => {
    setSelectedLanguage(langCode);
    setNavbarVisible(false);
  }, []);

  const modalTitle = editingAccount ? "Edit bank account" : "New bank account";
  const primaryActionLabel = submitting
    ? "Saving..."
    : editingAccount
    ? "Save changes"
    : "Save account";

  return (
    <SafeAreaView className="flex-1 bg-brand-surface">
      <AppHeader
        title="Bank Accounts"
        onMenuPress={() => setNavbarVisible(true)}
        rightIconName="account-balance"
        onRightPress={() => {}}
      />

      <Navigation activeTab="bankAccounts" onTabChange={handleTabChange} />

      <View className="bg-white px-4 py-3 border-b border-brand-sky-10">
        <Text className="text-sm text-brand-slate-600">Total balance</Text>
        <Text className="text-2xl font-bold text-brand-sky mt-1">{currencyBreakdownLabel}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4 space-y-6">
          <TouchableOpacity
            onPress={openCreateAccountModal}
            activeOpacity={0.9}
            className="bg-brand-sky rounded-2xl py-4 px-5 shadow-md flex-row items-center justify-center gap-3"
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
            <Text className="text-white text-base font-semibold">Add account</Text>
          </TouchableOpacity>

          <View className="bg-white rounded-2xl shadow-sm border border-brand-sky-10">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-semibold text-brand-slate-900">
                Your bank accounts
              </Text>
              <MaterialIcons name="account-balance-wallet" size={22} color="#0288D1" />
            </View>
            {loading ? (
              <View className="px-4 py-6 items-center">
                <Text className="text-sm text-brand-slate-600">Loading bank accounts...</Text>
              </View>
            ) : fetchError ? (
              <View className="px-4 py-6">
                <Text className="text-sm text-brand-error text-center">{fetchError}</Text>
              </View>
            ) : accounts.length === 0 ? (
              <View className="px-4 py-6 items-center">
                <Text className="text-sm text-brand-slate-600 text-center">
                  No accounts yet. Tap "Add account" above to create your first one.
                </Text>
              </View>
            ) : (
              accounts.map((account, index) => (
                <TouchableOpacity
                  key={account.id}
                  className={`px-4 py-4 border-b border-gray-100 ${
                    index === accounts.length - 1 ? "border-b-0" : ""
                  }`}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("BankAccountDetail", { accountId: account.id })}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-base font-semibold text-brand-slate-900">
                        {account.name}
                      </Text>
                      <Text className="text-xs text-brand-slate-500 mt-1">{account.type}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-lg font-bold text-brand-sky">
                        {formatCurrency(account.balance, account.currency)}
                      </Text>
                      <AccountActionsMenu
                        onEdit={() => handleEditAccountPress(account)}
                        onDelete={() => confirmDeleteAccount(account)}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={isAddAccountModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setEditingAccount(null);
          setAddAccountModalVisible(false);
        }}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <View>
              <Text className="text-lg font-semibold text-brand-slate-900">{modalTitle}</Text>
              <Text className="text-xs text-brand-slate-500 mt-1">
                Keep balances and currencies accurate from the start.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setAddAccountModalVisible(false);
                setEditingAccount(null);
                setFormError("");
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView
            className="flex-1 px-5"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 12 }}
          >
            <View className="space-y-5">
              <View>
                <Text className="text-sm font-semibold text-brand-slate-700 mb-1">Account name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Vacation Savings"
                  className="bg-brand-input rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-semibold text-brand-slate-700 mb-1">Account type</Text>
                <TextInput
                  value={type}
                  onChangeText={setType}
                  placeholder="Savings, Checking, Card..."
                  className="bg-brand-input rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-semibold text-brand-slate-700 mb-1">
                  Starting balance
                </Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="bg-brand-input rounded-xl px-4 py-3 text-base"
                />
                <Text className="text-[11px] text-brand-slate-500 mt-1">
                  Enter current amount for this account.
                </Text>
              </View>
              <View>
                <Text className="text-sm font-semibold text-brand-slate-700 mb-1">Currency</Text>
                <TouchableOpacity
                  onPress={() => setCurrencyPickerVisible(true)}
                  className="bg-brand-input rounded-xl px-4 py-3 flex-row items-center justify-between"
                  activeOpacity={0.85}
                >
                  <View>
                    <Text className="text-base font-semibold">
                      {currency?.value || currency?.label || "USD"}
                    </Text>
                    <Text className="text-[11px] text-brand-slate-500">
                      {currency?.label || ""}
                    </Text>
                  </View>
                  <MaterialIcons name="expand-more" size={22} color="#6B7280" />
                </TouchableOpacity>
                <Text className="text-[11px] text-brand-slate-500 mt-2">
                  Tap to search and select a currency.
                </Text>
              </View>
              {formError ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <Text className="text-sm text-brand-error">{formError}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
          <View className="flex-row gap-3 px-5 pb-6 pt-3 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => {
                setAddAccountModalVisible(false);
                setEditingAccount(null);
                setFormError("");
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-brand-slate-200 bg-white"
              activeOpacity={0.85}
            >
              <Text className="text-sm font-semibold text-center text-brand-slate-700">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveAccount}
              activeOpacity={0.85}
              className={`flex-1 bg-brand-sky rounded-xl px-5 py-3 items-center justify-center shadow-sm ${
                submitting ? "opacity-70" : ""
              }`}
              disabled={submitting}
            >
              <Text className="text-white text-sm font-semibold">{primaryActionLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CurrencyPickerModal
        visible={isCurrencyPickerVisible}
        selectedCurrency={currency}
        onClose={() => setCurrencyPickerVisible(false)}
        onSelect={(selected) => setCurrency(selected)}
      />
      <NavbarDrawer
        visible={isNavbarVisible}
        onClose={() => setNavbarVisible(false)}
        language={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        user={auth.currentUser}
        onItemPress={handleDrawerItemPress}
      />
    </SafeAreaView>
  );
}

const currencyPickerStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 18,
    paddingBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  pickerCloseButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginHorizontal: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#0f172a",
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  currencyItemActive: {
    backgroundColor: "#f0f9ff",
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  currencyCodeActive: {
    color: "#0288D1",
  },
  currencyLabel: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  currencyLabelActive: {
    color: "#0369a1",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    color: "#94a3b8",
    fontSize: 15,
  },
});
