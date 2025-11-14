import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../src/api/client";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login/", {
        username,
        password,
      });
      await AsyncStorage.setItem("access", res.data.access);
      await AsyncStorage.setItem("refresh", res.data.refresh);
      navigation.replace("Home");
    } catch (err) {
      console.log(err.response?.data);
      Alert.alert("Login failed", "Check username/password");
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
