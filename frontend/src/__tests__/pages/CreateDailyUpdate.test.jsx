/**
 * Behavioral test for the CreateDailyUpdate page.
 *
 * Covers: the page renders, entering raw technical text and clicking
 * "Generate Client-Friendly Update" hits the mocked POST /daily-updates and
 * renders the returned formatted output in the preview card.
 *
 * On mount the page (and its CompanySelector / TagSelector / TeamSelector /
 * template loader children) fire several GET requests that aren't in the base
 * handler set; under onUnhandledRequest:'error' those would fail the test, so
 * we register a catch-all GET handler. The default POST /daily-updates handler
 * (which returns a formattedOutput containing "Completed mock feature") is left
 * intact, so we deliberately do NOT add a POST catch-all that would shadow it.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import CreateDailyUpdate from '../../pages/CreateDailyUpdate';

describe('CreateDailyUpdate page', () => {
  beforeEach(() => {
    // setup.js mocks window.location with an empty href; MSW's XHR interceptor
    // resolves request URLs against it, so give it a valid origin or requests
    // throw "Invalid base URL" before they can be mocked.
    window.location.href = 'http://localhost:3000/';
    // Satisfy on-mount data fetches (templates, companies, tags, teams).
    server.use(
      http.get('*', () =>
        HttpResponse.json({ success: true, data: [], count: 0 })
      )
    );
  });

  it('generates and displays the formatted output from the API', async () => {
    const user = userEvent.setup();
    render(<CreateDailyUpdate />);

    expect(
      screen.getByRole('heading', { name: 'Create Daily Update' })
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Example:/);
    await user.type(textarea, '- Fixed race condition in webhook handler');

    await user.click(
      screen.getByRole('button', { name: 'Generate Client-Friendly Update' })
    );

    // Preview card appears with the mocked formatted output.
    expect(
      await screen.findByRole('heading', { name: 'Formatted Output' })
    ).toBeInTheDocument();
    expect(await screen.findByText(/Completed mock feature/)).toBeInTheDocument();
    // Copy action becomes available once output exists.
    expect(
      screen.getByRole('button', { name: 'Copy to Clipboard' })
    ).toBeInTheDocument();
  });
});
