export const DEFAULT_CURRENCY = "USD";

export const toDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

export const formatCurrencyValue = (value, currency = DEFAULT_CURRENCY) => {
  const numeric = Number(value) || 0;
  const formatted = Math.abs(numeric).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = numeric < 0 ? "-" : "";
  return `${prefix}${currency.toUpperCase()} ${formatted}`;
};

export const formatDateParts = (value) => {
  const date = toDate(value);
  if (!date) {
    return { dateLabel: "-", timeLabel: "" };
  }
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { dateLabel, timeLabel };
};
