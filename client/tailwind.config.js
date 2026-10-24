/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linnk: {
          flame: {
            DEFAULT: '#FE4701',
            50: '#FFF4EE',
            100: '#FFE4D4',
            200: '#FFC5A8',
            300: '#FF9D70',
            400: '#FF6D29',
            500: '#FE4701',
            600: '#E03B00',
            700: '#B82E00',
            800: '#942606',
            900: '#78220A',
            950: '#420E02',
          },
          obsidian: {
            DEFAULT: '#161316',
            950: '#0B090B',
            900: '#161316',
            800: '#211C21',
            700: '#2E272E',
            600: '#3F363F',
          },
          espresso: {
            DEFAULT: '#453027',
            900: '#2A1C16',
            800: '#38261E',
            700: '#453027',
            600: '#5C4034',
            500: '#7A5647',
          },
          stone: {
            DEFAULT: '#EAE6DF',
            50: '#F9F8F6',
            100: '#F3F1EC',
            200: '#EAE6DF',
            300: '#DCD6CC',
            400: '#BABABA',
            500: '#8E8982',
            600: '#68635D',
          },
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'flame-glow': '0 10px 28px -4px rgba(254, 71, 1, 0.38)',
        'flame-sm': '0 4px 14px -2px rgba(254, 71, 1, 0.25)',
        'obsidian': '0 16px 36px -6px rgba(22, 19, 22, 0.24)',
        'arch-card': '0 4px 20px -2px rgba(22, 19, 22, 0.05), 0 1px 3px 0 rgba(22, 19, 22, 0.03)',
      },
      backgroundImage: {
        'arounda-glow': 'radial-gradient(circle at 18% 42%, rgba(255, 109, 41, 0.28) 0%, rgba(69, 48, 39, 0.45) 42%, rgba(22, 19, 22, 0.98) 85%)',
        'arch-grid': 'linear-gradient(to right, rgba(22, 19, 22, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(22, 19, 22, 0.05) 1px, transparent 1px)',
        'arch-grid-dark': 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
