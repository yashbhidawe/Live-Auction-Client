/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0B12",
        surface: "#151527",
        primary: "#7C5CFF",
        accent: "#22E58B",
        foreground: "#FFFFFF",
        muted: "#A1A1B3",
        danger: "#FF4D4D",
      },
    },
  },
  plugins: [],
};
