import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase";
import { LOCAL_USER_ID } from "../storage/transactions";

const STORAGE_KEY = "@income-expense-app/payment-methods";
export const DEFAULT_PAYMENT_METHODS = ["Cash", "Bank"];

const buildStorageKey = () => {
  const user = auth.currentUser;
  return `${STORAGE_KEY}/${user?.uid || LOCAL_USER_ID}`;
};

const readPaymentMethods = async () => {
  try {
    const raw = await AsyncStorage.getItem(buildStorageKey());
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.trim());
    }
    return [];
  } catch (error) {
    console.warn("Failed to read payment methods", error);
    return [];
  }
};

const persistPaymentMethods = async (methods) => {
  try {
    await AsyncStorage.setItem(buildStorageKey(), JSON.stringify(methods));
  } catch (error) {
    console.warn("Failed to save payment methods", error);
    throw error;
  }
};

export const getPaymentMethodsStore = async () => {
  const stored = await readPaymentMethods();
  if (stored.length === 0) {
    return DEFAULT_PAYMENT_METHODS;
  }
  return stored;
};

export const addPaymentMethodStore = async (methodName) => {
  const trimmed = (methodName || "").trim();
  if (!trimmed) {
    return getPaymentMethodsStore();
  }
  const current = await getPaymentMethodsStore();
  const lower = trimmed.toLowerCase();
  const filtered = current.filter((item) => item.toLowerCase() !== lower);
  const updated = [trimmed, ...filtered];
  await persistPaymentMethods(updated);
  return updated;
};
