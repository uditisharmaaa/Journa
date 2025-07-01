/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFD60A',        // Bold Yellow
        background: '#FFFFFF',     // White
        textMain: '#1C1C1E',       // Almost Black
        textSecondary: '#666666',  // Mid Gray
        error: '#FF4D4F',          // Error Red
        success: '#8BC34A',        // Optional Success Green
      },
    },
  },
  plugins: [],
}
