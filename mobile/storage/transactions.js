import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@income-expense-app/transactions";
export const LOCAL_USER_ID = "local-user";

const readAllTransactions = async () => {
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
    console.warn("Failed to read stored transactions", error);
    return {};
  }
};

const writeAllTransactions = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to write stored transactions", error);
  }
};

const generateLocalId = () => {
  const random = Math.random().toString(36).slice(2, 10);
  return `local-${Date.now()}-${random}`;
};

const normalizeTransactions = (transactions) => {
  if (!Array.isArray(transactions)) {
    return [];
  }
  return transactions.filter((item) => item && typeof item === "object");
};

export const getTransactionsForUser = async (userId = LOCAL_USER_ID) => {
  const all = await readAllTransactions();
  return normalizeTransactions(all[userId]);
};

export const saveTransactionForUser = async (userId, transaction) => {
  const all = await readAllTransactions();
  const existing = normalizeTransactions(all[userId]);
  const persistedTransaction = {
    id: transaction?.id || generateLocalId(),
    ...transaction,
    userId,
  };
  all[userId] = [persistedTransaction, ...existing];
  await writeAllTransactions(all);
  return persistedTransaction;
};

export const setTransactionsForUser = async (userId, transactions) => {
  const all = await readAllTransactions();
  all[userId] = normalizeTransactions(transactions).map((transaction) => ({
    id: transaction?.id || generateLocalId(),
    ...transaction,
    userId,
  }));
  await writeAllTransactions(all);
};
