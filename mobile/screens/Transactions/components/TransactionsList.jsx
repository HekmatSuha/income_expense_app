import React from "react";
import {
  SectionList as RNSectionList,
  View as RNView,
  Text as RNText,
} from "react-native";
import { styled } from "../../../packages/nativewind";
import TransactionRow from "./TransactionRow";
import { Feather } from "@expo/vector-icons";
import { formatCurrencyValue } from "../../../utils/formatters";

const SectionList = styled(RNSectionList);
const View = styled(RNView);
const Text = styled(RNText);

const TransactionsList = ({ groupedTransactions }) => {
  if (groupedTransactions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4 pt-20">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Feather name="inbox" size={32} color="#9CA3AF" />
        </View>
        <Text className="text-gray-900 text-lg font-bold mb-2">
          No transactions found
        </Text>
        <Text className="text-gray-500 text-center px-8">
          Try adjusting your filters or add a new transaction to get started.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={groupedTransactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TransactionRow transaction={item} />}
      renderSectionHeader={({ section: { title, data } }) => {
        const summary = data.reduce(
          (acc, tx) => {
            if (tx.type === "INCOME") {
              acc.income += Number(tx.amount) || 0;
            } else {
              acc.expense += Number(tx.amount) || 0;
            }
            return acc;
          },
          { income: 0, expense: 0 }
        );

        return (
          <View className="bg-gray-100 px-4 py-2 flex-row justify-between items-center">
            <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {title}
            </Text>
            <View className="flex-row gap-3">
              {summary.income > 0 && (
                <Text className="text-xs font-bold text-emerald-600">
                  +{formatCurrencyValue(summary.income, data[0]?.currency)}
                </Text>
              )}
              {summary.expense > 0 && (
                <Text className="text-xs font-bold text-rose-600">
                  -{formatCurrencyValue(summary.expense, data[0]?.currency)}
                </Text>
              )}
            </View>
          </View>
        );
      }}
      stickySectionHeadersEnabled={true}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default TransactionsList;
