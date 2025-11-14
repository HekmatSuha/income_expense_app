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

const FILTER_PALETTE = {
  all: { background: "#FFF8E1", text: "#B7791F", border: "#F6AD55" },
  daily: { background: "#E8F5E9", text: "#2F855A", border: "#68D391" },
  weekly: { background: "#E3F2FD", text: "#1D4ED8", border: "#60A5FA" },
  monthly: { background: "#F3E8FF", text: "#6B21A8", border: "#C084FC" },
  yearly: { background: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5" },
};

const NOTE_TYPE_COLORS = {
  daily: { card: "#E3F2FD", text: "#1E3A8A", accent: "#3B82F6" },
  weekly: { card: "#F3E8FF", text: "#5B21B6", accent: "#8B5CF6" },
  monthly: { card: "#FFF3E0", text: "#9C4221", accent: "#F59E0B" },
  yearly: { card: "#E0F2F1", text: "#00695C", accent: "#26A69A" },
  all: { card: "#F1F5F9", text: "#1F2937", accent: "#0288D1" },
};

const SUMMARY_COLORS = {
  completed: { background: "#E6FFFA", text: "#0F766E" },
  pending: { background: "#FEF3C7", text: "#B45309" },
  total: { background: "#E0E7FF", text: "#3730A3" },
};

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
                const palette = FILTER_PALETTE[filter.type];
                return (
                  <TouchableOpacity
                    key={filter.type}
                    onPress={() => setActiveFilter(filter.type)}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isActive ? palette.background : "#FFFFFF",
                      borderColor: isActive ? palette.border : "#E2E8F0",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isActive ? palette.text : "#4B5563" }}
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
                  className="relative mb-3 overflow-hidden rounded-2xl border shadow-sm p-4"
                  style={{
                    backgroundColor:
                      (NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all).card,
                    borderColor: `${(NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all).accent}33`,
                  }}
                >
                  <View
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{
                      backgroundColor: (NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all)
                        .accent,
                    }}
                  />
                  <Text
                    className="text-base font-medium"
                    style={{ color: (NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all).text }}
                  >
                    {note.text}
                  </Text>
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text
                      className="text-xs"
                      style={{
                        color: `${(NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all).text}B3`,
                      }}
                    >
                      {note.date}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleNoteComplete(note.id)}
                      className="h-6 w-6 items-center justify-center rounded border-2"
                      style={{
                        backgroundColor: note.completed
                          ? (NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all).accent
                          : "transparent",
                        borderColor: (NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.all).accent,
                      }}
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

      <View className="absolute left-0 right-0 bottom-0 border-t border-gray-200 bg-white">
        <View className="flex-row">
          <View
            className="flex-1 items-center py-3"
            style={{
              backgroundColor: SUMMARY_COLORS.completed.background,
              borderRightColor: "#FFFFFF",
              borderRightWidth: 1,
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: SUMMARY_COLORS.completed.text }}
            >
              Completed
            </Text>
            <Text className="text-lg font-semibold text-gray-800">{completedCount}</Text>
          </View>
          <View
            className="flex-1 items-center py-3"
            style={{
              backgroundColor: SUMMARY_COLORS.pending.background,
              borderRightColor: "#FFFFFF",
              borderRightWidth: 1,
            }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: SUMMARY_COLORS.pending.text }}
            >
              Pending
            </Text>
            <Text className="text-lg font-semibold text-gray-800">{pendingCount}</Text>
          </View>
          <View
            className="flex-1 items-center py-3"
            style={{ backgroundColor: SUMMARY_COLORS.total.background }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: SUMMARY_COLORS.total.text }}
            >
              Total
            </Text>
            <Text className="text-lg font-semibold text-gray-800">{totalCount}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
