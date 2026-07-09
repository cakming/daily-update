/**
 * Behavioral test for the ExportButton component.
 *
 * Covers: it renders its trigger button and, when clicked, opens the menu
 * exposing the four export format options. ExportButton performs no on-mount
 * fetch, so no MSW handlers are required.
 */
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../test-utils/test-utils';
import ExportButton from '../../components/ExportButton';

describe('ExportButton', () => {
  it('renders the trigger and opens the export menu', async () => {
    const user = userEvent.setup();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /Export/ });
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(
      await screen.findByRole('menuitem', { name: /Export as CSV/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Export as JSON/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Export as Markdown/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Export as PDF/ })
    ).toBeInTheDocument();
  });
});
