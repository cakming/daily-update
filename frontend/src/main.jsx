import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react'
import { system } from './theme.js'
import App from './App.jsx'
import { initSentry } from './config/sentry.js'

// Initialize Sentry for error tracking
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <App />
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
)
