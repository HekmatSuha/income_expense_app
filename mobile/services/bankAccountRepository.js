import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

const getBankAccountsCollection = (userId) => {
  return collection(db, "users", userId, "bankAccounts");
};

export const addBankAccount = async (bankAccount) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  const bankAccountsCollection = getBankAccountsCollection(user.uid);
  const docRef = await addDoc(bankAccountsCollection, bankAccount);
  return { id: docRef.id, ...bankAccount };
};

export const getBankAccounts = async () => {
  const user = auth.currentUser;
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
