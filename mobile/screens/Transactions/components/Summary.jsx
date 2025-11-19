import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";
import { Feather } from "@expo/vector-icons";
import { formatCurrencyValue } from "../../../utils/formatters";

const View = styled(RNView);
const Text = styled(RNText);

const Summary = ({ totalIncome, totalExpense, balance, currency }) => {
  const incomeValue = Math.max(totalIncome, 0);
  const expenseValue = Math.abs(totalExpense);
  const totalVolume = incomeValue + expenseValue;
  const incomeShare = totalVolume ? (incomeValue / totalVolume) * 100 : 0;

  return (
    <View className="px-4 pt-4 pb-2 bg-gray-50">
      <View className="rounded-3xl bg-white shadow-sm border border-gray-100 px-5 py-6">
        <View className="items-center mb-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Total Balance
          </Text>
          <Text className="text-4xl font-black text-gray-900 tracking-tight">
            {formatCurrencyValue(balance, currency)}
          </Text>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center">
                <Feather name="arrow-down-left" size={14} color="#059669" />
              </View>
              <Text className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                Income
              </Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">
              {formatCurrencyValue(totalIncome, currency)}
            </Text>
          </View>

          <View className="flex-1 bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-6 h-6 rounded-full bg-rose-100 items-center justify-center">
                <Feather name="arrow-up-right" size={14} color="#e11d48" />
              </View>
              <Text className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                Expense
              </Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">
              {formatCurrencyValue(-Math.abs(totalExpense), currency)}
            </Text>
          </View>
        </View>

        <View className="mt-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs font-medium text-gray-400">Cash Flow</Text>
            <Text className="text-xs font-bold text-gray-600">
              {Math.round(incomeShare)}% Income
            </Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-gray-900 rounded-full"
              style={{ width: `${incomeShare}%` }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default Summary;
