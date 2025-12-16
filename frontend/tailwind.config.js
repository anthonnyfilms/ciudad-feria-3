/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Unbounded', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: '#FACC15',
        'primary-foreground': '#020617',
        secondary: '#3B82F6',
        'secondary-foreground': '#FFFFFF',
        accent: '#EF4444',
        'accent-foreground': '#FFFFFF',
        background: '#020617',
        foreground: '#F8FAFC',
        card: '#0F172A',
        'card-foreground': '#F8FAFC',
        border: '#1E293B',
        input: '#1E293B',
        ring: '#FACC15',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}