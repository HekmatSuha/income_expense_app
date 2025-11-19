import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";
import { formatCurrencyValue } from "../../../utils/formatters";

const View = styled(RNView);
const Text = styled(RNText);

const Summary = ({ totalIncome, totalExpense, balance }) => {
  const incomeValue = Math.max(totalIncome, 0);
  const expenseValue = Math.abs(totalExpense);
  const totalVolume = incomeValue + expenseValue;
  const incomeShare = totalVolume ? (incomeValue / totalVolume) * 100 : 0;

  return (
    <View className="px-4 pt-4 pb-2 bg-gray-100">
      <View className="rounded-3xl bg-white shadow-sm border border-gray-100 px-4 py-5">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Balance
        </Text>
        <Text className="text-3xl font-bold text-gray-900 mt-1">
          {formatCurrencyValue(balance)}
        </Text>
        <Text className="text-xs text-gray-500 mt-2">
          Income vs expense for the selected range
        </Text>
        <View className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${incomeShare}%` }}
          />
        </View>
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 rounded-2xl bg-emerald-50 px-3 py-3">
            <Text className="text-[11px] font-semibold text-emerald-600 uppercase">
              Total Income
            </Text>
            <Text className="text-lg font-semibold text-emerald-700 mt-1">
              {formatCurrencyValue(totalIncome)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-rose-50 px-3 py-3">
            <Text className="text-[11px] font-semibold text-rose-600 uppercase">
              Total Expense
            </Text>
            <Text className="text-lg font-semibold text-rose-600 mt-1">
              {formatCurrencyValue(-Math.abs(totalExpense))}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Summary;
