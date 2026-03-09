/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#2563EB',
                primaryDark: '#1D4ED8',
                secondary: '#F1F5F9',
                accentRed: '#EF4444',
                accentGreen: '#22C55E',
                accentAmber: '#F59E0B',
                surface: '#F8FAFC',
                textPrimary: '#0F172A',
                textSecondary: '#64748B',
                borderGray: '#E2E8F0',
            },
        },
    },
    plugins: [],
};
