import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  Modal,
  TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import {
  addTransaction,
  subscribeToRemoteTransactions,
} from "../services/transactions";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";
import DateTimePicker from "@react-native-community/datetimepicker";
import AddTransaction from "../components/AddTransaction";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const TextInput = styled(RNTextInput);

const periodFilters = ["ALL", "TODAY", "WEEK", "MONTH", "CUSTOM"];
const typeFilters = ["ALL", "INCOME", "EXPENSE", "TRANSFER"];
const DEFAULT_CURRENCY = "USD";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getPeriodRange = (period, startDate, endDate) => {
  const now = new Date();
  switch (period) {
    case "TODAY":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "WEEK":
      return { from: startOfWeek(now), to: endOfDay(now) };
    case "MONTH":
      return { from: startOfMonth(now), to: endOfDay(now) };
    case "CUSTOM": {
      const from = startDate ? startOfDay(startDate) : startOfDay(now);
      const to = endDate ? endOfDay(endDate) : endOfDay(now);
      if (from > to) {
        return { from: to, to: from };
      }
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
};

const toDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

const formatCurrencyValue = (value, currency = DEFAULT_CURRENCY) => {
  const numeric = Number(value) || 0;
  const formatted = Math.abs(numeric).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = numeric < 0 ? "-" : "";
  return `${prefix}${currency.toUpperCase()} ${formatted}`;
};

const formatDateParts = (value) => {
  const date = toDate(value);
  if (!date) {
    return { dateLabel: "-", timeLabel: "" };
  }
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { dateLabel, timeLabel };
};

const TransactionRow = ({ transaction }) => {
  const isIncome = transaction.type === "INCOME";
  const amountClass = isIncome ? "text-green-600" : "text-red-500";
  return (
    <View className="px-4 py-3 border-b border-gray-100 bg-white">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-gray-900">
            {transaction.category || transaction.type}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {transaction.paymentMethod} • {transaction.paymentAccount || "Unspecified"}
          </Text>
          {transaction.note ? (
            <Text className="text-xs text-gray-500 mt-1">{transaction.note}</Text>
          ) : null}
        </View>
        <Text className={`text-base font-bold ${amountClass}`}>
          {transaction.displayAmount}
        </Text>
      </View>
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-xs text-gray-400">{transaction.timeLabel}</Text>
        {transaction.attachmentsCount ? (
          <Text className="text-xs text-gray-400">
            {transaction.attachmentsCount} attachments
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    type: "ALL",
    paymentMethod: "ALL",
    currency: "ALL",
    period: "ALL",
    minAmount: "",
    maxAmount: "",
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
  });
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isSettingStartDate, setIsSettingStartDate] = useState(true);
  const [isAddTransactionModalVisible, setAddTransactionModalVisible] =
    useState(false);
  const uid = auth.currentUser?.uid;

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!uid) {
      getTransactionsForUser(LOCAL_USER_ID)
        .then((items) => {
          if (isMounted) {
            setTransactions(items);
          }
        })
        .catch((error) => {
          console.error("Failed to load local transactions", error);
          if (isMounted) {
            setTransactions([]);
          }
        });
      return () => {
        isMounted = false;
      };
    }

    const unsubscribe = subscribeToRemoteTransactions(uid, {
      onData: async (items) => {
        if (isMounted) {
          setTransactions(items);
        }
        try {
          await setTransactionsForUser(uid, items);
        } catch (error) {
          console.error("Failed to cache transactions locally", error);
        }
      },
      onError: async (error) => {
        console.error("Failed to load transactions from Firestore", error);
        try {
          const localItems = await getTransactionsForUser(uid);
          if (isMounted) {
            setTransactions(localItems);
          }
        } catch (localError) {
          console.error("Failed to load cached transactions", localError);
          if (isMounted) {
            setTransactions([]);
          }
        }
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [uid]);

  const normalizedTransactions = useMemo(() => {
    return transactions.map((transaction) => {
      const type = (transaction?.type || "EXPENSE").toUpperCase();
      const timestamp =
        toDate(transaction.date || transaction.createdAt || transaction.time) ||
        new Date();
      const currency = (transaction.currency || DEFAULT_CURRENCY).toUpperCase();
      const amountValue = Number(transaction.amount) || 0;
      const { dateLabel, timeLabel } = formatDateParts(timestamp);
      return {
        ...transaction,
        id:
          transaction.id ||
          `${timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        currency,
        timestamp,
        amountValue,
        amountAbs: Math.abs(amountValue),
        displayAmount: formatCurrencyValue(amountValue, currency),
        dateLabel,
        timeLabel,
        paymentMethod: transaction.paymentMethod || "Other",
        paymentAccount: transaction.paymentAccount || "Unspecified",
        note: transaction.note || "",
        attachmentsCount: Array.isArray(transaction.attachments)
          ? transaction.attachments.length
          : 0,
      };
    });
  }, [transactions]);

  const paymentMethodOptions = useMemo(() => {
    const unique = new Set(
      normalizedTransactions.map((tx) => tx.paymentMethod).filter(Boolean)
    );
    return ["ALL", ...unique];
  }, [normalizedTransactions]);

  const currencyOptions = useMemo(() => {
    const unique = new Set(normalizedTransactions.map((tx) => tx.currency));
    return ["ALL", ...unique];
  }, [normalizedTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const minAmountValue = Number(filters.minAmount);
    const maxAmountValue = Number(filters.maxAmount);
    const hasMin = filters.minAmount !== "" && !Number.isNaN(minAmountValue);
    const hasMax = filters.maxAmount !== "" && !Number.isNaN(maxAmountValue);
    const { from, to } = getPeriodRange(
      filters.period,
      filters.startDate,
      filters.endDate
    );

    return normalizedTransactions
      .filter((transaction) => {
        if (filters.type !== "ALL" && transaction.type !== filters.type) {
          return false;
        }
        if (
          filters.paymentMethod !== "ALL" &&
          transaction.paymentMethod !== filters.paymentMethod
        ) {
          return false;
        }
        if (
          filters.currency !== "ALL" &&
          transaction.currency !== filters.currency
        ) {
          return false;
        }
        if (hasMin && transaction.amountAbs < minAmountValue) {
          return false;
        }
        if (hasMax && transaction.amountAbs > maxAmountValue) {
          return false;
        }
        if (from && transaction.timestamp < from) {
          return false;
        }
        if (to && transaction.timestamp > to) {
          return false;
        }
        if (query) {
          const haystack = [
            transaction.category,
            transaction.note,
            transaction.paymentMethod,
            transaction.paymentAccount,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [normalizedTransactions, filters]);

  const handleClearFilters = useCallback(() => {
    const now = new Date();
    setFilters({
      query: "",
      type: "ALL",
      paymentMethod: "ALL",
      currency: "ALL",
      period: "ALL",
      minAmount: "",
      maxAmount: "",
      startDate: startOfDay(now),
      endDate: endOfDay(now),
    });
  }, []);

  const handleDateChange = (_, selectedDate) => {
    if (!selectedDate) {
      setDatePickerVisible(false);
      return;
    }
    const normalized = isSettingStartDate
      ? startOfDay(selectedDate)
      : endOfDay(selectedDate);
    setDatePickerVisible(false);
    updateFilter(isSettingStartDate ? "startDate" : "endDate", normalized);
  };

  const showDatePicker = (isStart) => {
    setIsSettingStartDate(isStart);
    setDatePickerVisible(true);
  };

  const handleAddTransaction = async (transaction) => {
    if (uid) {
      await addTransaction(uid, transaction);
    } else {
      const newTransactions = [...transactions, transaction];
      setTransactions(newTransactions);
      await setTransactionsForUser(LOCAL_USER_ID, newTransactions);
    }
  };

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce(
          (sum, transaction) => sum + (Number(transaction.amount) || 0),
          0
        ),
    [filteredTransactions]
  );

  const totalExpense = useMemo(
    () =>
      filteredTransactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce(
          (sum, transaction) => sum + (Number(transaction.amount) || 0),
          0
        ),
    [filteredTransactions]
  );

  const balance = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  );

  const groupedTransactions = useMemo(() => {
    const groups = filteredTransactions.reduce((bucket, transaction) => {
      const key = transaction.dateLabel;
      if (!bucket[key]) {
        bucket[key] = [];
      }
      bucket[key].push(transaction);
      return bucket;
    }, {});
    return Object.entries(groups);
  }, [filteredTransactions]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 bg-gray-100">
        <View className="bg-white shadow-sm">
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                className="p-2"
                activeOpacity={0.7}
                onPress={() => {
                  if (navigation.canGoBack?.()) {
                    navigation.goBack();
                  }
                }}
              >
                <Feather name="arrow-left" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text className="text-gray-800 text-xl font-semibold">
                Transactions
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="p-2"
                activeOpacity={0.7}
                onPress={() => setAddTransactionModalVisible(true)}
              >
                <Feather name="plus" size={22} color="#1f2937" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2" activeOpacity={0.7}>
                <Feather name="search" size={22} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="bg-white border-b border-gray-200">
          <View className="flex-row">
            <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
              <Text className="text-xs text-gray-600">Total Income</Text>
              <Text className="text-green-600 text-base font-semibold">
                {formatCurrencyValue(totalIncome)}
              </Text>
            </View>
            <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
              <Text className="text-xs text-red-600">Total Expense</Text>
              <Text className="text-red-600 text-base font-semibold">
                {formatCurrencyValue(-Math.abs(totalExpense))}
              </Text>
            </View>
            <View className="flex-1 items-center justify-center py-4">
              <Text className="text-xs text-gray-700">Balance</Text>
              <Text className="text-gray-900 text-base font-semibold">
                {formatCurrencyValue(balance)}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-2">
            <Feather name="search" size={18} color="#6B7280" />
            <TextInput
              className="flex-1 px-2 text-sm text-gray-700"
              placeholder="Search by category, note, account, method..."
              value={filters.query}
              onChangeText={(text) => updateFilter("query", text)}
              placeholderTextColor="#9CA3AF"
            />
            {filters.query ? (
              <TouchableOpacity onPress={() => updateFilter("query", "")}>
                <Feather name="x-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View className="bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3 px-4 py-3">
              {typeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  className={`px-4 py-2 rounded-full ${
                    filters.type === filter ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  onPress={() => updateFilter("type", filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filters.type === filter ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {filter === "ALL" ? "All" : filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3 px-4 py-3">
              {paymentMethodOptions.map((method) => (
                <TouchableOpacity
                  key={method}
                  className={`px-4 py-2 rounded-full ${
                    filters.paymentMethod === method
                      ? "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                  onPress={() => updateFilter("paymentMethod", method)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filters.paymentMethod === method
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {method === "ALL" ? "All Methods" : method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3 px-4 py-3">
              {currencyOptions.map((currency) => (
                <TouchableOpacity
                  key={currency}
                  className={`px-4 py-2 rounded-full ${
                    filters.currency === currency
                      ? "bg-purple-500"
                      : "bg-gray-200"
                  }`}
                  onPress={() => updateFilter("currency", currency)}
                  activeOpacity={0.8}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filters.currency === currency
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {currency === "ALL" ? "All Currencies" : currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Min amount</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                keyboardType="numeric"
                placeholder="0.00"
                value={filters.minAmount}
                onChangeText={(text) =>
                  updateFilter("minAmount", text.replace(/[^0-9.]/g, ""))
                }
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Max amount</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                keyboardType="numeric"
                placeholder="0.00"
                value={filters.maxAmount}
                onChangeText={(text) =>
                  updateFilter("maxAmount", text.replace(/[^0-9.]/g, ""))
                }
              />
            </View>
          </View>
        </View>

        <View className="bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3 px-4 py-3">
              {periodFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  className={`px-4 py-2 rounded-full ${
                    filters.period === filter ? "bg-indigo-500" : "bg-gray-200"
                  }`}
                  activeOpacity={0.8}
                  onPress={() => {
                    updateFilter("period", filter);
                    if (filter === "CUSTOM") {
                      setDatePickerVisible(true);
                    }
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      filters.period === filter ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {filter === "ALL"
                      ? "All time"
                      : filter === "TODAY"
                      ? "Today"
                      : filter === "WEEK"
                      ? "This week"
                      : filter === "MONTH"
                      ? "This month"
                      : "Custom"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {filters.period === "CUSTOM" ? (
            <View className="px-4 pb-3">
              <View className="flex-row justify-between">
                <TouchableOpacity
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 mr-2"
                  onPress={() => showDatePicker(true)}
                >
                  <Text className="text-xs text-gray-500">Start date</Text>
                  <Text className="text-sm text-gray-800">
                    {filters.startDate
                      ? filters.startDate.toLocaleDateString()
                      : "-"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 ml-2"
                  onPress={() => showDatePicker(false)}
                >
                  <Text className="text-xs text-gray-500">End date</Text>
                  <Text className="text-sm text-gray-800">
                    {filters.endDate
                      ? filters.endDate.toLocaleDateString()
                      : "-"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          <View className="px-4 pb-3">
            <TouchableOpacity
              className="self-end px-3 py-2 rounded-full bg-gray-200"
              onPress={handleClearFilters}
            >
              <Text className="text-xs font-semibold text-gray-700">
                Clear filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {groupedTransactions.length === 0 ? (
              <View className="px-4 py-10 items-center">
                <Text className="text-gray-500 text-sm">
                  No transactions match your filters.
                </Text>
              </View>
            ) : (
              groupedTransactions.map(([date, dayTransactions]) => (
                <View key={date} className="mt-4">
                  <View className="px-4 py-2 bg-gray-200">
                    <Text className="text-gray-600 font-semibold">{date}</Text>
                  </View>
                  {dayTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-lg p-5 w-5/6">
              <Text className="text-lg font-bold mb-4">Select Date Range</Text>
              <View className="flex-row justify-around mb-4">
                <TouchableOpacity
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  onPress={() => showDatePicker(true)}
                >
                  <Text className="text-xs text-gray-500">Start date</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {filters.startDate
                      ? filters.startDate.toLocaleDateString()
                      : "-"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  onPress={() => showDatePicker(false)}
                >
                  <Text className="text-xs text-gray-500">End date</Text>
                  <Text className="text-sm font-semibold text-gray-800">
                    {filters.endDate
                      ? filters.endDate.toLocaleDateString()
                      : "-"}
                  </Text>
                </TouchableOpacity>
              </View>
              {isDatePickerVisible && (
                <DateTimePicker
                  value={
                    isSettingStartDate
                      ? filters.startDate || new Date()
                      : filters.endDate || new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
              <TouchableOpacity
                className="mt-4 px-4 py-2 rounded-full bg-blue-500 self-end"
                onPress={() => setDatePickerVisible(false)}
              >
                <Text className="text-white font-semibold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <AddTransaction
          isVisible={isAddTransactionModalVisible}
          onClose={() => setAddTransactionModalVisible(false)}
          onAddTransaction={handleAddTransaction}
        />
      </View>
    </SafeAreaView>
  );
}
