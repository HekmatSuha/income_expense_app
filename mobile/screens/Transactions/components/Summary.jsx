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

  const renderCurrencyRows = (valueSelector, valueClass) => (
    <View className="mt-2 space-y-1">
      {displayEntries.map(([currency, data]) => (
        <View
          key={`${valueClass}-${currency}`}
          className="flex-row justify-between items-center"
        >
          <Text className="text-xs font-semibold text-text-secondary-light">
            {currency}
          </Text>
          <Text
            className={`text-sm font-bold ${valueClass}`}
            numberOfLines={1}
          >
            {formatCurrencyValue(valueSelector(data), currency)}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View className="px-4 pt-4 pb-3 bg-background-light">
      <View className="rounded-3xl bg-card-light shadow-md border border-gray-100 px-5 py-5">
        <View className="mb-5">
          <Text className="text-[10px] font-bold text-text-secondary-light uppercase tracking-widest mb-2">
            Total Balance
          </Text>
          <View className="rounded-2xl border border-gray-100 bg-background-light px-4 py-3">
            {renderCurrencyRows((data) => data.balance, "text-text-light")}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-2xl p-4 border"
            style={{
              borderColor: "rgba(40, 167, 69, 0.25)",
              backgroundColor: "rgba(40, 167, 69, 0.08)",
            }}
          >
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm">
                <Feather name="arrow-down-left" size={14} color="#28A745" />
              </View>
              <Text className="text-[11px] font-bold text-income uppercase tracking-wide">
                Income
              </Text>
            </View>
            {renderCurrencyRows((data) => data.income, "text-income")}
          </View>

          <View
            className="flex-1 rounded-2xl p-4 border"
            style={{
              borderColor: "rgba(220, 53, 69, 0.25)",
              backgroundColor: "rgba(220, 53, 69, 0.08)",
            }}
          >
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm">
                <Feather name="arrow-up-right" size={14} color="#DC3545" />
              </View>
              <Text className="text-[11px] font-bold text-expense uppercase tracking-wide">
                Expense
              </Text>
            </View>
            {renderCurrencyRows(
              (data) => -Math.abs(data.expense),
              "text-expense"
            )}
          </View>
        </View>

        {displayEntries.length === 1 && (
          <View className="mt-5">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-[11px] font-medium text-text-secondary-light">
                Cash Flow
              </Text>
              <Text className="text-[11px] font-bold text-text-light">
                {Math.round(incomeShare)}% Income
              </Text>
            </View>
            <View className="h-1.5 bg-background-light rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
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
