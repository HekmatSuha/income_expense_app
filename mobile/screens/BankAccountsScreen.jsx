import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import {
  addBankAccount,
  getBankAccounts,
  updateBankAccount,
  deleteBankAccount,
} from "../services/bankAccountRepository";
import Navigation from "../components/Navigation";
import AccountActionsMenu from "../components/menus/AccountActionsMenu";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const TouchableOpacity = styled(RNTouchableOpacity);
import { currencies } from "../constants/currencies";

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

  const modalTitle = editingAccount ? "Edit bank account" : "New bank account";
  const primaryActionLabel = submitting
    ? "Saving..."
    : editingAccount
    ? "Save changes"
    : "Save account";

  return (
    <SafeAreaView className="flex-1 bg-brand-surface">
      <View className="bg-brand-sky px-4 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-semibold">Bank Accounts</Text>
          <View className="bg-white-15 rounded-full p-3">
            <MaterialIcons name="account-balance" size={24} color="#FFFFFF" />
          </View>
        </View>
        <View className="mt-4">
          <Text className="text-white text-sm">Total balance</Text>
          <Text className="text-white text-2xl font-bold mt-1">
            {currencyBreakdownLabel}
          </Text>
        </View>
      </View>

      <Navigation activeTab="bankAccounts" onTabChange={handleTabChange} />

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
                  No accounts yet. Tap “Add account” above to create your first one.
                </Text>
              </View>
            ) : (
              accounts.map((account, index) => (
                <View
                  key={account.id}
                  className={`px-4 py-4 border-b border-gray-100 ${
                    index === accounts.length - 1 ? "border-b-0" : ""
                  }`}
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
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={isAddAccountModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setEditingAccount(null);
          setAddAccountModalVisible(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white rounded-3xl w-full p-5">
            <Text className="text-lg font-semibold text-brand-slate-900 mb-4">
              {modalTitle}
            </Text>
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-brand-slate-600 mb-1">Account name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Vacation Savings"
                  className="bg-brand-input rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-brand-slate-600 mb-1">Account type</Text>
                <TextInput
                  value={type}
                  onChangeText={setType}
                  placeholder="Savings, Checking, ..."
                  className="bg-brand-input rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-brand-slate-600 mb-1">Starting balance</Text>
                <TextInput
                  value={balance}
                  onChangeText={setBalance}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="bg-brand-input rounded-xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-brand-slate-600 mb-1">Currency</Text>
                <TouchableOpacity
                  onPress={() => setCurrencyPickerVisible(true)}
                  className="bg-brand-input rounded-xl px-4 py-3"
                >
                  <Text className="text-base">{currency?.label || currency?.value || "USD"}</Text>
                </TouchableOpacity>
              </View>
              {formError ? (
                <Text className="text-sm text-brand-error">{formError}</Text>
              ) : null}
              <View className="flex-row justify-end gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => {
                    setAddAccountModalVisible(false);
                    setEditingAccount(null);
                    setFormError("");
                  }}
                  className="px-4 py-3 rounded-xl border border-brand-slate-200"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-semibold text-brand-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveAccount}
                  activeOpacity={0.85}
                  className={`bg-brand-sky rounded-xl px-5 py-3 items-center justify-center shadow-sm ${
                    submitting ? "opacity-70" : ""
                  }`}
                  disabled={submitting}
                >
                  <Text className="text-white text-sm font-semibold">
                    {primaryActionLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isCurrencyPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCurrencyPickerVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl w-11/12 max-h-3/4">
            <FlatList
              data={currencies}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCurrency(item);
                    setCurrencyPickerVisible(false);
                  }}
                  className="p-4 border-b border-gray-200"
                >
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
