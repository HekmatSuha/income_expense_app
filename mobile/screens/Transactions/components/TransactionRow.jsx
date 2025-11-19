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
    <View className="px-4 py-3 bg-white border-b border-gray-50">
      <View className="flex-row items-center gap-4">
        <View
          className={`h-12 w-12 rounded-full items-center justify-center ${isIncome ? "bg-emerald-100" : "bg-rose-100"
            }`}
        >
          <Text
            className={`text-lg font-bold ${isIncome ? "text-emerald-600" : "text-rose-600"
              }`}
          >
            {avatarLabel}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                {transaction.category || transaction.type}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {transaction.note || transaction.paymentMethod}
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-base font-bold ${amountClass}`}>
                {isIncome ? "+" : "-"}
                {transaction.displayAmount}
              </Text>
              <Text className="text-[10px] font-medium text-gray-400 mt-0.5">
                {transaction.timeLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TransactionRow;
