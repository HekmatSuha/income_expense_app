import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useLanguage } from "../context/LanguageContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const keyboardVerticalOffset = useMemo(
    () => (Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 24 : 0),
    []
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("auth.missingInfoTitle"), t("auth.missingInfoBody"));
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("Home");
    } catch (err) {
      console.log(err);
      Alert.alert(t("auth.loginFailedTitle"), t("auth.loginFailedBody"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("auth.loginTitle")}</Text>
            <Text style={styles.subtitle}>{t("auth.loginSubtitle")}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("auth.signIn")}</Text>
            <TextInput
              placeholder={t("auth.email")}
              placeholderTextColor="#8A8FA6"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              returnKeyType="next"
            />
            <TextInput
              placeholder={t("auth.password")}
              placeholderTextColor="#8A8FA6"
              value={password}
              secureTextEntry
              style={styles.input}
              onChangeText={setPassword}
              returnKeyType="done"
            />

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.tertiaryAction}
              disabled={loading}
            >
              <Text style={styles.tertiaryActionText}>{t("auth.forgotPassword")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              style={styles.secondaryAction}
              disabled={loading}
            >
              <Text style={styles.secondaryActionText}>{t("auth.needAccount")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 16,
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
  tertiaryAction: {
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  tertiaryActionText: {
    color: "#7DD3FC",
    fontSize: 13,
    fontWeight: "500",
  },
});
