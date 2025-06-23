import React from 'react';

import { Header } from '@/components/Header';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- Mocks ---

// Mock Authentication Provider Hook
const mockUseAuth = jest.fn();
jest.mock('@/providers/AuthenticationProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next-intl Hooks
const mockT = jest.fn((key) => key.split('.').pop() || key); // Remove unused parameter
const mockUseLocale = jest.fn(() => 'en'); // Default locale
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => mockT),
  useLocale: () => mockUseLocale(),
}));

// Mock Navigation Hooks and Components
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockUseRouter = jest.fn(() => ({ replace: mockReplace, push: mockPush }));
const mockUsePathname = jest.fn(() => '/mock-path');
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
  Link: jest.fn(({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )),
}));

// Mock UI Components
jest.mock('@/components/ui/button', () => ({
  // Mock 'Button' by rendering children or a placeholder button
  Button: jest.fn(({ children, asChild, ...props }) => {
    if (asChild) {
      // If asChild is true, Button is just a wrapper, render children directly
      return <>{children}</>;
    }
    // Otherwise, render a simple button element for testing interactions
    return <button {...props}>{children}</button>;
  }),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: jest.fn(({ children }) => <div>{children}</div>),
  DropdownMenuTrigger: jest.fn(({ children }) => (
    <div data-testid='locale-trigger'>{children}</div>
  )),
  DropdownMenuContent: jest.fn(({ children }) => <div>{children}</div>),
  DropdownMenuItem: jest.fn(({ children, onClick, disabled }) => {
    const locale = typeof children === 'string' ? children.toLowerCase() : 'unknown';
    return (
      <button onClick={onClick} disabled={disabled} data-testid={`locale-menu-item-${locale}`}>
        {children}
      </button>
    );
  }),
}));

// Mock SignOutButton Component
jest.mock('@/components/SignOutButton', () => ({
  SignOutButton: jest.fn(() => <button>MockSignOutButton</button>), // Simple placeholder
}));

// Mock lucide-react Icon
jest.mock('lucide-react', () => ({
  Loader2: jest.fn(() => <span>Loading...</span>), // Simple placeholder
}));

// Mock path functions (return simple strings)
jest.mock('@/paths', () => ({
  homePath: jest.fn(() => '/mock-home'),
  restClientPath: jest.fn(() => '/mock-rest-client'),
  variablesPath: jest.fn(() => '/mock-variables'),
  historyPath: jest.fn(() => '/mock-history'),
  signInPath: jest.fn(() => '/mock-signin'),
  signUpPath: jest.fn(() => '/mock-signup'),
}));

// Mock the routing configuration from src/i18n/routing.ts
jest.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'ru'], // Provide the necessary locales array
    // Add other properties if needed by the component, otherwise keep simple
  },
}));

// Mock routing constant (already imported, just ensure it's available)
// We are using the actual routing object, which is fine as it's static data

// Mock cn utility (optional, usually safe to use the real one)
// jest.mock('@/lib/utils', () => ({
//   cn: (...args) => args.filter(Boolean).join(' '),
// }));

// Helper to render Header with specific auth state
const renderHeader = (authState: { isAuthenticated: boolean; isLoading: boolean }) => {
  mockUseAuth.mockReturnValue(authState);
  return render(<Header />);
};

