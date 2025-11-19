import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "../../packages/nativewind";
import { auth } from "../../firebase";
import { Feather } from "@expo/vector-icons";
import {
  addTransaction,
  subscribeToRemoteTransactions,
} from "../../services/transactions";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../../storage/transactions";
import DateTimePicker from "@react-native-community/datetimepicker";
import AddTransaction from "../../components/AddTransaction";
import Header from "./components/Header";
import Summary from "./components/Summary";
import FilterBar from "./components/FilterBar";
import TransactionsList from "./components/TransactionsList";
import {
  DEFAULT_CURRENCY,
  formatCurrencyValue,
  formatDateParts,
  toDate,
} from "../../utils/formatters";

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

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

export default function TransactionsScreen() {
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

  const summaryCurrency = useMemo(() => {
    if (filters.currency !== "ALL") {
      return filters.currency;
    }
    const unique = Array.from(
      new Set(filteredTransactions.map((tx) => tx.currency).filter(Boolean))
    );
    if (unique.length === 1) {
      return unique[0];
    }
    return filteredTransactions[0]?.currency || DEFAULT_CURRENCY;
  }, [filters.currency, filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = filteredTransactions.reduce((bucket, transaction) => {
      const key = transaction.dateLabel;
      if (!bucket[key]) {
        bucket[key] = [];
      }
      bucket[key].push(transaction);
      return bucket;
    }, {});

    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  }, [filteredTransactions]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 bg-gray-100 relative">
        <Header />
        <Summary
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={balance}
          currency={summaryCurrency}
        />
        <FilterBar
          filters={filters}
          updateFilter={updateFilter}
          paymentMethodOptions={paymentMethodOptions}
          currencyOptions={currencyOptions}
          handleClearFilters={handleClearFilters}
          showDatePicker={showDatePicker}
        />
        <TransactionsList groupedTransactions={groupedTransactions} />

        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-600/40 z-50"
          onPress={() => setAddTransactionModalVisible(true)}
          activeOpacity={0.9}
        >
          <Feather name="plus" size={28} color="white" />
        </TouchableOpacity>

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
