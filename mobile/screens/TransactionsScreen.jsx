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

const timeFilters = ["All", "Daily", "Weekly", "Monthly", "Custom"];

const formatCurrency = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString();
};

const Transaction = ({ transaction }) => {
  const { category, amount, type, time } = transaction;
  const isIncome = type === "INCOME";

  const iconMap = {
    Food: "coffee",
    Shopping: "shopping-cart",
    Transport: "truck",
    Home: "home",
    Default: "dollar-sign",
  };

  const iconName = iconMap[category] || iconMap.Default;

  return (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
      <View className="flex-row items-center gap-4">
        <View className="p-2 bg-gray-200 rounded-full">
          <Feather name={iconName} size={20} color="#1f2937" />
        </View>
        <View>
          <Text className="text-gray-800 font-semibold">{category}</Text>
          <Text className="text-gray-500 text-xs">{time}</Text>
        </View>
      </View>
      <Text
        className={`font-semibold ${
          isIncome ? "text-green-500" : "text-red-500"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(amount)}
      </Text>
    </View>
  );
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
  const [isAddTransactionModalVisible, setAddTransactionModalVisible] =
    useState(false);
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
    const currentDate =
      selectedDate || (isSettingStartDate ? startDate : endDate);
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

  const handleAddTransaction = async (transaction) => {
    if (uid) {
      await addTransaction(uid, transaction);
    } else {
      const newTransactions = [...transactions, transaction];
      setTransactions(newTransactions);
      await setTransactionsForUser(LOCAL_USER_ID, newTransactions);
    }
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

  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach((transaction) => {
      const { date, time } = formatDateTime(
        transaction.date ?? transaction.createdAt
      );
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push({ ...transaction, time });
    });
    return groups;
  }, [filteredTransactions, formatDateTime]);

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

        <View className="p-4 bg-white">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {timeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  className={`px-4 py-2 rounded-full ${
                    activeFilter === filter ? "bg-blue-500" : "bg-gray-200"
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
                      activeFilter === filter ? "text-white" : "text-gray-700"
                    } text-sm font-medium`}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {Object.keys(groupedTransactions).map((date) => (
              <View key={date} className="mt-4">
                <View className="px-4 py-2 bg-gray-200">
                  <Text className="text-gray-600 font-semibold">{date}</Text>
                </View>
                {groupedTransactions[date].map((transaction) => (
                  <Transaction
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </View>
            ))}
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
                <Button
                  title="Start Date"
                  onPress={() => showDatePicker(true)}
                />
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

        <AddTransaction
          isVisible={isAddTransactionModalVisible}
          onClose={() => setAddTransactionModalVisible(false)}
          onAddTransaction={handleAddTransaction}
        />
      </View>
    </SafeAreaView>
  );
}
