// tailwind.config.ts - SIMPLER VERSION
import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "1rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--border))",
                ring: "hsl(var(--primary))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "#3b82f6",      // blue-500
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#8b5cf6",      // purple-500
                    foreground: "#ffffff",
                },
                destructive: {
                    DEFAULT: "#ef4444",      // red-500
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#6b7280",      // gray-500
                    foreground: "#ffffff",
                },
                accent: {
                    DEFAULT: "#0ea5e9",      // sky-500
                    foreground: "#ffffff",
                },
                popover: {
                    DEFAULT: "#ffffff",
                    foreground: "#111827",
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#111827",
                },
            },
            borderRadius: {
                lg: "0.5rem",
                md: "calc(0.5rem - 2px)",
                sm: "calc(0.5rem - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "fade-out": {
                    from: { opacity: "1" },
                    to: { opacity: "0" },
                },
                "slide-in": {
                    from: { transform: "translateY(10px)", opacity: "0" },
                    to: { transform: "translateY(0)", opacity: "1" },
                },
                "slide-out": {
                    from: { transform: "translateY(0)", opacity: "1" },
                    to: { transform: "translateY(10px)", opacity: "0" },
                },
                "pulse": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
                "shimmer": {
                    "100%": {
                        transform: "translateX(100%)",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.3s ease-in-out",
                "fade-out": "fade-out 0.3s ease-in-out",
                "slide-in": "slide-in 0.3s ease-out",
                "slide-out": "slide-out 0.3s ease-out",
                "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "shimmer": "shimmer 2s infinite",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-primary": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                "gradient-success": "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
            },
            boxShadow: {
                "soft": "0 2px 20px -5px rgba(0, 0, 0, 0.1)",
                "medium": "0 4px 30px -10px rgba(0, 0, 0, 0.15)",
                "hard": "0 10px 40px -15px rgba(0, 0, 0, 0.2)",
                "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
            },
        },
    },
    plugins: [],
}
export default config