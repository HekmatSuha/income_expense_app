import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView as RNSafeAreaView,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import api from "../src/api/client";
import Navigation from "../components/Navigation";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const quickActions = [
  {
    label: "Add Income",
    icon: "add-circle-outline",
    colorClass: "bg-income",
    route: "AddTransaction",
    params: { type: "INCOME" },
  },
  {
    label: "Add Expense",
    icon: "remove-circle-outline",
    colorClass: "bg-expense",
    route: "AddTransaction",
    params: { type: "EXPENSE" },
  },
  {
    label: "Transfer",
    icon: "swap-horiz",
    colorClass: "bg-transfer",
    route: "AddTransaction",
    params: { type: "TRANSFER" },
  },
  {
    label: "Transactions",
    icon: "list-alt",
    colorClass: "bg-transactions",
    route: "AddTransaction",
  },
];

const formatCurrency = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString();
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAmountClass = (type) => {
  switch (type) {
    case "INCOME":
      return "text-income";
    case "EXPENSE":
      return "text-expense";
    default:
      return "text-transactions";
  }
};

export default function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get("/transactions/");
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const { incomeTotal, expenseTotal } = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.type === "INCOME") {
          acc.incomeTotal += amount;
        } else if (transaction.type === "EXPENSE") {
          acc.expenseTotal += amount;
        }
        return acc;
      },
      { incomeTotal: 0, expenseTotal: 0 }
    );
  }, [transactions]);

  const computedBalance = useMemo(
    () => incomeTotal - expenseTotal,
    [incomeTotal, expenseTotal]
  );

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 3);
  }, [transactions]);

  const handleTabChange = useCallback(
    (tab) => {
      if (tab === "home") {
        navigation.navigate("Home");
      }
      if (tab === "calendar") {
        navigation.navigate("Calendar");
      }
      if (tab === "bankAccounts") {
        navigation.navigate("BankAccounts");
      }
      if (tab === "notebook") {
        navigation.navigate("Notebook");
      }
    },
    [navigation]
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <View className="bg-primary px-4 pt-6 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="p-2" activeOpacity={0.7}>
            <MaterialIcons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white text-xl font-bold">Income Expense</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-white text-sm font-medium">October 2025</Text>
              <MaterialIcons name="expand-more" size={18} color="#FFFFFF" />
            </View>
          </View>
          <TouchableOpacity className="p-2" activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Navigation activeTab="home" onTabChange={handleTabChange} />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 mt-6">
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                className={`${action.colorClass} rounded-2xl px-4 py-4 items-center justify-center shadow-md`}
                activeOpacity={0.85}
                style={{ width: "48%", marginBottom: 16 }}
                onPress={() => navigation.navigate(action.route, action.params)}
              >
                <MaterialIcons name={action.icon} size={32} color="#FFFFFF" />
                <Text className="text-white font-semibold text-sm mt-2 text-center">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-card-light rounded-2xl shadow-md p-4">
            <Text className="text-center text-sm font-semibold text-text-secondary-light">
              01-Oct-2025 → 31-Oct-2025
            </Text>
            <View className="flex-row justify-between border-b border-gray-200 mt-4 pb-3">
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">Income</Text>
                <Text className="text-lg font-bold text-income mt-1">
                  {formatCurrency(incomeTotal)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">Expense</Text>
                <Text className="text-lg font-bold text-expense mt-1">
                  {formatCurrency(expenseTotal)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">Balance</Text>
                <Text className="text-lg font-bold text-text-light mt-1">
                  {formatCurrency(computedBalance)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-sm text-text-secondary-light">Previous Balance</Text>
              <Text className="text-sm font-semibold text-text-light">0</Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm font-bold text-text-secondary-light">Balance</Text>
              <Text className="text-sm font-bold text-income">
                {formatCurrency(computedBalance)}
              </Text>
            </View>
          </View>

          <View className="bg-card-light rounded-2xl shadow-md mt-6">
            <View className="p-4">
              <Text className="text-lg font-bold text-text-light mb-4">
                Recent Transactions
              </Text>
              {recentTransactions.length === 0 ? (
                <Text className="text-sm text-text-secondary-light">
                  No recent transactions yet.
                </Text>
              ) : (
                recentTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    className="flex-row justify-between items-start mb-4"
                  >
                    <View className="flex-1 pr-4">
                      <Text className="text-xs text-text-secondary-light">
                        {formatDate(transaction.date)}
                      </Text>
                      <Text className="text-base font-semibold text-text-light mt-1">
                        {transaction.category || transaction.type}
                      </Text>
                      {transaction.note ? (
                        <Text className="text-xs text-text-secondary-light mt-1">
                          {transaction.note}
                        </Text>
                      ) : null}
                    </View>
                    <View className="items-end">
                      <Text className={`text-base font-bold ${getAmountClass(transaction.type)}`}>
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View className="border-t border-gray-200 px-4 py-3 items-end">
              <TouchableOpacity onPress={() => navigation.navigate("AddTransaction")}>
                <Text className="text-primary text-sm font-semibold">More →</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-card-light rounded-2xl shadow-md p-4 mt-6 relative">
            <TouchableOpacity
              className="absolute top-4 right-4 bg-primary rounded-full w-10 h-10 items-center justify-center shadow-lg"
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-text-light mb-4">Monthly Budget</Text>
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary-light">Budget Expense</Text>
              <Text className="text-sm text-text-light">0</Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-sm text-text-secondary-light font-semibold">Remaining</Text>
              <Text className="text-sm text-expense font-bold">0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
