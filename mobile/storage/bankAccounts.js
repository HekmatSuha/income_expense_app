import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@income-expense-app/bank-accounts";
const DEFAULT_USER_ID = "local-user";

export const DEFAULT_BANK_ACCOUNTS = [
  {
    id: "demo-checking",
    name: "Main Checking",
    type: "Checking",
    balance: 2450.75,
    currency: "USD",
  },
  {
    id: "demo-savings",
    name: "High-Yield Savings",
    type: "Savings",
    balance: 7200.5,
    currency: "USD",
  },
  {
    id: "demo-cash",
    name: "Cash Wallet",
    type: "Cash",
    balance: 180.25,
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

const normalizeAccount = (account) => ({
  id: account?.id || generateLocalId(),
  name: account?.name || "Unnamed account",
  type: account?.type || "Account",
  balance: Number(account?.balance) || 0,
  currency: account?.currency || "USD",
});

const cloneDefaultAccounts = () => DEFAULT_BANK_ACCOUNTS.map((account) => normalizeAccount(account));

export const getLocalBankAccounts = async (userId = DEFAULT_USER_ID) => {
  const all = await readAll();
  const stored = Array.isArray(all[userId]) ? all[userId] : [];

  if (stored.length === 0) {
    const defaults = cloneDefaultAccounts();
    all[userId] = defaults;
    await writeAll(all);
    return defaults;
  }

  return stored.map((account) => normalizeAccount(account));
};

export const setLocalBankAccounts = async (userId, accounts) => {
  const all = await readAll();
  const normalized = Array.isArray(accounts)
    ? accounts.map((account) => normalizeAccount(account))
    : cloneDefaultAccounts();
  all[userId || DEFAULT_USER_ID] = normalized;
  await writeAll(all);
  return normalized;
};

export const addLocalBankAccount = async (userId, account) => {
  const targetUserId = userId || DEFAULT_USER_ID;
  const existing = await getLocalBankAccounts(targetUserId);
  const normalized = normalizeAccount(account);
  const deduped = existing.filter((item) => item.id !== normalized.id);
  const updated = [normalized, ...deduped];

  const all = await readAll();
  all[targetUserId] = updated;
  await writeAll(all);

  return normalized;
};
