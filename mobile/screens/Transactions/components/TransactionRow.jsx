import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";

const View = styled(RNView);
const Text = styled(RNText);

const TransactionRow = ({ transaction }) => {
  const isIncome = transaction.type === "INCOME";
  const amountClass = isIncome ? "text-green-600" : "text-red-500";
  return (
    <View className="px-4 py-3 border-b border-gray-100 bg-white">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-gray-900">
            {transaction.category || transaction.type}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {transaction.paymentMethod} •{" "}
            {transaction.paymentAccount || "Unspecified"}
          </Text>
          {transaction.note ? (
            <Text className="text-xs text-gray-500 mt-1">
              {transaction.note}
            </Text>
          ) : null}
        </View>
        <Text className={`text-base font-bold ${amountClass}`}>
          {transaction.displayAmount}
        </Text>
      </View>
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-xs text-gray-400">{transaction.timeLabel}</Text>
        {transaction.attachmentsCount ? (
          <Text className="text-xs text-gray-400">
            {transaction.attachmentsCount} attachments
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default TransactionRow;
