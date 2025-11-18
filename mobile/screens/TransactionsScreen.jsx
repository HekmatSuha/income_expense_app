import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  Modal,
  Button,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import { subscribeToRemoteTransactions } from "../services/transactions";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";
import DateTimePicker from "@react-native-community/datetimepicker";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const timeFilters = ["All", "Daily", "Weekly", "Monthly", "Custom"];

const formatCurrency = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString();
};

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isSettingStartDate, setIsSettingStartDate] = useState(true);
  const uid = auth.currentUser?.uid;

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

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(
      now.setDate(now.getDate() - now.getDay())
    ).setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filtered = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      switch (activeFilter) {
        case "Daily":
          return transactionDate >= startOfDay;
        case "Weekly":
          return transactionDate >= startOfWeek;
        case "Monthly":
          return transactionDate >= startOfMonth;
        case "Custom":
          return (
            transactionDate >= startDate &&
            transactionDate <= new Date(endDate.setHours(23, 59, 59, 999))
          );
        case "All":
        default:
          return true;
      }
    });
    setFilteredTransactions(filtered);
  }, [transactions, activeFilter, startDate, endDate]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || (isSettingStartDate ? startDate : endDate);
    setDatePickerVisible(false);
    if (isSettingStartDate) {
      setStartDate(currentDate);
    } else {
      setEndDate(currentDate);
    }
  };

  const showDatePicker = (isStart) => {
    setIsSettingStartDate(isStart);
    setDatePickerVisible(true);
  };

  const formatDateTime = useCallback((value) => {
    if (!value) {
      return { date: "-", time: "" };
    }

    let dateValue = value;

    if (typeof value?.toDate === "function") {
      dateValue = value.toDate();
    } else if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        dateValue = parsed;
      }
    }

    if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
      return { date: "-", time: "" };
    }

    const date = dateValue.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = dateValue.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { date, time };
  }, []);

  const normalizeType = useCallback((value) => {
    if (typeof value === "string") {
      return value.toUpperCase();
    }
    return value;
  }, []);

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((transaction) => normalizeType(transaction.type) === "INCOME")
        .reduce(
          (sum, transaction) => sum + (Number(transaction.amount) || 0),
          0
        ),
    [normalizeType, filteredTransactions]
  );

  const totalExpense = useMemo(
    () =>
      filteredTransactions
        .filter((transaction) => normalizeType(transaction.type) === "EXPENSE")
        .reduce(
          (sum, transaction) => sum + (Number(transaction.amount) || 0),
          0
        ),
    [normalizeType, filteredTransactions]
  );

  const balance = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 bg-gray-100">
        <View className="bg-blue-500">
          <View className="flex-row items-center justify-between px-4 py-4">
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
                <Feather name="arrow-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold">
                Transactions
              </Text>
            </View>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity className="p-2" activeOpacity={0.7}>
                <Feather name="search" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2" activeOpacity={0.7}>
                <Feather name="menu" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2" activeOpacity={0.7}>
                <Feather name="more-vertical" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          >
            <View className="flex-row gap-3">
              {timeFilters.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    className={`px-4 py-2 rounded-full ${
                      isActive ? "bg-white" : "bg-blue-400"
                    }`}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (filter === "Custom") {
                        setDatePickerVisible(true);
                      }
                      setActiveFilter(filter);
                    }}
                  >
                    <Text
                      className={`${
                        isActive ? "text-blue-500" : "text-white"
                      } text-sm font-medium`}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="bg-blue-500">
          <Text className="text-white text-center py-3 text-base font-medium">
            {activeFilter}
          </Text>
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
                <Button title="Start Date" onPress={() => showDatePicker(true)} />
                <Button title="End Date" onPress={() => showDatePicker(false)} />
              </View>
              {isDatePickerVisible && (
                <DateTimePicker
                  value={isSettingStartDate ? startDate : endDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
              <Button
                title="Done"
                onPress={() => setDatePickerVisible(false)}
              />
            </View>
          </View>
        </Modal>

        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="bg-white">
              <View className="flex-row items-center border-b border-gray-200 px-4 py-3 bg-gray-50">
                <Text className="flex-1 text-xs font-semibold text-gray-600">
                  Date
                </Text>
                <Text className="flex-1 text-xs font-semibold text-gray-600">
                  Category
                </Text>
                <Text className="w-20 text-right text-xs font-semibold text-green-600">
                  Income
                </Text>
                <Text className="w-20 text-right text-xs font-semibold text-red-600">
                  Expense
                </Text>
              </View>

              {filteredTransactions.map((transaction, index) => {
                const isLast = index === filteredTransactions.length - 1;
                const { date, time } = formatDateTime(
                  transaction.date ?? transaction.createdAt
                );
                const isIncome = normalizeType(transaction.type) === "INCOME";
                return (
                  <View
                    key={transaction.id}
                    className={`border-b border-gray-100 ${
                      !isLast ? "" : "border-transparent"
                    }`}
                  >
                    <View className="flex-row items-start px-4 py-4 gap-3">
                      <View className="flex-1">
                        <Text className="text-sm text-gray-800">{date}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {time}
                        </Text>
                      </View>
                      <Text className="flex-1 text-sm text-gray-800">
                        {transaction.category}
                      </Text>
                      <Text
                        className={`w-20 text-right text-sm font-bold ${
                          isIncome ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between px-4 pb-4">
                      <View className="flex-row items-center gap-2">
                        {transaction.paymentMethod ? (
                          <View className="px-3 py-1 rounded-full border border-gray-300 bg-gray-100">
                            <Text className="text-xs font-medium text-gray-700">
                              {transaction.paymentMethod}
                            </Text>
                          </View>
                        ) : null}
                        {transaction.note ? (
                          <Text className="text-xs text-gray-500">
                            {transaction.note}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="bg-white border-t border-gray-200">
          <View className="flex-row gap-3 px-4 py-4">
            <TouchableOpacity
              className="flex-1 h-12 rounded-lg items-center justify-center bg-green-500"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold">Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-12 rounded-lg items-center justify-center bg-red-500"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold">Expense</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row border-t border-gray-200">
            <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
              <Text className="text-xs text-gray-600">Total Income</Text>
              <Text className="text-green-600 text-base font-semibold">
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
              <Text className="text-xs text-red-600">Total Expense</Text>
              <Text className="text-red-600 text-base font-semibold">
                {formatCurrency(totalExpense)}
              </Text>
            </View>
            <View className="flex-1 items-center justify-center py-4">
              <Text className="text-xs text-gray-700">Balance</Text>
              <Text className="text-gray-900 text-base font-semibold">
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
