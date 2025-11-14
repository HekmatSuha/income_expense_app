import React, { useEffect, useState } from "react";
import { View, TextInput, Button } from "react-native";
import api from "../src/api/client";

export default function AddTransactionScreen({ navigation, route }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(route?.params?.type || "EXPENSE");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (route?.params?.type) {
      setType(route.params.type);
    }
  }, [route?.params?.type]);

  const handleSave = async () => {
    await api.post("/transactions/", {
      amount,
      type,
      category,
      note,
      date: new Date().toISOString(),
    });
    navigation.goBack();
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      {/* You can use Picker from @react-native-picker/picker */}
      {/* or simple buttons for type/category */}
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}
