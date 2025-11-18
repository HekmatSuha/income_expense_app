import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@income-expense-app/monthly-budget";
export const DEFAULT_USER_ID = "local-user";

const readAllBudgets = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to read monthly budgets", error);
  }
  return {};
};

const writeAllBudgets = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to persist monthly budget", error);
    throw error;
  }
};

export const getBudgetForUser = async (userId = DEFAULT_USER_ID) => {
  const all = await readAllBudgets();
  return all[userId] || null;
};

export const setBudgetForUser = async (userId, budget) => {
  const all = await readAllBudgets();
  if (!budget) {
    delete all[userId];
  } else {
    all[userId] = budget;
  }
  await writeAllBudgets(all);
  return budget;
};
