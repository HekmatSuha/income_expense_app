import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@income-expense-app/budget";
export const LOCAL_USER_ID = "local-user";

const readBudget = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (error) {
    console.warn("Failed to read stored budget", error);
    return {};
  }
};

const writeBudget = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to write stored budget", error);
    throw error;
  }
};

export const getBudgetForUser = async (userId = LOCAL_USER_ID) => {
  const all = await readBudget();
  return all[userId] || null;
};

export const saveBudgetForUser = async (userId, budget) => {
  const all = await readBudget();
  all[userId] = budget;
  await writeBudget(all);
  return budget;
};
