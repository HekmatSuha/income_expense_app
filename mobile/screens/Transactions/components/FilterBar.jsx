import React from "react";
import {
  ScrollView as RNScrollView,
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  TextInput as RNTextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { styled } from "../../../packages/nativewind";

const ScrollView = styled(RNScrollView);
const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const TextInput = styled(RNTextInput);

const typeFilters = ["ALL", "INCOME", "EXPENSE", "TRANSFER"];
const periodFilters = ["ALL", "TODAY", "WEEK", "MONTH", "CUSTOM"];

const FilterBar = ({
  filters,
  updateFilter,
  paymentMethodOptions,
  currencyOptions,
  handleClearFilters,
  showDatePicker,
}) => {
  return (
    <>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-2">
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 px-2 text-sm text-gray-700"
            placeholder="Search by category, note, account, method..."
            value={filters.query}
            onChangeText={(text) => updateFilter("query", text)}
            placeholderTextColor="#9CA3AF"
          />
          {filters.query ? (
            <TouchableOpacity onPress={() => updateFilter("query", "")}>
              <Feather name="x-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3 px-4 py-3">
            {typeFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                className={`px-4 py-2 rounded-full ${
                  filters.type === filter ? "bg-blue-500" : "bg-gray-200"
                }`}
                onPress={() => updateFilter("type", filter)}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-medium ${
                    filters.type === filter ? "text-white" : "text-gray-700"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3 px-4 py-3">
            {paymentMethodOptions.map((method) => (
              <TouchableOpacity
                key={method}
                className={`px-4 py-2 rounded-full ${
                  filters.paymentMethod === method
                    ? "bg-emerald-500"
                    : "bg-gray-200"
                }`}
                onPress={() => updateFilter("paymentMethod", method)}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-medium ${
                    filters.paymentMethod === method
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {method === "ALL" ? "All Methods" : method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3 px-4 py-3">
            {currencyOptions.map((currency) => (
              <TouchableOpacity
                key={currency}
                className={`px-4 py-2 rounded-full ${
                  filters.currency === currency
                    ? "bg-purple-500"
                    : "bg-gray-200"
                }`}
                onPress={() => updateFilter("currency", currency)}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-sm font-medium ${
                    filters.currency === currency
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {currency === "ALL" ? "All Currencies" : currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Min amount</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              keyboardType="numeric"
              placeholder="0.00"
              value={filters.minAmount}
              onChangeText={(text) =>
                updateFilter("minAmount", text.replace(/[^0-9.]/g, ""))
              }
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Max amount</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              keyboardType="numeric"
              placeholder="0.00"
              value={filters.maxAmount}
              onChangeText={(text) =>
                updateFilter("maxAmount", text.replace(/[^0-9.]/g, ""))
              }
            />
          </View>
        </View>
      </View>

      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3 px-4 py-3">
            {periodFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                className={`px-4 py-2 rounded-full ${
                  filters.period === filter ? "bg-indigo-500" : "bg-gray-200"
                }`}
                activeOpacity={0.8}
                onPress={() => {
                  updateFilter("period", filter);
                  if (filter === "CUSTOM") {
                    showDatePicker(true);
                  }
                }}
              >
                <Text
                  className={`text-sm font-medium ${
                    filters.period === filter ? "text-white" : "text-gray-700"
                  }`}
                >
                  {filter === "ALL"
                    ? "All time"
                    : filter === "TODAY"
                    ? "Today"
                    : filter === "WEEK"
                    ? "This week"
                    : filter === "MONTH"
                    ? "This month"
                    : "Custom"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {filters.period === "CUSTOM" ? (
          <View className="px-4 pb-3">
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 mr-2"
                onPress={() => showDatePicker(true)}
              >
                <Text className="text-xs text-gray-500">Start date</Text>
                <Text className="text-sm text-gray-800">
                  {filters.startDate
                    ? filters.startDate.toLocaleDateString()
                    : "-"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 ml-2"
                onPress={() => showDatePicker(false)}
              >
                <Text className="text-xs text-gray-500">End date</Text>
                <Text className="text-sm text-gray-800">
                  {filters.endDate
                    ? filters.endDate.toLocaleDateString()
                    : "-"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <View className="px-4 pb-3">
          <TouchableOpacity
            className="self-end px-3 py-2 rounded-full bg-gray-200"
            onPress={handleClearFilters}
          >
            <Text className="text-xs font-semibold text-gray-700">
              Clear filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default FilterBar;
