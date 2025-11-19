import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";
import { Feather } from "@expo/vector-icons";
import { formatCurrencyValue } from "../../../utils/formatters";

const View = styled(RNView);
const Text = styled(RNText);

const Summary = ({ summaryData }) => {
  // summaryData is now an object: { [currency]: { income, expense, balance } }
  const currencies = Object.keys(summaryData);
  const primaryCurrency = currencies[0] || "USD";
  const primaryData = summaryData[primaryCurrency] || {
    income: 0,
    expense: 0,
    balance: 0,
  };

  const balanceString = currencies
    .map((curr) => formatCurrencyValue(summaryData[curr].balance, curr))
    .join(", ");

  const incomeString = currencies
    .map((curr) => formatCurrencyValue(summaryData[curr].income, curr))
    .join(", ");

  const expenseString = currencies
    .map((curr) =>
      formatCurrencyValue(-Math.abs(summaryData[curr].expense), curr)
    )
    .join(", ");

  const totalVolume = primaryData.income + Math.abs(primaryData.expense);
  const incomeShare = totalVolume
    ? (primaryData.income / totalVolume) * 100
    : 0;

  return (
    <View className="px-4 pt-4 pb-2 bg-gray-50">
      <View className="rounded-3xl bg-white shadow-sm border border-gray-100 px-5 py-5">
        <View className="items-center mb-5">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Total Balance
          </Text>
          <Text className="text-2xl font-black text-gray-900 tracking-tight text-center">
            {balanceString || formatCurrencyValue(0, primaryCurrency)}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-5 h-5 rounded-full bg-emerald-100 items-center justify-center">
                <Feather name="arrow-down-left" size={12} color="#059669" />
              </View>
              <Text className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Income
              </Text>
            </View>
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {incomeString || formatCurrencyValue(0, primaryCurrency)}
            </Text>
          </View>

          <View className="flex-1 bg-rose-50/50 rounded-xl p-3 border border-rose-100/50">
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-5 h-5 rounded-full bg-rose-100 items-center justify-center">
                <Feather name="arrow-up-right" size={12} color="#e11d48" />
              </View>
              <Text className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">
                Expense
              </Text>
            </View>
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {expenseString || formatCurrencyValue(0, primaryCurrency)}
            </Text>
          </View>
        </View>

        {currencies.length === 1 && (
          <View className="mt-5">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-[10px] font-medium text-gray-400">
                Cash Flow
              </Text>
              <Text className="text-[10px] font-bold text-gray-600">
                {Math.round(incomeShare)}% Income
              </Text>
            </View>
            <View className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-gray-900 rounded-full"
                style={{ width: `${incomeShare}%` }}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default Summary;
