import React, { useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../packages/nativewind";
import { updateProfile, updateEmail, reload } from "firebase/auth";
import { auth } from "../firebase";

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const TouchableOpacity = styled(RNTouchableOpacity);
const ScrollView = styled(RNScrollView);

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Not signed in", "You need to sign in before updating your profile.");
      return;
    }

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();
    const currentName = user.displayName || "";
    const currentEmail = user.email || "";
    const hasNameChange = trimmedName !== currentName;
    const hasEmailChange = trimmedEmail !== currentEmail;

    if (!hasNameChange && !hasEmailChange) {
      Alert.alert("No changes", "Update your name or email, then try saving again.");
      return;
    }

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a display name.");
      return;
    }

    setLoading(true);
    let nameUpdated = false;

    try {
      if (hasNameChange) {
        await updateProfile(user, { displayName: trimmedName });
        nameUpdated = true;
      }

      if (hasEmailChange) {
        // updateEmail can fail if the session is old; we let it surface a helpful error.
        await updateEmail(user, trimmedEmail);
        setEmail(trimmedEmail);
      }

      await reload(user);
      Alert.alert("Success", "Profile updated successfully.");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      let message = "Failed to update profile.";
      if (error?.code === "auth/requires-recent-login") {
        message = "For security, please sign out and sign in again to change your email.";
      }
      if (nameUpdated) {
        // Ensure we show the saved name even if email failed.
        await reload(user).catch(() => {});
      }
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-slate-900 ml-2">My Profile</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-8">
          <View className="items-center mb-8">
            <View className="h-24 w-24 bg-sky-100 rounded-full items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-sky-600">
                {(displayName?.[0] || user?.email?.[0] || "?").toUpperCase()}
              </Text>
            </View>
            <Text className="text-sm text-slate-500">
              {user?.uid ? "Signed in" : "Guest User"}
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-base"
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-base"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text className="text-xs text-slate-400 mt-2 ml-1">
                Changing email requires a recent sign-in.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="p-6 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`w-full bg-[#0288D1] py-4 rounded-2xl items-center shadow-sm ${
              loading ? "opacity-70" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
