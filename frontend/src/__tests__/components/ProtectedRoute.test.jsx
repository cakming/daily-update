import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import ProtectedRoute from '../../components/ProtectedRoute';
import * as AuthContext from '../../context/AuthContext';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when auth is loading', () => {
    // Mock useAuth to return loading state
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      token: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show spinner, not content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    // Chakra UI Spinner would be present but harder to test
  });

  it('should redirect to login when not authenticated', () => {
    // Mock useAuth to return not authenticated
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      token: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    // Mock useAuth to return authenticated state
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      token: 'mock-token',
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render multiple children when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      token: 'mock-token',
    });

    render(
      <ProtectedRoute>
        <div>First Child</div>
        <div>Second Child</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });
});
