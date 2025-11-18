import { auth } from "../firebase";
import {
  getLocalBankAccounts,
  setLocalBankAccounts,
} from "../storage/bankAccounts";
import { LOCAL_USER_ID, saveTransactionForUser } from "../storage/transactions";
import { createRemoteTransaction } from "./transactions";

const normalizeTransactionForStorage = (transaction) => ({
  ...transaction,
  amount: Number(transaction?.amount) || 0,
  createdAt: transaction?.createdAt || new Date().toISOString(),
});

const updateBankAccountBalance = async (userId, transaction) => {
  const accounts = await getLocalBankAccounts(userId);
  const accountIndex = accounts.findIndex(
    (acc) => acc.name === transaction.paymentAccount
  );

  if (accountIndex === -1) {
    return;
  }

  const account = accounts[accountIndex];
  const amount = transaction.amount;

  if (transaction.type === "INCOME") {
    account.balance += amount;
  } else if (transaction.type === "EXPENSE") {
    account.balance -= amount;
  }

  accounts[accountIndex] = account;
  await setLocalBankAccounts(userId, accounts);
};

export const persistTransaction = async (transaction) => {
  const user = auth.currentUser;
  const targetUserId = user?.uid || LOCAL_USER_ID;
  const payload = normalizeTransactionForStorage(transaction);

  const saveLocally = async (overrides = {}) =>
    saveTransactionForUser(targetUserId, {
      ...payload,
      ...overrides,
    });

  await updateBankAccountBalance(targetUserId, payload);

  if (!user) {
    const stored = await saveLocally({ synced: false });
    return {
      status: "local-only",
      userId: targetUserId,
      transaction: stored,
    };
  }

  try {
    const remoteTransaction = await createRemoteTransaction(user.uid, payload);
    const stored = await saveLocally({ id: remoteTransaction.id, synced: true });
    return {
      status: "synced",
      userId: targetUserId,
      transaction: stored,
      remote: remoteTransaction,
    };
  } catch (error) {
    const stored = await saveLocally({ synced: false });
    return {
      status: "offline-fallback",
      userId: targetUserId,
      transaction: stored,
      error,
    };
  }
};
