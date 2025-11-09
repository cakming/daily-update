import { extendTheme } from '@chakra-ui/react';

// Custom theme with brand colors
export const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f7f7',
      100: '#b3e6e6',
      200: '#80d5d5',
      300: '#4dc4c4',
      400: '#1ab3b3',
      500: '#0d9488', // teal.600
      600: '#0b7a70',
      700: '#096158',
      800: '#074740',
      900: '#052e28',
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
