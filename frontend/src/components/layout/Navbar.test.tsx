import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useUIStore.setState({ activeModal: null, isNavDrawerOpen: false });
});

describe('Navbar — unauthenticated', () => {
  it('renders the brand logo', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getAllByText('Travel').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sarthi/i).length).toBeGreaterThan(0);
  });

  it('shows desktop nav links: Plan Trip, Discover, Deals', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getAllByText(/Plan Trip/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Discover/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Deals/i).length).toBeGreaterThan(0);
  });

  it('shows Sign In and Get Started buttons when logged out', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Get Started').length).toBeGreaterThan(0);
  });

  it('clicking Sign In opens the auth-signin modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    const btn = screen.getAllByText('Sign In')[0]!;
    await user.click(btn);
    expect(useUIStore.getState().activeModal).toBe('auth-signin');
  });

  it('clicking Get Started opens the auth-signup modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    const btn = screen.getAllByText('Get Started')[0]!;
    await user.click(btn);
    expect(useUIStore.getState().activeModal).toBe('auth-signup');
  });
});

describe('Navbar — authenticated', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1', email: 'a@b.com', displayName: 'Riya Sharma',
        avatarUrl: null, preferredCurrency: 'INR', preferredLanguage: 'en',
      } as never,
      isAuthenticated: true,
    });
  });

  it('hides Sign In / Get Started when logged in', () => {
    renderWithProviders(<Navbar />);
    expect(screen.queryAllByText('Get Started')).toHaveLength(0);
  });

  it('shows the first name in the profile pill', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('Riya')).toBeInTheDocument();
  });

  it('opens the profile dropdown when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    await user.click(screen.getByText('Riya'));
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('My Trips')).toBeInTheDocument();
    expect(screen.getByText('Fare Alerts')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('profile dropdown displays the user email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Navbar />);
    await user.click(screen.getByText('Riya'));
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });
});
