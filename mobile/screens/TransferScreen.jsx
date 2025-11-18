import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { adjustBankAccountBalance, getBankAccounts } from "../services/bankAccountRepository";
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

const padNumber = (value, size = 2) => String(value).padStart(size, "0");

const formatDisplayDate = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  const day = value.toLocaleDateString(undefined, { day: "2-digit" });
  const month = value.toLocaleDateString(undefined, { month: "short" });
  const year = value.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDisplayTime = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  const hours24 = value.getHours();
  const minutes = value.getMinutes();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;
  return `${hour12}:${padNumber(minutes)} ${period}`;
};

const formatAccountBalanceLabel = (account) => {
  if (!account) {
    return "";
  }
  const amount = Number(account.balance);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
  return `${formattedAmount} ${account.currency || ""}`.trim();
};

const formatAmountInput = (value) => {
  const rawText = (value || "").replace(/[^0-9.]/g, "");
  const parts = rawText.split(".");
  let integer = parts[0];
  let decimal = parts[1];
  if (integer) {
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (decimal !== undefined) {
    return `${integer}.${decimal}`;
  }
  return integer;
};

const AccountListModal = ({ visible, accounts, onSelect, onClose, title }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        {accounts.length === 0 ? (
          <Text style={styles.modalEmptyText}>No accounts available.</Text>
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemMeta}>{formatAccountBalanceLabel(item)}</Text>
                <Text style={styles.modalItemMeta}>{item.type}</Text>
              </TouchableOpacity>
            )}
          />
        )}
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Text style={styles.modalCloseText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function TransferScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState(null);
  const [isFromPickerVisible, setFromPickerVisible] = useState(false);
  const [isToPickerVisible, setToPickerVisible] = useState(false);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => formatDisplayDate(new Date()));
  const [time, setTime] = useState(() => formatDisplayTime(new Date()));
  const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [pendingPickerValue, setPendingPickerValue] = useState(new Date());

  const currentDateTime = useMemo(
    () => new Date(parseDateTimeToISO(date, time)),
    [date, time]
  );

  const loadBankAccounts = useCallback(async () => {
    try {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
      setFromAccount((prev) => {
        if (!Array.isArray(accounts) || accounts.length === 0) {
          return null;
        }
        if (!prev) {
          return accounts[0];
        }
        return accounts.find((item) => item.id === prev.id) || accounts[0];
      });
      setToAccount((prev) => {
        if (!Array.isArray(accounts) || accounts.length === 0) {
          return null;
        }
        if (!prev) {
          return accounts[1] || accounts[0];
        }
        return accounts.find((item) => item.id === prev.id) || accounts[1] || accounts[0];
      });
    } catch (error) {
      console.error("Failed to fetch bank accounts", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBankAccounts();
    }, [loadBankAccounts])
  );

  const handleAmountChange = useCallback((text) => {
    setAmount(formatAmountInput(text));
  }, []);

  const handleSwapAccounts = useCallback(() => {
    if (!fromAccount || !toAccount) {
      return;
    }
    setFromAccount(toAccount);
    setToAccount(fromAccount);
  }, [fromAccount, toAccount]);

  const openPicker = useCallback(
    (mode) => {
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          mode,
          value: currentDateTime,
          is24Hour: false,
          onChange: (_, selectedDate) => {
            if (!selectedDate) {
              return;
            }
            if (mode === "date") {
              setDate(formatDisplayDate(selectedDate));
            } else {
              setTime(formatDisplayTime(selectedDate));
            }
          },
        });
        return;
      }
      setPickerMode(mode);
      setPendingPickerValue(currentDateTime);
      setDateTimePickerVisible(true);
    },
    [currentDateTime]
  );

  const handlePickerChange = useCallback((_, selectedDate) => {
    if (Platform.OS !== "ios") {
      return;
    }
    if (selectedDate) {
      setPendingPickerValue(selectedDate);
    }
  }, []);

  const handlePickerConfirm = useCallback(() => {
    if (Platform.OS !== "ios") {
      return;
    }
    if (pickerMode === "date") {
      setDate(formatDisplayDate(pendingPickerValue));
    } else {
      setTime(formatDisplayTime(pendingPickerValue));
    }
    setDateTimePickerVisible(false);
  }, [pickerMode, pendingPickerValue]);

  const handlePickerDismiss = useCallback(() => {
    if (Platform.OS !== "ios") {
      return;
    }
    setDateTimePickerVisible(false);
  }, []);

  const handleTransfer = useCallback(async () => {
    if (!amount) {
      Alert.alert("Missing amount", "Please enter an amount to continue.");
      return;
    }
    if (!fromAccount || !toAccount) {
      Alert.alert("Missing accounts", "Please select both source and destination accounts.");
      return;
    }
    if (fromAccount.id === toAccount.id) {
      Alert.alert("Invalid accounts", "Please select two different accounts.");
      return;
    }

    const numericAmount = Number(amount.replace(/,/g, ""));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount greater than zero.");
      return;
    }

    const timestamp = parseDateTimeToISO(date, time);
    const sharedMeta = {
      type: "TRANSFER",
      note: notes,
      time,
      createdAt: timestamp,
    };

    try {
      const statuses = [];
      const outgoing = await persistTransaction({
        ...sharedMeta,
        amount: -Math.abs(numericAmount),
        paymentAccount: fromAccount.name,
        currency: fromAccount.currency,
        transferTo: toAccount.name,
      });
      statuses.push(outgoing.status);
      if (fromAccount?.id) {
        try {
          await adjustBankAccountBalance(fromAccount.id, -Math.abs(numericAmount));
        } catch (balanceError) {
          console.warn("Failed to decrease source account after transfer", balanceError);
        }
      }

      const incoming = await persistTransaction({
        ...sharedMeta,
        amount: Math.abs(numericAmount),
        paymentAccount: toAccount.name,
        currency: toAccount.currency,
        transferFrom: fromAccount.name,
      });
      statuses.push(incoming.status);
      if (toAccount?.id) {
        try {
          await adjustBankAccountBalance(toAccount.id, Math.abs(numericAmount));
        } catch (balanceError) {
          console.warn("Failed to increase destination account after transfer", balanceError);
        }
      }

      if (statuses.includes("local-only")) {
        Alert.alert(
          "Saved locally",
          "Sign in to sync this transfer with your account."
        );
        navigation.goBack();
        return;
      }

      if (statuses.includes("offline-fallback")) {
        Alert.alert(
          "Saved offline",
          "We'll sync this transfer with your account once you're back online."
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
  }, [amount, date, fromAccount, navigation, notes, time, toAccount]);

  const isTransferDisabled =
    !amount || !fromAccount || !toAccount || fromAccount?.id === toAccount?.id;

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
                onChangeText={handleAmountChange}
                placeholder="Enter amount"
                keyboardType="numeric"
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
              />
              <MaterialIcons name="calculate" size={22} color="#0D99DB" />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.accountHeader}>
              <Text style={styles.sectionLabel}>From Account</Text>
              <TouchableOpacity
                style={[
                  styles.swapButton,
                  (!fromAccount || !toAccount) && styles.swapButtonDisabled,
                ]}
                onPress={handleSwapAccounts}
                disabled={!fromAccount || !toAccount}
              >
                <MaterialIcons name="swap-horiz" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.accountCard}
              onPress={() => setFromPickerVisible(true)}
            >
              <View>
                <Text style={styles.accountName}>
                  {fromAccount ? fromAccount.name : "Select account"}
                </Text>
                {fromAccount ? (
                  <>
                    <Text style={styles.accountMeta}>{fromAccount.type}</Text>
                    <Text style={styles.accountMeta}>
                      {formatAccountBalanceLabel(fromAccount)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.accountMetaMuted}>
                    You need at least two bank accounts to transfer.
                  </Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>To Account</Text>
            <TouchableOpacity
              style={styles.accountCard}
              onPress={() => setToPickerVisible(true)}
            >
              <View>
                <Text style={styles.accountName}>
                  {toAccount ? toAccount.name : "Select account"}
                </Text>
                {toAccount ? (
                  <>
                    <Text style={styles.accountMeta}>{toAccount.type}</Text>
                    <Text style={styles.accountMeta}>
                      {formatAccountBalanceLabel(toAccount)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.accountMetaMuted}>
                    Choose a destination account.
                  </Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => openPicker("date")}
            >
              <Text style={styles.dateLabel}>Date</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateValue}>{date}</Text>
                <MaterialIcons name="event" size={20} color="#0D99DB" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => openPicker("time")}
            >
              <Text style={styles.dateLabel}>Time</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateValue}>{time}</Text>
                <MaterialIcons name="access-time" size={20} color="#0D99DB" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.notesWrapper}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional note"
                placeholderTextColor="#9CA3AF"
                multiline
                style={styles.notesInput}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.transferButton,
              isTransferDisabled && styles.transferButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={isTransferDisabled}
          >
            <MaterialIcons name="compare-arrows" size={20} color="#FFFFFF" />
            <Text style={styles.transferButtonText}>Transfer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <AccountListModal
        visible={isFromPickerVisible}
        accounts={bankAccounts}
        onSelect={setFromAccount}
        onClose={() => setFromPickerVisible(false)}
        title="Select source account"
      />

      <AccountListModal
        visible={isToPickerVisible}
        accounts={bankAccounts}
        onSelect={setToAccount}
        onClose={() => setToPickerVisible(false)}
        title="Select destination account"
      />

      <Modal
        visible={isDateTimePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handlePickerDismiss}
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerModalContent}>
            <DateTimePicker
              value={pendingPickerValue}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handlePickerChange}
            />
            {Platform.OS === "ios" ? (
              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={handlePickerDismiss}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCloseButton} onPress={handlePickerConfirm}>
                  <Text style={styles.modalConfirmText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
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
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0D99DB",
    alignItems: "center",
    justifyContent: "center",
  },
  swapButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  accountMeta: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  accountMetaMuted: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
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
  dateLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateValue: {
    fontSize: 15,
    color: "#111827",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FD7E14",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  transferButtonDisabled: {
    opacity: 0.5,
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalItemMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  modalEmptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 24,
  },
  modalCloseButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  modalConfirmText: {
    fontSize: 14,
    color: "#0D99DB",
    fontWeight: "700",
  },
  pickerModalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 12,
  },
});
