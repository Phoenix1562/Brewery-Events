/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'laptop': {'max': '1366px'}, // Targets up to 1366px wide (your 13-inch laptop)
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        surface: {
          950: '#0B0D11',
          900: '#12141A',
          800: '#181B23',
          700: '#1F242E',
          600: '#2A303C',
          500: '#353C4B',
          300: '#4B5262',
          200: '#D8DCE8',
          150: '#E4E7F0',
          100: '#EBEDF5',
          50: '#F5F6FA',
        },
        accent: {
          600: '#52558E',
          500: '#6467A0',
          400: '#7376B2',
          300: '#888BC4',
          200: '#A5A7D6',
          100: '#C8C9E7',
        },
        lagoon: {
          600: '#2F6970',
          500: '#3C8891',
          400: '#4C9FA8',
          300: '#65B7BF',
          200: '#8DD0D6',
          100: '#BAE4E7',
        },
        amber: {
          600: '#B87E36',
          500: '#D49A54',
          400: '#E8B26C',
          300: '#F0C68F',
          200: '#F4D7A5',
          100: '#F9E7C6',
        },
        rosewood: {
          600: '#B05562',
          500: '#D97A8B',
          400: '#E996A5',
          300: '#F0AFBB',
          200: '#F3C5CD',
          100: '#F8DCE1',
        },
      },
    },
  },
  plugins: [],
};
