import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";
import { formatCurrencyValue } from "../../../utils/formatters";

const View = styled(RNView);
const Text = styled(RNText);

const Summary = ({ totalIncome, totalExpense, balance }) => {
  return (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row">
        <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
          <Text className="text-xs text-gray-600">Total Income</Text>
          <Text className="text-green-600 text-base font-semibold">
            {formatCurrencyValue(totalIncome)}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center py-4 border-r border-gray-200">
          <Text className="text-xs text-red-600">Total Expense</Text>
          <Text className="text-red-600 text-base font-semibold">
            {formatCurrencyValue(-Math.abs(totalExpense))}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center py-4">
          <Text className="text-xs text-gray-700">Balance</Text>
          <Text className="text-gray-900 text-base font-semibold">
            {formatCurrencyValue(balance)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Summary;
