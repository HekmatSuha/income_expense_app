import React, { useCallback, useState } from "react";
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
import { persistTransaction } from "../services/transactionRepository";

const parseDateTimeToISO = (dateString, timeString) => {
  const normalizedDate = (dateString || "").replace(/-/g, " ");
  const normalizedTime = (timeString || "").replace(/\./g, "").toUpperCase();
  const candidate = new Date(`${normalizedDate} ${normalizedTime}`.trim());
  if (!Number.isNaN(candidate.getTime())) {
    return candidate.toISOString();
  }
  return new Date().toISOString();
};

export default function TransferScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [fromBank, setFromBank] = useState("Bank 1");
  const [fromAccount, setFromAccount] = useState("Income");
  const [toBank, setToBank] = useState("Bank 2");
  const [toAccount, setToAccount] = useState("Expense");
  const [date, setDate] = useState("14-Nov-2025");
  const [time, setTime] = useState("11:16 PM");
  const [notes, setNotes] = useState("");

  const handleTransfer = useCallback(async () => {
    if (!amount) {
      Alert.alert("Missing amount", "Please enter an amount to continue.");
      return;
    }

    try {
      const result = await persistTransaction({
        amount: Number(amount),
        type: "TRANSFER",
        fromBank,
        fromAccount,
        toBank,
        toAccount,
        note: notes,
        time,
        date: parseDateTimeToISO(date, time),
        createdAt: new Date().toISOString(),
      });

      if (result.status === "local-only") {
        Alert.alert(
          "Saved locally",
          "Sign in to sync this transfer with your account."
        );
        navigation.goBack();
        return;
      }

      if (result.status === "offline-fallback") {
        Alert.alert(
          "Saved offline",
          "We'll sync this transfer once you're back online."
        );
        navigation.goBack();
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save transfer", error);
      Alert.alert(
        "Error",
        "Unable to save the transfer at the moment. Please try again."
      );
    }
  }, [
    amount,
    date,
    fromAccount,
    fromBank,
    navigation,
    notes,
    time,
    toAccount,
    toBank,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <MaterialIcons name="arrow-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Amount</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
              />
              <MaterialIcons name="calculate" size={22} color="#0D99DB" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>From</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Bank</Text>
                <TextInput
                  value={fromBank}
                  onChangeText={setFromBank}
                  style={styles.cardInput}
                />
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Account</Text>
                <TextInput
                  value={fromAccount}
                  onChangeText={setFromAccount}
                  style={styles.cardInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pay To</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Bank</Text>
                <TextInput
                  value={toBank}
                  onChangeText={setToBank}
                  style={styles.cardInput}
                />
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Account</Text>
                <TextInput
                  value={toAccount}
                  onChangeText={setToAccount}
                  style={styles.cardInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.dateCard}>
              <Text style={styles.cardLabel}>Date</Text>
              <View style={styles.dateRow}>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.dateInput}
                />
                <MaterialIcons name="calendar-today" size={22} color="#0D99DB" />
              </View>
            </View>
            <View style={styles.dateCard}>
              <Text style={styles.cardLabel}>Time</Text>
              <View style={styles.dateRow}>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  style={styles.dateInput}
                />
                <MaterialIcons name="access-time" size={22} color="#0D99DB" />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.notesWrapper}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Write notes here [Optional]"
                style={styles.notesInput}
                multiline
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.transferButton}
            activeOpacity={0.85}
            onPress={handleTransfer}
          >
            <Text style={styles.transferButtonText}>TRANSFER</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#0D99DB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 26,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginRight: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginRight: 12,
  },
  cardInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  dateCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    marginRight: 12,
  },
  notesWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 80,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
  },
  transferButton: {
    backgroundColor: "#0D99DB",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
});
