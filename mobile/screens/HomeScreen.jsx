import React, { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import {
  fetchRemoteTransactions,
  subscribeToRemoteTransactions,
} from "../services/transactions";
import PaymentMethodChart from "../components/PaymentMethodChart";
import {
  getLocalBankAccounts,
  setLocalBankAccounts,
} from "../storage/bankAccounts";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";
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
    route: "AddIncome",
  },
  {
    label: "Add Expense",
    icon: "remove-circle-outline",
    colorClass: "bg-expense",
    route: "AddExpense",
  },
  {
    label: "Transfer",
    icon: "swap-horiz",
    colorClass: "bg-transfer",
    route: "Transfer",
  },
  {
    label: "Transactions",
    icon: "list-alt",
    colorClass: "bg-transactions",
    route: "Transactions",
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
    case "TRANSFER":
      return "text-transfer";
    default:
      return "text-transactions";
  }
};

const getTransactionDate = (transaction) => {
  const candidate =
    transaction?.createdAt ||
    transaction?.date ||
    transaction?.updatedAt ||
    transaction?.timestamp;
  if (!candidate) {
    return null;
  }
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameMonth = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const getSignedAmounts = (transaction) => {
  const type = (transaction?.type || "").toUpperCase();
  const numeric = Number(transaction?.amount) || 0;
  const absolute = Math.abs(numeric);

  if (type === "INCOME") {
    return { type, absolute, signed: absolute };
  }
  if (type === "EXPENSE") {
    return { type, absolute, signed: -absolute };
  }
  return { type, absolute, signed: numeric };
};

export default function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyBudget] = useState(null);
  const unsubscribeRef = useRef(null);

  const loadLocalBankAccounts = useCallback(async () => {
    try {
      const localBankAccounts = await getLocalBankAccounts();
      setBankAccounts(localBankAccounts);
    } catch (error) {
      console.error("Failed to load local bank accounts", error);
      setBankAccounts([]);
    }
  }, []);

  const loadLocalTransactions = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid || LOCAL_USER_ID;
      const localTransactions = await getTransactionsForUser(userId);
      setTransactions(localTransactions);
    } catch (error) {
      console.error("Failed to load local transactions", error);
      setTransactions([]);
    }
  }, []);

  const loadData = useCallback(() => {
    const userId = auth.currentUser?.uid;
    loadLocalBankAccounts();

    if (!userId) {
      loadLocalTransactions();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return null;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const unsubscribe = subscribeToRemoteTransactions(userId, {
      onData: async (remoteTransactions) => {
        setTransactions(remoteTransactions);
        try {
          await setTransactionsForUser(userId, remoteTransactions);
        } catch (error) {
          console.error("Failed to cache transactions locally", error);
        }
      },
      onError: async (error) => {
        console.error("Failed to load transactions from Firestore", error);
        await loadLocalTransactions();
      },
    });

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [loadLocalTransactions, loadLocalBankAccounts]);

  useFocusEffect(
    useCallback(() => {
      loadData();

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const userId = auth.currentUser?.uid;
      loadLocalBankAccounts();
      if (!userId) {
        await loadLocalTransactions();
        return;
      }

      const transactionsData = await fetchRemoteTransactions(userId);
      setTransactions(transactionsData);
      try {
        await setTransactionsForUser(userId, transactionsData);
      } catch (setError) {
        console.error("Failed to cache refreshed transactions", setError);
      }
    } catch (error) {
      console.error("Failed to refresh transactions", error);
      await loadLocalTransactions();
    } finally {
      setRefreshing(false);
    }
  }, [loadLocalTransactions, loadLocalBankAccounts]);

  const todaySummary = useMemo(() => {
    const today = new Date();
    const summary = transactions.reduce(
      (acc, transaction) => {
        const transactionDate = getTransactionDate(transaction);
        const { type, absolute, signed } = getSignedAmounts(transaction);
        const isForToday = transactionDate ? isSameDay(transactionDate, today) : false;

        if (isForToday) {
          if (type === "INCOME") {
            acc.todayIncome += absolute;
            acc.todayNet += signed;
          } else if (type === "EXPENSE") {
            acc.todayExpense += absolute;
            acc.todayNet += signed;
          } else {
            acc.todayNet += signed;
          }
        } else {
          acc.previousBalance += signed;
        }

        return acc;
      },
      {
        todayIncome: 0,
        todayExpense: 0,
        todayNet: 0,
        previousBalance: 0,
        todayLabel: "",
      }
    );
    summary.todayLabel = formatDate(today);
    return summary;
  }, [transactions]);

  const totalBalance = useMemo(
    () => todaySummary.previousBalance + todaySummary.todayNet,
    [todaySummary.previousBalance, todaySummary.todayNet]
  );

  const todayBalanceClass = todaySummary.todayNet >= 0 ? "text-income" : "text-expense";
  const totalBalanceClass = totalBalance >= 0 ? "text-income" : "text-expense";
  const previousBalanceClass =
    todaySummary.previousBalance >= 0 ? "text-income" : "text-expense";
  const todayExpenseDisplay = todaySummary.todayExpense > 0 ? -todaySummary.todayExpense : 0;
  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    return transactions.reduce((acc, transaction) => {
      const transactionDate = getTransactionDate(transaction);
      const { type, absolute } = getSignedAmounts(transaction);
      if (type === "EXPENSE" && transactionDate && isSameMonth(transactionDate, now)) {
        return acc + absolute;
      }
      return acc;
    }, 0);
  }, [transactions]);

  const budgetSummary = useMemo(() => {
    if (monthlyBudget == null) {
      return { hasBudget: false };
    }
    const remaining = monthlyBudget - currentMonthExpense;
    return {
      hasBudget: true,
      budgetAmount: monthlyBudget,
      spent: currentMonthExpense,
      statusLabel: remaining >= 0 ? "Remaining" : "Exceeded by",
      statusAmount: Math.abs(remaining),
      statusClass: remaining >= 0 ? "text-income" : "text-expense",
    };
  }, [monthlyBudget, currentMonthExpense]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 3);
  }, [transactions]);

  const paymentMethodDistribution = useMemo(() => {
    const distribution = bankAccounts.map((account) => ({
      name: account.name,
      total: 0,
      color: account.color || "#000000",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    }));

    transactions.forEach((transaction) => {
      const account = distribution.find(
        (acc) => acc.name === transaction.paymentAccount
      );
      if (account) {
        const { signed } = getSignedAmounts(transaction);
        account.total += signed;
      }
    });

    return distribution.filter((account) => account.total > 0);
  }, [transactions, bankAccounts]);

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
              {`Today · ${todaySummary.todayLabel || ""}`}
            </Text>
            <View className="flex-row justify-between border-b border-gray-200 mt-4 pb-3">
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">Income</Text>
                <Text className="text-lg font-bold text-income mt-1">
                  {formatCurrency(todaySummary.todayIncome)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">Expense</Text>
                <Text className="text-lg font-bold text-expense mt-1">
                  {formatCurrency(todayExpenseDisplay)}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">Balance</Text>
                <Text className={`text-lg font-bold mt-1 ${todayBalanceClass}`}>
                  {formatCurrency(todaySummary.todayNet)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-sm text-text-secondary-light">Previous Balance</Text>
              <Text className={`text-sm font-semibold ${previousBalanceClass}`}>
                {formatCurrency(todaySummary.previousBalance)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm font-bold text-text-secondary-light">Total Balance</Text>
              <Text className={`text-sm font-bold ${totalBalanceClass}`}>
                {formatCurrency(totalBalance)}
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
                        {transaction.paymentAccount ? ` (${transaction.paymentAccount})` : ""}
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

          <View className="bg-card-light rounded-2xl shadow-md p-4 mt-6">
            <Text className="text-lg font-bold text-text-light mb-4">Monthly Budget</Text>
            {budgetSummary.hasBudget ? (
              <>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-text-secondary-light">Budget</Text>
                  <Text className="text-sm font-semibold text-text-light">
                    {formatCurrency(budgetSummary.budgetAmount)}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-sm text-text-secondary-light">Spent this month</Text>
                  <Text className="text-sm font-semibold text-expense">
                    {formatCurrency(budgetSummary.spent)}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-sm text-text-secondary-light font-semibold">
                    {budgetSummary.statusLabel}
                  </Text>
                  <Text className={`text-sm font-bold ${budgetSummary.statusClass}`}>
                    {formatCurrency(budgetSummary.statusAmount)}
                  </Text>
                </View>
              </>
            ) : (
              <Text className="text-sm text-text-secondary-light">
                You haven't set a monthly budget yet. Once you define one, we'll track how much of
                it you've spent and highlight any excess.
              </Text>
            )}
          </View>

          <View className="bg-card-light rounded-2xl shadow-md p-4 mt-6">
            <PaymentMethodChart data={paymentMethodDistribution} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
