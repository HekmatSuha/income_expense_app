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
    throw error;
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

const toTimestamp = (value) => {
  if (!value) {
    return 0;
  }

  // Support Firestore Timestamp objects and plain Dates/strings
  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
};

const sortTransactions = (transactions) =>
  [...transactions].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));

const mergeTransactionsById = (transactions) => {
  const seen = new Set();
  const merged = [];

  transactions.forEach((original) => {
    if (!original || typeof original !== "object") {
      return;
    }

    const transaction = { ...original };
    if (!transaction.id) {
      transaction.id = generateLocalId();
    }

    if (seen.has(transaction.id)) {
      return;
    }

    seen.add(transaction.id);
    merged.push(transaction);
  });

  return merged;
};

const withSyncState = (transaction) => ({
  ...transaction,
  synced: transaction?.synced ?? false,
});

export const getTransactionsForUser = async (userId = LOCAL_USER_ID) => {
  const all = await readAllTransactions();
  return sortTransactions(normalizeTransactions(all[userId]));
};

export const saveTransactionForUser = async (userId, transaction) => {
  const all = await readAllTransactions();
  const existing = normalizeTransactions(all[userId]);
  const persistedTransaction = withSyncState({
    id: transaction?.id || generateLocalId(),
    ...transaction,
    userId,
  });
  const updated = sortTransactions(
    mergeTransactionsById([persistedTransaction, ...existing])
  );
  all[userId] = updated;
  await writeAllTransactions(all);
  return persistedTransaction;
};

export const setTransactionsForUser = async (userId, transactions) => {
  const all = await readAllTransactions();
  const normalized = normalizeTransactions(transactions).map((transaction) =>
    withSyncState({
      id: transaction?.id || generateLocalId(),
      ...transaction,
      userId,
      synced: transaction?.synced ?? true,
    })
  );
  all[userId] = sortTransactions(mergeTransactionsById(normalized));
  await writeAllTransactions(all);
};

export const updateTransactionForUser = async (userId, transactionId, updates) => {
  if (!transactionId) {
    return null;
  }
  const all = await readAllTransactions();
  const existing = normalizeTransactions(all[userId]);
  let updatedTransaction = null;
  const mapped = existing.map((item) => {
    if (item.id !== transactionId) {
      return item;
    }
    updatedTransaction = withSyncState({
      ...item,
      ...updates,
      id: transactionId,
      userId,
    });
    return updatedTransaction;
  });
  all[userId] = sortTransactions(mapped);
  await writeAllTransactions(all);
  return updatedTransaction;
};

export const deleteTransactionForUser = async (userId, transactionId) => {
  const all = await readAllTransactions();
  const existing = normalizeTransactions(all[userId]);
  const filtered = existing.filter((item) => item.id !== transactionId);
  all[userId] = sortTransactions(filtered);
  await writeAllTransactions(all);
  return filtered;
};
