import React, { useMemo, useState } from "react";
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeBadges = useMemo(() => {
    const badges = [];
    if (filters.type !== "ALL") {
      badges.push({
        key: "type",
        label:
          filters.type === "INCOME"
            ? "Income"
            : filters.type === "EXPENSE"
            ? "Expense"
            : "Transfers",
      });
    }
    if (filters.paymentMethod !== "ALL") {
      badges.push({ key: "paymentMethod", label: filters.paymentMethod });
    }
    if (filters.currency !== "ALL") {
      badges.push({ key: "currency", label: filters.currency });
    }
    if (filters.period !== "ALL") {
      const pretty =
        filters.period === "TODAY"
          ? "Today"
          : filters.period === "WEEK"
          ? "This week"
          : filters.period === "MONTH"
          ? "This month"
          : "Custom range";
      badges.push({ key: "period", label: pretty });
    }
    if (filters.minAmount) {
      badges.push({ key: "minAmount", label: `Min ${filters.minAmount}` });
    }
    if (filters.maxAmount) {
      badges.push({ key: "maxAmount", label: `Max ${filters.maxAmount}` });
    }
    return badges;
  }, [filters]);

  const activeFiltersCount = activeBadges.length;

  const clearSingleFilter = (key) => {
    switch (key) {
      case "type":
        updateFilter("type", "ALL");
        break;
      case "paymentMethod":
        updateFilter("paymentMethod", "ALL");
        break;
      case "currency":
        updateFilter("currency", "ALL");
        break;
      case "period":
        updateFilter("period", "ALL");
        break;
      case "minAmount":
        updateFilter("minAmount", "");
        break;
      case "maxAmount":
        updateFilter("maxAmount", "");
        break;
      default:
        break;
    }
  };

  const handleReset = () => {
    handleClearFilters();
    setShowAdvanced(false);
  };

  const handlePeriodPress = (filter) => {
    updateFilter("period", filter);
    if (filter === "CUSTOM") {
      setShowAdvanced(true);
      showDatePicker(true);
    }
  };

  const renderChip = ({
    label,
    isActive,
    onPress,
    activeClass = "bg-blue-600",
  }) => (
    <TouchableOpacity
      key={label}
      className={`px-4 py-2 rounded-full ${
        isActive ? activeClass : "bg-gray-100"
      }`}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-white border-b border-gray-200 shadow-sm">
      <View className="px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-3 py-2">
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
            className={`flex-row items-center gap-2 px-3 py-2 rounded-2xl border ${
              showAdvanced ? "border-blue-500 bg-blue-50" : "border-gray-200"
            }`}
            onPress={() => setShowAdvanced((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Feather
              name="sliders"
              size={18}
              color={showAdvanced ? "#3b82f6" : "#4b5563"}
            />
            <Text
              className={`text-sm font-semibold ${
                showAdvanced ? "text-blue-600" : "text-gray-700"
              }`}
            >
              Filters
            </Text>
            {activeFiltersCount ? (
              <View className="h-5 w-5 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-xs font-semibold">
                  {activeFiltersCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {activeBadges.length ? (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {activeBadges.map((badge) => (
              <TouchableOpacity
                key={`${badge.key}-${badge.label}`}
                className="px-3 py-1.5 rounded-full bg-gray-100 flex-row items-center gap-1"
                onPress={() => clearSingleFilter(badge.key)}
                activeOpacity={0.8}
              >
                <Text className="text-xs font-semibold text-gray-700">
                  {badge.label}
                </Text>
                <Feather name="x" size={12} color="#4B5563" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full bg-gray-200"
              onPress={handleReset}
            >
              <Text className="text-xs font-semibold text-gray-700">
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View className="border-t border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          <View className="flex-row gap-2">
            {typeFilters.map((filter) =>
              renderChip({
                label:
                  filter === "ALL"
                    ? "All"
                    : filter === "TRANSFER"
                    ? "Transfer"
                    : filter.charAt(0) + filter.slice(1).toLowerCase(),
                isActive: filters.type === filter,
                onPress: () => updateFilter("type", filter),
              })
            )}
          </View>
        </ScrollView>
      </View>

      <View className="border-t border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <View className="flex-row gap-2">
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
                onPress: () => handlePeriodPress(filter),
                activeClass: "bg-indigo-500",
              })
            )}
          </View>
        </ScrollView>
      </View>

      {showAdvanced ? (
        <View className="px-4 pt-4 pb-5 border-t border-gray-100 space-y-5">
          <View>
            <Text className="text-xs uppercase text-gray-400 font-semibold mb-2">
              Payment source
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {paymentMethodOptions.map((method) =>
                renderChip({
                  label: method === "ALL" ? "All methods" : method,
                  isActive: filters.paymentMethod === method,
                  onPress: () => updateFilter("paymentMethod", method),
                  activeClass: "bg-emerald-500",
                })
              )}
            </View>
          </View>

          <View>
            <Text className="text-xs uppercase text-gray-400 font-semibold mb-2">
              Currency
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {currencyOptions.map((currency) =>
                renderChip({
                  label: currency === "ALL" ? "All currencies" : currency,
                  isActive: filters.currency === currency,
                  onPress: () => updateFilter("currency", currency),
                  activeClass: "bg-purple-500",
                })
              )}
            </View>
          </View>

          <View>
            <Text className="text-xs uppercase text-gray-400 font-semibold mb-2">
              Amount range
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextInput
                  className="border border-gray-200 rounded-2xl px-3 py-3 text-sm"
                  keyboardType="numeric"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChangeText={(text) =>
                    updateFilter("minAmount", text.replace(/[^0-9.]/g, ""))
                  }
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className="border border-gray-200 rounded-2xl px-3 py-3 text-sm"
                  keyboardType="numeric"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChangeText={(text) =>
                    updateFilter("maxAmount", text.replace(/[^0-9.]/g, ""))
                  }
                />
              </View>
            </View>
          </View>

          {filters.period === "CUSTOM" ? (
            <View>
              <Text className="text-xs uppercase text-gray-400 font-semibold mb-2">
                Custom range
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 border border-gray-200 rounded-2xl px-3 py-3"
                  onPress={() => showDatePicker(true)}
                >
                  <Text className="text-xs text-gray-500 mb-1">Start date</Text>
                  <Text className="text-sm text-gray-800 font-semibold">
                    {filters.startDate
                      ? filters.startDate.toLocaleDateString()
                      : "-"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 border border-gray-200 rounded-2xl px-3 py-3"
                  onPress={() => showDatePicker(false)}
                >
                  <Text className="text-xs text-gray-500 mb-1">End date</Text>
                  <Text className="text-sm text-gray-800 font-semibold">
                    {filters.endDate
                      ? filters.endDate.toLocaleDateString()
                      : "-"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="px-4 py-2 rounded-full bg-gray-100"
              onPress={handleReset}
            >
              <Text className="text-xs font-semibold text-gray-700">
                Reset filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-full bg-blue-600"
              onPress={() => setShowAdvanced(false)}
            >
              <Text className="text-xs font-semibold text-white">
                Hide panel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default FilterBar;
