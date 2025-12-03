import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { persistTransaction, updateTransaction } from "../services/transactionRepository";
import { getBankAccounts } from "../services/bankAccountRepository";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import {
  addExpenseCategory as persistExpenseCategory,
  getExpenseCategories,
  DEFAULT_EXPENSE_CATEGORIES,
} from "../services/expenseCategoryRepository";
import {
  DEFAULT_PAYMENT_METHODS,
  addPaymentMethodStore,
  getPaymentMethodsStore,
} from "../services/paymentMethodRepository";

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

const formatItemAmount = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "";
  }
  return numeric.toLocaleString();
};

const sanitizeNumberInput = (value) => {
  if (typeof value !== "string") {
    return NaN;
  }
  const normalized = value.replace(/,/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const computeItemAmount = (item) => {
  const amount = Number(item?.amount);
  if (!Number.isNaN(amount) && amount > 0) {
    return amount;
  }
  const quantity = Number(item?.quantity);
  const rate = Number(item?.rate);
  if (Number.isNaN(quantity) || Number.isNaN(rate)) {
    return 0;
  }
  return quantity * rate;
};

const buildItemsSummaryText = (list) => {
  if (!Array.isArray(list) || list.length === 0) {
    return "";
  }
  const lines = list.map((item, index) => {
    const quantity = Number(item?.quantity) || 0;
    const rate = Number(item?.rate) || 0;
    const amount = computeItemAmount(item);
    const readableRate = formatItemAmount(rate) || rate.toString();
    const readableAmount = formatItemAmount(amount) || amount.toString();
    return `${index + 1}. ${item.name} - ${quantity} x ${readableRate} = ${readableAmount}`;
  });
  const total = list.reduce((sum, item) => sum + computeItemAmount(item), 0);
  const readableTotal = formatItemAmount(total) || total.toString();
  return `Items:\n${lines.join("\n")}\nTotal ${readableTotal}`;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_COLUMN_WIDTH = `${(1 / DAY_LABELS.length) * 100}%`;

const isSameDay = (a, b) =>
  a?.getFullYear() === b?.getFullYear() &&
  a?.getMonth() === b?.getMonth() &&
  a?.getDate() === b?.getDate();

const buildCalendarMatrix = (cursor) => {
  if (!(cursor instanceof Date)) {
    return [];
  }
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekDay = firstOfMonth.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const days = [];
  for (let i = startWeekDay; i > 0; i -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - i);
    days.push({ date, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    days.push({ date, isCurrentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    days.push({ date, isCurrentMonth: false });
  }

  const rows = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }
  return rows;
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
  const currency = account.currency || "";
  return currency ? `${formattedAmount} ${currency}` : formattedAmount;
};

export default function AddExpenseScreen({ navigation, route }) {
  const [expense, setExpense] = useState("");
  const [category, setCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Bank");
  const [account, setAccount] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => formatDisplayDate(new Date()));
  const [time, setTime] = useState(() => formatDisplayTime(new Date()));
  const [reminder, setReminder] = useState("");
  const [isAccountPickerVisible, setAccountPickerVisible] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [isPaymentMethodPickerVisible, setPaymentMethodPickerVisible] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isAttachmentPickerVisible, setAttachmentPickerVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [isItemModalVisible, setItemModalVisible] = useState(false);
  const [itemComposerItems, setItemComposerItems] = useState([]);
  const [itemNameInput, setItemNameInput] = useState("");
  const [itemQuantityInput, setItemQuantityInput] = useState("");
  const [itemRateInput, setItemRateInput] = useState("");
  const [lastItemsSummary, setLastItemsSummary] = useState("");
  const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [pendingPickerValue, setPendingPickerValue] = useState(new Date());
  const editingTransaction = route?.params?.transaction;
  const isEditing = route?.params?.mode === "edit" || !!editingTransaction;
  const [hasPrefilled, setHasPrefilled] = useState(false);

  const itemComposerTotal = useMemo(
    () => itemComposerItems.reduce((sum, item) => sum + computeItemAmount(item), 0),
    [itemComposerItems]
  );
  const dateLabel = useMemo(() => buildDateLabel(date), [date]);
  const timeLabel = useMemo(
    () => (time || "").replace(/\s+/g, " ").trim(),
    [time]
  );
  const currentDateTime = useMemo(
    () => new Date(parseDateTimeToISO(date, time)),
    [date, time]
  );
  const headerTitle = isEditing ? "Edit Expense" : "Add Expense";
  const saveButtonLabel = isEditing ? "Save changes" : "Save";

  const loadBankAccounts = useCallback(async () => {
    try {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
      setAccount((prev) => {
        if (!Array.isArray(accounts) || accounts.length === 0) {
          return prev;
        }
        if (editingTransaction?.paymentAccount) {
          const matchedByName = accounts.find(
            (item) => item.name === editingTransaction.paymentAccount
          );
          if (matchedByName) {
            return matchedByName;
          }
        }
        if (prev) {
          const matched = accounts.find((item) => item.id === prev.id);
          return matched || prev;
        }
        return accounts[0] || null;
      });
    } catch (error) {
      console.error("Failed to fetch bank accounts", error);
      setBankAccounts([]);
      setAccount(null);
    }
  }, [editingTransaction?.paymentAccount]);

  const loadExpenseCategories = useCallback(async () => {
    try {
      const stored = await getExpenseCategories();
      setCategories(stored);
    } catch (error) {
      console.error("Failed to fetch expense categories", error);
      setCategories(DEFAULT_EXPENSE_CATEGORIES);
      setCategory(null);
    }
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const stored = await getPaymentMethodsStore();
      setPaymentMethods(stored);
      if (stored.length > 0 && !isEditing) {
        setPaymentMethod(stored[0]);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods", error);
      setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      setPaymentMethod(DEFAULT_PAYMENT_METHODS[0]);
    }
  }, [isEditing]);

  useFocusEffect(
    useCallback(() => {
      loadBankAccounts();
      loadExpenseCategories();
      loadPaymentMethods();
    }, [loadBankAccounts, loadExpenseCategories, loadPaymentMethods])
  );

  useEffect(() => {
    if (!isEditing || hasPrefilled) {
      return;
    }
    const tx = editingTransaction || {};
    const rawAmount = Math.abs(Number(tx.amount ?? tx.amountValue ?? 0));
    if (Number.isFinite(rawAmount) && rawAmount > 0) {
      handleExpenseChange(String(rawAmount));
    }
    if (tx.category) {
      setCategory(tx.category);
    }
    if (tx.paymentMethod) {
      setPaymentMethod(tx.paymentMethod);
    }
    if (tx.note) {
      setNotes(tx.note);
    }
    if (tx.recurring) {
      setReminder(tx.recurring);
    }
    const timestamp = tx.createdAt || tx.date || tx.time;
    const parsedDate = timestamp ? new Date(timestamp) : null;
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      setDate(formatDisplayDate(parsedDate));
      setTime(formatDisplayTime(parsedDate));
    }
    const normalizedAttachments = Array.isArray(tx.attachments)
      ? tx.attachments.map((file) => ({
          id:
            file?.id ||
            `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file?.name || "Attachment",
          uri: file?.uri,
          type: file?.type,
          mimeType: file?.mimeType,
        }))
      : [];
    if (normalizedAttachments.length > 0) {
      setAttachments(normalizedAttachments);
    }
    if (Array.isArray(tx.items)) {
      setItems(tx.items);
      setLastItemsSummary(buildItemsSummaryText(tx.items));
    }
    setHasPrefilled(true);
  }, [editingTransaction, hasPrefilled, isEditing]);

  useEffect(() => {
    if (!isEditing || !editingTransaction?.paymentAccount) {
      return;
    }
    if (account?.name === editingTransaction.paymentAccount) {
      return;
    }
    const match =
      bankAccounts.find((item) => item.name === editingTransaction.paymentAccount) ||
      bankAccounts.find((item) => item.id === editingTransaction.paymentAccount);
    if (match) {
      setAccount(match);
      return;
    }
    if (!account) {
      setAccount({
        id: `account-${Date.now()}`,
        name: editingTransaction.paymentAccount,
        currency: editingTransaction.currency,
        balance: Number(editingTransaction.balance) || 0,
      });
    }
  }, [account, bankAccounts, editingTransaction, isEditing]);


  const handleExpenseChange = (text) => {
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

    setExpense(formattedText);
  };

  const handleAddCategory = useCallback(async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      Alert.alert("Missing category", "Please enter a category name.");
      return;
    }

    try {
      const updated = await persistExpenseCategory(trimmed);
      setCategories(updated);
    } catch (error) {
      console.error("Failed to save category", error);
      Alert.alert(
        "Error",
        "Unable to save the new category right now. We'll still add it locally."
      );
      setCategories((prev) => {
        const lower = trimmed.toLowerCase();
        const filtered = prev.filter((item) => item.toLowerCase() !== lower);
        return [trimmed, ...filtered];
      });
    }

    setCategory(trimmed);
    setNewCategory("");
    setCategoryPickerVisible(false);
  }, [newCategory]);

  const handleAddPaymentMethod = useCallback(async () => {
    const trimmed = newPaymentMethod.trim();
    if (!trimmed) {
      Alert.alert("Missing payment method", "Please enter a payment method name.");
      return;
    }

    try {
      const updated = await addPaymentMethodStore(trimmed);
      setPaymentMethods(updated);
    } catch (error) {
      console.error("Failed to save payment method", error);
      setPaymentMethods((prev) => {
        const lower = trimmed.toLowerCase();
        const filtered = prev.filter((item) => item.toLowerCase() !== lower);
        return [trimmed, ...filtered];
      });
      Alert.alert("Error", "Unable to save this method right now. Added locally instead.");
    }

    setPaymentMethod(trimmed);
    setNewPaymentMethod("");
    setPaymentMethodPickerVisible(false);
  }, [newPaymentMethod]);

  const appendAttachment = useCallback((attachment) => {
    const mimeType =
      typeof attachment?.mimeType === "string"
        ? attachment.mimeType
        : typeof attachment?.type === "string" && attachment.type.includes("/")
        ? attachment.type
        : undefined;

    setAttachments((prev) => [
      ...prev,
      {
        id: attachment?.id || `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: attachment?.name || "Attachment",
        uri: attachment?.uri,
        type: attachment?.type || mimeType || "file",
        mimeType,
      },
    ]);
  }, []);

  const handleRemoveAttachment = useCallback((attachmentId) => {
    setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  }, []);

  const handlePreviewAttachment = useCallback(async (file) => {
    if (!file?.uri) {
      return;
    }

    try {
      const mimeType =
        (typeof file?.mimeType === "string" && file.mimeType) ||
        (typeof file?.type === "string" && file.type.includes("/") && file.type) ||
        "*/*";

      if (Platform.OS === "android") {
        const isLocalContent =
          file.uri.startsWith("file://") || file.uri.startsWith("content://");

        if (isLocalContent) {
          let androidUri = file.uri;
          if (androidUri.startsWith("file://")) {
            androidUri = await getContentUriAsync(androidUri);
          }
          await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.VIEW, {
            data: androidUri,
            flags: IntentLauncher.ActivityFlags.GRANT_READ_URI_PERMISSION,
            type: mimeType,
          });
          return;
        }
      }

      const supported = await Linking.canOpenURL(file.uri);
      if (!supported) {
        Alert.alert(
          "Unsupported file",
          "We couldn't open this attachment on your device."
        );
        return;
      }
      await Linking.openURL(file.uri);
    } catch (error) {
      console.error("Failed to preview attachment", error);
      Alert.alert("Error", "Unable to open this attachment right now.");
    }
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
          mimeType: asset.mimeType,
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
          mimeType: asset.mimeType,
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
          mimeType: asset.mimeType || "application/pdf",
        });
      }
    } catch (error) {
      console.error("Failed to pick document", error);
      Alert.alert("Error", "Unable to open the document picker right now.");
    }
  }, [appendAttachment]);

  const handleOpenItemModal = useCallback(() => {
    setItemComposerItems(items.map((item) => ({ ...item })));
    setItemNameInput("");
    setItemQuantityInput("");
    setItemRateInput("");
    setItemModalVisible(true);
  }, [items]);

  const handleCancelItemModal = useCallback(() => {
    setItemModalVisible(false);
    setItemComposerItems([]);
    setItemNameInput("");
    setItemQuantityInput("");
    setItemRateInput("");
  }, []);

  const handleRemoveComposerItem = useCallback((itemId) => {
    setItemComposerItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const syncNotesWithItems = useCallback(
    (nextItems) => {
      if (!lastItemsSummary && nextItems.length === 0) {
        return;
      }
      const summary = buildItemsSummaryText(nextItems);
      setNotes((prevNotes) => {
        let base = prevNotes || "";
        if (lastItemsSummary && base.includes(lastItemsSummary)) {
          base = base.replace(lastItemsSummary, "").trimEnd();
        }
        if (!summary) {
          return base;
        }
        const trimmedBase = base.trimEnd();
        if (!trimmedBase) {
          return summary;
        }
        return `${trimmedBase}\n\n${summary}`;
      });
      setLastItemsSummary(summary);
    },
    [lastItemsSummary]
  );

  const handleAddComposerItem = useCallback(() => {
    if (!itemNameInput.trim()) {
      Alert.alert("Missing item", "Please enter an item name.");
      return;
    }
    const quantityValue = sanitizeNumberInput(itemQuantityInput);
    const rateValue = sanitizeNumberInput(itemRateInput);
    if (Number.isNaN(quantityValue) || Number.isNaN(rateValue)) {
      Alert.alert("Invalid item", "Please enter valid quantity and rate.");
      return;
    }
    if (quantityValue <= 0 || rateValue <= 0) {
      Alert.alert("Invalid values", "Quantity and rate must be greater than zero.");
      return;
    }
    const amount = quantityValue * rateValue;
    setItemComposerItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: itemNameInput.trim(),
        quantity: quantityValue,
        rate: rateValue,
        amount,
      },
    ]);
    setItemNameInput("");
    setItemQuantityInput("");
    setItemRateInput("");
  }, [itemNameInput, itemQuantityInput, itemRateInput]);

  const handleConfirmItemModal = useCallback(() => {
    const finalizedItems = itemComposerItems.map((item) => ({ ...item }));
    setItems(finalizedItems);
    syncNotesWithItems(finalizedItems);
    setItemModalVisible(false);
    setItemComposerItems([]);
    setItemNameInput("");
    setItemQuantityInput("");
    setItemRateInput("");
  }, [itemComposerItems, syncNotesWithItems]);

  const handleRemoveItem = useCallback(
    (itemId) => {
      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== itemId);
        syncNotesWithItems(updated);
        return updated;
      });
    },
    [syncNotesWithItems]
  );

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

  const handleDatePress = useCallback(() => {
    openPicker("date");
  }, [openPicker]);

  const handleTimePress = useCallback(() => {
    openPicker("time");
  }, [openPicker]);

  const handleSave = useCallback(async () => {
    if (!expense) {
      return Alert.alert("Missing amount", "Please enter an amount to continue.");
    }

    if (!category) {
      return Alert.alert("Missing category", "Please select a category to continue.");
    }

    if (!account) {
      return Alert.alert("Missing account", "Please select an account to continue.");
    }

    const normalizedAmount = Number(expense.replace(/,/g, ""));
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount greater than zero.");
      return;
    }
    const payload = {
      amount: -Math.abs(normalizedAmount), // Expenses deduct from the account
      type: "EXPENSE",
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
      const result =
        isEditing && editingTransaction?.id
          ? await updateTransaction(editingTransaction.id, payload)
          : await persistTransaction(payload);

      if (result.status === "local-only") {
        Alert.alert(
          "Saved locally",
          isEditing
            ? "We'll sync these expense changes when you're back online or signed in."
            : "Sign in to sync this expense with your account."
        );
        navigation.goBack();
        return;
      }

      if (result.status === "offline-fallback") {
        Alert.alert(
          "Saved offline",
          "We'll sync this expense with your account once you're back online."
        );
        navigation.goBack();
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save expense", error);
      Alert.alert(
        "Error",
        "Unable to save the expense at the moment. Please try again."
      );
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
    attachments,
    items,
    isEditing,
    editingTransaction,
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
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <MaterialIcons name="expand-more" size={22} color="#FFFFFF" />
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.section}>
            <Text style={styles.expenseLabel}>Expense</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={expense}
                onChangeText={handleExpenseChange} // Use new handler
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
              <Text
                style={[
                  styles.rowCardInput,
                  !category && styles.placeholderText,
                ]}
              >
                {category || "Select category"}
              </Text>
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
              <Text
                style={[
                  styles.rowCardInput,
                  !account && styles.placeholderText,
                ]}
              >
                {account
                  ? `${account.name} (${formatAccountBalanceLabel(account)})`
                  : "Select account"}
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
              onPress={handleOpenItemModal}
            >
              <MaterialIcons name="format-list-bulleted" size={22} color="#0288D1" />
              <Text style={styles.actionButtonText}>Add Items</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 ? (
            <View style={styles.attachmentList}>
              {attachments.map((file) => (
                <View key={file.id} style={styles.attachmentItem}>
                  <TouchableOpacity
                    style={styles.attachmentPreview}
                    activeOpacity={0.8}
                    onPress={() => handlePreviewAttachment(file)}
                  >
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
                  </TouchableOpacity>
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
              {items.map((item) => {
                const amountValue = computeItemAmount(item);
                const hasDetails =
                  Number.isFinite(item?.quantity) && Number.isFinite(item?.rate);
                const rateLabel =
                  formatItemAmount(item.rate) || item.rate?.toString() || "0";
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {hasDetails ? (
                        <Text style={styles.itemAmountMuted}>
                          {`${item.quantity} x ${rateLabel}`}
                        </Text>
                      ) : null}
                      {amountValue > 0 ? (
                        <Text style={styles.itemAmount}>
                          {formatItemAmount(amountValue) || amountValue.toString()}
                        </Text>
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
                );
              })}
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
              <Text style={styles.timeInput}>{timeLabel || "Select time"}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.bottomButton, styles.saveButton]}
        >
          <Text style={styles.saveButtonText}>{saveButtonLabel}</Text>
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
                  <Text>{`${item.name} (${formatAccountBalanceLabel(item)})`}</Text>
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
        onRequestClose={handleCancelItemModal}
      >
        <View style={styles.itemModalOverlay}>
          <View style={styles.itemModalCard}>
            <Text style={styles.itemModalTitle}>Add Items</Text>
            <TextInput
              style={styles.itemModalInputFull}
              placeholder="Item"
              placeholderTextColor="#9CA3AF"
              value={itemNameInput}
              onChangeText={setItemNameInput}
            />
            <View style={styles.itemModalRow}>
              <TextInput
                style={[styles.itemModalInput, styles.itemModalInputQuantity]}
                placeholder="Quantity"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={itemQuantityInput}
                onChangeText={setItemQuantityInput}
              />
              <TextInput
                style={[styles.itemModalInput, styles.itemModalInputRate]}
                placeholder="Rate"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={itemRateInput}
                onChangeText={setItemRateInput}
              />
              <TouchableOpacity
                style={styles.itemModalAddButton}
                onPress={handleAddComposerItem}
              >
                <Text style={styles.itemModalAddButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.itemModalList}>
              {itemComposerItems.length === 0 ? (
                <Text style={styles.itemModalEmptyText}>
                  Added items will appear here.
                </Text>
              ) : (
                <ScrollView
                  style={styles.itemModalScroll}
                  contentContainerStyle={styles.itemModalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {itemComposerItems.map((item, index) => {
                    const amountValue = computeItemAmount(item);
                    const hasBreakdown =
                      Number.isFinite(item?.quantity) && Number.isFinite(item?.rate);
                    const rateLabel =
                      formatItemAmount(item.rate) || item.rate?.toString() || "0";
                    const amountLabel =
                      formatItemAmount(amountValue) || amountValue.toString();
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.itemModalListRow,
                          index === itemComposerItems.length - 1 &&
                            styles.itemModalLastRow,
                        ]}
                      >
                        <View style={styles.itemModalListInfo}>
                          <Text style={styles.itemModalItemName}>{item.name}</Text>
                          {hasBreakdown ? (
                            <Text style={styles.itemModalItemMeta}>
                              {`${item.quantity} x ${rateLabel}`}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.itemModalListActions}>
                          <Text style={styles.itemModalAmountText}>{amountLabel}</Text>
                          <TouchableOpacity
                            accessibilityLabel={`Remove ${item.name}`}
                            onPress={() => handleRemoveComposerItem(item.id)}
                            style={styles.itemModalRemoveButton}
                          >
                            <MaterialIcons name="close" size={18} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
            <View style={styles.itemModalTotalRow}>
              <Text style={styles.itemModalTotalLabel}>Total</Text>
              <Text style={styles.itemModalTotalValue}>
                {formatItemAmount(itemComposerTotal) || itemComposerTotal.toString()}
              </Text>
            </View>
            <View style={styles.itemModalActions}>
              <TouchableOpacity onPress={handleCancelItemModal}>
                <Text style={styles.itemModalActionText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmItemModal}
                disabled={itemComposerItems.length === 0}
              >
                <Text
                  style={[
                    styles.itemModalActionText,
                    styles.itemModalActionPrimary,
                    itemComposerItems.length === 0 && styles.itemModalActionDisabled,
                  ]}
                >
                  OK
                </Text>
              </TouchableOpacity>
            </View>
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
        visible={isDateTimePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handlePickerDismiss}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerContent}>
            <DateTimePicker
              value={pendingPickerValue}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handlePickerChange}
            />
            {Platform.OS === "ios" ? (
              <View style={styles.pickerActions}>
                <TouchableOpacity style={styles.pickerButton} onPress={handlePickerDismiss}>
                  <Text style={styles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerButton, styles.pickerConfirm]}
                  onPress={handlePickerConfirm}
                >
                  <Text style={[styles.pickerButtonText, styles.pickerConfirmText]}>Save</Text>
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
  placeholderText: {
    color: "#9CA3AF",
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
    minWidth: 0,
    fontSize: 14,
    color: "#111827",
    lineHeight: 18,
  },
  timeInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: "#111827",
    lineHeight: 18,
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
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  itemModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  itemModalCard: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  itemModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  itemModalInputFull: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    color: "#111827",
  },
  itemModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  itemModalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  itemModalInputQuantity: {
    flex: 0.9,
  },
  itemModalInputRate: {
    flex: 0.9,
  },
  itemModalAddButton: {
    backgroundColor: "#0288D1",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemModalAddButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  itemModalList: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    maxHeight: 220,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  itemModalScroll: {
    flexGrow: 0,
  },
  itemModalScrollContent: {
    paddingBottom: 4,
  },
  itemModalEmptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
  },
  itemModalListRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemModalLastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemModalListInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemModalItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemModalItemMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  itemModalListActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemModalAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0288D1",
  },
  itemModalRemoveButton: {
    padding: 6,
  },
  itemModalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  itemModalTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  itemModalTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0288D1",
  },
  itemModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
  },
  itemModalActionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  itemModalActionPrimary: {
    color: "#0288D1",
  },
  itemModalActionDisabled: {
    color: "#D1D5DB",
  },
  pickerModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContent: {
    width: "85%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
  },
  pickerHero: {
    backgroundColor: "#0288D1",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  pickerHeroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  pickerHeroSubtitle: {
    color: "#E0F2FE",
    fontSize: 16,
    marginTop: 6,
  },
  calendarPicker: {
    padding: 16,
    gap: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0288D1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calendarMonthLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  calendarNavButton: {
    padding: 6,
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarWeekDay: {
    width: DAY_COLUMN_WIDTH,
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  calendarGrid: {
    gap: 4,
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarCell: {
    width: DAY_COLUMN_WIDTH,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  calendarCellMuted: {
    backgroundColor: "#F9FAFB",
  },
  calendarCellActive: {
    backgroundColor: "#0288D1",
  },
  calendarCellText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  calendarCellTextMuted: {
    color: "#9CA3AF",
  },
  calendarCellTextActive: {
    color: "#FFFFFF",
  },
  timePicker: {
    padding: 16,
    gap: 12,
  },
  timePickerHint: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  timePickerInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeInputWrapper: {
    alignItems: "center",
  },
  timeInput: {
    width: 60,
    borderBottomWidth: 2,
    borderColor: "#0288D1",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    paddingVertical: 2,
  },
  timeInputLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  timeColon: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0288D1",
  },
  periodToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#0288D1",
    borderRadius: 20,
    overflow: "hidden",
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  periodButtonActive: {
    backgroundColor: "#0288D1",
  },
  periodButtonText: {
    fontSize: 14,
    color: "#0288D1",
    fontWeight: "700",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
