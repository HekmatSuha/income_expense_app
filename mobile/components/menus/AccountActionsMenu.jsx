import React, { useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const AccountActionsMenu = ({ onEdit, onDelete }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative ml-2">
      <TouchableOpacity
        onPress={() => setVisible((prev) => !prev)}
        className="p-1 rounded-full bg-gray-100 border border-gray-200"
        activeOpacity={0.8}
      >
        <MaterialIcons name="more-vert" size={20} color="#64748B" />
      </TouchableOpacity>
      {visible ? (
        <View className="absolute right-0 top-8 bg-white rounded-2xl border border-gray-100 shadow-xl z-10">
          <TouchableOpacity
            onPress={() => {
              setVisible(false);
              onEdit?.();
            }}
            className="px-4 py-3 flex-row items-center gap-2 border-b border-gray-50"
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={18} color="#0288D1" />
            <Text className="text-sm font-semibold text-primary">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setVisible(false);
              onDelete?.();
            }}
            className="px-4 py-3 flex-row items-center gap-2"
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
            <Text className="text-sm font-semibold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default AccountActionsMenu;
