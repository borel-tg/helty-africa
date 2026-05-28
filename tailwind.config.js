/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2E7D64",
          50: "#E8F5F1",
          100: "#C5E5DC",
          200: "#9DD1C2",
          300: "#74BCA8",
          400: "#4FAD92",
          500: "#2E7D64",
          600: "#266B55",
          700: "#1D5342",
          800: "#143B30",
          900: "#0C231D",
        },
        secondary: {
          DEFAULT: "#E67E22",
          50: "#FDF3E7",
          100: "#FAE0BF",
          200: "#F6CC94",
          300: "#F2B768",
          400: "#EEA241",
          500: "#E67E22",
          600: "#C96A19",
          700: "#9D5214",
          800: "#713B0E",
          900: "#452309",
        },
        background: "#FFF9F0",
        surface: "#FFFFFF",
        "text-primary": "#1A1A1A",
        "text-secondary": "#666666",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "10px",
        input: "10px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.05)",
        modal: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
