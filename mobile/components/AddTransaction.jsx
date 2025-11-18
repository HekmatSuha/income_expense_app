import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Button,
} from "react-native";
import { styled } from "../packages/nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

const AddTransaction = ({ isVisible, onClose, onAddTransaction }) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("EXPENSE");

  const handleAddTransaction = () => {
    onAddTransaction({
      amount: parseFloat(amount),
      category,
      type,
      date: new Date().toISOString(),
    });
    setAmount("");
    setCategory("");
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide">
      <StyledView className="flex-1 justify-center items-center bg-black/50">
        <StyledView className="bg-white rounded-lg p-5 w-5/6">
          <StyledText className="text-lg font-bold mb-4">
            Add Transaction
          </StyledText>
          <StyledTextInput
            placeholder="Amount"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
            value={amount}
            onChangeText={setAmount}
          />
          <StyledTextInput
            placeholder="Category"
            className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
            value={category}
            onChangeText={setCategory}
          />
          <StyledView className="flex-row justify-around mb-4">
            <StyledTouchableOpacity
              className={`px-4 py-2 rounded-full ${
                type === "INCOME" ? "bg-green-500" : "bg-gray-200"
              }`}
              onPress={() => setType("INCOME")}
            >
              <StyledText
                className={`${
                  type === "INCOME" ? "text-white" : "text-gray-700"
                }`}
              >
                Income
              </StyledText>
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              className={`px-4 py-2 rounded-full ${
                type === "EXPENSE" ? "bg-red-500" : "bg-gray-200"
              }`}
              onPress={() => setType("EXPENSE")}
            >
              <StyledText
                className={`${
                  type === "EXPENSE" ? "text-white" : "text-gray-700"
                }`}
              >
                Expense
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
          <Button title="Add" onPress={handleAddTransaction} />
          <Button title="Cancel" onPress={onClose} color="red" />
        </StyledView>
      </StyledView>
    </Modal>
  );
};

export default AddTransaction;
