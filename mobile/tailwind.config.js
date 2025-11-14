/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.jsx", "./screens/**/*.{jsx,js}"],
  theme: {
    extend: {
      colors: {
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
        transactions: "#17A2B8"
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
};
