import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@income-expense-app/bank-accounts";
const DEFAULT_USER_ID = "local-user";

export const DEFAULT_BANK_ACCOUNTS = [
  {
    id: "demo-checking",
    name: "Main Checking",
    type: "Checking",
    startingBalance: 2450.75,
    currency: "USD",
  },
  {
    id: "demo-savings",
    name: "High-Yield Savings",
    type: "Savings",
    startingBalance: 7200.5,
    currency: "USD",
  },
  {
    id: "demo-cash",
    name: "Cash Wallet",
    type: "Cash",
    startingBalance: 180.25,
    currency: "USD",
  },
];

const readAll = async () => {
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
    console.warn("Failed to read stored bank accounts", error);
    return {};
  }
};

const writeAll = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to persist bank accounts locally", error);
    throw error;
  }
};

const generateLocalId = () => {
  const random = Math.random().toString(36).slice(2, 9);
  return `local-bank-${Date.now()}-${random}`;
};

const resolveStartingBalance = (account) => {
  const explicit = Number(account?.startingBalance);
  if (Number.isFinite(explicit)) {
    return explicit;
  }
  const fallback = Number(account?.balance);
  if (Number.isFinite(fallback)) {
    return fallback;
  }
  return 0;
};

const normalizeAccount = (account) => {
  const startingBalance = resolveStartingBalance(account);
  return {
    id: account?.id || generateLocalId(),
    name: account?.name || "Unnamed account",
    type: account?.type || "Account",
    currency: account?.currency || "USD",
    startingBalance,
    balance: startingBalance,
    createdAt: account?.createdAt || new Date().toISOString(),
    updatedAt: account?.updatedAt || new Date().toISOString(),
  };
};

const prepareForStorage = (account) => {
  const normalized = normalizeAccount(account);
  return {
    id: normalized.id,
    name: normalized.name,
    type: normalized.type,
    currency: normalized.currency,
    startingBalance: normalized.startingBalance,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  };
};

const cloneDefaultAccounts = () => DEFAULT_BANK_ACCOUNTS.map((account) => prepareForStorage(account));

export const getLocalBankAccounts = async (userId = DEFAULT_USER_ID) => {
  const all = await readAll();
  const stored = Array.isArray(all[userId]) ? all[userId] : [];

  if (stored.length === 0) {
    const defaults = cloneDefaultAccounts();
    all[userId] = defaults;
    await writeAll(all);
    return defaults.map((item) => normalizeAccount(item));
  }

  return stored.map((account) => normalizeAccount(account));
};

export const setLocalBankAccounts = async (userId, accounts) => {
  const all = await readAll();
  const normalized = Array.isArray(accounts)
    ? accounts.map((account) => prepareForStorage(account))
    : cloneDefaultAccounts();
  all[userId || DEFAULT_USER_ID] = normalized;
  await writeAll(all);
  return normalized.map((account) => normalizeAccount(account));
};

export const addLocalBankAccount = async (userId, account) => {
  const targetUserId = userId || DEFAULT_USER_ID;
  const existing = await getLocalBankAccounts(targetUserId);
  const normalized = normalizeAccount(account);
  const storedPayload = prepareForStorage(normalized);
  const deduped = existing.filter((item) => item.id !== normalized.id);
  const updated = [storedPayload, ...deduped.map((item) => prepareForStorage(item))];

  const all = await readAll();
  all[targetUserId] = updated;
  await writeAll(all);

  return normalized;
};

export const updateLocalBankAccount = async (userId, accountId, updates) => {
  if (!accountId) {
    return null;
  }
  const targetUserId = userId || DEFAULT_USER_ID;
  const existing = await getLocalBankAccounts(targetUserId);
  let updatedAccount = null;
  const mapped = existing.map((account) => {
    if (account.id !== accountId) {
      return prepareForStorage(account);
    }
    const merged = {
      ...account,
      ...updates,
      id: accountId,
      updatedAt: new Date().toISOString(),
    };
    updatedAccount = normalizeAccount(merged);
    return prepareForStorage(updatedAccount);
  });
  const all = await readAll();
  all[targetUserId] = mapped;
  await writeAll(all);
  return updatedAccount;
};

export const deleteLocalBankAccount = async (userId, accountId) => {
  const targetUserId = userId || DEFAULT_USER_ID;
  const existing = await getLocalBankAccounts(targetUserId);
  const filtered = existing
    .filter((account) => account.id !== accountId)
    .map((account) => prepareForStorage(account));
  const all = await readAll();
  all[targetUserId] = filtered;
  await writeAll(all);
  return filtered.map((account) => normalizeAccount(account));
};
