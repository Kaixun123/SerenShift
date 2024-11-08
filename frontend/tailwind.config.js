/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    colors: {
      black: "#000",
      white: "#fff",
      blue: {
        primary: "#4339F2",
        secondary: "#0C66E4",
        100: "#F5F8FF",
      },
      gray: {
        primary: "#787486",
        secondary: "#DBDBDB",
      },
      red: {
        primary: "#D13838",
        secondary: "#C53030"
      },
      green: {
        primary: "#3EAC3E"
      },
      yellow: {
        primary: "#D39335"
      },
      light: {
        primary: "#FAFBFC",
        secondary: "#F3F4F6",
      },
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      }
    },
  },
  plugins: [],
};
