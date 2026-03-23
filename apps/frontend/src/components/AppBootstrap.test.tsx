import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AppBootstrap from './AppBootstrap';
import type { AppBridgeClient } from '../services/appBridgeClient';

vi.mock('@jtl-software/platform-ui-react', () => ({
  Alert: ({ title, description }: { title?: ReactNode; description?: ReactNode }) => (
    <div role="alert">
      {title}
      {description}
    </div>
  ),
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ThemeProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../App', () => ({
  default: () => <div>App Ready</div>,
}));

vi.mock('../services/appBridgeContext', () => ({
  AppBridgeProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('AppBootstrap', () => {
  it('renders a loading state before the bridge client is ready', () => {
    const unresolvedLoader = vi.fn<() => Promise<AppBridgeClient>>(
      () =>
        new Promise<AppBridgeClient>(() => {
          return undefined;
        }),
    );

    render(<AppBootstrap loadAppBridgeClient={unresolvedLoader} />);

    expect(screen.getByRole('heading', { name: 'Loading app shell' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Initializing app...');
  });

  it('renders the app after loading the bridge client', async () => {
    const loader = vi.fn<() => Promise<AppBridgeClient>>().mockResolvedValue({
      getSessionToken: vi.fn(),
      setupCompleted: vi.fn(),
      getCurrentCustomerId: vi.fn(),
      subscribeToCustomerChanged: vi.fn(),
    });

    render(<AppBootstrap loadAppBridgeClient={loader} />);

    await waitFor(() => {
      expect(screen.getByText('App Ready')).toBeInTheDocument();
    });
  });

  it('renders a safe fallback when bridge bootstrap fails', async () => {
    const loader = vi.fn<() => Promise<AppBridgeClient>>().mockRejectedValue(new Error('Bridge bootstrap failed.'));

    render(<AppBootstrap loadAppBridgeClient={loader} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'App startup failed' })).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('The application could not be initialized.');
    expect(screen.getByRole('alert')).toHaveTextContent('Bridge bootstrap failed.');
  });
});
