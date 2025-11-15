import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView as RNSafeAreaView,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const timeFilters = ["All", "Daily", "Weekly", "Monthly", "Yearly"];

const formatCurrency = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString();
};

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      return undefined;
    }

    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", uid)
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(items);
    });

    return () => unsubscribe();
  }, [uid]);

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
      transactions
        .filter((transaction) => normalizeType(transaction.type) === "INCOME")
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0),
    [normalizeType, transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((transaction) => normalizeType(transaction.type) === "EXPENSE")
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0),
    [normalizeType, transactions]
  );

  const balance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 bg-gray-100">
        <View className="bg-[#0288D1]">
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
              <Text className="text-white text-xl font-semibold">Transactions</Text>
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
                      isActive ? "bg-white" : "bg-white/20"
                    }`}
                    activeOpacity={0.8}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text className={`${isActive ? "text-gray-900" : "text-white"} text-sm font-medium`}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="bg-[#0288D1]">
          <Text className="text-white text-center py-3 text-base font-medium">All</Text>
        </View>

        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="bg-white">
              <View className="flex-row items-center border-b border-gray-200 px-4 py-3 bg-gray-50">
                <Text className="flex-1 text-xs font-semibold text-gray-600">Date</Text>
                <Text className="flex-1 text-xs font-semibold text-gray-600">Category</Text>
                <Text className="w-20 text-right text-xs font-semibold text-green-600">Income</Text>
                <Text className="w-20 text-right text-xs font-semibold text-red-600">Expense</Text>
              </View>

              {transactions.map((transaction, index) => {
                const isLast = index === transactions.length - 1;
                const { date, time } = formatDateTime(transaction.date ?? transaction.createdAt);
                return (
                  <View key={transaction.id} className={`${!isLast ? "border-b border-gray-200" : ""}`}>
                    <View className="flex-row items-start px-4 py-4 gap-3">
                      <View className="flex-1">
                        <Text className="text-sm text-gray-800">{date}</Text>
                        <Text className="text-xs text-gray-500 mt-1">{time}</Text>
                      </View>
                      <Text className="flex-1 text-sm text-gray-800">{transaction.category}</Text>
                      <Text
                        className={`w-20 text-right text-sm ${
                          normalizeType(transaction.type) === "INCOME"
                            ? "text-green-600"
                            : "text-transparent"
                        }`}
                      >
                        {normalizeType(transaction.type) === "INCOME"
                          ? formatCurrency(transaction.amount)
                          : "-"}
                      </Text>
                      <Text
                        className={`w-20 text-right text-sm ${
                          normalizeType(transaction.type) === "EXPENSE"
                            ? "text-red-600"
                            : "text-transparent"
                        }`}
                      >
                        {normalizeType(transaction.type) === "EXPENSE"
                          ? formatCurrency(transaction.amount)
                          : "-"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between px-4 pb-4">
                      <View className="flex-row items-center gap-2">
                        {transaction.paymentMethod ? (
                          <View className="px-3 py-1 rounded-full border border-gray-300 bg-white">
                            <Text className="text-xs font-medium text-gray-700">
                              {transaction.paymentMethod}
                            </Text>
                          </View>
                        ) : null}
                        {transaction.note ? (
                          <Text className="text-xs text-gray-500">{transaction.note}</Text>
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
              className="flex-1 h-12 rounded-lg items-center justify-center bg-[#4CAF50]"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold">Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-12 rounded-lg items-center justify-center bg-[#F44336]"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold">Expense</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row border-t border-gray-200">
            <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
              <Text className="text-xs text-gray-600">Total Income</Text>
              <Text className="text-green-600 text-base font-semibold">{formatCurrency(totalIncome)}</Text>
            </View>
            <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
              <Text className="text-xs text-red-600">Total Expense</Text>
              <Text className="text-red-600 text-base font-semibold">{formatCurrency(totalExpense)}</Text>
            </View>
            <View className="flex-1 items-center justify-center py-4">
              <Text className="text-xs text-gray-700">Balance</Text>
              <Text className="text-gray-900 text-base font-semibold">{formatCurrency(balance)}</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
