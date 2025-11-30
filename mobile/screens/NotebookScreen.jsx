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
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { styled } from "../packages/nativewind";
import { auth } from "../firebase";
import Navigation from "../components/Navigation";
import NavbarDrawer from "../components/NavbarDrawer";
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

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function NotebookScreen({ navigation }) {
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
        className="mb-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-[#0F172A]">
              {note.text}
            </Text>
            {note.date ? (
              <Text className="mt-1 text-xs text-[#64748b]">{note.date}</Text>
            ) : null}
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => handleToggle(note.id)}
              activeOpacity={0.8}
              className={`h-7 w-7 items-center justify-center rounded-full border ${
                note.completed ? "bg-[#0288D1] border-[#0288D1]" : "border-[#CBD5E1]"
              }`}
            >
              {note.completed ? (
                <MaterialIcons name="check" size={18} color="#FFFFFF" />
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Delete task", "Are you sure you want to delete this task?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => handleDelete(note.id) },
                ])
              }
              activeOpacity={0.8}
              className="h-7 w-7 items-center justify-center rounded-full bg-[#FEE2E2]"
            >
              <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F5F9]">
      <View className="bg-[#0288D1] px-4 py-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="p-1 mr-2"
              activeOpacity={0.7}
              onPress={() => setNavbarVisible(true)}
            >
              <MaterialIcons name="menu" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-semibold">Notebook</Text>
          </View>
          <View className="flex-row items-center space-x-3" />
        </View>
      </View>

      <Navigation activeTab="notebook" onTabChange={handleTabChange} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
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
        <View className="px-4 pt-4 space-y-4">
          <View className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <Text className="text-lg font-semibold text-[#0F172A] mb-3">Add a task</Text>
            <TextInput
              placeholder="What do you need to do?"
              placeholderTextColor="#94A3B8"
              className="mb-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-base text-[#0F172A]"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <TextInput
              placeholder="Due date (YYYY-MM-DD) optional"
              placeholderTextColor="#94A3B8"
              className="mb-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-base text-[#0F172A]"
              value={dateInput}
              onChangeText={setDateInput}
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={handleAddNote}
                activeOpacity={0.85}
                className="rounded-full bg-[#0288D1] px-5 py-3"
              >
                <Text className="text-white font-semibold">Add task</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row">
            {STATUS_FILTERS.map((item) => {
              const isActive = filter === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  activeOpacity={0.8}
                  className={`mr-2 rounded-full px-4 py-2 border ${
                    isActive ? "bg-[#0288D1] border-[#0288D1]" : "bg-white border-[#E2E8F0]"
                  }`}
                  style={{ minWidth: 96 }}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-[#0F172A]"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? (
            <View className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm font-medium text-red-700">{error}</Text>
            </View>
          ) : null}

          <View className="pt-2">
            <Text className="text-sm font-semibold text-[#0F172A] mb-2">Tasks</Text>
            {loading ? (
              <View className="items-center justify-center py-10 rounded-2xl border border-[#E2E8F0] bg-white">
                <Text className="text-[#64748b]">Loading tasks...</Text>
              </View>
            ) : filteredNotes.length === 0 ? (
              <View className="items-center justify-center py-12 rounded-2xl border border-dashed border-[#CBD5E1] bg-white">
                <Text className="text-[#64748b] mb-3">No tasks yet</Text>
                <TouchableOpacity
                  onPress={handleAddNote}
                  activeOpacity={0.85}
                  className="rounded-full bg-[#0288D1] px-5 py-3"
                >
                  <Text className="text-white font-semibold">Add your first task</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredNotes.map(renderNoteCard)
            )}
          </View>
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
