import React, { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  RefreshControl,
  Modal,
  TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import {
  fetchRemoteTransactions,
  subscribeToRemoteTransactions,
} from "../services/transactions";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";
import Navigation from "../components/Navigation";
import NavbarDrawer from "../components/NavbarDrawer";
import { currencies } from "../constants/currencies";
import { getBudgetForUser, setBudgetForUser } from "../storage/budget";
import { useLanguage } from "../context/LanguageContext";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const TextInput = styled(RNTextInput);

const quickActions = [
  {
    key: "addIncome",
    icon: "add-circle-outline",
    colorClass: "bg-income",
    route: "AddIncome",
  },
  {
    key: "addExpense",
    icon: "remove-circle-outline",
    colorClass: "bg-expense",
    route: "AddExpense",
  },
  {
    key: "transfer",
    icon: "swap-horiz",
    colorClass: "bg-transfer",
    route: "Transfer",
  },
  {
    key: "transactions",
    icon: "list-alt",
    colorClass: "bg-transactions",
    route: "Transactions",
  },
];

const DEFAULT_CURRENCY = "USD";

const currencySymbolMap = currencies.reduce((map, item) => {
  const symbol = item.symbol || item.value;
  map[item.value.toUpperCase()] = symbol;
  return map;
}, {});

const formatNumber = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value, currencyCode = DEFAULT_CURRENCY) => {
  const code = currencyCode ? currencyCode.toUpperCase() : DEFAULT_CURRENCY;
  const symbol = currencySymbolMap[code] || code;
  return `${symbol} ${formatNumber(value)}`;
};

const addToCurrencyMap = (map, currencyCode, amount) => {
  const code = currencyCode ? currencyCode.toUpperCase() : DEFAULT_CURRENCY;
  map.set(code, (map.get(code) || 0) + amount);
};

const formatCurrencyAggregate = (map) => {
  if (!map || map.size === 0) {
    return formatCurrency(0);
  }
  const entries = Array.from(map.entries()).filter(([, value]) => value !== 0);
  if (entries.length === 0) {
    return formatCurrency(0);
  }
  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(", ");
};

