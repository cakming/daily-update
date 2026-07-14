/**
 * Smoke render tests for the presentational skeleton/loader components. These
 * are pure UI with prop-driven counts; rendering each with default and custom
 * props exercises their markup paths.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import {
  PageLoader,
  CardSkeleton,
  TableSkeleton,
  StatsSkeleton,
  ListSkeleton,
  FormSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  ProfileSkeleton,
  NotificationSkeleton,
  EmptyState,
  LoadingOverlay,
  ButtonSpinner,
  InlineLoader,
} from '../../components/LoadingStates';

describe('LoadingStates', () => {
  it('PageLoader shows its message', () => {
    render(<PageLoader message="Fetching data" />);
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });

  it('renders every skeleton without crashing (default + custom counts)', () => {
    const { container } = render(
      <div>
        <CardSkeleton count={2} />
        <TableSkeleton rows={3} columns={2} />
        <StatsSkeleton count={3} />
        <ListSkeleton count={2} />
        <FormSkeleton fields={2} />
        <ChartSkeleton height="200px" />
        <DashboardSkeleton />
        <ProfileSkeleton />
        <NotificationSkeleton count={2} />
        <ButtonSpinner />
        <InlineLoader text="Working" />
      </div>
    );
    expect(container.querySelectorAll('.chakra-skeleton').length).toBeGreaterThan(0);
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('EmptyState shows title, description and an optional action', () => {
    render(
      <EmptyState title="Nothing here" description="Add something" action={<button>Go</button>} />
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('EmptyState renders without an action', () => {
    render(<EmptyState title="Empty" description="No items" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('LoadingOverlay shows its message', () => {
    render(<LoadingOverlay message="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });
});
