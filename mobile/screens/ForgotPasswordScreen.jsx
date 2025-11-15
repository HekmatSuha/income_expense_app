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
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert(
        "Email required",
        "Please enter your email address so we can send you reset instructions."
      );
      return;
    }

    try {
      setResetting(true);
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Reset email sent",
        "Check your inbox for a link to reset your password."
      );
      navigation.goBack();
    } catch (err) {
      console.log(err);
      const message =
        err?.code === "auth/user-not-found"
          ? "We couldn't find an account with that email address."
          : "We couldn't send the reset email. Please try again later.";
      Alert.alert("Reset failed", message);
    } finally {
      setResetting(false);
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address below to receive password reset instructions.
          </Text>
        </View>

        <View style={styles.card}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#8A8FA6"
            autoCapitalize="none"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              resetting && styles.primaryButtonDisabled,
            ]}
            onPress={handlePasswordReset}
            disabled={resetting}
          >
            <Text style={styles.primaryButtonText}>
              {resetting ? "Sending reset email..." : "Reset Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.secondaryAction}
            disabled={resetting}
          >
            <Text style={styles.secondaryActionText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
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
    color: "#F8FAFC",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#CBD5F5",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F8FAFC",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  primaryButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    marginTop: 18,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#7DD3FC",
    fontSize: 14,
    fontWeight: "500",
  },
});
