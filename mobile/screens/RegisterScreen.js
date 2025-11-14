import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../src/api/client";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Missing information", "Username and password are required.");
      return;
    }
    if (form.password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Passwords do not match", "Please confirm your password.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register/", {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      Alert.alert("Welcome!", "Account created successfully. Please log in.", [
        {
          text: "Go to Login",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (err) {
      const errorData = err.response?.data;
      const message = Array.isArray(errorData)
        ? errorData.join("\n")
        : typeof errorData === "object"
        ? Object.values(errorData)
            .flat()
            .join("\n") || "Unable to register. Please try again."
        : "Unable to register. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Join us to keep your income and expenses perfectly organised.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign up</Text>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#8A8FA6"
            autoCapitalize="none"
            style={styles.input}
            value={form.username}
            onChangeText={(value) => updateField("username", value)}
          />
          <TextInput
            placeholder="Email (optional)"
            placeholderTextColor="#8A8FA6"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={form.email}
            onChangeText={(value) => updateField("email", value)}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#8A8FA6"
            secureTextEntry
            style={styles.input}
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
          />
          <TextInput
            placeholder="Confirm password"
            placeholderTextColor="#8A8FA6"
            secureTextEntry
            style={styles.input}
            value={form.confirmPassword}
            onChangeText={(value) => updateField("confirmPassword", value)}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Creating account..." : "Create account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.replace("Login")}
            style={styles.secondaryAction}
            disabled={loading}
          >
            <Text style={styles.secondaryActionText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F9FAFB",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F9FAFB",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  primaryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryAction: {
    marginTop: 18,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#A5B4FC",
    fontSize: 14,
    fontWeight: "500",
  },
});
