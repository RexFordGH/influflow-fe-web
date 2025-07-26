import { heroui } from '@heroui/react';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './stories/**/*.{js,ts,jsx,tsx,mdx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/react/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        danger: '#D75454',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        inter: ['var(--font-inter)'],
      },
    },
  },
  plugins: [heroui()],
};

export default config;
