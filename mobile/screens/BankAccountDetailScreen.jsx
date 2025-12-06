import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  TouchableOpacity as RNTouchableOpacity,
  TextInput as RNTextInput,
  Platform,
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
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

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
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [rangeFilter, setRangeFilter] = useState("30"); // 7 | 30 | 90 | ALL
  const [searchTerm, setSearchTerm] = useState("");
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState("start");
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const handleQuickAdd = useCallback(
    async (type) => {
      const numericAmount = Number((amountInput || "").replace(/,/g, ""));
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
    },
    [account, amountInput, noteInput, filterForAccount]
  );

  const headerTitle = account?.name || "Account";
  const balanceLabel = useMemo(() => {
    if (!account) return "";
    const amount = Number(account.balance);
    const formatted = Number.isFinite(amount)
      ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "0.00";
    return `${account.currency || "USD"} ${formatted}`;
  }, [account]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const days = rangeFilter === "ALL" ? null : Number(rangeFilter);
    const rangeStart = days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;
    const customStart = startDateFilter ? new Date(startDateFilter) : null;
    const customEnd = endDateFilter ? new Date(endDateFilter) : null;
    return transactions.filter((tx) => {
      const type = (tx.type || "").toUpperCase();
      if (typeFilter !== "ALL" && type !== typeFilter) {
        return false;
      }
      const createdAt = new Date(tx.createdAt || tx.date);
      if (rangeStart && createdAt < rangeStart) {
        return false;
      }
      if (customStart && createdAt < customStart) {
        return false;
      }
      if (customEnd && createdAt > customEnd) {
        return false;
      }
      if (searchTerm.trim()) {
        const haystack = `${tx.category || ""} ${tx.note || ""}`.toLowerCase();
        if (!haystack.includes(searchTerm.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [endDateFilter, rangeFilter, searchTerm, startDateFilter, transactions, typeFilter]);

  const insightSummary = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    const categoryMap = new Map();
    filteredTransactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if ((tx.type || "").toUpperCase() === "INCOME") {
        incomeTotal += amount;
      } else {
        expenseTotal += Math.abs(amount);
      }
      const key = tx.category || "Uncategorized";
      categoryMap.set(key, (categoryMap.get(key) || 0) + Math.abs(amount));
    });
    const topCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0];
    return {
      incomeTotal,
      expenseTotal,
      net: incomeTotal - expenseTotal,
      topCategoryName: topCategory ? topCategory[0] : "None yet",
      topCategoryValue: topCategory ? topCategory[1] : 0,
    };
  }, [filteredTransactions]);

  const formatCurrency = useCallback(
    (value) => {
      const amount = Number(value) || 0;
      return `${account?.currency || "USD"} ${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [account?.currency]
  );

  const formatDateLabel = useCallback((value, placeholder) => {
    if (!value) return placeholder;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return placeholder;
    return date.toLocaleDateString();
  }, []);

  const openDatePicker = useCallback(
    (target) => {
      const baseValue = target === "start" ? startDateFilter : endDateFilter;
      const initial = baseValue ? new Date(baseValue) : new Date();
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          mode: "date",
          value: initial,
          onChange: (_, selectedDate) => {
            if (!selectedDate) return;
            if (target === "start") {
              setStartDateFilter(selectedDate);
            } else {
              setEndDateFilter(selectedDate);
            }
          },
        });
        return;
      }
      setPickerTarget(target);
      setIosPickerValue(initial);
      setIosPickerVisible(true);
    },
    [endDateFilter, startDateFilter]
  );

  const handleIOSPickerChange = useCallback((_, selectedDate) => {
    if (selectedDate) {
      setIosPickerValue(selectedDate);
    }
  }, []);

  const handleIOSPickerConfirm = useCallback(() => {
    if (pickerTarget === "start") {
      setStartDateFilter(iosPickerValue);
    } else {
      setEndDateFilter(iosPickerValue);
    }
    setIosPickerVisible(false);
  }, [iosPickerValue, pickerTarget]);

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
            <Text className="text-base font-semibold text-text-light mb-3">Insights</Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="w-[48%] rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                <Text className="text-[11px] text-text-secondary-light mb-1">Net change</Text>
                <Text
                  className={`text-xl font-extrabold ${insightSummary.net >= 0 ? "text-income" : "text-expense"}`}
                  numberOfLines={1}
                >
                  {formatCurrency(insightSummary.net)}
                </Text>
                <Text className="text-[11px] text-text-secondary-light mt-1">vs selected range</Text>
              </View>
              <View className="w-[48%] rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                <Text className="text-[11px] text-text-secondary-light mb-1">Inflow</Text>
                <Text className="text-xl font-extrabold text-income" numberOfLines={1}>
                  {formatCurrency(insightSummary.incomeTotal)}
                </Text>
              </View>
              <View className="w-[48%] rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                <Text className="text-[11px] text-text-secondary-light mb-1">Outflow</Text>
                <Text className="text-xl font-extrabold text-expense" numberOfLines={1}>
                  {formatCurrency(insightSummary.expenseTotal)}
                </Text>
              </View>
              <View className="w-[48%] rounded-2xl bg-white border border-gray-200 p-3 shadow-sm">
                <Text className="text-[11px] text-text-secondary-light mb-1">Top category</Text>
                <Text className="text-base font-semibold text-text-light" numberOfLines={1}>
                  {insightSummary.topCategoryName}
                </Text>
                {insightSummary.topCategoryValue > 0 ? (
                  <Text className="text-[12px] text-text-secondary-light" numberOfLines={1}>
                    {formatCurrency(insightSummary.topCategoryValue)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View className="rounded-2xl bg-card-light border border-gray-200 p-4">
            <Text className="text-base font-semibold text-text-light mb-3">History</Text>
            <View className="flex-row gap-2 mb-3">
              {["ALL", "INCOME", "EXPENSE"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setTypeFilter(type)}
                  className={`px-3 py-2 rounded-full border ${
                    typeFilter === type ? "border-primary bg-primary/10" : "border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      typeFilter === type ? "text-primary" : "text-text-secondary-light"
                    }`}
                  >
                    {type === "ALL" ? "All" : type === "INCOME" ? "Income" : "Expense"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2 mb-3">
              {[
                { label: "7d", value: "7" },
                { label: "30d", value: "30" },
                { label: "90d", value: "90" },
                { label: "All", value: "ALL" },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.value}
                  onPress={() => setRangeFilter(chip.value)}
                  className={`px-3 py-2 rounded-full border ${
                    rangeFilter === chip.value ? "border-primary bg-primary/10" : "border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      rangeFilter === chip.value ? "text-primary" : "text-text-secondary-light"
                    }`}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2 mb-3">
              <TouchableOpacity
                onPress={() => openDatePicker("start")}
                className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
              >
                <Text className="text-[11px] text-text-secondary-light mb-1">From</Text>
                <Text className="text-sm font-semibold text-text-light">
                  {formatDateLabel(startDateFilter, "Start date")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openDatePicker("end")}
                className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
              >
                <Text className="text-[11px] text-text-secondary-light mb-1">To</Text>
                <Text className="text-sm font-semibold text-text-light">
                  {formatDateLabel(endDateFilter, "End date")}
                </Text>
              </TouchableOpacity>
              {(startDateFilter || endDateFilter) ? (
                <TouchableOpacity
                  onPress={() => {
                    setStartDateFilter(null);
                    setEndDateFilter(null);
                  }}
                  className="px-3 py-3 rounded-xl border border-gray-200 bg-white items-center justify-center"
                >
                  <Text className="text-xs font-semibold text-primary">Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by category or note"
              placeholderTextColor="#94A3B8"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-3"
            />
            <View className="rounded-2xl border border-gray-200 bg-white p-3 mb-4">
              <TouchableOpacity
                className="flex-row justify-between items-center"
                activeOpacity={0.85}
                onPress={() => setQuickAddOpen((prev) => !prev)}
              >
                <Text className="text-base font-semibold text-text-light">Quick add</Text>
                <MaterialIcons
                  name={isQuickAddOpen ? "expand-less" : "expand-more"}
                  size={22}
                  color="#111827"
                />
              </TouchableOpacity>
              {isQuickAddOpen ? (
                <View className="mt-3">
                  <TextInput
                    placeholder="Amount"
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    value={amountInput}
                    onChangeText={setAmountInput}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-2"
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
              ) : null}
            </View>
            {loading ? (
              <Text className="text-sm text-text-secondary-light">Loading transactions...</Text>
            ) : filteredTransactions.length === 0 ? (
              <Text className="text-sm text-text-secondary-light">No transactions yet.</Text>
            ) : (
              filteredTransactions.map((tx) => {
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
      {Platform.OS === "ios" && iosPickerVisible ? (
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-4">
          <DateTimePicker
            value={iosPickerValue}
            mode="date"
            display="spinner"
            onChange={handleIOSPickerChange}
            style={{ width: "100%" }}
          />
          <View className="flex-row justify-end gap-4 mt-3">
            <TouchableOpacity onPress={() => setIosPickerVisible(false)}>
              <Text className="text-sm font-semibold text-text-secondary-light">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleIOSPickerConfirm}>
              <Text className="text-sm font-semibold text-primary">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
