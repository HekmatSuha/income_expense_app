import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView as RNSafeAreaView,
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import Navigation from "../components/Navigation";
import { auth } from "../firebase";
import { fetchRemoteTransactions } from "../services/transactions";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDateLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function getMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getCalendarDays(currentDate) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const totalCells = 42;
  const days = [];

  for (let i = 0; i < totalCells; i += 1) {
    const dayOffset = i - startDay;
    const isCurrentMonth = dayOffset >= 0 && dayOffset < daysInMonth;
    const dayNumber = isCurrentMonth
      ? dayOffset + 1
      : dayOffset < 0
      ? daysInPreviousMonth + dayOffset + 1
      : i - (startDay + daysInMonth) + 1;

    const date = new Date(year, month, dayNumber);
    if (!isCurrentMonth && dayOffset < 0) {
      date.setMonth(month - 1);
    }
    if (!isCurrentMonth && dayOffset >= daysInMonth) {
      date.setMonth(month + 1);
    }

    days.push({
      key: `${date.toISOString()}-${i}`,
      date,
      label: dayNumber,
      isCurrentMonth,
    });
  }

  return days;
}

export default function CalendarScreen({ navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);

  const loadTransactions = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        const localTransactions = await getTransactionsForUser(LOCAL_USER_ID);
        setTransactions(localTransactions);
        return;
      }

      const remoteTransactions = await fetchRemoteTransactions(user.uid);
      setTransactions(remoteTransactions);
      try {
        await setTransactionsForUser(user.uid, remoteTransactions);
      } catch (cacheError) {
        console.error("Failed to cache transactions for calendar", cacheError);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
      try {
        const fallbackUserId = auth.currentUser?.uid || LOCAL_USER_ID;
        const localTransactions = await getTransactionsForUser(fallbackUserId);
        setTransactions(localTransactions);
      } catch (localError) {
        console.error("Failed to load local transactions for calendar", localError);
        setTransactions([]);
      }
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTransactions);
    return unsubscribe;
  }, [navigation, loadTransactions]);

  const events = useMemo(() => {
    return transactions
      .map((transaction) => {
        const eventDate = transaction?.date ? new Date(transaction.date) : null;
        if (!eventDate || Number.isNaN(eventDate.getTime())) {
          return null;
        }

        const type = String(transaction.type || "").toUpperCase();

        return {
          id: String(transaction.id ?? `${transaction.type}-${transaction.date}`),
          title: transaction.category || type || "Transaction",
          type,
          date: eventDate,
          amount: Number(transaction.amount) || 0,
        };
      })
      .filter(Boolean);
  }, [transactions]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentDate),
    [currentDate]
  );

  const monthEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        return (
          eventDate.getFullYear() === currentDate.getFullYear() &&
          eventDate.getMonth() === currentDate.getMonth()
        );
      })
      .sort(
        (a, b) =>
          (a.date instanceof Date ? a.date : new Date(a.date)).getTime() -
          (b.date instanceof Date ? b.date : new Date(b.date)).getTime()
      );
  }, [currentDate, events]);

  const getTypeLabel = useCallback((type) => {
    if (!type) {
      return "";
    }
    const normalized = String(type).toUpperCase();
    if (normalized === "INCOME") {
      return "Income";
    }
    if (normalized === "EXPENSE") {
      return "Expense";
    }
    if (normalized === "TRANSFER") {
      return "Transfer";
    }
    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }, []);

  const handleTabChange = (tab) => {
    if (tab === "calendar") {
      return;
    }
    if (tab === "home") {
      navigation.navigate("Home");
    }
    if (tab === "bankAccounts") {
      navigation.navigate("BankAccounts");
    }
    if (tab === "notebook") {
      navigation.navigate("Notebook");
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F5F9]">
      <View className="bg-[#0288D1] px-4 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-semibold">Calendar</Text>
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity className="p-1" activeOpacity={0.7}>
              <MaterialIcons name="search" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity className="p-1" activeOpacity={0.7}>
              <MaterialIcons name="calendar-today" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity className="p-1" activeOpacity={0.7}>
              <MaterialIcons name="more-vert" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Navigation activeTab="calendar" onTabChange={handleTabChange} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          <View className="bg-white rounded-2xl shadow-sm border border-[#0288D1]/20">
            <View className="flex-row items-center justify-between px-4 py-3 bg-[#0288D1] rounded-t-2xl">
              <TouchableOpacity
                onPress={goToPreviousMonth}
                className="p-1"
                activeOpacity={0.7}
              >
                <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-base font-semibold">
                {getMonthLabel(currentDate)}
              </Text>
              <TouchableOpacity
                onPress={goToNextMonth}
                className="p-1"
                activeOpacity={0.7}
              >
                <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View className="px-4 py-3">
              <View className="flex-row justify-between">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <Text
                    key={day}
                    className="w-[14%] text-xs font-semibold text-[#0288D1] text-center"
                  >
                    {day}
                  </Text>
                ))}
              </View>

              <View className="flex-row flex-wrap mt-2">
                {calendarDays.map((day) => {
                  const dayEvents = monthEvents.filter((event) => {
                    const eventDate =
                      event.date instanceof Date ? event.date : new Date(event.date);
                    return (
                      eventDate.getFullYear() === day.date.getFullYear() &&
                      eventDate.getMonth() === day.date.getMonth() &&
                      eventDate.getDate() === day.date.getDate()
                    );
                  });

                  const hasIncome = dayEvents.some(
                    (event) => String(event.type || "").toUpperCase() === "INCOME"
                  );
                  const hasExpense = dayEvents.some(
                    (event) => String(event.type || "").toUpperCase() === "EXPENSE"
                  );
                  const hasOther = dayEvents.some((event) => {
                    const normalized = String(event.type || "").toUpperCase();
                    return normalized && normalized !== "INCOME" && normalized !== "EXPENSE";
                  });
                  const isToday = (() => {
                    const today = new Date();
                    return (
                      today.getFullYear() === day.date.getFullYear() &&
                      today.getMonth() === day.date.getMonth() &&
                      today.getDate() === day.date.getDate()
                    );
                  })();

                  let dayBackgroundClass = day.isCurrentMonth
                    ? "bg-white"
                    : "bg-[#E2E8F0]";
                  let borderClass = day.isCurrentMonth
                    ? "border-[#0288D1]/20"
                    : "border-[#94A3B8]/40";
                  let textClass = day.isCurrentMonth
                    ? "text-[#1F2937]"
                    : "text-[#94A3B8]";

                  if (hasIncome && hasExpense) {
                    dayBackgroundClass = "bg-[#FFF3E0]";
                    textClass = "text-[#9C4221]";
                    borderClass = "border-[#FB923C]/40";
                  } else if (hasIncome) {
                    dayBackgroundClass = "bg-[#E0F7FA]";
                    textClass = "text-[#006064]";
                    borderClass = "border-[#26A69A]/40";
                  } else if (hasExpense) {
                    dayBackgroundClass = "bg-[#FDE8E8]";
                    textClass = "text-[#9B2C2C]";
                    borderClass = "border-[#F87171]/40";
                  }

                  if (isToday) {
                    dayBackgroundClass = "bg-[#FFF9C4]";
                    textClass = "text-[#7A5700] font-semibold";
                    borderClass = "border-[#FBBF24]/60";
                  }

                  const badgeClass = hasIncome && hasExpense
                    ? "bg-[#FB923C]/80"
                    : hasIncome
                    ? "bg-[#26A69A]/80"
                    : hasExpense
                    ? "bg-[#F87171]/80"
                    : hasOther
                    ? "bg-[#17A2B8]/80"
                    : "bg-[#94A3B8]/60";

                  return (
                    <View
                      key={day.key}
                      style={{ width: "14.28%" }}
                      className={`h-16 p-1 items-center justify-center border ${
                        dayBackgroundClass
                      } ${borderClass}`}
                    >
                      <Text className={`text-sm ${textClass}`}>{day.label}</Text>
                      {dayEvents.length > 0 && (
                        <View
                          className={`mt-1 px-1.5 py-0.5 rounded-full ${badgeClass}`}
                        >
                          <Text className="text-[10px] text-white font-semibold">
                            {dayEvents.length} evt
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-base font-semibold text-gray-700">
              Upcoming Events
            </Text>

            {monthEvents.length === 0 ? (
              <View className="mt-4 rounded-xl bg-white p-4 border border-gray-200">
                <Text className="text-gray-500 text-center">No events scheduled.</Text>
              </View>
            ) : (
              monthEvents.map((event) => {
                const eventDate =
                  event.date instanceof Date ? event.date : new Date(event.date);
                const normalizedType = String(event.type || "").toUpperCase();
                const isIncome = normalizedType === "INCOME";
                const isExpense = normalizedType === "EXPENSE";
                const accentColor = isIncome
                  ? "#26A69A"
                  : isExpense
                  ? "#EF5350"
                  : "#17A2B8";
                const backgroundColor = isIncome
                  ? "#E0F7FA"
                  : isExpense
                  ? "#FDE8E8"
                  : "#E0F2FE";
                return (
                  <View
                    key={event.id}
                    className="relative mt-4 overflow-hidden rounded-2xl border shadow-sm"
                    style={{
                      borderColor: `${accentColor}33`,
                      backgroundColor,
                    }}
                  >
                    <View
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: accentColor }}
                    />
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text
                          className="text-base font-semibold"
                          style={{
                            color: isIncome
                              ? "#00695C"
                              : isExpense
                              ? "#9B2C2C"
                              : "#0F4C75",
                          }}
                        >
                          {event.title}
                        </Text>
                        <Text className="text-xs text-gray-600 mt-1">
                          {formatDateLabel(eventDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: accentColor }}
                        >
                          {isIncome ? "+" : isExpense ? "-" : ""}${formatCurrency(event.amount)}
                        </Text>
                        <Text className="text-xs text-gray-600 mt-1">
                          {getTypeLabel(event.type)}
                        </Text>
                      </View>
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
