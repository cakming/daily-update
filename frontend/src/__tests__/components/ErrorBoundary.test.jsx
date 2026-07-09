/**
 * Tests for the app-wide ErrorBoundary.
 *
 * A child that throws during render should be caught and replaced by the
 * fallback UI ("Something went wrong" + recovery buttons) instead of crashing
 * the whole tree. When the child renders fine, the boundary is transparent.
 *
 * React logs the caught error to console.error; we silence that expected noise
 * for the duration of the throwing test so the output stays readable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import ErrorBoundary from '../../components/ErrorBoundary';

const Boom = () => {
  throw new Error('Kaboom failure');
};

describe('ErrorBoundary', () => {
  let errorSpy;

  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>Happy child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Happy child')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows the fallback UI and recovery buttons when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    // The caught error message is surfaced to the user.
    expect(screen.getByText('Kaboom failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to Dashboard' })
    ).toBeInTheDocument();
  });
});
