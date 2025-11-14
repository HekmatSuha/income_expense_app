import React, { useMemo, useState } from "react";
import {
  SafeAreaView as RNSafeAreaView,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import Navigation from "../components/Navigation";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const TouchableOpacity = styled(RNTouchableOpacity);

const INITIAL_ACCOUNTS = [
  { id: "1", name: "Main Checking", type: "Checking", balance: 2450.23 },
  { id: "2", name: "High Yield Savings", type: "Savings", balance: 10235.5 },
];

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BankAccountsScreen({ navigation }) {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
  }, [accounts]);

  const handleAddAccount = () => {
    const trimmedName = name.trim();
    const trimmedType = type.trim();
    const parsedBalance = Number(balance);

    if (!trimmedName || !trimmedType || Number.isNaN(parsedBalance)) {
      setError("Please provide a name, type, and numeric balance.");
      return;
    }

    const nextAccount = {
      id: `${Date.now()}`,
      name: trimmedName,
      type: trimmedType,
      balance: parsedBalance,
    };

    setAccounts((prev) => [nextAccount, ...prev]);
    setName("");
    setType("");
    setBalance("");
    setError("");
  };

  const handleTabChange = (tab) => {
    if (tab === "bankAccounts") {
      return;
    }
    if (tab === "home") {
      navigation.navigate("Home");
    }
    if (tab === "calendar") {
      navigation.navigate("Calendar");
    }
    if (tab === "notebook") {
      navigation.navigate("Notebook");
    }
  };

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
            ${formatCurrency(totalBalance)}
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
          <View className="bg-white rounded-2xl shadow-sm border border-brand-sky-15 p-4">
            <Text className="text-lg font-semibold text-brand-slate-900 mb-4">
              Create a new bank account
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
              {error ? (
                <Text className="text-sm text-brand-error">{error}</Text>
              ) : null}
              <TouchableOpacity
                onPress={handleAddAccount}
                activeOpacity={0.85}
                className="bg-brand-sky rounded-2xl py-3 items-center justify-center shadow-sm"
              >
                <Text className="text-white text-base font-semibold">Add account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white rounded-2xl shadow-sm border border-brand-sky-10">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-semibold text-brand-slate-900">
                Your bank accounts
              </Text>
              <MaterialIcons name="account-balance-wallet" size={22} color="#0288D1" />
            </View>
            {accounts.length === 0 ? (
              <View className="px-4 py-6 items-center">
                <Text className="text-sm text-brand-slate-600 text-center">
                  No accounts yet. Add your first bank account above.
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
                    <View className="items-end">
                      <Text className="text-lg font-bold text-brand-sky">
                        ${formatCurrency(account.balance)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
