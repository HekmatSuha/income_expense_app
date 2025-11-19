import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";

const View = styled(RNView);
const Text = styled(RNText);

const TransactionRow = ({ transaction }) => {
  const isIncome = transaction.type === "INCOME";
  const amountClass = isIncome ? "text-green-600" : "text-red-500";
  const avatarLabel =
    (transaction.category?.[0] || transaction.type?.[0] || "?").toUpperCase();

  return (
    <View className="px-4 py-2">
      <View className="bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm">
        <View className="flex-row justify-between items-start">
          <View className="flex-row flex-1 gap-3">
            <View
              className={`h-12 w-12 rounded-2xl items-center justify-center ${
                isIncome ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  isIncome ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {avatarLabel}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {transaction.category || transaction.type}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {transaction.paymentMethod} -{" "}
                {transaction.paymentAccount || "Unspecified"}
              </Text>
              {transaction.note ? (
                <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
                  {transaction.note}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="items-end">
            <Text className={`text-base font-bold ${amountClass}`}>
              {transaction.displayAmount}
            </Text>
            <Text className="text-[11px] text-gray-400 mt-1">
              {transaction.currency}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-xs text-gray-400">{transaction.timeLabel}</Text>
          {transaction.attachmentsCount ? (
            <Text className="text-xs text-gray-400">
              {transaction.attachmentsCount} attachment
              {transaction.attachmentsCount > 1 ? "s" : ""}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default TransactionRow;
