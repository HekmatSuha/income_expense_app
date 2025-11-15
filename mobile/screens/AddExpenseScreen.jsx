import React, { useCallback, useMemo, useState } from "react";
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
import { LOCAL_USER_ID, saveTransactionForUser } from "../storage/transactions";

const parseDateTimeToISO = (dateString, timeString) => {
  const normalizedDate = (dateString || "").replace(/-/g, " ");
  const normalizedTime = (timeString || "").replace(/\./g, "").toUpperCase();
  const candidate = new Date(`${normalizedDate} ${normalizedTime}`.trim());
  if (!Number.isNaN(candidate.getTime())) {
    return candidate.toISOString();
  }
  return new Date().toISOString();
};

const buildDateLabel = (value) => {
  if (!value) {
    return "";
  }
  return value;
};

export default function AddExpenseScreen({ navigation }) {
  const [expense, setExpense] = useState("");
  const [category, setCategory] = useState("Air Tickets");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [account, setAccount] = useState("Personal Account");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("14-Nov-2025");
  const [time, setTime] = useState("11:16 PM");
  const [reminder, setReminder] = useState("");

  const dateLabel = useMemo(() => buildDateLabel(date), [date]);

  const handleSave = useCallback(async () => {
    if (!expense) {
      Alert.alert("Missing amount", "Please enter an amount to continue.");
      return;
    }

    const user = auth.currentUser;
    const targetUserId = user?.uid || LOCAL_USER_ID;
    const payload = {
      amount: Number(expense),
      type: "EXPENSE",
      category,
      note: notes,
      paymentMethod,
      paymentAccount: account,
      recurring: reminder,
      time,
      date: parseDateTimeToISO(date, time),
      createdAt: new Date().toISOString(),
    };

    const persistLocally = async () => {
      try {
        await saveTransactionForUser(targetUserId, payload);
        return true;
      } catch (storageError) {
        console.error("Failed to store expense locally", storageError);
        Alert.alert(
          "Storage error",
          "We couldn't save the expense on this device. Please try again."
        );
        return false;
      }
    };

    if (!user) {
      const saved = await persistLocally();
      if (saved) {
        Alert.alert(
          "Saved locally",
          "Sign in to sync this expense with your account."
        );
        navigation.goBack();
      }
      return;
    }

    try {
      await addDoc(collection(db, "transactions"), {
        ...payload,
        userId: user.uid,
      });
      await persistLocally();
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save expense", error);
      const saved = await persistLocally();
      if (saved) {
        Alert.alert(
          "Saved offline",
          "We stored the expense locally and will keep it available on this device."
        );
        navigation.goBack();
      } else {
        Alert.alert(
          "Error",
          "Unable to save the expense at the moment. Please try again."
        );
      }
    }
  }, [
    account,
    category,
    date,
    expense,
    navigation,
    notes,
    paymentMethod,
    reminder,
    time,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="arrow-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <MaterialIcons name="expand-more" size={22} color="#FFFFFF" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.expenseLabel}>Expense</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={expense}
                onChangeText={setExpense}
                placeholder="Enter amount"
                keyboardType="numeric"
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
              />
              <MaterialIcons name="calculate" size={22} color="#0288D1" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.rowCard}>
              <View style={styles.rowCardIcon}>
                <MaterialIcons name="flight" size={22} color="#4B5563" />
              </View>
              <TextInput
                value={category}
                onChangeText={setCategory}
                style={styles.rowCardInput}
              />
              <View style={styles.categoryDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.rowCard}>
              <TextInput
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                style={styles.rowCardInput}
              />
              <MaterialIcons name="credit-card" size={22} color="#0288D1" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.rowCard}>
              <TextInput
                value={account}
                onChangeText={setAccount}
                style={styles.rowCardInput}
              />
              <MaterialIcons name="account-balance" size={22} color="#0288D1" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.inputWithIcon}>
              <MaterialIcons name="mic" size={20} color="#4B5563" />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="[Optional]"
                style={[styles.textInput, styles.notesInput]}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
              <MaterialIcons name="photo-camera" size={22} color="#0288D1" />
              <Text style={styles.actionButtonText}>Add Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
              <MaterialIcons name="format-list-bulleted" size={22} color="#0288D1" />
              <Text style={styles.actionButtonText}>Add Items</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.dateCard}>
              <View style={styles.dateInner}>
                <TouchableOpacity style={styles.dateButton}>
                  <MaterialIcons name="chevron-left" size={20} color="#374151" />
                </TouchableOpacity>
                <TextInput
                  value={dateLabel}
                  onChangeText={setDate}
                  style={styles.dateInput}
                />
                <TouchableOpacity style={styles.dateButton}>
                  <MaterialIcons name="chevron-right" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
              <MaterialIcons name="calendar-today" size={22} color="#0288D1" />
            </View>
            <View style={styles.dateCard}>
              <TextInput value={time} onChangeText={setTime} style={styles.timeInput} />
              <MaterialIcons name="access-time" size={22} color="#0288D1" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recurring? Set Reminder</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={reminder}
                onChangeText={setReminder}
                placeholder=""
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
              />
              <MaterialIcons name="calendar-month" size={22} color="#0288D1" />
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomButton, styles.bottomDivider]}>
          <Text style={styles.bottomButtonText}>Payment Method</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomButton, styles.bottomDivider]}>
          <Text style={styles.bottomButtonText}>Category</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.bottomButton, styles.saveButton]}
        >
          <Text style={styles.saveButtonText}>Save</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#0288D1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerIconButton: {
    padding: 4,
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  expenseLabel: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionLabel: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  notesInput: {
    height: 52,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  rowCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  rowCardInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  categoryDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0288D1",
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    gap: 8,
  },
  actionButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  dateCard: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    gap: 8,
  },
  dateInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  dateButton: {
    padding: 4,
  },
  dateInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#111827",
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDivider: {
    borderRightWidth: 1,
    borderRightColor: "#D1D5DB",
  },
  bottomButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#0288D1",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
  },
});
