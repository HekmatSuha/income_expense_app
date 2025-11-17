import { collection, addDoc, getDocs, query } from "firebase/firestore";
import { auth, db } from "../firebase";

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

export const addBankAccount = async (bankAccount) => {
  const user = await waitForAuthenticatedUser();
  if (!user) {
    throw new Error(NOT_AUTHENTICATED_ERROR);
  }

  const bankAccountsCollection = getBankAccountsCollection(user.uid);
  const docRef = await addDoc(bankAccountsCollection, bankAccount);
  return { id: docRef.id, ...bankAccount };
};

export const getBankAccounts = async () => {
  const user = await waitForAuthenticatedUser().catch((error) => {
    console.warn("Failed to determine authenticated user", error);
    return null;
  });
  if (!user) {
    return [];
  }

  const bankAccountsCollection = getBankAccountsCollection(user.uid);
  const q = query(bankAccountsCollection);
  const querySnapshot = await getDocs(q);

  const bankAccounts = [];
  querySnapshot.forEach((doc) => {
    bankAccounts.push({ id: doc.id, ...doc.data() });
  });

  return bankAccounts;
};
