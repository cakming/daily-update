import { createSystem, defaultConfig } from '@chakra-ui/react';

// Create a custom system with dark mode enabled
export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e6f7f7' },
          100: { value: '#b3e6e6' },
          200: { value: '#80d5d5' },
          300: { value: '#4dc4c4' },
          400: { value: '#1ab3b3' },
          500: { value: '#0d9488' }, // teal.600
          600: { value: '#0b7a70' },
          700: { value: '#096158' },
          800: { value: '#074740' },
          900: { value: '#052e28' },
        },
      },
    },
  },
});
