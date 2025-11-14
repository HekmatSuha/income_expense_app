const React = require("react");
const { forwardRef } = React;
const { StyleSheet } = require("react-native");

const SPACING_SCALE = {
  "0": 0,
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "12": 48,
  "16": 64
};

const RADIUS_SCALE = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999
};

const FONT_SIZE_SCALE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30
};

const LINE_HEIGHT_SCALE = {
  xs: 16,
  sm: 20,
  base: 22,
  lg: 24,
  xl: 26,
  "2xl": 32,
  "3xl": 36
};

const FONT_WEIGHT_MAP = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700"
};

const COLORS = {
  primary: "#007BFF",
  "background-light": "#F8F9FA",
  "background-dark": "#121212",
  "card-light": "#FFFFFF",
  "card-dark": "#1E1E1E",
  "text-light": "#212529",
  "text-dark": "#EAEAEA",
  "text-secondary-light": "#6C757D",
  "text-secondary-dark": "#A9A9A9",
  income: "#28A745",
  expense: "#DC3545",
  transfer: "#FD7E14",
  transactions: "#17A2B8",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  "gray-100": "#F1F5F9",
  "gray-200": "#E2E8F0",
  "gray-300": "#CBD5F5",
  "gray-400": "#94A3B8",
  "gray-700": "#334155"
};

const FLEX_MAP = {
  flex: 1,
  "flex-1": 1,
  "flex-row": { flexDirection: "row" },
  "flex-col": { flexDirection: "column" },
  "flex-wrap": { flexWrap: "wrap" }
};

const JUSTIFY_MAP = {
  "justify-start": { justifyContent: "flex-start" },
  "justify-center": { justifyContent: "center" },
  "justify-between": { justifyContent: "space-between" },
  "justify-around": { justifyContent: "space-around" },
  "justify-end": { justifyContent: "flex-end" }
};

const ITEMS_MAP = {
  "items-start": { alignItems: "flex-start" },
  "items-center": { alignItems: "center" },
  "items-end": { alignItems: "flex-end" },
  "items-stretch": { alignItems: "stretch" }
};

const TEXT_ALIGN_MAP = {
  "text-left": { textAlign: "left" },
  "text-center": { textAlign: "center" },
  "text-right": { textAlign: "right" }
};

const POSITION_MAP = {
  absolute: { position: "absolute" },
  relative: { position: "relative" }
};

const SELF_MAP = {
  "self-center": { alignSelf: "center" },
  "self-start": { alignSelf: "flex-start" },
  "self-end": { alignSelf: "flex-end" }
};

const POSITION_EDGE_MAP = {
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right"
};

function mergeStyles(classStyle, style) {
  if (!classStyle) {
    return style;
  }
  if (!style) {
    return classStyle;
  }
  if (Array.isArray(style)) {
    return [classStyle, ...style];
  }
  return [classStyle, style];
}

function spacingValue(token) {
  return SPACING_SCALE[token] ?? Number(token);
}

function applySpacing(style, type, token) {
  const value = spacingValue(token);
  if (Number.isNaN(value)) {
    return;
  }
  switch (type) {
    case "p":
      style.padding = value;
      break;
    case "px":
      style.paddingHorizontal = value;
      break;
    case "py":
      style.paddingVertical = value;
      break;
    case "pt":
      style.paddingTop = value;
      break;
    case "pb":
      style.paddingBottom = value;
      break;
    case "pl":
      style.paddingLeft = value;
      break;
    case "pr":
      style.paddingRight = value;
      break;
    case "m":
      style.margin = value;
      break;
    case "mx":
      style.marginHorizontal = value;
      break;
    case "my":
      style.marginVertical = value;
      break;
    case "mt":
      style.marginTop = value;
      break;
    case "mb":
      style.marginBottom = value;
      break;
    case "ml":
      style.marginLeft = value;
      break;
    case "mr":
      style.marginRight = value;
      break;
    case "gap":
      style.gap = value;
      break;
    case "h":
      style.height = value;
      break;
    case "w":
      style.width = value;
      break;
    case "top":
      style.top = value;
      break;
    case "bottom":
      style.bottom = value;
      break;
    case "left":
      style.left = value;
      break;
    case "right":
      style.right = value;
      break;
    default:
      break;
  }
}

function applyRadius(style, token) {
  const value = RADIUS_SCALE[token] ?? RADIUS_SCALE.DEFAULT;
  style.borderRadius = value;
}

function applyFontSize(style, token) {
  const value = FONT_SIZE_SCALE[token];
  if (value) {
    style.fontSize = value;
    style.lineHeight = LINE_HEIGHT_SCALE[token] ?? value * 1.2;
  }
}

function applyFontWeight(style, token) {
  const weight = FONT_WEIGHT_MAP[token];
  if (weight) {
    style.fontWeight = weight;
  }
}

function applyColor(style, token, prop) {
  const color = COLORS[token];
  if (color) {
    style[prop] = color;
  }
}

