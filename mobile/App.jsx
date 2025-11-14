import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import AddTransactionScreen from "./screens/AddTransactionScreen";
import CalendarScreen from "./screens/CalendarScreen";
import NotebookScreen from "./screens/NotebookScreen";
import BankAccountsScreen from "./screens/BankAccountsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="BankAccounts" component={BankAccountsScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Notebook" component={NotebookScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
