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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {groupedTransactions.length === 0 ? (
          <View className="px-4 py-10 items-center">
            <Text className="text-gray-500 text-sm">
              No transactions match your filters.
            </Text>
          </View>
        ) : (
          groupedTransactions.map(([date, dayTransactions]) => (
            <View key={date} className="mt-4">
              <View className="px-4 py-2 bg-gray-200">
                <Text className="text-gray-600 font-semibold">{date}</Text>
              </View>
              {dayTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default TransactionsList;
