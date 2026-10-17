/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        denim: { DEFAULT: "#2F5486", deep: "#14284B", wash: "#DCE7F3", sky: "#B9D0E8" },
        rivet: "#C77B30",
        stitch: "#F2C14E",
        tag: "#C4553B",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "sans-serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
