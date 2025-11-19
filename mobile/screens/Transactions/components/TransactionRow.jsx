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

  const bgColor = isIncome ? "bg-emerald-50/30" : "bg-rose-50/30";
  const borderColor = isIncome ? "border-emerald-100/50" : "border-rose-100/50";

  return (
    <View className={`mx-4 mb-3 rounded-2xl border ${borderColor} ${bgColor} p-3`}>
      <View className="flex-row items-center gap-3">
        <View
          className={`h-10 w-10 rounded-full items-center justify-center bg-white shadow-sm`}
        >
          <Text
            className={`text-base font-bold ${isIncome ? "text-emerald-600" : "text-rose-600"
              }`}
          >
            {avatarLabel}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                {transaction.paymentAccount ||
                  transaction.accountName ||
                  transaction.paymentMethod}
              </Text>
              <Text className="text-[11px] text-gray-500 mt-0.5" numberOfLines={1}>
                {transaction.category || transaction.type}
                {transaction.note ? ` • ${transaction.note}` : ""}
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-sm font-bold ${amountClass}`}>
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
