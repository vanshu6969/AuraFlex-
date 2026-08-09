/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f12',
        surface: '#18181f',
        'surface-hover': '#24242f',
        primary: {
          DEFAULT: '#e50914',
          glow: 'rgba(229, 9, 20, 0.4)',
        },
        violet: {
          accent: '#8b5cf6',
          glow: 'rgba(139, 92, 246, 0.4)',
        },
      },
      boxShadow: {
        'glow-crimson': '0 0 25px rgba(229, 9, 20, 0.5)',
        'glow-violet': '0 0 25px rgba(139, 92, 246, 0.5)',
      },
    },
  },
  plugins: [],
};
