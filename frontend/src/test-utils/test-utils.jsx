import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import { AuthProvider } from '../context/AuthContext';

// Custom render function that includes all providers
export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    authValue = null,
    ...renderOptions
  } = options;

  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <Provider value={defaultSystem}>
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render };
