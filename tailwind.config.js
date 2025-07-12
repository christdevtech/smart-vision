/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
