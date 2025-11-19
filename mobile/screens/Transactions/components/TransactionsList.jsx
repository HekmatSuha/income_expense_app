import React from "react";
import {
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
} from "react-native";
import { styled } from "../../../packages/nativewind";
import TransactionRow from "./TransactionRow";

const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);

const TransactionsList = ({ groupedTransactions }) => {
  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {groupedTransactions.length === 0 ? (
          <View className="px-4 py-10 items-center">
            <Text className="text-gray-500 text-sm">
              No transactions match your filters.
            </Text>
          </View>
        ) : (
          groupedTransactions.map(([date, dayTransactions]) => {
            const summary = dayTransactions.reduce(
              (acc, tx) => {
                if (tx.type === "INCOME") {
                  acc.income += 1;
                } else if (tx.type === "EXPENSE") {
                  acc.expense += 1;
                } else {
                  acc.transfer += 1;
                }
                return acc;
              },
              { income: 0, expense: 0, transfer: 0 }
            );

            return (
              <View key={date} className="mt-6">
                <View className="px-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-gray-700">
                      {date}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {dayTransactions.length}{" "}
                      {dayTransactions.length === 1
                        ? "transaction"
                        : "transactions"}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    {summary.income ? (
                      <View className="px-2 py-1 rounded-full bg-emerald-50">
                        <Text className="text-[11px] font-semibold text-emerald-700">
                          {summary.income} income
                        </Text>
                      </View>
                    ) : null}
                    {summary.expense ? (
                      <View className="px-2 py-1 rounded-full bg-rose-50">
                        <Text className="text-[11px] font-semibold text-rose-600">
                          {summary.expense} expense
                        </Text>
                      </View>
                    ) : null}
                    {summary.transfer ? (
                      <View className="px-2 py-1 rounded-full bg-indigo-50">
                        <Text className="text-[11px] font-semibold text-indigo-600">
                          {summary.transfer} transfer
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {dayTransactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default TransactionsList;
