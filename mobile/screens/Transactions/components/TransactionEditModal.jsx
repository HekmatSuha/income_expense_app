import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styled } from "../../../packages/nativewind";

const Container = styled(View);
const Card = styled(View);
const Row = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledPressable = styled(Pressable);

const TYPE_OPTIONS = ["INCOME", "EXPENSE", "TRANSFER"];

const TransactionEditModal = ({
  visible,
  transaction,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!transaction) {
      return;
    }
    setType(transaction.type || "EXPENSE");
    setAmount(String(transaction.amount ?? transaction.amountValue ?? ""));
    setCategory(transaction.category || "");
    setPaymentMethod(transaction.paymentMethod || "");
    setPaymentAccount(transaction.paymentAccount || "");
    setNote(transaction.note || "");
    setError("");
  }, [transaction, visible]);

  if (!visible) {
    return null;
  }

  const handleSubmit = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!category.trim()) {
      setError("Please provide a category.");
      return;
    }
    setError("");
    onSubmit?.({
      id: transaction?.id,
      amount: numericAmount,
      type,
      category,
      paymentMethod,
      paymentAccount,
      note,
    });
  };

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <Container className="flex-1 bg-black/50 justify-center items-center px-4">
        <Card className="w-full bg-white rounded-3xl p-5">
          <Row className="flex-row justify-between items-center mb-4">
            <StyledText className="text-lg font-semibold text-gray-900">
              Edit transaction
            </StyledText>
            <StyledTouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
              <MaterialIcons name="close" size={20} color="#111827" />
            </StyledTouchableOpacity>
          </Row>

          <Row className="flex-row gap-2 mb-4">
            {TYPE_OPTIONS.map((option) => {
              const isActive = type === option;
              return (
                <StyledPressable
                  key={option}
                  className={`flex-1 px-3 py-2 rounded-full border ${
                    isActive ? "bg-primary border-primary" : "border-gray-200"
                  }`}
                  onPress={() => setType(option)}
                >
                  <StyledText
                    className={`text-center text-xs font-semibold ${
                      isActive ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {option}
                  </StyledText>
                </StyledPressable>
              );
            })}
          </Row>

          <View className="space-y-3">
            <View>
              <StyledText className="text-xs text-gray-500 mb-1">Amount</StyledText>
              <StyledTextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-base"
                placeholder="0.00"
              />
            </View>
            <View>
              <StyledText className="text-xs text-gray-500 mb-1">Category</StyledText>
              <StyledTextInput
                value={category}
                onChangeText={setCategory}
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-base"
                placeholder="Groceries, Rent, Salary..."
              />
            </View>
            <View>
              <StyledText className="text-xs text-gray-500 mb-1">Payment method</StyledText>
              <StyledTextInput
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-base"
                placeholder="Card, Cash..."
              />
            </View>
            <View>
              <StyledText className="text-xs text-gray-500 mb-1">Payment account</StyledText>
              <StyledTextInput
                value={paymentAccount}
                onChangeText={setPaymentAccount}
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-base"
                placeholder="Main Checking"
              />
            </View>
            <View>
              <StyledText className="text-xs text-gray-500 mb-1">Note</StyledText>
              <StyledTextInput
                value={note}
                onChangeText={setNote}
                className="border border-gray-200 rounded-2xl px-4 py-2.5 text-base"
                placeholder="Optional note"
                multiline
              />
            </View>

            {error ? <StyledText className="text-xs text-red-500">{error}</StyledText> : null}

            <Row className="flex-row justify-end gap-3 pt-2">
              <StyledTouchableOpacity
                onPress={onClose}
                className="px-4 py-3 rounded-2xl border border-gray-200"
              >
                <StyledText className="text-sm font-semibold text-gray-500">Cancel</StyledText>
              </StyledTouchableOpacity>
              <StyledTouchableOpacity
                onPress={handleSubmit}
                className={`px-6 py-3 rounded-2xl bg-primary ${submitting ? "opacity-70" : ""}`}
                disabled={submitting}
              >
                <StyledText className="text-white font-semibold text-sm">
                  {submitting ? "Saving..." : "Save changes"}
                </StyledText>
              </StyledTouchableOpacity>
            </Row>
          </View>
        </Card>
      </Container>
    </Modal>
  );
};

export default TransactionEditModal;