function parseClassName(className) {
  if (!className) {
    return null;
  }
  const style = {};
  className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      if (token.includes(":")) {
        const [prefix, actual] = token.split(":");
        if (prefix === "dark") {
          // ignore dark: tokens for simplified implementation
          token = actual;
        } else {
          token = actual;
        }
      }

      if (token.startsWith("bg-")) {
        applyColor(style, token.replace("bg-", ""), "backgroundColor");
        return;
      }
      if (token.startsWith("text-")) {
        const value = token.replace("text-", "");
        if (FONT_SIZE_SCALE[value]) {
          applyFontSize(style, value);
        } else {
          applyColor(style, value, "color");
        }
        return;
      }
      if (token.startsWith("border-")) {
        const value = token.replace("border-", "");
        applyColor(style, value, "borderColor");
        return;
      }
      if (token.startsWith("p")) {
        const match = token.match(/^(p|px|py|pt|pb|pl|pr)-(.*)$/);
        if (match) {
          applySpacing(style, match[1], match[2]);
          return;
        }
      }
      if (token.startsWith("m")) {
        const match = token.match(/^(m|mx|my|mt|mb|ml|mr)-(.*)$/);
        if (match) {
          applySpacing(style, match[1], match[2]);
          return;
        }
      }
      if (token.startsWith("w-")) {
        applySpacing(style, "w", token.replace("w-", ""));
        return;
      }
      if (token.startsWith("h-")) {
        applySpacing(style, "h", token.replace("h-", ""));
        return;
      }
      if (token.startsWith("top-")) {
        applySpacing(style, "top", token.replace("top-", ""));
        return;
      }
      if (token.startsWith("bottom-")) {
        applySpacing(style, "bottom", token.replace("bottom-", ""));
        return;
      }
      if (token.startsWith("left-")) {
        applySpacing(style, "left", token.replace("left-", ""));
        return;
      }
      if (token.startsWith("right-")) {
        applySpacing(style, "right", token.replace("right-", ""));
        return;
      }
      if (token.startsWith("rounded")) {
        const parts = token.split("-");
        applyRadius(style, parts[1] || "DEFAULT");
        return;
      }
      if (token.startsWith("opacity-")) {
        const value = Number(token.replace("opacity-", "")) / 100;
        if (!Number.isNaN(value)) {
          style.opacity = value;
        }
        return;
      }
      if (token === "shadow-md") {
        Object.assign(style, {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6
        });
        return;
      }
      if (token === "shadow-lg") {
        Object.assign(style, {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 10
        });
        return;
      }
      if (token === "border") {
        style.borderWidth = 1;
        return;
      }
      if (token === "border-b") {
        style.borderBottomWidth = StyleSheet.hairlineWidth;
        return;
      }
      if (token === "border-t") {
        style.borderTopWidth = StyleSheet.hairlineWidth;
        return;
      }
      if (token === "font-semibold") {
        applyFontWeight(style, "semibold");
        return;
      }
      if (token === "font-bold") {
        applyFontWeight(style, "bold");
        return;
      }
      if (token === "font-medium") {
        applyFontWeight(style, "medium");
        return;
      }
      if (token === "uppercase") {
        style.textTransform = "uppercase";
        return;
      }
      if (token === "tracking-wide") {
        style.letterSpacing = 1;
        return;
      }
      if (token === "leading-tight") {
        style.lineHeight = (style.fontSize || 16) * 1.2;
        return;
      }
      if (token === "flex") {
        style.flex = 1;
        return;
      }
      if (token === "flex-1") {
        style.flex = 1;
        return;
      }
      if (token === "bg-transparent") {
        style.backgroundColor = "transparent";
        return;
      }
      if (token === "text-white") {
        style.color = COLORS.white;
        return;
      }
      if (token === "text-black") {
        style.color = COLORS.black;
        return;
      }
      if (token === "overflow-hidden") {
        style.overflow = "hidden";
        return;
      }
      if (token === "text-uppercase") {
        style.textTransform = "uppercase";
        return;
      }
      if (token === "font-light") {
        style.fontWeight = "300";
        return;
      }
      if (FLEX_MAP[token]) {
        Object.assign(style, FLEX_MAP[token]);
        return;
      }
      if (JUSTIFY_MAP[token]) {
        Object.assign(style, JUSTIFY_MAP[token]);
        return;
      }
      if (ITEMS_MAP[token]) {
        Object.assign(style, ITEMS_MAP[token]);
        return;
      }
      if (TEXT_ALIGN_MAP[token]) {
        Object.assign(style, TEXT_ALIGN_MAP[token]);
        return;
      }
      if (POSITION_MAP[token]) {
        Object.assign(style, POSITION_MAP[token]);
        return;
      }
      if (SELF_MAP[token]) {
        Object.assign(style, SELF_MAP[token]);
        return;
      }
      if (POSITION_EDGE_MAP[token]) {
        // edge positions are handled above via dynamic tokens
        return;
      }
    });

  return Object.keys(style).length ? style : null;
}

function styled(Component) {
  return forwardRef(function StyledComponent({ className, style, ...rest }, ref) {
    const classStyle = parseClassName(className);
    return React.createElement(Component, {
      ref,
      style: mergeStyles(classStyle, style),
      ...rest
    });
  });
}

module.exports = { styled };
