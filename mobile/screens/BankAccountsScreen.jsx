import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView as RNSafeAreaView,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import api from "../src/api/client";
import Navigation from "../components/Navigation";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const TouchableOpacity = styled(RNTouchableOpacity);

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BankAccountsScreen({ navigation }) {
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const response = await api.get("/bank-accounts/");
      const data = Array.isArray(response.data) ? response.data : [];
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

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
  }, [accounts]);

  const handleAddAccount = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedType = type.trim();
    const parsedBalance = Number(balance);

    if (!trimmedName || !trimmedType || Number.isNaN(parsedBalance)) {
      setFormError("Please provide a name, type, and numeric balance.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const response = await api.post("/bank-accounts/", {
        name: trimmedName,
        type: trimmedType,
        balance: parsedBalance,
      });

      setAccounts((prev) => [response.data, ...prev]);
      setName("");
      setType("");
      setBalance("");
    } catch (error) {
      console.error("Failed to create bank account", error);
      setFormError("Unable to add bank account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [balance, name, type]);

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
              {formError ? (
                <Text className="text-sm text-brand-error">{formError}</Text>
              ) : null}
              <TouchableOpacity
                onPress={handleAddAccount}
                activeOpacity={0.85}
                className={`bg-brand-sky rounded-2xl py-3 items-center justify-center shadow-sm ${
                  submitting ? "opacity-70" : ""
                }`}
                disabled={submitting}
              >
                <Text className="text-white text-base font-semibold">
                  {submitting ? "Adding..." : "Add account"}
                </Text>
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
