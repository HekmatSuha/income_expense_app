import { collection, addDoc, getDocs, query, doc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "../firebase";
import { LOCAL_USER_ID } from "../storage/transactions";
import {
  addLocalBankAccount,
  getLocalBankAccounts,
  setLocalBankAccounts,
  adjustLocalBankAccountBalance,
} from "../storage/bankAccounts";

const getBankAccountsCollection = (userId) => {
  return collection(db, "users", userId, "bankAccounts");
};

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

const normalizeBankAccount = (bankAccount) => ({
  name: bankAccount?.name || "Account",
  type: bankAccount?.type || "Account",
  balance: Number(bankAccount?.balance) || 0,
  currency: bankAccount?.currency || "USD",
});

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
    const docRef = await addDoc(bankAccountsCollection, normalized);
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

  if (!user) {
    return getLocalBankAccounts(targetUserId);
  }

  try {
    const bankAccountsCollection = getBankAccountsCollection(user.uid);
    const q = query(bankAccountsCollection);
    const querySnapshot = await getDocs(q);

    const bankAccounts = [];
    querySnapshot.forEach((doc) => {
      bankAccounts.push({ id: doc.id, ...doc.data() });
    });

    if (bankAccounts.length === 0) {
      return getLocalBankAccounts(targetUserId);
    }

    await setLocalBankAccounts(targetUserId, bankAccounts);
    return bankAccounts;
  } catch (error) {
    console.warn("Failed to fetch remote bank accounts, falling back to local cache", error);
    return getLocalBankAccounts(targetUserId);
  }
};

export const adjustBankAccountBalance = async (accountId, delta = 0) => {
  if (!accountId || !Number.isFinite(delta) || delta === 0) {
    return null;
  }

  const user = await waitForAuthenticatedUser().catch((error) => {
    console.warn("Failed to determine authenticated user", error);
    return null;
  });

  const targetUserId = user?.uid || LOCAL_USER_ID;

  if (user) {
    try {
      const accountRef = doc(db, "users", user.uid, "bankAccounts", accountId);
      await updateDoc(accountRef, { balance: increment(delta) });
    } catch (error) {
      console.warn("Failed to update remote bank account balance", error);
    }
  }

  try {
    return await adjustLocalBankAccountBalance(targetUserId, accountId, delta);
  } catch (error) {
    console.warn("Failed to update local bank account balance", error);
    return null;
  }
};
