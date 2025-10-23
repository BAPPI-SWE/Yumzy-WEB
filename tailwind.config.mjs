/** @type {import('tailwindcss').Config} */
export default {
  content: [
...

    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors from Color.kt
        brandPink: '#DC0C25',        //
        deepPink: '#D50032',         //
        softPink: '#FFEBEE',         //
        darkPink: '#B70314',         //
        lightGray: '#F5F5F5',        //
        gGreen: '#199925',           //
        softC: '#EDEAEA',            //
        cardColor1: '#FDEFEF',       //
        cardColor2: '#EFF5FD',       //
        cardColor3: '#E8F5E9',       //
        cardColor4: '#F3E5F5',       //
      },
      // You might want to extend backgroundImage later if needed
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};