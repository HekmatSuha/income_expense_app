import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { formatCurrencyValue } from "../../../utils/formatters";

export const generateCSV = async (transactions) => {
  const header = "Date,Type,Category,Amount,Currency,Note,Payment Method\n";
  const rows = transactions
    .map((t) => {
      const date = t.timestamp.toISOString().split("T")[0];
      const amount = t.amount;
      const note = (t.note || "").replace(/,/g, " "); // Escape commas
      return `${date},${t.type},${t.category},${amount},${t.currency},${note},${t.paymentMethod}`;
    })
    .join("\n");

  const csvContent = header + rows;
  const filename = FileSystem.documentDirectory + "transactions_report.csv";

  try {
    await FileSystem.writeAsStringAsync(filename, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return filename;
  } catch (error) {
    console.error("Error writing CSV", error);
    return null;
  }
};

export const shareFile = async (filePath) => {
  if (!(await Sharing.isAvailableAsync())) {
    alert("Sharing is not available on this device");
    return;
  }
  await Sharing.shareAsync(filePath);
};
