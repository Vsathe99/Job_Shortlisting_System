/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f4ff',
                    100: '#e0eaff',
                    200: '#c7d7fe',
                    300: '#a5bdfc',
                    400: '#8199f8',
                    500: '#6272f1',
                    600: '#4f57e4',
                    700: '#4145c8',
                    800: '#3639a2',
                    900: '#303481',
                    950: '#1e1f4c',
                },
                dark: {
                    900: '#0d0f1a',
                    800: '#13162a',
                    700: '#1a1e38',
                    600: '#232845',
                    500: '#2e3459',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-gradient': 'linear-gradient(135deg, #1e1f4c 0%, #232845 50%, #0d0f1a 100%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
