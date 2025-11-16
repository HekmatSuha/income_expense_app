import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please confirm your password.");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      Alert.alert("Welcome!", "Account created successfully. Please log in.", [
        {
          text: "Go to Login",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (err) {
      let message = "Unable to register. Please try again.";

      if (err?.code === "auth/email-already-in-use") {
        message = "An account with that email already exists. Try logging in instead.";
      } else if (err?.code === "auth/invalid-email") {
        message = "That email address looks invalid. Please check and try again.";
      } else if (err?.code === "auth/weak-password") {
        message = "Password must be at least 8 characters long.";
      }

      setError(message);
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
            placeholder="Email"
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

          {!!error && <Text style={styles.errorText}>{error}</Text>}

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
  errorText: {
    color: "#F87171",
    marginBottom: 4,
    fontSize: 14,
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
