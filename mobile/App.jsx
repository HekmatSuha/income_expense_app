import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import AddTransactionScreen from "./screens/AddTransactionScreen";
import NotebookScreen from "./screens/NotebookScreen";
import BankAccountsScreen from "./screens/BankAccountsScreen";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import TransferScreen from "./screens/TransferScreen";
import AddIncomeScreen from "./screens/AddIncomeScreen";

import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";

import ErrorBoundary from "./components/ErrorBoundary";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="BankAccounts" component={BankAccountsScreen} />
          <Stack.Screen name="Notebook" component={NotebookScreen} />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
          <Stack.Screen name="Transfer" component={TransferScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
