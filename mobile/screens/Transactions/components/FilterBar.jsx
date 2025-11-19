import React, { useMemo, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TouchableOpacity as RNTouchableOpacity,
  TextInput as RNTextInput,
  Modal,
  ScrollView as RNScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { styled } from "../../../packages/nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const TouchableOpacity = styled(RNTouchableOpacity);
const TextInput = styled(RNTextInput);
const ScrollView = styled(RNScrollView);

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
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  const activeBadges = useMemo(() => {
    const badges = [];
    if (filters.type !== "ALL") badges.push("Type");
    if (filters.paymentMethod !== "ALL") badges.push("Payment");
    if (filters.currency !== "ALL") badges.push("Currency");
    if (filters.period !== "ALL") badges.push("Period");
    if (filters.minAmount || filters.maxAmount) badges.push("Amount");
    return badges;
  }, [filters]);

  const activeFiltersCount = activeBadges.length;

  const renderSectionTitle = (title) => (
    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-4">
      {title}
    </Text>
  );

  const renderChip = ({
    label,
    isActive,
    onPress,
    activeClass = "bg-blue-600",
  }) => (
    <TouchableOpacity
      key={label}
      className={`px-4 py-2 rounded-full mr-2 mb-2 ${isActive ? activeClass : "bg-gray-100"
        }`}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-700"
          }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-white border-b border-gray-200 shadow-sm z-10">
      <View className="px-4 py-3 flex-row items-center gap-3">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-3 py-2.5">
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            className="flex-1 px-2 text-sm text-gray-700"
            placeholder="Search transactions..."
            value={filters.query}
            onChangeText={(text) => updateFilter("query", text)}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {filters.query ? (
            <TouchableOpacity onPress={() => updateFilter("query", "")}>
              <Feather name="x-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          className={`flex-row items-center gap-2 px-4 py-2.5 rounded-2xl border ${activeFiltersCount
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 bg-white"
            }`}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Feather
            name="sliders"
            size={18}
            color={activeFiltersCount ? "#2563eb" : "#4b5563"}
          />
          {activeFiltersCount > 0 && (
            <View className="bg-blue-600 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-900">Filters</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4">
              {renderSectionTitle("Time Period")}
              <View className="flex-row flex-wrap">
                {periodFilters.map((filter) =>
                  renderChip({
                    label:
                      filter === "ALL"
                        ? "All time"
                        : filter === "TODAY"
                          ? "Today"
                          : filter === "WEEK"
                            ? "This week"
                            : filter === "MONTH"
                              ? "This month"
                              : "Custom",
                    isActive: filters.period === filter,
                    onPress: () => {
                      updateFilter("period", filter);
                      if (filter === "CUSTOM") {
                        showDatePicker(true);
                      }
                    },
                    activeClass: "bg-indigo-600",
                  })
                )}
              </View>

              {filters.period === "CUSTOM" && (
                <View className="flex-row gap-3 mt-2 mb-2">
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 bg-white rounded-xl px-3 py-3"
                    onPress={() => showDatePicker(true)}
                  >
                    <Text className="text-xs text-gray-500 mb-1">Start date</Text>
                    <Text className="text-sm text-gray-900 font-semibold">
                      {filters.startDate
                        ? filters.startDate.toLocaleDateString()
                        : "-"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 bg-white rounded-xl px-3 py-3"
                    onPress={() => showDatePicker(false)}
                  >
                    <Text className="text-xs text-gray-500 mb-1">End date</Text>
                    <Text className="text-sm text-gray-900 font-semibold">
                      {filters.endDate
                        ? filters.endDate.toLocaleDateString()
                        : "-"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {renderSectionTitle("Transaction Type")}
              <View className="flex-row flex-wrap">
                {typeFilters.map((filter) =>
                  renderChip({
                    label:
                      filter === "ALL"
                        ? "All Types"
                        : filter.charAt(0) + filter.slice(1).toLowerCase(),
                    isActive: filters.type === filter,
                    onPress: () => updateFilter("type", filter),
                    activeClass: "bg-blue-600",
                  })
                )}
              </View>

              {renderSectionTitle("Payment Method")}
              <View className="flex-row flex-wrap">
                {paymentMethodOptions.map((method) =>
                  renderChip({
                    label: method === "ALL" ? "All Methods" : method,
                    isActive: filters.paymentMethod === method,
                    onPress: () => updateFilter("paymentMethod", method),
                    activeClass: "bg-emerald-600",
                  })
                )}
              </View>

              {renderSectionTitle("Currency")}
              <View className="flex-row flex-wrap">
                {currencyOptions.map((currency) =>
                  renderChip({
                    label: currency === "ALL" ? "All Currencies" : currency,
                    isActive: filters.currency === currency,
                    onPress: () => updateFilter("currency", currency),
                    activeClass: "bg-purple-600",
                  })
                )}
              </View>

              {renderSectionTitle("Amount Range")}
              <View className="flex-row gap-3 mb-8">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1 ml-1">Minimum</Text>
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900"
                    keyboardType="numeric"
                    placeholder="0"
                    value={filters.minAmount}
                    onChangeText={(text) =>
                      updateFilter("minAmount", text.replace(/[^0-9.]/g, ""))
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1 ml-1">Maximum</Text>
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900"
                    keyboardType="numeric"
                    placeholder="Any"
                    value={filters.maxAmount}
                    onChangeText={(text) =>
                      updateFilter("maxAmount", text.replace(/[^0-9.]/g, ""))
                    }
                  />
                </View>
              </View>
            </ScrollView>

            <View className="p-4 bg-white border-t border-gray-200 flex-row gap-3 pb-8">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl bg-gray-100 items-center"
                onPress={handleClearFilters}
              >
                <Text className="text-gray-700 font-bold">Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] py-3.5 rounded-xl bg-blue-600 items-center"
                onPress={() => setFilterModalVisible(false)}
              >
                <Text className="text-white font-bold">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default FilterBar;
