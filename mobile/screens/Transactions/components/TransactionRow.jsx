import React, { useMemo, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { styled } from "../../../packages/nativewind";
import { MaterialIcons } from "@expo/vector-icons";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);

const typePalette = {
  INCOME: { amount: "text-income", border: "border-l-income" },
  EXPENSE: { amount: "text-expense", border: "border-l-expense" },
  TRANSFER: { amount: "text-transactions", border: "border-l-transactions" },
};

const TransactionRow = ({ transaction, onEdit, onDelete }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const type = transaction.type?.toUpperCase() || "EXPENSE";
  const palette = typePalette[type] || typePalette.EXPENSE;
  const avatarLabel =
    (transaction.category?.[0] || transaction.type?.[0] || "?").toUpperCase();
  const attachments = useMemo(
    () => (Array.isArray(transaction.attachments) ? transaction.attachments : []),
    [transaction.attachments]
  );

  // Android intent flag for granting one-time read access to the opened URI.
  const READ_URI_PERMISSION_FLAG = 1; // android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
  const ANDROID_VIEW_ACTION =
    (IntentLauncher.ActivityAction && IntentLauncher.ActivityAction.VIEW) ||
    "android.intent.action.VIEW";

  const handleOpenAttachment = async (file) => {
    if (!file?.uri) {
      return;
    }
    try {
      const mimeType =
        (typeof file?.mimeType === "string" && file.mimeType) ||
        (typeof file?.type === "string" && file.type.includes("/") && file.type) ||
        "*/*";

      if (Platform.OS === "android") {
        const isLocalContent = file.uri.startsWith("file://") || file.uri.startsWith("content://");
        if (isLocalContent) {
          let androidUri = file.uri;
          if (androidUri.startsWith("file://")) {
            androidUri = await getContentUriAsync(androidUri);
          }
          await IntentLauncher.startActivityAsync(ANDROID_VIEW_ACTION, {
            data: androidUri,
            flags: READ_URI_PERMISSION_FLAG,
            type: mimeType,
          });
          return;
        }
      }

      const supported = await Linking.canOpenURL(file.uri);
      if (!supported) {
        Alert.alert("Attachment", "We couldn't open this attachment on your device.");
        return;
      }
      await Linking.openURL(file.uri);
    } catch (error) {
      console.error("Failed to open attachment", error);
      Alert.alert("Attachment", "Unable to open this attachment right now.");
    }
  };

  return (
    <View
      className={`relative mx-4 mb-3 rounded-2xl bg-card-light border border-gray-100 shadow-sm p-4 border-l-4 ${palette.border}`}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 rounded-full bg-background-light border border-gray-100 items-center justify-center">
          <Text className="text-base font-bold text-text-light">{avatarLabel}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-bold text-text-light" numberOfLines={1}>
                {transaction.category || transaction.type}
              </Text>
              <Text
                className="text-[11px] text-text-secondary-light mt-0.5"
                numberOfLines={1}
              >
                {transaction.paymentMethod}
                {transaction.paymentAccount ? ` - ${transaction.paymentAccount}` : ""}
              </Text>
              {transaction.note ? (
                <Text
                  className="text-[11px] text-text-secondary-light mt-0.5"
                  numberOfLines={1}
                >
                  {transaction.note}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text className={`text-base font-bold ${palette.amount}`}>
                {transaction.displayAmount}
              </Text>
              <Text className="text-[10px] font-medium text-text-secondary-light mt-0.5">
                {transaction.timeLabel}
              </Text>
              <TouchableOpacity
                className="mt-2 p-1 rounded-full bg-background-light border border-gray-100"
                activeOpacity={0.7}
                onPress={() => setMenuVisible((prev) => !prev)}
              >
                <MaterialIcons name="more-vert" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {attachments.length > 0 ? (
        <View className="mt-3 border-t border-gray-100 pt-3">
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="attach-file" size={16} color="#6B7280" />
            <Text className="text-xs font-semibold text-text-secondary-light">
              Attachments ({attachments.length})
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {attachments.map((file) => (
              <TouchableOpacity
                key={file.id || file.uri}
                className="mr-2 mb-2 px-3 py-2 rounded-full bg-background-light border border-gray-100 flex-row items-center gap-2"
                activeOpacity={0.8}
                onPress={() => handleOpenAttachment(file)}
              >
                <MaterialIcons name="insert-drive-file" size={14} color="#0288D1" />
                <Text
                  className="text-[11px] font-semibold text-text-light"
                  numberOfLines={1}
                >
                  {file.name || "Attachment"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
      {menuVisible ? (
        <View className="absolute top-4 right-4 bg-white rounded-2xl border border-gray-100 shadow-lg z-10">
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center gap-2 border-b border-gray-50"
            activeOpacity={0.8}
            onPress={() => {
              setMenuVisible(false);
              onEdit?.(transaction);
            }}
          >
            <MaterialIcons name="edit" size={16} color="#0288D1" />
            <Text className="text-sm font-semibold text-primary">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center gap-2"
            activeOpacity={0.8}
            onPress={() => {
              setMenuVisible(false);
              onDelete?.(transaction);
            }}
          >
            <MaterialIcons name="delete-outline" size={16} color="#DC2626" />
            <Text className="text-sm font-semibold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default TransactionRow;
