/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      textShadow: {
        sm: '1px 1px 2px rgba(0, 0, 0, 0.5)',
        DEFAULT: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        lg: '3px 3px 6px rgba(0, 0, 0, 0.5)',
        outline: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
      },
    },
  },
  darkMode: ["class"],
  content: ["src/**/*.{ts,tsx}"],  
  plugins: [
    require("tailwindcss-animate"),
    require('tailwindcss/plugin')(function({ matchUtilities, theme }) {
      matchUtilities(
        { 'text-shadow': (value) => ({ textShadow: value }) },
        { values: theme('textShadow') }
      )
    }),
    require('@tailwindcss/typography')
  ],
}