import React, { useState } from "react";
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity } from "react-native";
import { styled } from "../../../packages/nativewind";
import { MaterialIcons } from "@expo/vector-icons";

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
