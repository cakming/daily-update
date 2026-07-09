/**
 * Behavioral tests for the CreateWeeklyUpdate page.
 * Exercises date validation, the generate POST flow (rendering the preview),
 * the save POST flow, and the generate error branch.
 *
 * The date inputs (type="date") have no jsdom-resolvable label, so they are
 * driven with fireEvent.change via a querySelectorAll lookup.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { server } from '../../test-utils/mocks/server';
import { render, screen, fireEvent } from '../../test-utils/test-utils';
import CreateWeeklyUpdate from '../../pages/CreateWeeklyUpdate';

const seedAuth = () => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
};

const setDates = (start, end) => {
  const dateInputs = document.querySelectorAll('input[type="date"]');
  fireEvent.change(dateInputs[0], { target: { value: start } });
  fireEvent.change(dateInputs[1], { target: { value: end } });
};

const generateHandler = () =>
  http.post('*/weekly-updates/generate', () =>
    HttpResponse.json({
      success: true,
      data: {
        formattedOutput: 'MOCK WEEKLY SUMMARY OUTPUT',
        sections: {},
        dailyUpdatesUsed: 3,
      },
    })
  );

describe('CreateWeeklyUpdate page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    seedAuth();
    server.use(
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true })),
      http.get('*/auth/me', () =>
        HttpResponse.json({
          success: true,
          data: { _id: 'u1', name: 'Test User', email: 'test@example.com' },
        })
      )
    );
  });

  it('renders the heading and date range card', () => {
    render(<CreateWeeklyUpdate />);
    expect(
      screen.getByRole('heading', { name: 'Generate Weekly Summary' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Select Date Range' })).toBeInTheDocument();
  });

  it('warns when dates are missing', async () => {
    const user = userEvent.setup();
    render(<CreateWeeklyUpdate />);

    await user.click(
      screen.getByRole('button', { name: 'Generate Weekly Summary' })
    );

    expect(
      await screen.findByText('Please select both dates')
    ).toBeInTheDocument();
  });

  it('generates a weekly summary and renders the preview', async () => {
    const user = userEvent.setup();
    server.use(generateHandler());
    render(<CreateWeeklyUpdate />);

    setDates('2026-07-01', '2026-07-05');

    await user.click(
      screen.getByRole('button', { name: 'Generate Weekly Summary' })
    );

    expect(
      await screen.findByText('MOCK WEEKLY SUMMARY OUTPUT')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Generated from 3 daily updates')
    ).toBeInTheDocument();
  });

  it('saves a generated summary and shows a success toast', async () => {
    const user = userEvent.setup();
    server.use(generateHandler());
    render(<CreateWeeklyUpdate />);

    setDates('2026-07-01', '2026-07-05');
    await user.click(
      screen.getByRole('button', { name: 'Generate Weekly Summary' })
    );
    await screen.findByText('MOCK WEEKLY SUMMARY OUTPUT');

    await user.click(screen.getByRole('button', { name: 'Save to History' }));

    expect(
      await screen.findByText('Weekly update saved!')
    ).toBeInTheDocument();
  });

  it('shows an error toast when generation fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('*/weekly-updates/generate', () =>
        HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 })
      )
    );
    render(<CreateWeeklyUpdate />);

    setDates('2026-07-01', '2026-07-05');
    await user.click(
      screen.getByRole('button', { name: 'Generate Weekly Summary' })
    );

    expect(
      await screen.findByText('Failed to generate update')
    ).toBeInTheDocument();
  });
});
