import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import Navigation from "../components/Navigation";

const SafeAreaView = styled(RNSafeAreaView);
const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
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

function formatDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateInput(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map((part) => Number(part));
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function formatNoteDate(dateString) {
  if (!isValidDateInput(dateString)) {
    return dateString;
  }
  const [year, month, day] = dateString.split("-").map((part) => Number(part));
  const date = new Date(year, month - 1, day);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${weekdays[date.getDay()]}, ${String(day).padStart(2, "0")} ${months[date.getMonth()]} ${year}`;
}

function sortNotesList(noteList) {
  return [...noteList].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();

    const isTimeAValid = !Number.isNaN(timeA);
    const isTimeBValid = !Number.isNaN(timeB);

    if (isTimeAValid && isTimeBValid && timeA !== timeB) {
      return timeB - timeA;
    }

    if (isTimeAValid && !isTimeBValid) {
      return -1;
    }

    if (!isTimeAValid && isTimeBValid) {
      return 1;
    }

    return String(b.id).localeCompare(String(a.id));
  });
}

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
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteDate, setNewNoteDate] = useState(() => formatDateInput(new Date()));
  const [newNoteFrequency, setNewNoteFrequency] = useState("monthly");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const filteredNotes = useMemo(() => {
    if (activeFilter === "all") {
      return notes;
    }
    return notes.filter((note) => note.frequency === activeFilter);
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

  const loadNotes = useCallback(
    async ({ showLoader = true } = {}) => {
      if (showLoader) {
        setLoading(true);
      }
      setFetchError("");
      setActionError("");
      try {
        const user = auth.currentUser;
        if (!user) {
          setNotes([]);
          return;
        }

        const notesQuery = query(
          collection(db, "notes"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(notesQuery);
        const data = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        setNotes(sortNotesList(data));
      } catch (error) {
        console.error("Failed to fetch notes", error);
        setFetchError("Unable to load notes. Pull to refresh or try again.");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes({ showLoader: false });
    setRefreshing(false);
  }, [loadNotes]);

  const resetNoteForm = useCallback(() => {
    setNewNoteText("");
    setNewNoteDate(formatDateInput(new Date()));
    setNewNoteFrequency("monthly");
  }, []);

  const handleToggleCreateForm = useCallback(() => {
    setShowCreateForm((prev) => {
      if (prev && creating) {
        return prev;
      }
      const next = !prev;
      if (!next) {
        resetNoteForm();
        setCreateError("");
      } else {
        setCreateError("");
      }
      return next;
    });
  }, [creating, resetNoteForm]);

  const handleCancelCreate = useCallback(() => {
    if (creating) {
      return;
    }
    resetNoteForm();
    setShowCreateForm(false);
    setCreateError("");
  }, [creating, resetNoteForm]);

  const handleCreateNote = useCallback(async () => {
    const trimmedText = newNoteText.trim();

    if (!trimmedText) {
      setCreateError("Please add a note before saving.");
      return;
    }

    if (!isValidDateInput(newNoteDate)) {
      setCreateError("Enter a valid date in YYYY-MM-DD format.");
      return;
    }

    setCreating(true);
    setCreateError("");

    const tempId = `temp-${Date.now()}`;
    const optimisticNote = {
      id: tempId,
      text: trimmedText,
      date: newNoteDate,
      frequency: newNoteFrequency,
      completed: false,
    };

    setNotes((prev) => sortNotesList([optimisticNote, ...prev]));

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("auth/not-authenticated");
      }

      const notePayload = {
        text: trimmedText,
        date: newNoteDate,
        frequency: newNoteFrequency,
        completed: false,
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, "notes"), notePayload);

      setNotes((prev) =>
        sortNotesList(
          prev.map((note) =>
            note.id === tempId ? { id: docRef.id, ...notePayload } : note
          )
        )
      );
      resetNoteForm();
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create note", error);
      if (error.message === "auth/not-authenticated") {
        setCreateError("You must be logged in to create notes.");
      } else {
        setCreateError("Unable to create note. Please try again.");
      }
      setNotes((prev) => prev.filter((note) => note.id !== tempId));
    } finally {
      setCreating(false);
    }
  }, [newNoteDate, newNoteFrequency, newNoteText, resetNoteForm]);

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
    if (tab === "bankAccounts") {
      navigation.navigate("BankAccounts");
    }
  };

  const toggleNoteComplete = useCallback(
    async (id) => {
      setActionError("");
      const existingNote = notes.find((note) => note.id === id);
      if (!existingNote) {
        return;
      }

      const optimisticNote = {
        ...existingNote,
        completed: !existingNote.completed,
      };

      setNotes((prev) =>
        sortNotesList(prev.map((note) => (note.id === id ? optimisticNote : note)))
      );

      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("auth/not-authenticated");
        }

        await updateDoc(doc(db, "notes", id), {
          completed: optimisticNote.completed,
        });
      } catch (error) {
        console.error("Failed to toggle note", error);
        if (error.message === "auth/not-authenticated") {
          setActionError("You must be logged in to update notes.");
        } else {
          setActionError("Unable to update note. Please try again.");
        }
        setNotes((prev) =>
          sortNotesList(prev.map((note) => (note.id === id ? existingNote : note)))
        );
      }
    },
    [notes]
  );

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0288D1"
            colors={["#0288D1"]}
          />
        }
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

          {showCreateForm ? (
            <View className="mt-4 rounded-2xl border border-[#0288D133] bg-white p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-[#1F2937]">Create a note</Text>
                <TouchableOpacity
                  onPress={handleCancelCreate}
                  activeOpacity={0.7}
                  disabled={creating}
                  className="p-1"
                  style={{ opacity: creating ? 0.6 : 1 }}
                >
                  <MaterialIcons name="close" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
              <View className="mt-4 space-y-3">
                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1">Note</Text>
                  <TextInput
                    value={newNoteText}
                    onChangeText={setNewNoteText}
                    placeholder="What do you need to remember?"
                    multiline
                    className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                    editable={!creating}
                  />
                </View>
                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1">Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={newNoteDate}
                    onChangeText={setNewNoteDate}
                    placeholder="YYYY-MM-DD"
                    keyboardType="numbers-and-punctuation"
                    className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
                    editable={!creating}
                  />
                </View>
                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-2">Frequency</Text>
                  <View className="flex-row flex-wrap">
                    {FILTERS.filter((filter) => filter.type !== "all").map((filter) => {
                      const isSelected = filter.type === newNoteFrequency;
                      const palette = NOTE_TYPE_COLORS[filter.type] || NOTE_TYPE_COLORS.all;
                      return (
                        <TouchableOpacity
                          key={filter.type}
                          onPress={() => setNewNoteFrequency(filter.type)}
                          className="mr-2 mb-2 px-3 py-1.5 rounded-full border"
                          activeOpacity={0.8}
                          disabled={creating}
                          style={{
                            backgroundColor: isSelected ? palette.card : "#F8FAFC",
                            borderColor: isSelected ? palette.accent : "#E2E8F0",
                            opacity: creating ? 0.7 : 1,
                          }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: isSelected ? palette.text : "#475569" }}
                          >
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {createError ? (
                  <Text className="text-xs text-red-500">{createError}</Text>
                ) : null}
                <View className="mt-1 flex-row justify-end">
                  <TouchableOpacity
                    onPress={handleCancelCreate}
                    activeOpacity={0.7}
                    disabled={creating}
                    className="mr-3 px-4 py-2 rounded-full border border-[#CBD5F5]"
                    style={{ opacity: creating ? 0.7 : 1 }}
                  >
                    <Text className="text-sm font-medium text-[#475569]">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateNote}
                    activeOpacity={0.85}
                    disabled={creating}
                    className="px-4 py-2 rounded-full bg-[#0288D1]"
                    style={{ opacity: creating ? 0.7 : 1 }}
                  >
                    <Text className="text-sm font-semibold text-white">
                      {creating ? "Saving..." : "Save note"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          {fetchError ? (
            <View className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm font-medium text-red-700">{fetchError}</Text>
            </View>
          ) : null}

          <View className="mt-4">
            {loading ? (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500">Loading notes...</Text>
              </View>
            ) : filteredNotes.length === 0 ? (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500">No notes yet</Text>
              </View>
            ) : (
              filteredNotes.map((note) => {
                const palette = NOTE_TYPE_COLORS[note.frequency] || NOTE_TYPE_COLORS.all;
                return (
                  <View
                    key={note.id}
                    className="relative mb-3 overflow-hidden rounded-2xl border shadow-sm p-4"
                    style={{
                      backgroundColor: palette.card,
                      borderColor: `${palette.accent}33`,
                    }}
                  >
                    <View
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: palette.accent }}
                    />
                    <Text className="text-base font-medium" style={{ color: palette.text }}>
                      {note.text}
                    </Text>
                    <View className="mt-3 flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: `${palette.text}B3` }}>
                        {formatNoteDate(note.date)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleNoteComplete(note.id)}
                        className="h-6 w-6 items-center justify-center rounded border-2"
                        style={{
                          backgroundColor: note.completed ? palette.accent : "transparent",
                          borderColor: palette.accent,
                        }}
                        activeOpacity={0.8}
                      >
                        {note.completed ? (
                          <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        ) : null}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {actionError ? (
            <View className="mt-2 items-end">
              <Text className="text-xs text-red-500">{actionError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute right-6 bottom-36 h-14 w-14 items-center justify-center rounded-full bg-[#0288D1] shadow-lg"
        activeOpacity={0.8}
        onPress={handleToggleCreateForm}
        disabled={creating}
        style={{ opacity: creating ? 0.7 : 1 }}
      >
        <MaterialIcons name={showCreateForm ? "remove" : "add"} size={30} color="#FFFFFF" />
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
