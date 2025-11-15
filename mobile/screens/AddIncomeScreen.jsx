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
  Modal,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { persistTransaction } from "../services/transactionRepository";
import { getBankAccounts } from "../services/bankAccountRepository";
import { useFocusEffect } from "@react-navigation/native";

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

export default function AddIncomeScreen({ navigation }) {
  const [income, setIncome] = useState("");
  const [category, setCategory] = useState("Salary");
  const [paymentMethod, setPaymentMethod] = useState("Bank");
  const [account, setAccount] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("14-Nov-2025");
  const [time, setTime] = useState("11:16 PM");
  const [reminder, setReminder] = useState("");
  const [isAccountPickerVisible, setAccountPickerVisible] = useState(false);
  const [categories, setCategories] = useState(['Salary', 'Freelance', 'Investment']);
  const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [paymentMethods, setPaymentMethods] = useState(['Cash', 'Bank']);
  const [isPaymentMethodPickerVisible, setPaymentMethodPickerVisible] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [isIncomeInputFocused, setIsIncomeInputFocused] = useState(false); // New state

  const dateLabel = useMemo(() => buildDateLabel(date), [date]);

  const loadBankAccounts = useCallback(async () => {
    try {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to fetch bank accounts", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBankAccounts();
    }, [loadBankAccounts])
  );

  const handleIncomeChange = (text) => {
    // Remove non-numeric characters except for a single decimal point
    const rawText = text.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = rawText.split('.');
    let integer = parts[0];
    let decimal = parts[1];

    // Format integer part with commas
    if (integer) {
      integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Recombine
    let formattedText = integer;
    if (decimal !== undefined) {
      formattedText = `${integer}.${decimal}`;
    }

    setIncome(formattedText);
  };

  const handleSave = useCallback(async () => {
    if (!income) {
      Alert.alert("Missing amount", "Please enter an amount to continue.");
      return;
    }

    if (!account) {
      Alert.alert("Missing account", "Please select an account to continue.");
      return;
    }

    const payload = {
      amount: Number(income.replace(/,/g, '')), // Remove commas before saving
      type: "INCOME",
      category,
      note: notes,
      paymentMethod,
      paymentAccount: account.name,
      recurring: reminder,
      time,
      createdAt: parseDateTimeToISO(date, time),
      currency: account.currency,
    };

    try {
      const result = await persistTransaction(payload);

      if (result.status === "local-only") {
        Alert.alert(
          "Saved locally",
          "Sign in to sync this income with your account."
        );
        navigation.goBack();
        return;
      }

      if (result.status === "offline-fallback") {
        Alert.alert(
          "Saved offline",
          "We'll sync this income with your account once you're back online."
        );
        navigation.goBack();
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save income", error);
      Alert.alert(
        "Error",
        "Unable to save the income at the moment. Please try again."
      );
    }
  }, [
    account,
    category,
    date,
    income,
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
            <Text style={styles.headerTitle}>Add Income</Text>
            <MaterialIcons name="expand-more" size={22} color="#FFFFFF" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.incomeLabel}>Income</Text>
            <View style={[
              styles.inputWithIcon,
              isIncomeInputFocused && styles.inputWithIconFocused // Apply focused style
            ]}>
              <TextInput
                value={income}
                onChangeText={handleIncomeChange} // Use new handler
                placeholder="Enter amount"
                keyboardType="numeric"
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
                onFocus={() => setIsIncomeInputFocused(true)} // Set focus state
                onBlur={() => setIsIncomeInputFocused(false)}   // Unset focus state
              />
              <MaterialIcons name="calculate" size={22} color="#0288D1" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <TouchableOpacity onPress={() => setCategoryPickerVisible(true)} activeOpacity={0.8} style={styles.rowCard}>
              <View style={styles.rowCardIcon}>
                <MaterialIcons name="work" size={22} color="#4B5563" />
              </View>
              <Text style={styles.rowCardInput}>{category}</Text>
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
            <TouchableOpacity onPress={() => setPaymentMethodPickerVisible(true)} activeOpacity={0.8} style={styles.rowCard}>
              <Text style={styles.rowCardInput}>{paymentMethod}</Text>
              <MaterialIcons name="credit-card" size={22} color="#0288D1" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account</Text>
            <TouchableOpacity
              onPress={() => setAccountPickerVisible(true)}
              activeOpacity={0.8}
              style={styles.rowCard}
            >
              <Text style={styles.rowCardInput}>
                {account ? `${account.name} (${account.currency})` : "Select account"}
              </Text>
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
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.bottomButton, styles.saveButton]}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={isAccountPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAccountPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={bankAccounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setAccount(item);
                    setAccountPickerVisible(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text>{`${item.name} (${item.currency})`}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={isCategoryPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCategory(item);
                    setCategoryPickerVisible(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="New Category"
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity onPress={handleAddCategory} style={styles.modalAddButton}>
                <Text style={styles.modalAddButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isPaymentMethodPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentMethodPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={paymentMethods}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setPaymentMethod(item);
                    setPaymentMethodPickerVisible(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="New Payment Method"
                value={newPaymentMethod}
                onChangeText={setNewPaymentMethod}
              />
              <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.modalAddButton}>
                <Text style={styles.modalAddButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  incomeLabel: {
    color: "#16A34A",
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
  saveButton: {
    backgroundColor: "#0288D1",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalInputContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  modalAddButton: {
    backgroundColor: '#0288D1',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
  },
  modalAddButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputWithIconFocused: {
    borderColor: '#0288D1', // Example: change border color on focus
    borderWidth: 2, // Example: make border thicker on focus
  },
});