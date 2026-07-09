/**
 * Render smoke tests for every page.
 *
 * These exist because 16 pages once rendered blank: they used Chakra UI v3
 * dotted syntax (`Card.Root`, `Tabs.Trigger`, `Modal.Root`, ...) on a Chakra v2
 * install, so the components resolved to `undefined` and React threw
 * "Element type is invalid" during render. With no error boundary the whole
 * page went blank and nothing caught it.
 *
 * A page that mounts without throwing and produces non-empty output would have
 * failed loudly on that bug — that's exactly the regression guard we want.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test-utils/mocks/server';
import { render } from '../../test-utils/test-utils';

// Eagerly import each page's default export.
import Login from '../../pages/Login';
import ForgotPassword from '../../pages/ForgotPassword';
import ResetPassword from '../../pages/ResetPassword';
import VerifyEmail from '../../pages/VerifyEmail';
import Dashboard from '../../pages/Dashboard';
import CreateDailyUpdate from '../../pages/CreateDailyUpdate';
import CreateWeeklyUpdate from '../../pages/CreateWeeklyUpdate';
import History from '../../pages/History';
import Companies from '../../pages/Companies';
import Analytics from '../../pages/Analytics';
import Templates from '../../pages/Templates';
import Tags from '../../pages/Tags';
import Search from '../../pages/Search';
import Schedules from '../../pages/Schedules';
import ScheduleHistory from '../../pages/ScheduleHistory';
import Notifications from '../../pages/Notifications';
import NotificationPreferences from '../../pages/NotificationPreferences';
import EmailSettings from '../../pages/EmailSettings';
import Integrations from '../../pages/Integrations';
import Teams from '../../pages/Teams';
import Profile from '../../pages/Profile';
import TwoFactorSetup from '../../pages/TwoFactorSetup';

const PAGES = [
  ['Login', Login],
  ['ForgotPassword', ForgotPassword],
  ['ResetPassword', ResetPassword],
  ['VerifyEmail', VerifyEmail],
  ['Dashboard', Dashboard],
  ['CreateDailyUpdate', CreateDailyUpdate],
  ['CreateWeeklyUpdate', CreateWeeklyUpdate],
  ['History', History],
  ['Companies', Companies],
  ['Analytics', Analytics],
  ['Templates', Templates],
  ['Tags', Tags],
  ['Search', Search],
  ['Schedules', Schedules],
  ['ScheduleHistory', ScheduleHistory],
  ['Notifications', Notifications],
  ['NotificationPreferences', NotificationPreferences],
  ['EmailSettings', EmailSettings],
  ['Integrations', Integrations],
  ['Teams', Teams],
  ['Profile', Profile],
  ['TwoFactorSetup', TwoFactorSetup],
];

describe('page render smoke tests', () => {
  beforeEach(() => {
    // No auth token: pages are rendered directly (not through ProtectedRoute),
    // and the public auth pages (Login, etc.) redirect away when a token is
    // present, so leaving it unset lets every page render its own markup.
    // Generic catch-all so on-mount data fetches don't error out under
    // onUnhandledRequest: 'error'. Content correctness isn't the point here —
    // surviving the initial render is.
    server.use(
      http.get('*', () => HttpResponse.json({ success: true, data: [], count: 0 })),
      http.post('*', () => HttpResponse.json({ success: true, data: {} })),
      http.put('*', () => HttpResponse.json({ success: true, data: {} })),
      http.delete('*', () => HttpResponse.json({ success: true }))
    );
  });

  it.each(PAGES)('renders %s without crashing', (name, Page) => {
    // render() throws if any component in the tree is `undefined` (the exact
    // failure mode of the v3-on-v2 bug), which fails this test.
    const { container } = render(<Page />);
    expect(container.textContent.length).toBeGreaterThan(0);
  });
});
