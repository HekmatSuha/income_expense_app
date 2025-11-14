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

const FILTERS = [
  { type: "all", label: "All" },
  { type: "daily", label: "Daily" },
  { type: "weekly", label: "Weekly" },
  { type: "monthly", label: "Monthly" },
  { type: "yearly", label: "Yearly" },
];

const INITIAL_NOTES = [
  {
    id: "1",
    text: "Today I should go to shopping",
    date: "Fri, 14 Nov 2025",
    completed: false,
    type: "monthly",
  },
  {
    id: "2",
    text: "Prepare budget report",
    date: "Tue, 18 Nov 2025",
    completed: true,
    type: "weekly",
  },
  {
    id: "3",
    text: "Plan year-end savings goals",
    date: "Sun, 30 Nov 2025",
    completed: false,
    type: "yearly",
  },
];

function getMonthName(index) {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][index];
}

function formatMonthRange(date) {
  const year = date.getFullYear();
  const monthName = getMonthName(date.getMonth());
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
  return `01-${monthName.slice(0, 3)}-${year} -> ${lastDay}-${monthName.slice(0, 3)}-${year}`;
}

export default function NotebookScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("monthly");
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));

  const filteredNotes = useMemo(() => {
    if (activeFilter === "all") {
      return notes;
    }
    return notes.filter((note) => note.type === activeFilter);
  }, [activeFilter, notes]);

  const { completedCount, pendingCount, totalCount } = useMemo(() => {
    const completed = filteredNotes.filter((note) => note.completed).length;
    const pending = filteredNotes.length - completed;
    return {
      completedCount: completed,
      pendingCount: pending,
      totalCount: filteredNotes.length,
    };
  }, [filteredNotes]);

  const handleTabChange = (tab) => {
    if (tab === "notebook") {
      return;
    }
    if (tab === "home") {
      navigation.navigate("Home");
    }
    if (tab === "calendar") {
      navigation.navigate("Calendar");
    }
  };

  const toggleNoteComplete = (id) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
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
          <Text className="text-white text-xl font-semibold">Notebook</Text>
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

      <Navigation activeTab="notebook" onTabChange={handleTabChange} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            <View className="flex-row space-x-2">
              {FILTERS.map((filter) => {
                const isActive = filter.type === activeFilter;
                return (
                  <TouchableOpacity
                    key={filter.type}
                    onPress={() => setActiveFilter(filter.type)}
                    className={`px-4 py-2 rounded-full border ${
                      isActive
                        ? "bg-[#0288D1] border-[#0288D1]"
                        : "bg-white border-gray-300"
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View className="mt-4 bg-[#0288D1] rounded-2xl px-4 py-3 flex-row items-center justify-between">
            <TouchableOpacity onPress={goToPreviousMonth} className="p-1" activeOpacity={0.7}>
              <MaterialIcons name="chevron-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white font-semibold text-sm">
              {formatMonthRange(currentDate)}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} className="p-1" activeOpacity={0.7}>
              <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            {filteredNotes.length === 0 ? (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500">No notes yet</Text>
              </View>
            ) : (
              filteredNotes.map((note) => (
                <View
                  key={note.id}
                  className="mb-3 rounded-2xl bg-white p-4 border border-gray-200 shadow-sm"
                >
                  <Text className="text-base text-gray-800">{note.text}</Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-xs text-gray-500">{note.date}</Text>
                    <TouchableOpacity
                      onPress={() => toggleNoteComplete(note.id)}
                      className={`h-6 w-6 items-center justify-center rounded border-2 ${
                        note.completed
                          ? "bg-[#0288D1] border-[#0288D1]"
                          : "border-[#0288D1]"
                      }`}
                      activeOpacity={0.8}
                    >
                      {note.completed && (
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute right-6 bottom-36 h-14 w-14 items-center justify-center rounded-full bg-[#0288D1] shadow-lg"
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200">
        <View className="flex-row">
          <View className="flex-1 items-center border-r border-gray-200 py-3">
            <Text className="text-sm font-medium text-green-600">Completed</Text>
            <Text className="text-lg font-semibold text-gray-800">{completedCount}</Text>
          </View>
          <View className="flex-1 items-center border-r border-gray-200 py-3">
            <Text className="text-sm font-medium text-red-600">Pending</Text>
            <Text className="text-lg font-semibold text-gray-800">{pendingCount}</Text>
          </View>
          <View className="flex-1 items-center py-3">
            <Text className="text-sm font-medium text-gray-500">Total</Text>
            <Text className="text-lg font-semibold text-gray-800">{totalCount}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
