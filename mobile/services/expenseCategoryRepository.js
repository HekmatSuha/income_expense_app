import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase";
import { LOCAL_USER_ID } from "../storage/transactions";

const STORAGE_KEY = "@income-expense-app/expense-categories";
export const DEFAULT_EXPENSE_CATEGORIES = ["Groceries", "Bills", "Rent"];

const buildStorageKey = () => {
  const user = auth.currentUser;
  return `${STORAGE_KEY}/${user?.uid || LOCAL_USER_ID}`;
};

const readCategories = async () => {
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
    console.warn("Failed to read expense categories", error);
    return [];
  }
};

const persistCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(buildStorageKey(), JSON.stringify(categories));
  } catch (error) {
    console.warn("Failed to save expense categories", error);
    throw error;
  }
};

export const getExpenseCategories = async () => {
  const stored = await readCategories();
  if (stored.length === 0) {
    return DEFAULT_EXPENSE_CATEGORIES;
  }
  return stored;
};

export const addExpenseCategory = async (categoryName) => {
  const trimmed = (categoryName || "").trim();
  if (!trimmed) {
    return getExpenseCategories();
  }
  const current = await getExpenseCategories();
  const lower = trimmed.toLowerCase();
  const filtered = current.filter((item) => item.toLowerCase() !== lower);
  const updated = [trimmed, ...filtered];
  await persistCategories(updated);
  return updated;
};
