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
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { persistTransaction } from "../services/transactionRepository";
import { getBankAccounts } from "../services/bankAccountRepository";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

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
  return value.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatItemAmount = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "";
  }
  return numeric.toLocaleString();
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
  const [attachments, setAttachments] = useState([]);
  const [isAttachmentPickerVisible, setAttachmentPickerVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [isItemModalVisible, setItemModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [inlinePickerMode, setInlinePickerMode] = useState("date");
  const [inlinePickerValue, setInlinePickerValue] = useState(new Date());
  const [isInlinePickerVisible, setInlinePickerVisible] = useState(false);

  const dateLabel = useMemo(() => buildDateLabel(date), [date]);
  const currentDateTime = useMemo(
    () => new Date(parseDateTimeToISO(date, time)),
    [date, time]
  );

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

  const handleAddCategory = useCallback(() => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      Alert.alert("Missing category", "Please enter a category name.");
      return;
    }

    setCategories((prev) => {
      if (prev.includes(trimmed)) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setCategory(trimmed);
    setNewCategory("");
    setCategoryPickerVisible(false);
  }, [newCategory]);

  const handleAddPaymentMethod = useCallback(() => {
    const trimmed = newPaymentMethod.trim();
    if (!trimmed) {
      Alert.alert("Missing payment method", "Please enter a payment method name.");
      return;
    }

    setPaymentMethods((prev) => {
      if (prev.includes(trimmed)) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setPaymentMethod(trimmed);
    setNewPaymentMethod("");
    setPaymentMethodPickerVisible(false);
  }, [newPaymentMethod]);

  const appendAttachment = useCallback((attachment) => {
    setAttachments((prev) => [
      ...prev,
      {
        id: attachment?.id || `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: attachment?.name || "Attachment",
        uri: attachment?.uri,
        type: attachment?.type || "file",
      },
    ]);
  }, []);

  const handleRemoveAttachment = useCallback((attachmentId) => {
    setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  }, []);

  const handleCaptureBill = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Please allow camera access to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        appendAttachment({
          name: asset.fileName || "captured-photo.jpg",
          uri: asset.uri,
          type: asset.mimeType || asset.type || "image",
        });
      }
    } catch (error) {
      console.error("Failed to capture attachment", error);
      Alert.alert("Error", "Unable to open the camera right now.");
    }
  }, [appendAttachment]);

  const handlePickBillFromLibrary = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Media library access is needed to select an existing photo."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        appendAttachment({
          name: asset.fileName || "attachment",
          uri: asset.uri,
          type: asset.mimeType || asset.type || "image",
        });
      }
    } catch (error) {
      console.error("Failed to pick attachment", error);
      Alert.alert("Error", "Unable to access the gallery right now.");
    }
  }, [appendAttachment]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result?.canceled || result?.type === "cancel") {
        return;
      }

      const asset = Array.isArray(result?.assets) ? result.assets[0] : result;
      if (asset?.uri) {
        appendAttachment({
          name: asset.name || "document",
          uri: asset.uri,
          type: asset.mimeType || "application/pdf",
        });
      }
    } catch (error) {
      console.error("Failed to pick document", error);
      Alert.alert("Error", "Unable to open the document picker right now.");
    }
  }, [appendAttachment]);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) {
      Alert.alert("Missing item", "Please enter an item name.");
      return;
    }
    const numericAmount = newItemAmount ? Number(newItemAmount.replace(/,/g, "")) : null;
    if (newItemAmount && Number.isNaN(numericAmount)) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: newItemName.trim(),
        amount: numericAmount,
      },
    ]);
    setNewItemName("");
    setNewItemAmount("");
    setItemModalVisible(false);
  }, [newItemAmount, newItemName]);

  const handleRemoveItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const openPicker = useCallback(
    (mode) => {
      const baseDate = currentDateTime;
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          mode,
          value: baseDate,
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
      setInlinePickerMode(mode);
      setInlinePickerValue(baseDate);
      setInlinePickerVisible(true);
    },
    [currentDateTime]
  );

  const handleInlinePickerConfirm = useCallback(() => {
    if (inlinePickerMode === "date") {
      setDate(formatDisplayDate(inlinePickerValue));
    } else {
      setTime(formatDisplayTime(inlinePickerValue));
    }
    setInlinePickerVisible(false);
  }, [inlinePickerMode, inlinePickerValue]);

  const handleInlinePickerChange = useCallback((_, selectedDate) => {
    if (selectedDate) {
      setInlinePickerValue(selectedDate);
    }
  }, []);

  const handleInlinePickerCancel = useCallback(() => {
    setInlinePickerVisible(false);
  }, []);

  const handleDatePress = useCallback(() => {
    openPicker("date");
  }, [openPicker]);

  const handleTimePress = useCallback(() => {
    openPicker("time");
  }, [openPicker]);

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
      attachments,
      items,
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
    attachments,
    items,
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
            <View style={styles.inputWithIcon}>
              <TextInput
                value={income}
                onChangeText={handleIncomeChange} // Use new handler
                placeholder="Enter amount"
                keyboardType="numeric"
                style={styles.textInput}
                placeholderTextColor="#9CA3AF"
                underlineColorAndroid="transparent"
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
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.85}
              onPress={() => setAttachmentPickerVisible(true)}
            >
              <MaterialIcons name="photo-camera" size={22} color="#0288D1" />
              <Text style={styles.actionButtonText}>Add Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.85}
              onPress={() => setItemModalVisible(true)}
            >
              <MaterialIcons name="format-list-bulleted" size={22} color="#0288D1" />
              <Text style={styles.actionButtonText}>Add Items</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 ? (
            <View style={styles.attachmentList}>
              {attachments.map((file) => (
                <View key={file.id} style={styles.attachmentItem}>
                  <MaterialIcons
                    name={file.type?.includes("pdf") ? "description" : "attach-file"}
                    size={20}
                    color="#0288D1"
                  />
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.attachmentMeta}>{file.type}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveAttachment(file.id)}
                    style={styles.attachmentRemove}
                    accessibilityLabel="Remove attachment"
                  >
                    <MaterialIcons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {items.length > 0 ? (
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.amount !== null ? (
                      <Text style={styles.itemAmount}>{formatItemAmount(item.amount)}</Text>
                    ) : (
                      <Text style={styles.itemAmountMuted}>No amount</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    accessibilityLabel={`Remove ${item.name}`}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.dateCard}
              activeOpacity={0.85}
              onPress={handleDatePress}
            >
              <MaterialIcons name="calendar-today" size={22} color="#0288D1" />
              <Text style={styles.dateInput}>{dateLabel || "Select date"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateCard}
              activeOpacity={0.85}
              onPress={handleTimePress}
            >
              <MaterialIcons name="access-time" size={22} color="#0288D1" />
              <Text style={styles.timeInput}>{time}</Text>
            </TouchableOpacity>
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
        visible={isAttachmentPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAttachmentPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add bill</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setAttachmentPickerVisible(false);
                handleCaptureBill();
              }}
            >
              <MaterialIcons name="photo-camera" size={20} color="#0288D1" />
              <Text style={styles.modalOptionText}>Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setAttachmentPickerVisible(false);
                handlePickBillFromLibrary();
              }}
            >
              <MaterialIcons name="image" size={20} color="#0288D1" />
              <Text style={styles.modalOptionText}>Choose from gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setAttachmentPickerVisible(false);
                handlePickDocument();
              }}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color="#0288D1" />
              <Text style={styles.modalOptionText}>Upload PDF/image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCloseOption]}
              onPress={() => setAttachmentPickerVisible(false)}
            >
              <MaterialIcons name="close" size={20} color="#6B7280" />
              <Text style={styles.modalOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isItemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add item</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputSpacing]}
              placeholder="Amount (optional)"
              keyboardType="decimal-pad"
              value={newItemAmount}
              onChangeText={setNewItemAmount}
            />
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleAddItem}>
              <Text style={styles.modalPrimaryButtonText}>Save Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => setItemModalVisible(false)}
            >
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
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
      <Modal
        visible={isInlinePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleInlinePickerCancel}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerContent}>
            <DateTimePicker
              value={inlinePickerValue}
              mode={inlinePickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleInlinePickerChange}
              style={styles.pickerComponent}
            />
            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.pickerButton} onPress={handleInlinePickerCancel}>
                <Text style={styles.pickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerButton, styles.pickerConfirm]} onPress={handleInlinePickerConfirm}>
                <Text style={[styles.pickerButtonText, styles.pickerConfirmText]}>Save</Text>
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
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
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
    paddingHorizontal: 16,
    gap: 12,
  },
  dateInput: {
    flex: 1,
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
  attachmentList: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 12,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  attachmentMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  attachmentRemove: {
    padding: 4,
  },
  itemsList: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0288D1",
    marginTop: 4,
  },
  itemAmountMuted: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#111827",
  },
  modalCloseOption: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingTop: 12,
  },
  modalInputSpacing: {
    marginTop: 12,
  },
  modalPrimaryButton: {
    backgroundColor: "#0288D1",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalSecondaryButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  pickerModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  pickerComponent: {
    width: "100%",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  pickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  pickerConfirm: {
    backgroundColor: "#0288D1",
    borderRadius: 8,
  },
  pickerConfirmText: {
    color: "#FFFFFF",
  },
});