// --- Tests ---

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Default mock return values
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockUseLocale.mockReturnValue('en');
    mockUseRouter.mockReturnValue({ replace: mockReplace, push: mockPush });
    mockUsePathname.mockReturnValue('/mock-path');
    mockT.mockImplementation((key) => key.split('.').pop() || key); // Remove unused parameter
  });

  it('should render correctly when logged out', () => {
    renderHeader({ isAuthenticated: false, isLoading: false });

    // Check for title
    expect(screen.getByText('title')).toBeInTheDocument();

    // Check for locale button (uses last part of key) - Target the first one (trigger)
    expect(screen.getAllByRole('button', { name: 'en' })[0]).toBeInTheDocument();

    // Check for Sign In / Sign Up buttons
    expect(screen.getByRole('link', { name: 'signIn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'signUp' })).toBeInTheDocument();

    // Check that Sign Out button is NOT present
    expect(screen.queryByText('MockSignOutButton')).not.toBeInTheDocument();

    // Check that main nav links are NOT present
    expect(screen.queryByRole('link', { name: 'home' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'restClient' })).not.toBeInTheDocument();
  });

  it('should render correctly when logged in', () => {
    renderHeader({ isAuthenticated: true, isLoading: false });

    // Check for title
    expect(screen.getByText('title')).toBeInTheDocument();

    // Check for locale button - Target the first one (trigger)
    expect(screen.getAllByRole('button', { name: 'en' })[0]).toBeInTheDocument();

    // Check that Sign In / Sign Up buttons are NOT present
    expect(screen.queryByRole('link', { name: 'signIn' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'signUp' })).not.toBeInTheDocument();

    // Check that Sign Out button IS present (using the mock's content)
    expect(screen.getByText('MockSignOutButton')).toBeInTheDocument();

    // Check that main nav links ARE present
    expect(screen.getByRole('link', { name: 'home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'restClient' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'variables' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'history' })).toBeInTheDocument();
  });

  it('should change locale when a new locale is selected', async () => {
    const user = userEvent.setup();
    mockUseLocale.mockReturnValue('en'); // Start as 'en'
    const { rerender } = renderHeader({ isAuthenticated: false, isLoading: false });

    // Find the trigger using its test ID and click it
    // Note: The button itself is a child of the trigger div now
    const localeTrigger = screen.getByTestId('locale-trigger');
    const localeTriggerButton = localeTrigger.querySelector('button');
    expect(localeTriggerButton).toHaveTextContent('en');
    await user.click(localeTriggerButton!);

    // Find and click the "ru" menu item using its test ID
    const ruOption = await screen.findByTestId('locale-menu-item-ru');
    await user.click(ruOption);

    // Verify the router was called
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/mock-path', { locale: 'ru' });

    // Simulate the locale changing
    mockUseLocale.mockReturnValue('ru');

    // Rerender
    rerender(<Header />);

    // Wait for the trigger button to update its text using its test ID
    // We find the trigger div and check the button inside it
    await waitFor(() => {
      const updatedTrigger = screen.getByTestId('locale-trigger');
      const updatedButton = updatedTrigger.querySelector('button');
      expect(updatedButton).toHaveTextContent('ru');
    });

    // Check that the 'en' menu item still exists
    expect(screen.getByTestId('locale-menu-item-en')).toBeInTheDocument();
  });

  it('should show loading state during auth check', () => {
    renderHeader({ isAuthenticated: false, isLoading: true });

    // Check the trigger button state via test ID
    const localeTrigger = screen.getByTestId('locale-trigger');
    const localeTriggerButton = localeTrigger.querySelector('button');
    expect(localeTriggerButton).toBeDisabled();

    // Sign in/up links might still be visible
    expect(screen.getByRole('link', { name: 'signIn' })).toBeInTheDocument();
  });

  it('should highlight REST Client nav link when on REST client routes', () => {
    // Test for GET method route with locale prefix
    mockUsePathname.mockReturnValue('/en/GET/https%3A%2F%2Fapi.example.com%2Fusers');
    const { unmount: unmount1 } = renderHeader({ isAuthenticated: true, isLoading: false });

    const restClientLink = screen.getByRole('link', { name: 'restClient' });
    expect(restClientLink).toHaveClass('text-foreground');
    unmount1();

    // Test for POST method route with locale prefix
    mockUsePathname.mockReturnValue('/ru/POST/https%3A%2F%2Fapi.example.com%2Fusers');
    const { unmount: unmount2 } = renderHeader({ isAuthenticated: true, isLoading: false });

    const restClientLinkPost = screen.getByRole('link', { name: 'restClient' });
    expect(restClientLinkPost).toHaveClass('text-foreground');
    unmount2();

    // Test for non-REST client route
    mockUsePathname.mockReturnValue('/en/history');
    const { unmount: unmount3 } = renderHeader({ isAuthenticated: true, isLoading: false });

    const restClientLinkHistory = screen.getByRole('link', { name: 'restClient' });
    expect(restClientLinkHistory).toHaveClass('text-foreground/60');
    unmount3();
  });

  // Add more tests as needed, e.g., for scroll behavior if crucial
});
