import React, { useMemo, useState } from "react";
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

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const EVENTS = [
  {
    id: "1",
    title: "Grocery Shopping",
    type: "Expense",
    date: "2025-11-03",
    amount: 120.5,
  },
  {
    id: "2",
    title: "Salary",
    type: "Income",
    date: "2025-11-08",
    amount: 3800,
  },
  {
    id: "3",
    title: "Coffee with Alex",
    type: "Expense",
    date: "2025-11-14",
    amount: 15.25,
  },
  {
    id: "4",
    title: "Car Insurance",
    type: "Expense",
    date: "2025-11-21",
    amount: 240,
  },
  {
    id: "5",
    title: "Freelance Project",
    type: "Income",
    date: "2025-11-26",
    amount: 640,
  },
];

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
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));

  const calendarDays = useMemo(
    () => getCalendarDays(currentDate),
    [currentDate]
  );

  const monthEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth()
      );
    }).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [currentDate]);

  const handleTabChange = (tab) => {
    if (tab === "calendar") {
      return;
    }
    if (tab === "home") {
      navigation.navigate("Home");
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
                  const hasEvents = monthEvents.some((event) => {
                    const eventDate = new Date(event.date);
                    return (
                      eventDate.getFullYear() === day.date.getFullYear() &&
                      eventDate.getMonth() === day.date.getMonth() &&
                      eventDate.getDate() === day.date.getDate()
                    );
                  });

                  return (
                    <View
                      key={day.key}
                      style={{ width: "14.28%" }}
                      className={`h-16 p-1 items-center justify-center border border-[#0288D1]/10 ${
                        day.isCurrentMonth ? "bg-white" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          day.isCurrentMonth ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {day.label}
                      </Text>
                      {hasEvents && (
                        <View className="mt-1 h-2 w-2 rounded-full bg-[#0288D1]" />
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
                const eventDate = new Date(event.date);
                return (
                  <View
                    key={event.id}
                    className="mt-4 rounded-xl bg-white p-4 border border-gray-200 shadow-sm"
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-base font-semibold text-gray-800">
                          {event.title}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {formatDateLabel(eventDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className={`text-sm font-semibold ${
                            event.type === "Income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {event.type === "Income" ? "+" : "-"}${formatCurrency(event.amount)}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">{event.type}</Text>
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
