import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  TouchableOpacity as RNTouchableOpacity,
  TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import AppHeader from "../components/AppHeader";
import { getBankAccounts } from "../services/bankAccountRepository";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";
import { subscribeToRemoteTransactions } from "../services/transactions";
import { persistTransaction } from "../services/transactionRepository";
import { MaterialIcons } from "@expo/vector-icons";

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);
const Text = styled(RNText);
const ScrollView = styled(RNScrollView);
const TouchableOpacity = styled(RNTouchableOpacity);
const TextInput = styled(RNTextInput);

const sanitizeAccountKey = (value) => (value || "").trim().toLowerCase();

export default function BankAccountDetailScreen({ route, navigation }) {
  const { accountId } = route.params || {};
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const unsubscribeRef = useRef(null);
  const userId = auth.currentUser?.uid || LOCAL_USER_ID;

  const filterForAccount = useCallback(
    (items) => {
      if (!account?.name) return [];
      const key = sanitizeAccountKey(account.name);
      return items
        .filter((tx) => sanitizeAccountKey(tx?.paymentAccount) === key)
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    },
    [account?.name]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const accounts = await getBankAccounts();
      const found = accounts.find((item) => item.id === accountId);
      setAccount(found || null);

      if (auth.currentUser?.uid) {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        const unsub = subscribeToRemoteTransactions(auth.currentUser.uid, {
          onData: async (items) => {
            const filtered = filterForAccount(items);
            setTransactions(filtered);
            try {
              await setTransactionsForUser(auth.currentUser.uid, items);
            } catch (error) {
              console.warn("Failed to cache transactions", error);
            }
          },
          onError: async (error) => {
            console.warn("Failed to sync remote transactions", error);
            const localItems = await getTransactionsForUser(auth.currentUser.uid);
            setTransactions(filterForAccount(localItems));
          },
        });
        unsubscribeRef.current = unsub;
      } else {
        const localItems = await getTransactionsForUser(userId);
        setTransactions(filterForAccount(localItems));
      }
    } catch (error) {
      console.error("Failed to load account detail", error);
      Alert.alert("Error", "Could not load this account right now.");
    } finally {
      setLoading(false);
    }
  }, [accountId, filterForAccount, userId]);

  useEffect(() => {
    loadData();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadData]);

  const handleQuickAdd = async (type) => {
    const numericAmount = Number(amountInput.replace(/,/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Amount required", "Enter a positive amount.");
      return;
    }
    if (!account) {
      Alert.alert("Account missing", "Account not found.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        amount: numericAmount,
        type,
        category: type === "INCOME" ? "Deposit" : "Withdrawal",
        paymentMethod: account.type || "Bank",
        paymentAccount: account.name,
        currency: account.currency || "USD",
        note: noteInput.trim(),
        createdAt: new Date().toISOString(),
      };
      const result = await persistTransaction(payload);
      if (result?.transaction) {
        setTransactions((prev) => filterForAccount([result.transaction, ...prev]));
      }
      setAmountInput("");
      setNoteInput("");
    } catch (error) {
      console.error("Failed to save transaction", error);
      Alert.alert("Error", "Could not save this transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = account?.name || "Account";
  const balanceLabel = useMemo(() => {
    if (!account) return "";
    const amount = Number(account.balance);
    const formatted = Number.isFinite(amount)
      ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "0.00";
    return `${account.currency || "USD"} ${formatted}`;
  }, [account]);

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <AppHeader
        title={headerTitle}
        onMenuPress={() => navigation.goBack()}
        leftIconName="arrow-back-ios"
        rightIconName="account-balance-wallet"
        onRightPress={() => {}}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4">
          <View className="rounded-2xl bg-card-light border border-gray-200 p-4 mb-4">
            <Text className="text-xs font-semibold text-text-secondary-light mb-1">
              Current balance
            </Text>
            <Text className="text-2xl font-bold text-text-light">{balanceLabel}</Text>
            <Text className="text-xs text-text-secondary-light mt-1">{account?.type}</Text>
          </View>

          <View className="rounded-2xl bg-card-light border border-gray-200 p-4 mb-4">
            <Text className="text-base font-semibold text-text-light mb-2">Quick add</Text>
            <TextInput
              placeholder="Amount"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-3"
            />
            <TextInput
              placeholder="Note (optional)"
              placeholderTextColor="#94A3B8"
              value={noteInput}
              onChangeText={setNoteInput}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-3"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-xl bg-income px-4 py-3 items-center"
                activeOpacity={0.85}
                disabled={submitting}
                onPress={() => handleQuickAdd("INCOME")}
              >
                <Text className="text-white font-semibold">Add money</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl bg-expense px-4 py-3 items-center"
                activeOpacity={0.85}
                disabled={submitting}
                onPress={() => handleQuickAdd("EXPENSE")}
              >
                <Text className="text-white font-semibold">Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="rounded-2xl bg-card-light border border-gray-200 p-4">
            <Text className="text-base font-semibold text-text-light mb-3">History</Text>
            {loading ? (
              <Text className="text-sm text-text-secondary-light">Loading transactions...</Text>
            ) : transactions.length === 0 ? (
              <Text className="text-sm text-text-secondary-light">No transactions yet.</Text>
            ) : (
              transactions.map((tx) => {
                const amount = Number(tx.amount) || 0;
                const formatted = amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const isIncome = (tx.type || "").toUpperCase() === "INCOME";
                const dateLabel = tx.dateLabel || new Date(tx.createdAt || tx.date).toLocaleString();
                return (
                  <View
                    key={tx.id}
                    className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-text-light" numberOfLines={1}>
                        {tx.category || (isIncome ? "Deposit" : "Withdrawal")}
                      </Text>
                      {tx.note ? (
                        <Text className="text-xs text-text-secondary-light mt-0.5" numberOfLines={2}>
                          {tx.note}
                        </Text>
                      ) : null}
                      <Text className="text-[11px] text-text-secondary-light mt-0.5">
                        {dateLabel}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-base font-bold ${isIncome ? "text-income" : "text-expense"}`}
                      >
                        {`${tx.currency || account?.currency || "USD"} ${formatted}`}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
