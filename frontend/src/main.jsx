import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from '@chakra-ui/react'
import { defaultSystem } from '@chakra-ui/react'
import App from './App.jsx'
import { initSentry } from './config/sentry.js'

// Initialize Sentry for error tracking
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider value={defaultSystem}>
      <App />
    </Provider>
  </StrictMode>,
)
