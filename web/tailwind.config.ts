import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "wos-bg": "#0B101B", // Deepest dark blue
                "wos-surface": "#151E2F", // Slightly lighter for panels
                "ice": {
                    400: "#38BDF8", // Bright Sky Blue
                    500: "#0EA5E9", // Sky Blue
                    600: "#0284C7", // Deep Sky Blue
                },
                "fire": {
                    400: "#FB7185", // Rose
                    500: "#F43F5E", // Rose Red
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "frost-gradient": "linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0) 100%)",
            },
        },
    },
    plugins: [],
};
export default config;
