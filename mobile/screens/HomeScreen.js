import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button } from "react-native";
import api from "../src/api/client";

export default function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);

  const loadData = async () => {
    const res = await api.get("/transactions/");
    setTransactions(res.data);
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadData);
    return unsub;
  }, [navigation]);

  const total = transactions.reduce(
    (acc, t) => (t.type === "INCOME" ? acc + parseFloat(t.amount) : acc - parseFloat(t.amount)),
    0
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, marginBottom: 8 }}>Balance: {total.toFixed(2)}</Text>

      <Button
        title="Add Transaction"
        onPress={() => navigation.navigate("AddTransaction")}
      />

      <FlatList
        style={{ marginTop: 16 }}
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomWidth: 1 }}>
            <Text>
              {item.type}: {item.amount} ({item.category})
            </Text>
            <Text>{new Date(item.date).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}
