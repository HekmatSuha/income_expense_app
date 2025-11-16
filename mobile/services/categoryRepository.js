import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebase";
import { LOCAL_USER_ID } from "../storage/transactions";

const STORAGE_KEY = "@income-expense-app/income-categories";
export const DEFAULT_INCOME_CATEGORIES = ["Salary", "Freelance", "Investment"];

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
    console.warn("Failed to read income categories", error);
    return [];
  }
};

const persistCategories = async (categories) => {
  try {
    await AsyncStorage.setItem(buildStorageKey(), JSON.stringify(categories));
  } catch (error) {
    console.warn("Failed to save income categories", error);
    throw error;
  }
};

const normalizeCategories = (categories) => {
  if (!Array.isArray(categories)) {
    return DEFAULT_INCOME_CATEGORIES;
  }
  const cleaned = categories
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return cleaned.length > 0 ? cleaned : DEFAULT_INCOME_CATEGORIES;
};

export const getIncomeCategories = async () => {
  const stored = await readCategories();
  if (stored.length === 0) {
    return DEFAULT_INCOME_CATEGORIES;
  }
  return stored;
};

export const addIncomeCategory = async (categoryName) => {
  const trimmed = (categoryName || "").trim();
  if (!trimmed) {
    return getIncomeCategories();
  }
  const current = await getIncomeCategories();
  const lower = trimmed.toLowerCase();
  const filtered = current.filter((item) => item.toLowerCase() !== lower);
  const updated = [trimmed, ...filtered];
  await persistCategories(updated);
  return updated;
};

export const saveIncomeCategories = async (categories) => {
  const normalized = normalizeCategories(categories);
  await persistCategories(normalized);
  return normalized;
};
