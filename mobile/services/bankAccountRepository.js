import { collection, addDoc, getDocs, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  LOCAL_USER_ID,
  getTransactionsForUser,
  setTransactionsForUser,
} from "../storage/transactions";
import {
  addLocalBankAccount,
  getLocalBankAccounts,
  setLocalBankAccounts,
  updateLocalBankAccount,
  deleteLocalBankAccount,
} from "../storage/bankAccounts";
import { fetchRemoteTransactions } from "./transactions";

const getBankAccountsCollection = (userId) => {
  return collection(db, "users", userId, "bankAccounts");
};

const getBankAccountDocRef = (userId, accountId) =>
  doc(db, "users", userId, "bankAccounts", accountId);

const AUTH_TIMEOUT = 5000;
const NOT_AUTHENTICATED_ERROR = "auth/not-authenticated";

const waitForAuthenticatedUser = () =>
  new Promise((resolve) => {
    const existingUser = auth.currentUser;
    if (existingUser) {
      resolve(existingUser);
      return;
    }

    const startedAt = Date.now();
    const poll = setInterval(() => {
      const currentUser = auth.currentUser;
      const isTimeoutReached = Date.now() - startedAt >= AUTH_TIMEOUT;

      if (currentUser || isTimeoutReached) {
        clearInterval(poll);
        resolve(currentUser || null);
      }
    }, 100);
  });

const normalizeBankAccount = (bankAccount) => {
  const startingBalance = Number(bankAccount?.startingBalance ?? bankAccount?.balance);
  return {
    name: bankAccount?.name || "Account",
    type: bankAccount?.type || "Account",
    startingBalance: Number.isFinite(startingBalance) ? startingBalance : 0,
    currency: bankAccount?.currency || "USD",
  };
};

const sanitizeAccountKey = (value) => (value || "").trim().toLowerCase();

const buildBalanceMapFromTransactions = (transactions) => {
  return transactions.reduce((map, transaction) => {
    const key = sanitizeAccountKey(transaction?.paymentAccount);
    const amount = Number(transaction?.amount);
    if (!key || !Number.isFinite(amount)) {
      return map;
    }
    map[key] = (map[key] || 0) + amount;
    return map;
  }, {});
};

const applyBalancesToAccounts = (accounts, transactions) => {
  const adjustments = buildBalanceMapFromTransactions(transactions);
  return accounts.map((account) => {
    const key = sanitizeAccountKey(account?.name);
    const startingBalance = Number(account?.startingBalance ?? account?.balance) || 0;
    const delta = adjustments[key] || 0;
    const computedBalance = Number((startingBalance + delta).toFixed(2));
    return {
      ...account,
      startingBalance,
      balance: computedBalance,
      updatedAt: new Date().toISOString(),
    };
  });
};

const loadTransactionsForUser = async (userId, isAuthenticated) => {
  if (!userId) {
    return [];
  }

  if (!isAuthenticated) {
    return getTransactionsForUser(userId);
  }

  try {
    const remoteTransactions = await fetchRemoteTransactions(userId);
    await setTransactionsForUser(userId, remoteTransactions);
    return remoteTransactions;
  } catch (error) {
    console.warn("Failed to fetch remote transactions for balances", error);
    return getTransactionsForUser(userId);
  }
};

export const addBankAccount = async (bankAccount) => {
  const normalized = normalizeBankAccount(bankAccount);
  const user = await waitForAuthenticatedUser();
  const targetUserId = user?.uid || LOCAL_USER_ID;

  const persistLocally = async (overrides = {}) =>
    addLocalBankAccount(targetUserId, { ...normalized, ...overrides });

  if (!user) {
    return persistLocally();
  }

  try {
    const bankAccountsCollection = getBankAccountsCollection(user.uid);
    const docRef = await addDoc(bankAccountsCollection, {
      ...normalized,
      balance: normalized.startingBalance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return await persistLocally({ id: docRef.id });
  } catch (error) {
    console.warn("Falling back to local bank account storage", error);
    return persistLocally();
  }
};

export const getBankAccounts = async () => {
  const user = await waitForAuthenticatedUser().catch((error) => {
    console.warn("Failed to determine authenticated user", error);
    return null;
  });

  const targetUserId = user?.uid || LOCAL_USER_ID;

  let sourceAccounts = [];

  if (!user) {
    sourceAccounts = await getLocalBankAccounts(targetUserId);
  } else {
    try {
      const bankAccountsCollection = getBankAccountsCollection(user.uid);
      const q = query(bankAccountsCollection);
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((snapshotDoc) => {
        sourceAccounts.push({ id: snapshotDoc.id, ...snapshotDoc.data() });
      });

      if (sourceAccounts.length > 0) {
        await setLocalBankAccounts(targetUserId, sourceAccounts);
      }
    } catch (error) {
      console.warn("Failed to fetch remote bank accounts, falling back to local cache", error);
      sourceAccounts = await getLocalBankAccounts(targetUserId);
    }
  }

  if (sourceAccounts.length === 0) {
    sourceAccounts = await getLocalBankAccounts(targetUserId);
  }

  const transactions = await loadTransactionsForUser(targetUserId, Boolean(user));
  return applyBalancesToAccounts(sourceAccounts, transactions);
};

export const updateBankAccount = async (accountId, updates) => {
  if (!accountId) {
    throw new Error("Bank account id is required to update.");
  }
  const user = await waitForAuthenticatedUser();
  const targetUserId = user?.uid || LOCAL_USER_ID;

  const normalized = normalizeBankAccount({ id: accountId, ...updates });
  const persistLocally = async (overrides = {}) =>
    updateLocalBankAccount(targetUserId, accountId, {
      ...normalized,
      ...overrides,
    });

  if (!user) {
    return persistLocally();
  }

  try {
    await updateDoc(getBankAccountDocRef(user.uid, accountId), {
      name: normalized.name,
      type: normalized.type,
      currency: normalized.currency,
      startingBalance: normalized.startingBalance,
      updatedAt: new Date().toISOString(),
    });
    return persistLocally({ id: accountId });
  } catch (error) {
    console.warn("Failed to update remote bank account, persisting locally", error);
    return persistLocally();
  }
};

export const deleteBankAccount = async (accountId) => {
  if (!accountId) {
    throw new Error("Bank account id is required to delete.");
  }
  const user = await waitForAuthenticatedUser();
  const targetUserId = user?.uid || LOCAL_USER_ID;

  const removeLocal = async () => deleteLocalBankAccount(targetUserId, accountId);

  if (!user) {
    await removeLocal();
    return true;
  }

  try {
    await deleteDoc(getBankAccountDocRef(user.uid, accountId));
    await removeLocal();
    return true;
  } catch (error) {
    console.warn("Failed to delete remote bank account, removing locally", error);
    await removeLocal();
    return false;
  }
};
