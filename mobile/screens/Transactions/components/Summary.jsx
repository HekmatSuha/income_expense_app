import React from "react";
import { View as RNView, Text as RNText } from "react-native";
import { styled } from "../../../packages/nativewind";
import { formatCurrencyValue } from "../../../utils/formatters";
import { Feather } from "@expo/vector-icons";

const View = styled(RNView);
const Text = styled(RNText);

const Summary = ({ summaryData }) => {
  const entries = Object.entries(summaryData || {});
  const fallback = [["USD", { income: 0, expense: 0, balance: 0 }]];
  const displayEntries = entries.length ? entries : fallback;
  const [primaryCurrency, primaryData] = displayEntries[0];

  const totalVolume = primaryData.income + Math.abs(primaryData.expense);
  const incomeShare = totalVolume
    ? (primaryData.income / totalVolume) * 100
    : 0;

  return (
    <View className="px-4 pt-2 pb-1 bg-background-light">
      <View className="rounded-2xl bg-card-light border border-gray-100 px-4 py-3 shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[10px] font-bold text-text-secondary-light uppercase tracking-widest">
            Totals
          </Text>
          {displayEntries.length === 1 ? (
            <Text className="text-[10px] font-semibold text-text-secondary-light">
              {Math.round(incomeShare)}% Income
            </Text>
          ) : null}
        </View>
        {displayEntries.map(([currency, data]) => {
          const balance = formatCurrencyValue(data.balance, currency);
          const income = formatCurrencyValue(data.income, currency);
          const expense = formatCurrencyValue(-Math.abs(data.expense), currency);
          return (
            <View
              key={`summary-${currency}`}
              className="mb-2 last:mb-0 rounded-xl border border-gray-100 bg-background-light px-3 py-3"
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-xs font-semibold text-text-secondary-light">
                  {currency}
                </Text>
                <Text className="text-sm font-bold text-text-light" numberOfLines={1}>
                  {balance}
                </Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm">
                    <Feather name="arrow-down-left" size={14} color="#28A745" />
                  </View>
                  <Text className="text-[11px] font-bold text-income uppercase tracking-wide">
                    Income
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-income" numberOfLines={1}>
                  {income}
                </Text>
              </View>
              <View className="flex-row justify-between mt-1.5">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm">
                    <Feather name="arrow-up-right" size={14} color="#DC3545" />
                  </View>
                  <Text className="text-[11px] font-bold text-expense uppercase tracking-wide">
                    Expense
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-expense" numberOfLines={1}>
                  {expense}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default Summary;