const mergeCurrencyMaps = (...maps) => {
  return maps.reduce((acc, map) => {
    if (!map) {
      return acc;
    }
    map.forEach((value, currency) => {
      addToCurrencyMap(acc, currency, value);
    });
    return acc;
  }, new Map());
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

const buildCurrencyEntries = (map) => {
  if (!map || map.size === 0) {
    return [{ currency: DEFAULT_CURRENCY, label: formatCurrency(0) }];
  }
  return Array.from(map.entries()).map(([currency, amount]) => ({
    currency,
    amount,
    label: formatCurrency(amount, currency),
  }));
};

export default function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [isBudgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetAmountInput, setBudgetAmountInput] = useState("");
  const [isNavbarVisible, setNavbarVisible] = useState(false);
  const [budgetCurrencyInput, setBudgetCurrencyInput] = useState(DEFAULT_CURRENCY);
  const [budgetError, setBudgetError] = useState("");
  const [isCurrencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const unsubscribeRef = useRef(null);
  const { t } = useLanguage();

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

  const loadBudget = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid || LOCAL_USER_ID;
      const stored = await getBudgetForUser(userId);
      setMonthlyBudget(stored);
    } catch (error) {
      console.warn("Failed to load monthly budget", error);
      setMonthlyBudget(null);
    }
  }, []);

  const loadData = useCallback(() => {
    const userId = auth.currentUser?.uid;
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
  }, [loadLocalTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadBudget();

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }, [loadData, loadBudget])
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const userId = auth.currentUser?.uid;
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
  }, [loadLocalTransactions]);

  const todaySummary = useMemo(() => {
    const today = new Date();
    const summary = transactions.reduce(
      (acc, transaction) => {
        const transactionDate = getTransactionDate(transaction);
        const currency = (transaction?.currency || DEFAULT_CURRENCY).toUpperCase();
        const { type, absolute, signed } = getSignedAmounts(transaction);
        const isForToday = transactionDate ? isSameDay(transactionDate, today) : false;

        if (isForToday) {
          if (type === "INCOME") {
            acc.todayIncomeTotal += absolute;
            addToCurrencyMap(acc.todayIncomeMap, currency, absolute);
            acc.todayNetTotal += signed;
            addToCurrencyMap(acc.todayNetMap, currency, signed);
          } else if (type === "EXPENSE") {
            acc.todayExpenseTotal += absolute;
            addToCurrencyMap(acc.todayExpenseMap, currency, -absolute);
            acc.todayNetTotal += signed;
            addToCurrencyMap(acc.todayNetMap, currency, signed);
          } else {
            acc.todayNetTotal += signed;
            addToCurrencyMap(acc.todayNetMap, currency, signed);
          }
        } else {
          acc.previousBalanceTotal += signed;
          addToCurrencyMap(acc.previousBalanceMap, currency, signed);
        }

        return acc;
      },
      {
        todayIncomeTotal: 0,
        todayExpenseTotal: 0,
        todayNetTotal: 0,
        previousBalanceTotal: 0,
        todayIncomeMap: new Map(),
        todayExpenseMap: new Map(),
        todayNetMap: new Map(),
        previousBalanceMap: new Map(),
        todayLabel: "",
      }
    );
    summary.todayLabel = formatDate(today);
    return summary;
  }, [transactions]);

  const totalBalance = useMemo(
    () => todaySummary.previousBalanceTotal + todaySummary.todayNetTotal,
    [todaySummary.previousBalanceTotal, todaySummary.todayNetTotal]
  );

  const totalBalanceMap = useMemo(
    () => mergeCurrencyMaps(todaySummary.previousBalanceMap, todaySummary.todayNetMap),
    [todaySummary.previousBalanceMap, todaySummary.todayNetMap]
  );

  const todayBalanceClass = todaySummary.todayNetTotal >= 0 ? "text-income" : "text-expense";
  const totalBalanceClass = totalBalance >= 0 ? "text-income" : "text-expense";
  const previousBalanceClass =
    todaySummary.previousBalanceTotal >= 0 ? "text-income" : "text-expense";
  const todayIncomeEntries = useMemo(
    () => buildCurrencyEntries(todaySummary.todayIncomeMap),
    [todaySummary.todayIncomeMap]
  );
  const todayExpenseEntries = useMemo(
    () => buildCurrencyEntries(todaySummary.todayExpenseMap),
    [todaySummary.todayExpenseMap]
  );
  const todayNetEntries = useMemo(
    () => buildCurrencyEntries(todaySummary.todayNetMap),
    [todaySummary.todayNetMap]
  );
  const previousBalanceEntries = useMemo(
    () => buildCurrencyEntries(todaySummary.previousBalanceMap),
    [todaySummary.previousBalanceMap]
  );
  const totalBalanceEntries = useMemo(
    () => buildCurrencyEntries(totalBalanceMap),
    [totalBalanceMap]
  );
  const currentMonthExpenseMap = useMemo(() => {
    const now = new Date();
    const map = new Map();
    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDate(transaction);
      const { type, absolute } = getSignedAmounts(transaction);
      if (type === "EXPENSE" && transactionDate && isSameMonth(transactionDate, now)) {
        const currency = (transaction.currency || DEFAULT_CURRENCY).toUpperCase();
        addToCurrencyMap(map, currency, absolute);
      }
    });
    return map;
  }, [transactions]);

  const budgetSummary = useMemo(() => {
    if (!monthlyBudget) {
      return { hasBudget: false };
    }
    const spent = currentMonthExpenseMap.get(monthlyBudget.currency) || 0;
    const remaining = monthlyBudget.amount - spent;
    return {
      hasBudget: true,
      budgetAmount: monthlyBudget.amount,
      budgetCurrency: monthlyBudget.currency,
      spent,
      statusLabel: remaining >= 0 ? t("home.remaining") : t("home.exceededBy"),
      statusAmount: Math.abs(remaining),
      statusClass: remaining >= 0 ? "text-income" : "text-expense",
    };
  }, [monthlyBudget, currentMonthExpenseMap, t]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 3);
  }, [transactions]);

  const paymentMethodCurrencyTotals = useMemo(() => {
    const map = new Map();
    transactions.forEach((transaction) => {
      const { type, absolute } = getSignedAmounts(transaction);
      if (type !== "INCOME" || absolute <= 0) {
        return;
      }
      const method = (transaction.paymentMethod || "Other").trim() || "Other";
      const currency = (transaction.currency || DEFAULT_CURRENCY).toUpperCase();
      const key = `${method}:::${currency}`;
      const current = map.get(key) || { method, currency, amount: 0 };
      current.amount += absolute;
      map.set(key, current);
    });
    return Array.from(map.values());
  }, [transactions]);

  const openBudgetModal = useCallback(() => {
    if (monthlyBudget) {
      setBudgetAmountInput(
        String(monthlyBudget.amount ?? "").replace(/[^0-9.]/g, "")
      );
      setBudgetCurrencyInput(monthlyBudget.currency || DEFAULT_CURRENCY);
    } else {
      setBudgetAmountInput("");
      setBudgetCurrencyInput(DEFAULT_CURRENCY);
    }
    setBudgetError("");
    setBudgetModalVisible(true);
  }, [monthlyBudget]);

  const handleSaveBudget = useCallback(async () => {
    const normalizedCurrency =
      (budgetCurrencyInput || DEFAULT_CURRENCY).trim().toUpperCase() || DEFAULT_CURRENCY;
    const numericAmount = Number(budgetAmountInput.replace(/,/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setBudgetError(t("alerts.positiveBudget"));
      return;
    }
    const userId = auth.currentUser?.uid || LOCAL_USER_ID;
    const payload = {
      amount: numericAmount,
      currency: normalizedCurrency,
    };
    setMonthlyBudget(payload);
    try {
      await setBudgetForUser(userId, payload);
    } catch (error) {
      console.warn("Failed to save monthly budget", error);
    }
    setBudgetModalVisible(false);
  }, [budgetAmountInput, budgetCurrencyInput, t]);

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

  const handleDrawerItemPress = useCallback((itemKey) => {
    setNavbarVisible(false);
    switch (itemKey) {
      case "profile":
        navigation.navigate("Profile");
        break;
      case "settings":
        Alert.alert(
          t("alerts.userSettings"),
          t("alerts.userSettingsBody")
        );
        break;
      case "security":
        Alert.alert(
          t("alerts.securityPrivacy"),
          t("alerts.securityPrivacyBody")
        );
        break;
      case "notifications":
        Alert.alert(
          t("alerts.notifications"),
          t("alerts.notificationsBody")
        );
        break;
      case "support":
        Alert.alert(
          t("alerts.helpSupport"),
          t("alerts.helpSupportBody")
        );
        break;
      case "theme":
        Alert.alert(t("alerts.appearance"), t("alerts.appearanceBody"));
        break;
      case "feedback":
        Alert.alert(
          t("alerts.feedback"),
          t("alerts.feedbackBody")
        );
        break;
      case "logout":
        try {
          auth.signOut();
          // Navigation to Login is usually handled by an auth state listener in App.jsx or similar,
          // but if not, we might need navigation.replace('Login').
          // For now, assuming auth listener handles it or just sign out.
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        } catch (error) {
          console.error("Sign out failed", error);
          Alert.alert(t("alerts.error"), t("alerts.signOutFailed"));
        }
        break;
      default:
        break;
    }
  }, [navigation, t]);

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <View className="bg-primary px-4 pt-6 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="p-2"
            activeOpacity={0.7}
            onPress={() => setNavbarVisible(true)}
          >
            <MaterialIcons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white text-xl font-bold">{t("appName")}</Text>
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
                key={action.key}
                className={`${action.colorClass} rounded-2xl px-4 py-4 items-center justify-center shadow-md`}
                activeOpacity={0.85}
                style={{ width: "48%", marginBottom: 16 }}
                onPress={() => navigation.navigate(action.route, action.params)}
              >
                <MaterialIcons name={action.icon} size={32} color="#FFFFFF" />
                <Text className="text-white font-semibold text-sm mt-2 text-center">
                  {t(`quickActions.${action.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-card-light rounded-2xl shadow-md p-4">
            <Text className="text-center text-sm font-semibold text-text-secondary-light">
              {`${t("home.today")} · ${todaySummary.todayLabel || ""}`}
            </Text>
            <View className="flex-row justify-between border-b border-gray-200 mt-4 pb-3">
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">{t("home.income")}</Text>
                <View className="mt-1 gap-1 items-center">
                  {todayIncomeEntries.map((entry) => (
                    <Text
                      key={`income-${entry.currency}`}
                      className="text-base font-bold text-income"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {entry.label}
                    </Text>
                  ))}
                </View>
              </View>
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">{t("home.expense")}</Text>
                <View className="mt-1 gap-1 items-center">
                  {todayExpenseEntries.map((entry) => (
                    <Text
                      key={`expense-${entry.currency}`}
                      className="text-base font-bold text-expense"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {entry.label}
                    </Text>
                  ))}
                </View>
              </View>
              <View className="items-center flex-1">
                <Text className="text-sm text-text-secondary-light">{t("home.balance")}</Text>
                <View className="mt-1 gap-1 items-center">
                  {todayNetEntries.map((entry) => (
                    <Text
                      key={`net-${entry.currency}`}
                      className={`text-base font-bold ${todayBalanceClass}`}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {entry.label}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-sm text-text-secondary-light">{t("home.previousBalance")}</Text>
              <View className="items-end">
                {previousBalanceEntries.map((entry) => (
                  <Text
                    key={`prev-${entry.currency}`}
                    className={`text-xs font-semibold ${previousBalanceClass}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {entry.label}
                  </Text>
                ))}
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-sm font-bold text-text-secondary-light">{t("home.totalBalance")}</Text>
              <View className="items-end">
                {totalBalanceEntries.map((entry) => (
                  <Text
                    key={`total-${entry.currency}`}
                    className={`text-xs font-bold ${totalBalanceClass}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {entry.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View className="bg-card-light rounded-2xl shadow-md mt-6">
            <View className="p-4">
              <Text className="text-lg font-bold text-text-light mb-4">
                {t("home.recentTransactions")}
              </Text>
              {recentTransactions.length === 0 ? (
                <Text className="text-sm text-text-secondary-light">
                  {t("home.noTransactions")}
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
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View className="border-t border-gray-200 px-4 py-3 items-end">
              <TouchableOpacity onPress={() => navigation.navigate("AddTransaction")}>
                <Text className="text-primary text-sm font-semibold">{t("home.more")} →</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-card-light rounded-2xl shadow-md p-4 mt-6">
            <Text className="text-lg font-bold text-text-light mb-4">{t("home.paymentMethods")}</Text>
            {paymentMethodCurrencyTotals.length === 0 ? (
              <Text className="text-sm text-text-secondary-light">
                {t("home.noPaymentMethods")}
              </Text>
            ) : (
              paymentMethodCurrencyTotals.map((item) => (
                <View
                  key={`${item.method}-${item.currency}`}
                  className="flex-row justify-between items-center py-2 border-b border-gray-100"
                >
                  <Text className="text-sm text-text-secondary-light font-semibold">
                    {item.method} ({item.currency})
                  </Text>
                  <Text className="text-sm font-bold text-income">
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openBudgetModal}
            className="bg-card-light rounded-2xl shadow-md p-4 mt-6"
          >
            <Text className="text-lg font-bold text-text-light mb-4">{t("home.monthlyBudget")}</Text>
            {budgetSummary.hasBudget ? (
              <>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-text-secondary-light">{t("home.budget")}</Text>
                  <Text className="text-sm font-semibold text-text-light">
                    {formatCurrency(budgetSummary.budgetAmount, budgetSummary.budgetCurrency)}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-sm text-text-secondary-light">{t("home.spentThisMonth")}</Text>
                  <Text className="text-sm font-semibold text-expense">
                    {formatCurrency(budgetSummary.spent, budgetSummary.budgetCurrency)}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-sm text-text-secondary-light font-semibold">
                    {budgetSummary.statusLabel}
                  </Text>
                  <Text className={`text-sm font-bold ${budgetSummary.statusClass}`}>
                    {formatCurrency(budgetSummary.statusAmount, budgetSummary.budgetCurrency)}
                  </Text>
                </View>
              </>
            ) : (
              <Text className="text-sm text-text-secondary-light">
                {t("home.noBudgetSet")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={isBudgetModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-3xl w-full p-5">
            <Text className="text-lg font-semibold text-text-light mb-4">
              {t("home.setBudget")}
            </Text>
            <View className="space-y-4">
              <View>
                <Text className="text-sm text-text-secondary-light mb-1">{t("home.budgetAmount")}</Text>
                <TextInput
                  value={budgetAmountInput}
                  onChangeText={(text) => setBudgetAmountInput(text.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  className="border border-gray-200 rounded-2xl px-4 py-3 text-base"
                />
              </View>
              <View>
                <Text className="text-sm text-text-secondary-light mb-1">{t("home.currency")}</Text>
                <TouchableOpacity
                  onPress={() => setCurrencyPickerVisible(true)}
                  className="border border-gray-200 rounded-2xl px-4 py-3"
                >
                  <Text className="text-base font-semibold text-text-light">
                    {budgetCurrencyInput}
                  </Text>
                </TouchableOpacity>
              </View>
              {budgetError ? (
                <Text className="text-sm text-expense">{budgetError}</Text>
              ) : null}
              <View className="flex-row justify-end gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => {
                    setBudgetModalVisible(false);
                    setBudgetError("");
                  }}
                  className="px-4 py-3 rounded-2xl border border-gray-200"
                >
                  <Text className="text-sm font-semibold text-text-secondary-light">{t("home.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveBudget}
                  className="px-5 py-3 rounded-2xl bg-primary"
                >
                  <Text className="text-sm font-semibold text-white">{t("home.save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isCurrencyPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCurrencyPickerVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-3xl w-full max-h-[70%]">
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-semibold text-text-light">{t("home.selectCurrency")}</Text>
              <TouchableOpacity onPress={() => setCurrencyPickerVisible(false)}>
                <Text className="text-primary font-semibold">{t("home.close")}</Text>
              </TouchableOpacity>
            </View>
            <RNScrollView style={{ maxHeight: 360 }}>
              {currencies.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    setBudgetCurrencyInput(item.value);
                    setCurrencyPickerVisible(false);
                  }}
                  className="px-4 py-3 border-b border-gray-100"
                >
                  <Text className="text-sm font-semibold text-text-light">{item.value}</Text>
                  <Text className="text-xs text-text-secondary-light">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </RNScrollView>
          </View>
        </View>
      </Modal>
      <NavbarDrawer
        visible={isNavbarVisible}
        onClose={() => setNavbarVisible(false)}
        user={auth.currentUser}
        onItemPress={handleDrawerItemPress}
      />
    </SafeAreaView>
  );
}
