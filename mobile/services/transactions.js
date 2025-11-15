import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

const TRANSACTIONS_COLLECTION = "transactions";

const ensureUserId = (userId) => {
  if (!userId) {
    throw new Error("A userId is required to access transactions.");
  }
  return userId;
};

const normalizeCreatedAt = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const normalizeAmount = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return 0;
};

const normalizeType = (value) => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value || "EXPENSE";
};

const buildBaseTransaction = (transaction) => {
  const createdAt = normalizeCreatedAt(transaction?.createdAt);

  return {
    ...transaction,
    amount: normalizeAmount(transaction?.amount),
    type: normalizeType(transaction?.type),
    createdAt,
    updatedAt: new Date().toISOString(),
  };
};

const getUserDocRef = (userId) => doc(db, "users", ensureUserId(userId));

const getUserTransactionsCollection = (userId) =>
  collection(getUserDocRef(userId), TRANSACTIONS_COLLECTION);

const buildTransactionsQuery = (userId) =>
  query(getUserTransactionsCollection(userId), orderBy("createdAt", "desc"));

const mapSnapshot = (snapshot) =>
  snapshot.docs.map((snapshotDoc) => ({
    id: snapshotDoc.id,
    ...snapshotDoc.data(),
  }));

export const ensureUserDocument = async (userId) => {
  const userDocRef = getUserDocRef(userId);
  await setDoc(
    userDocRef,
    {
      lastActivityAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

export const createRemoteTransaction = async (userId, transaction) => {
  const normalizedTransaction = {
    ...buildBaseTransaction(transaction),
    userId: ensureUserId(userId),
  };
  await ensureUserDocument(userId);
  const docRef = await addDoc(
    getUserTransactionsCollection(userId),
    normalizedTransaction
  );
  return {
    id: docRef.id,
    ...normalizedTransaction,
  };
};

export const subscribeToRemoteTransactions = (userId, { onData, onError } = {}) => {
  try {
    const unsubscribe = onSnapshot(
      buildTransactionsQuery(userId),
      (snapshot) => {
        const items = mapSnapshot(snapshot);
        onData?.(items);
      },
      (error) => {
        console.error("Failed to listen to remote transactions", error);
        onError?.(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Unable to subscribe to transactions", error);
    onError?.(error);
    return () => {};
  }
};

export const fetchRemoteTransactions = async (userId) => {
  const snapshot = await getDocs(buildTransactionsQuery(userId));
  return mapSnapshot(snapshot);
};
