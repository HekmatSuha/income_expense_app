import { auth } from "../firebase";
import {
  getLocalBankAccounts,
  setLocalBankAccounts,
} from "../storage/bankAccounts";
import {
  LOCAL_USER_ID,
  saveTransactionForUser,
  getTransactionsForUser,
  updateTransactionForUser,
  deleteTransactionForUser,
} from "../storage/transactions";
import {
  createRemoteTransaction,
  updateRemoteTransaction,
  deleteRemoteTransaction,
} from "./transactions";

const normalizeTransactionForStorage = (transaction) => ({
  ...transaction,
  amount: Number(transaction?.amount) || 0,
  createdAt: transaction?.createdAt || new Date().toISOString(),
});

const sanitizeAccountKey = (value) => (value || "").trim().toLowerCase();

const buildBalanceMapFromTransactions = (transactions) =>
  transactions.reduce((map, transaction) => {
    const key = sanitizeAccountKey(transaction?.paymentAccount);
    const amount = Number(transaction?.amount);
    if (!key || !Number.isFinite(amount)) {
      return map;
    }
    const type = (transaction?.type || "EXPENSE").toUpperCase();
    const signedAmount = type === "EXPENSE" ? -Math.abs(amount) : Math.abs(amount);
    map[key] = (map[key] || 0) + signedAmount;
    return map;
  }, {});

const syncLocalBankAccountBalances = async (userId) => {
  const accounts = await getLocalBankAccounts(userId);
  if (!accounts || accounts.length === 0) {
    return;
  }
  const transactions = await getTransactionsForUser(userId);
  const adjustments = buildBalanceMapFromTransactions(transactions);

  const updatedAccounts = accounts.map((account) => {
    const key = sanitizeAccountKey(account?.name);
    const startingBalance =
      Number(account?.startingBalance ?? account?.balance ?? 0) || 0;
    const delta = adjustments[key] || 0;
    const balance = Number((startingBalance + delta).toFixed(2));
    return {
      ...account,
      startingBalance,
      balance,
      updatedAt: new Date().toISOString(),
    };
  });

  await setLocalBankAccounts(userId, updatedAccounts);
};

const resolveUserId = () => auth.currentUser?.uid || LOCAL_USER_ID;

export const persistTransaction = async (transaction) => {
  const user = auth.currentUser;
  const targetUserId = user?.uid || LOCAL_USER_ID;
  const payload = normalizeTransactionForStorage(transaction);

  const saveLocally = async (overrides = {}) =>
    saveTransactionForUser(targetUserId, {
      ...payload,
      ...overrides,
    });

  const finalize = async (overrides = {}) => {
    const stored = await saveLocally(overrides);
    await syncLocalBankAccountBalances(targetUserId);
    return stored;
  };

  if (!user) {
    const stored = await finalize({ synced: false });
    return {
      status: "local-only",
      userId: targetUserId,
      transaction: stored,
    };
  }

  try {
    const remoteTransaction = await createRemoteTransaction(user.uid, payload);
    const stored = await finalize({ id: remoteTransaction.id, synced: true });
    return {
      status: "synced",
      userId: targetUserId,
      transaction: stored,
      remote: remoteTransaction,
    };
  } catch (error) {
    const stored = await finalize({ synced: false });
    return {
      status: "offline-fallback",
      userId: targetUserId,
      transaction: stored,
      error,
    };
  }
};

export const updateTransaction = async (transactionId, updates) => {
  if (!transactionId) {
    throw new Error("Transaction id is required to update.");
  }
  const user = auth.currentUser;
  const targetUserId = resolveUserId();
  const transactions = await getTransactionsForUser(targetUserId);
  const existing = transactions.find((tx) => tx.id === transactionId);
  if (!existing) {
    throw new Error("Transaction not found locally.");
  }

  const payload = normalizeTransactionForStorage({
    ...existing,
    ...updates,
    id: transactionId,
    updatedAt: new Date().toISOString(),
  });

  const persistLocally = async (overrides = {}) => {
    const stored = await updateTransactionForUser(targetUserId, transactionId, {
      ...payload,
      ...overrides,
    });
    await syncLocalBankAccountBalances(targetUserId);
    return stored;
  };

  if (!user) {
    const stored = await persistLocally({ synced: false });
    return {
      status: "local-only",
      userId: targetUserId,
      transaction: stored,
    };
  }

  try {
    const remote = await updateRemoteTransaction(user.uid, transactionId, payload);
    const stored = await persistLocally({ synced: true });
    return {
      status: "synced",
      userId: targetUserId,
      transaction: stored,
      remote,
    };
  } catch (error) {
    const stored = await persistLocally({ synced: false });
    return {
      status: "offline-fallback",
      userId: targetUserId,
      transaction: stored,
      error,
    };
  }
};

export const deleteTransaction = async (transactionId) => {
  if (!transactionId) {
    throw new Error("Transaction id is required to delete.");
  }
  const user = auth.currentUser;
  const targetUserId = resolveUserId();

  const removeLocally = async (overrides = {}) => {
    await deleteTransactionForUser(targetUserId, transactionId);
    await syncLocalBankAccountBalances(targetUserId);
    return overrides;
  };

  if (!user) {
    await removeLocally();
    return {
      status: "local-only",
      userId: targetUserId,
    };
  }

  try {
    await deleteRemoteTransaction(user.uid, transactionId);
    await removeLocally();
    return {
      status: "synced",
      userId: targetUserId,
    };
  } catch (error) {
    await removeLocally();
    return {
      status: "offline-fallback",
      userId: targetUserId,
      error,
    };
  }
};
