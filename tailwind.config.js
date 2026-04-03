/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Goal accent colours
        wellness: "#FBD168",
        muscle: "#4ECDC4",
        weightloss: "#FF6B6B",
        hormonal: "#C084FC",
        // Background
        bg: "#0f0a1e",
        "bg-card": "rgba(255,255,255,0.03)",
        // Phase colours
        menstrual: "#f472b6",
        follicular: "#4ECDC4",
        ovulatory: "#FBD168",
        luteal: "#a78bfa",
      },
    },
  },
  plugins: [],
};
