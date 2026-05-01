import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { AuthModal } from './AuthModal';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedLogin    = authService.login as unknown as ReturnType<typeof vi.fn>;
const mockedRegister = authService.register as unknown as ReturnType<typeof vi.fn>;

async function waitForSignIn() {
  await screen.findByRole('dialog');
  await screen.findByPlaceholderText('Enter your password');
}
async function waitForSignUp() {
  await screen.findByRole('dialog');
  await screen.findByPlaceholderText('Your name');
}

function openSignIn() { useUIStore.getState().openModal('auth-signin'); }
function openSignUp() { useUIStore.getState().openModal('auth-signup'); }

beforeEach(() => {
  useUIStore.setState({ activeModal: null, toasts: [] });
  useAuthStore.getState().clearAuth();
  mockedLogin.mockReset();
  mockedRegister.mockReset();
  document.body.style.overflow = '';
});

describe('AuthModal — visibility', () => {
  it('does not render when no modal is active', () => {
    renderWithProviders(<AuthModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when openModal("auth-signin") is called', async () => {
    renderWithProviders(<AuthModal />);
    openSignIn();
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('renders when openModal("auth-signup") is called', async () => {
    renderWithProviders(<AuthModal />);
    openSignUp();
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('shows the Welcome heading when opened with auth-signin', async () => {
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('shows the Begin heading when opened with auth-signup', async () => {
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    expect(screen.getByText('Begin')).toBeInTheDocument();
  });
});

describe('AuthModal — close behaviour', () => {
  it('closes when the X button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when ESC is pressed', async () => {
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('locks body scroll while open', async () => {
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll on close', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
  });
});

describe('AuthModal — tab switching', () => {
  it('switches from Sign in to Create account when tab clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByText('Begin')).toBeInTheDocument());
  });

  it('switches back to Sign in via the bottom switch link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.click(screen.getByText('Sign in instead'));
    await waitFor(() => expect(screen.getByText('Welcome')).toBeInTheDocument());
  });
});

describe('AuthModal — Sign In form validation', () => {
  it('rejects an empty email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    expect(await screen.findByText(/Enter a valid email/)).toBeInTheDocument();
  });

  it('does NOT call authService.login when email is invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'notanemail');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pwd');
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    // Give react-hook-form a tick to validate
    await new Promise((r) => setTimeout(r, 200));
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it('rejects an empty password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    expect(await screen.findByText(/Password is required/)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    const pwd = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
    expect(pwd.type).toBe('password');
    const toggle = pwd.parentElement!.querySelector('button')!;
    await user.click(toggle);
    expect(pwd.type).toBe('text');
    await user.click(toggle);
    expect(pwd.type).toBe('password');
  });
});

describe('AuthModal — Sign In submission', () => {
  it('calls authService.login with email + password', async () => {
    mockedLogin.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', displayName: 'Riya' } },
      error: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123' });
    });
  });

  it('sets user in authStore on success', async () => {
    mockedLogin.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', displayName: 'Riya' } },
      error: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
  });

  it('closes the modal on successful sign in', async () => {
    mockedLogin.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', displayName: 'Riya' } },
      error: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    await waitFor(() => expect(useUIStore.getState().activeModal).toBeNull());
  });

  it('keeps the modal open + user logged out on credential failure', async () => {
    mockedLogin.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /Sign in to your account/ }));
    await waitFor(() => expect(mockedLogin).toHaveBeenCalled());
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useUIStore.getState().activeModal).toBe('auth-signin');
  });
});

describe('AuthModal — Sign Up form validation', () => {
  it('rejects a short name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'A');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it('rejects a password without uppercase', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'Riya Sharma');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'lowercase1!');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    expect(await screen.findByText(/uppercase letter/i)).toBeInTheDocument();
  });

  it('rejects a password without number', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'Riya Sharma');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'NoNumber!');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    expect(await screen.findByText(/Add a number/i)).toBeInTheDocument();
  });

  it('rejects a password without special character', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'Riya Sharma');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'NoSpecial1');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    expect(await screen.findByText(/special character/i)).toBeInTheDocument();
  });

  it('rejects a password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'Riya Sharma');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'A1!a');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    expect(await screen.findByText(/Min 8 characters/i)).toBeInTheDocument();
  });
});

describe('AuthModal — Sign Up submission', () => {
  it('calls authService.register with name, email, password', async () => {
    mockedRegister.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', displayName: 'Riya Sharma' } },
      error: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'Riya Sharma');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'riya@example.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        displayName: 'Riya Sharma',
        email: 'riya@example.com',
        password: 'Secret123!',
      });
    });
  });

  it('logs the user in + closes modal on successful sign up', async () => {
    mockedRegister.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com', displayName: 'Riya Sharma' } },
      error: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    await user.type(screen.getByPlaceholderText('Your name'), 'Riya Sharma');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'riya@example.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: /Create my free account/ }));
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });
});

describe('AuthModal — re-open regression', () => {
  it('can be opened, closed, and re-opened multiple times', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);

    // First open + close
    openSignIn();
    await waitForSignIn();
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(useUIStore.getState().activeModal).toBeNull());

    // Second open + close (this is the bug scenario)
    openSignIn();
    await waitForSignIn();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(useUIStore.getState().activeModal).toBeNull());

    // Third open should still work
    openSignIn();
    await waitForSignIn();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('can switch between signin and signup modals back-to-back', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);

    openSignIn();
    await waitForSignIn();
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(useUIStore.getState().activeModal).toBeNull());

    openSignUp();
    await waitForSignUp();
    expect(screen.getByText('Begin')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(useUIStore.getState().activeModal).toBeNull());

    openSignIn();
    await waitForSignIn();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });

  it('body scroll is restored fully (overflow becomes empty string) on close', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });
});

describe('AuthModal — Continue with Google CTA', () => {
  it('renders the Google button on Sign In view', async () => {
    renderWithProviders(<AuthModal />);
    openSignIn();
    await waitForSignIn();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('does NOT render the Google button on Sign Up view', async () => {
    renderWithProviders(<AuthModal />);
    openSignUp();
    await waitForSignUp();
    // After AnimatePresence finishes, Google button should be gone
    await waitFor(() => {
      expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
