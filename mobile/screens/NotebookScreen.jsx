import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView as RNScrollView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  View as RNView,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import Navigation from "../components/Navigation";
import NavbarDrawer from "../components/NavbarDrawer";
import AppHeader from "../components/AppHeader";
import {
  addLocalNote,
  deleteLocalNote,
  getLocalNotes,
  updateLocalNote,
} from "../storage/notebook";

const ScrollView = styled(RNScrollView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const TouchableOpacity = styled(RNTouchableOpacity);
const View = styled(RNView);
const SafeAreaView = styled(RNSafeAreaView);

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function NotebookScreen({ navigation }) {
  const COLORS = useMemo(
    () => ({
      primary: "#0288D1",
      accent: "#0EA5E9",
      surface: "#FFFFFF",
      border: "#D0E4F2",
      background: "#E6F3FB",
      text: "#0F172A",
      muted: "#64748B",
      success: "#10B981",
      danger: "#EF4444",
    }),
    []
  );

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [isNavbarVisible, setNavbarVisible] = useState(false);
  const userId = auth.currentUser?.uid;

  const filteredNotes = useMemo(() => {
    if (filter === "completed") {
      return notes.filter((note) => note.completed);
    }
    if (filter === "active") {
      return notes.filter((note) => !note.completed);
    }
    return notes;
  }, [filter, notes]);

  const stats = useMemo(() => {
    const completed = notes.filter((n) => n.completed).length;
    const total = notes.length;
    return {
      completed,
      total,
      pending: total - completed,
    };
  }, [notes]);

  const loadNotes = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const stored = await getLocalNotes(userId);
      setNotes(stored);
    } catch (err) {
      console.error("Failed to load notes", err);
      setError("Unable to load notes. Pull to refresh or try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const handleAddNote = async () => {
    const title = titleInput.trim();
    const date = dateInput.trim();

    if (!title) {
      Alert.alert("Add a task", "Please enter a task name.");
      return;
    }

    try {
      const created = await addLocalNote(userId, {
        text: title,
        date: date || new Date().toISOString().slice(0, 10),
        frequency: "custom",
        completed: false,
      });
      setNotes((prev) => [created, ...prev]);
      setTitleInput("");
      setDateInput("");
    } catch (err) {
      console.error("Failed to add note", err);
      Alert.alert("Error", "Could not save this task. Please try again.");
    }
  };

  const handleToggle = async (noteId) => {
    const existing = notes.find((n) => n.id === noteId);
    if (!existing) return;
    const updated = { ...existing, completed: !existing.completed };
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    try {
      await updateLocalNote(userId, noteId, { completed: updated.completed });
    } catch (err) {
      console.error("Failed to toggle note", err);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? existing : n)));
      Alert.alert("Error", "Could not update this task.");
    }
  };

  const handleDelete = async (noteId) => {
    const existing = notes.find((n) => n.id === noteId);
    if (!existing) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await deleteLocalNote(userId, noteId);
    } catch (err) {
      console.error("Failed to delete note", err);
      Alert.alert("Error", "Could not delete this task.");
      setNotes((prev) => [existing, ...prev]);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "notebook") return;
    if (tab === "home") navigation.navigate("Home");
    if (tab === "bankAccounts") navigation.navigate("BankAccounts");
    if (tab === "calendar") navigation.navigate("Calendar");
  };

  const renderNoteCard = (note) => {
    return (
      <View
        key={note.id}
        className="mb-3 rounded-2xl p-4 shadow-sm"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 }}
      >
        <View
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: note.completed ? COLORS.success : COLORS.accent }}
        />
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text
              className="text-base font-semibold"
              style={{
                color: COLORS.text,
                textDecorationLine: note.completed ? "line-through" : "none",
              }}
            >
              {note.text}
            </Text>
            {note.date ? (
              <Text className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                {note.date}
              </Text>
            ) : null}
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => handleToggle(note.id)}
              activeOpacity={0.8}
              className="h-8 w-8 items-center justify-center rounded-full border"
              style={{
                borderColor: note.completed ? COLORS.success : COLORS.border,
                backgroundColor: note.completed ? COLORS.success : COLORS.surface,
                shadowColor: "#00000022",
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              {note.completed ? (
                <MaterialIcons name="check" size={18} color="#FFFFFF" />
              ) : (
                <MaterialIcons name="radio-button-unchecked" size={18} color={COLORS.muted} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Delete task", "Are you sure you want to delete this task?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => handleDelete(note.id) },
                ])
              }
              activeOpacity={0.8}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: "#FEE2E2",
                shadowColor: "#00000022",
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: COLORS.background }}>
      <AppHeader
        title="Notebook"
        onMenuPress={() => setNavbarVisible(true)}
        rightIconName="notifications"
        onRightPress={() => {}}
        backgroundColor={COLORS.primary}
      />

      <Navigation activeTab="notebook" onTabChange={handleTabChange} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 180,
          paddingHorizontal: 16,
          paddingTop: 16,
          flexGrow: 1,
        }}
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
        <View className="rounded-2xl p-4 shadow-sm mb-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 }}>
          <Text className="text-lg font-semibold mb-3" style={{ color: COLORS.text }}>
            Add a task
          </Text>
          <TextInput
            placeholder="What do you need to do?"
            placeholderTextColor="#94A3B8"
            className="mb-3 rounded-xl px-4 py-3 text-base"
            style={{
              backgroundColor: "#F8FAFC",
              borderColor: COLORS.border,
              borderWidth: 1,
              color: COLORS.text,
            }}
            value={titleInput}
            onChangeText={setTitleInput}
          />
          <TextInput
            placeholder="Due date (YYYY-MM-DD) optional"
            placeholderTextColor="#94A3B8"
            className="mb-3 rounded-xl px-4 py-3 text-base"
            style={{
              backgroundColor: "#F8FAFC",
              borderColor: COLORS.border,
              borderWidth: 1,
              color: COLORS.text,
            }}
            value={dateInput}
            onChangeText={setDateInput}
          />
          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={handleAddNote}
              activeOpacity={0.85}
              className="rounded-full px-5 py-3"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="text-white font-semibold">Add task</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row mb-4">
          {STATUS_FILTERS.map((item) => {
            const isActive = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setFilter(item.key)}
                activeOpacity={0.8}
                className="mr-2 rounded-full px-4 py-2 border"
                style={{
                  minWidth: 96,
                  borderColor: isActive ? COLORS.primary : COLORS.border,
                  backgroundColor: isActive ? COLORS.primary : COLORS.surface,
                  shadowColor: "#00000011",
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 2,
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: isActive ? "#FFFFFF" : COLORS.text }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
            <Text className="text-sm font-medium text-red-700">{error}</Text>
          </View>
        ) : null}

        <View className="pt-2">
          <Text className="text-sm font-semibold mb-2" style={{ color: COLORS.text }}>
            Tasks
          </Text>
          {loading ? (
            <View
              className="items-center justify-center py-10 rounded-2xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
            >
              <Text className="text-sm" style={{ color: COLORS.muted }}>
                Loading tasks...
              </Text>
            </View>
          ) : filteredNotes.length === 0 ? (
            <View
              className="items-center justify-center py-12 rounded-2xl border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, borderStyle: "dashed" }}
            >
              <Text className="text-[#64748b] mb-3">No tasks yet</Text>
              <TouchableOpacity
                onPress={handleAddNote}
                activeOpacity={0.85}
                className="rounded-full px-5 py-3"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Text className="text-white font-semibold">Add your first task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredNotes.map(renderNoteCard)
          )}
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 border-t border-[#E2E8F0] bg-white">
        <View className="flex-row">
          <View className="flex-1 items-center py-3 border-r border-[#E2E8F0]">
            <Text className="text-xs font-semibold text-[#0F172A]">Pending</Text>
            <Text className="text-lg font-bold text-[#0288D1]">{stats.pending}</Text>
          </View>
          <View className="flex-1 items-center py-3 border-r border-[#E2E8F0]">
            <Text className="text-xs font-semibold text-[#0F172A]">Completed</Text>
            <Text className="text-lg font-bold text-[#10B981]">{stats.completed}</Text>
          </View>
          <View className="flex-1 items-center py-3">
            <Text className="text-xs font-semibold text-[#0F172A]">Total</Text>
            <Text className="text-lg font-bold text-[#0F172A]">{stats.total}</Text>
          </View>
        </View>
      </View>

      <NavbarDrawer
        visible={isNavbarVisible}
        onClose={() => setNavbarVisible(false)}
        user={auth.currentUser}
        onItemPress={(key) => {
          setNavbarVisible(false);
          if (key === "profile") navigation.navigate("Profile");
          if (key === "settings") Alert.alert("Settings", "Coming soon.");
          if (key === "support") Alert.alert("Support", "support@incomeexpense.app");
          if (key === "feedback") Alert.alert("Feedback", "We'd love to hear from you.");
          if (key === "logout") {
            auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          }
        }}
      />
    </SafeAreaView>
  );
}
