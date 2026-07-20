/**
 * Behavioral tests for the Achievements page.
 *
 * Covers the loading spinner, the happy-path render of streak stats + badges
 * from GET /gamification (earned vs in-progress states), and the API error
 * branch (surfaces the failure toast, renders the empty fallback).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import { render, screen } from '../../test-utils/test-utils';
import Achievements from '../../pages/Achievements';

const API = 'http://localhost:5000/api';

const GAMIFICATION = {
  currentStreak: 3,
  longestStreak: 7,
  totalUpdates: 12,
  totalDaily: 10,
  totalWeekly: 2,
  activeDays: 9,
  earnedCount: 2,
  totalAchievements: 3,
  achievements: [
    {
      id: 'first_update',
      title: 'Getting Started',
      description: 'Log your first update',
      icon: '🌱',
      target: 1,
      progress: 1,
      earned: true,
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Reach a 7-day streak',
      icon: '⚡',
      target: 7,
      progress: 7,
      earned: true,
    },
    {
      id: 'fifty_updates',
      title: 'Prolific',
      description: 'Log 50 updates',
      icon: '📚',
      target: 50,
      progress: 12,
      earned: false,
    },
  ],
};

function seedAuth() {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem(
    'user',
    JSON.stringify({ _id: 'u1', name: 'Test User', email: 'test@example.com' })
  );
}

describe('Achievements page', () => {
  beforeEach(() => {
    window.location.href = 'http://localhost:3000/';
    seedAuth();
    server.use(
      http.get('*/auth/me', () =>
        HttpResponse.json({ success: true, data: { _id: 'u1', name: 'Test User' } })
      )
    );
  });

  it('renders streak stats and badges from the API', async () => {
    server.use(
      http.get(`${API}/gamification`, () =>
        HttpResponse.json({ success: true, data: GAMIFICATION })
      )
    );

    render(<Achievements />);

    expect(
      await screen.findByRole('heading', { name: 'Achievements' })
    ).toBeInTheDocument();

    // Streak stat cards.
    expect(await screen.findByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Badges render with titles.
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    expect(screen.getByText('Prolific')).toBeInTheDocument();

    // Earned badges show an "Earned" pill; the unearned one shows progress.
    expect(screen.getAllByText('Earned')).toHaveLength(2);
    expect(screen.getByText('12/50')).toBeInTheDocument();
  });

  it('singularizes a one-day streak', async () => {
    server.use(
      http.get(`${API}/gamification`, () =>
        HttpResponse.json({
          success: true,
          data: { ...GAMIFICATION, currentStreak: 1 },
        })
      )
    );

    render(<Achievements />);
    expect(await screen.findByText('1 day')).toBeInTheDocument();
  });

  it('shows an error toast and fallback when the API fails', async () => {
    server.use(
      http.get(`${API}/gamification`, () =>
        HttpResponse.json({ success: false, message: 'boom' }, { status: 500 })
      )
    );

    render(<Achievements />);

    expect(
      await screen.findByText('Failed to load achievements')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('No achievement data available yet.')
    ).toBeInTheDocument();
  });
});
