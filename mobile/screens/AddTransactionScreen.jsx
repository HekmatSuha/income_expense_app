import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase";

const parseDateTimeToISO = (dateString, timeString) => {
  const normalizedDate = (dateString || "").replace(/-/g, " ");
  const normalizedTime = (timeString || "").replace(/\./g, "").toUpperCase();
  const candidate = new Date(`${normalizedDate} ${normalizedTime}`.trim());
  if (!Number.isNaN(candidate.getTime())) {
    return candidate.toISOString();
  }
  return new Date().toISOString();
};

export default function AddTransactionScreen({ navigation, route }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(route?.params?.type || "EXPENSE");
  const [category, setCategory] = useState(
    route?.params?.type === "INCOME" ? "Allowance" : "Food"
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentAccount, setPaymentAccount] = useState("Main Account");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("14-Nov-2025");
  const [time, setTime] = useState("09:28 PM");
  const [recurring, setRecurring] = useState("");

  useEffect(() => {
    if (route?.params?.type) {
      setType(route.params.type);
      if (route.params.type === "INCOME") {
        setCategory("Allowance");
      }
    }
  }, [route?.params?.type]);

  const isIncome = useMemo(() => type === "INCOME", [type]);

  const handleSave = async () => {
    if (!amount) {
      Alert.alert("Missing amount", "Please enter an amount to continue.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Not authenticated", "You must be logged in to add a transaction.");
        return;
      }
      await addDoc(collection(db, "transactions"), {
        amount: Number(amount),
        type,
        category,
        note: notes,
        date: parseDateTimeToISO(date, time),
        userId: user.uid,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save transaction", error);
      Alert.alert(
        "Error",
        "Unable to save the transaction at the moment. Please try again."
      );
    }
  };

  if (!isIncome) {
    return (
      <SafeAreaView style={styles.basicContainer}>
        <ScrollView contentContainerStyle={styles.basicContent}>
          <Text style={styles.basicTitle}>
            {type === "EXPENSE" ? "Add Expense" : "Add Transaction"}
          </Text>
          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.basicInput}
          />
          <TextInput
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.basicInput}
          />
          <TextInput
            placeholder="Notes"
            value={notes}
            onChangeText={setNotes}
            style={[styles.basicInput, styles.basicNotes]}
            multiline
          />
          <TouchableOpacity style={styles.basicSaveButton} onPress={handleSave}>
            <Text style={styles.basicSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={styles.headerButton}
            >
              <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrapper}>
              <Text style={styles.headerTitle}>Add Income</Text>
              <MaterialIcons name="expand-more" size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Income</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.textInput}
              />
              <MaterialIcons
                name="calculate"
                size={22}
                color="#2563EB"
                style={styles.inputIcon}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.selectButton}>
              <View style={styles.selectContent}>
                <Text style={styles.emoji}>👋</Text>
                <TextInput
                  value={category}
                  onChangeText={setCategory}
                  style={styles.selectInput}
                />
              </View>
              <MaterialIcons name="account-balance-wallet" size={22} color="#2563EB" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.selectButton}>
              <TextInput
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                style={styles.selectInput}
              />
              <View style={styles.methodIconWrapper}>
                <View style={styles.methodIcon} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Payment Account</Text>
            <View style={styles.selectButton}>
              <TextInput
                value={paymentAccount}
                onChangeText={setPaymentAccount}
                style={styles.selectInput}
              />
              <MaterialIcons name="account-balance" size={22} color="#2563EB" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="mic"
                size={20}
                color="#9CA3AF"
                style={styles.leadingIcon}
              />
              <TextInput
                placeholder="[Optional]"
                value={notes}
                onChangeText={setNotes}
                style={[styles.textInput, styles.notesInput]}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.secondaryButton}>
              <MaterialIcons name="photo-camera" size={22} color="#2563EB" />
              <Text style={styles.secondaryButtonText}>Add Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <MaterialIcons name="format-list-bulleted" size={22} color="#2563EB" />
              <Text style={styles.secondaryButtonText}>Add Items</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.dateCard}>
              <View style={styles.dateNavigation}>
                <TouchableOpacity
                  accessibilityLabel="Previous day"
                  onPress={() => setDate((prev) => prev)}
                >
                  <MaterialIcons name="chevron-left" size={20} color="#111827" />
                </TouchableOpacity>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.dateInput}
                />
                <TouchableOpacity
                  accessibilityLabel="Next day"
                  onPress={() => setDate((prev) => prev)}
                >
                  <MaterialIcons name="chevron-right" size={20} color="#111827" />
                </TouchableOpacity>
              </View>
              <MaterialIcons name="calendar-today" size={22} color="#2563EB" />
            </View>
            <View style={styles.dateCard}>
              <TextInput
                value={time}
                onChangeText={setTime}
                style={styles.timeInput}
              />
              <MaterialIcons name="access-time" size={22} color="#2563EB" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Recurring? Set Reminder</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={recurring}
                onChangeText={setRecurring}
                style={styles.textInput}
              />
              <MaterialIcons
                name="calendar-month"
                size={22}
                color="#2563EB"
                style={styles.inputIcon}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomButton, styles.bottomButtonBorder]}>
          <Text style={styles.bottomButtonText}>Payment Method</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomButton, styles.bottomButtonBorder]}>
          <Text style={styles.bottomButtonText}>Category</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomButton, styles.saveButton]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  headerButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 4,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  label: {
    color: "#047857",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    padding: 0,
  },
  notesInput: {
    color: "#6B7280",
  },
  inputIcon: {
    marginLeft: 8,
  },
  leadingIcon: {
    marginRight: 8,
  },
  selectButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  selectInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    padding: 0,
  },
  methodIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  methodIcon: {
    width: 18,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
  },
  dateCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dateNavigation: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  dateInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    padding: 0,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#D1D5DB",
    height: 56,
  },
  bottomButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonBorder: {
    borderRightWidth: 1,
    borderColor: "#D1D5DB",
  },
  bottomButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  basicContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  basicContent: {
    padding: 16,
  },
  basicTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  basicInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  basicNotes: {
    height: 96,
    textAlignVertical: "top",
  },
  basicSaveButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  basicSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
