import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const { connectTenantMock, getCurrentCustomerIdMock, requestCustomersMock } = vi.hoisted(() => ({
  connectTenantMock: vi.fn<(sessionToken: string) => Promise<{ message: string }>>(),
  requestCustomersMock: vi.fn<(appBridge: AppBridge) => Promise<unknown>>(),
  getCurrentCustomerIdMock: vi.fn<(appBridge: AppBridge) => Promise<string>>(),
}));

vi.mock('@jtl-software/platform-ui-react', () => ({
  Button: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  Input: ({ value }: { value?: string }) => <input readOnly value={value ?? ''} />,
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('./services/setupService', () => ({
  connectTenant: connectTenantMock,
}));

vi.mock('./services/erpService', () => ({
  requestCustomers: requestCustomersMock,
}));

vi.mock('./services/paneService', async () => {
  const actual = await vi.importActual<typeof import('./services/paneService')>('./services/paneService');

  return {
    ...actual,
    getCurrentCustomerId: getCurrentCustomerIdMock,
  };
});

type BridgeMock = {
  appBridge: AppBridge;
  methodCall: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

function createAppBridgeMock(): BridgeMock {
  const methodCall = vi.fn();
  const expose = vi.fn();
  const subscribe = vi.fn(() => vi.fn());

  return {
    appBridge: {
      event: {
        subscribe,
      },
      method: {
        call: methodCall,
        expose,
      },
    } as unknown as AppBridge,
    methodCall,
    subscribe,
  };
}

function renderAtPath(pathname: string, appBridge: AppBridge): void {
  window.history.pushState({}, '', pathname);
  render(<App appBridge={appBridge} />);
}

describe('get app mode rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the fallback for an unknown path', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/unknown', appBridge);

    expect(screen.getByRole('heading', { name: 'Unknown app mode' })).toBeInTheDocument();
  });

  it('renders the setup page and handles a successful setup flow', async () => {
    const user = userEvent.setup();
    const { appBridge, methodCall } = createAppBridgeMock();

    methodCall.mockImplementation((methodName: string) => {
      if (methodName === 'getSessionToken') {
        return Promise.resolve('session-token');
      }

      if (methodName === 'setupCompleted') {
        return Promise.resolve(undefined);
      }

      throw new Error(`Unexpected bridge method: ${methodName}`);
    });
    connectTenantMock.mockResolvedValue({ message: 'Tenant connected successfully.' });

    renderAtPath('/setup', appBridge);

    await user.click(screen.getByRole('button', { name: 'Setup App' }));

    expect(await screen.findByText('Tenant connected successfully.')).toBeInTheDocument();
    expect(methodCall).toHaveBeenCalledWith('setupCompleted');
  });

  it('shows setup errors without hiding them behind console output', async () => {
    const user = userEvent.setup();
    const { appBridge, methodCall } = createAppBridgeMock();

    methodCall.mockResolvedValue('session-token');
    connectTenantMock.mockRejectedValue(new Error('Backend validation failed.'));

    renderAtPath('/setup', appBridge);

    await user.click(screen.getByRole('button', { name: 'Setup App' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend validation failed.');
  });

  it('renders the ERP page and shows the returned backend payload', async () => {
    const user = userEvent.setup();
    const { appBridge } = createAppBridgeMock();

    requestCustomersMock.mockResolvedValue({
      items: [{ id: 'customer-1' }],
    });

    renderAtPath('/erp?view=details', appBridge);

    await user.click(screen.getByRole('button', { name: 'Load customer data' }));

    expect(await screen.findByText(/customer-1/)).toBeInTheDocument();
  });

  it('renders the pane page, reacts to bridge events and loads the current customer on demand', async () => {
    const user = userEvent.setup();
    const { appBridge, subscribe } = createAppBridgeMock();

    getCurrentCustomerIdMock.mockResolvedValue('customer-from-call');

    renderAtPath('/pane', appBridge);

    const subscriptionHandler = subscribe.mock.calls[0]?.[1] as ((value: unknown) => Promise<void>) | undefined;
    expect(subscriptionHandler).toBeDefined();

    await act(async () => {
      await subscriptionHandler?.({ customerId: 'customer-from-event' });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('customer-from-event')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Get Current Customer' }));

    expect(await screen.findByDisplayValue('customer-from-call')).toBeInTheDocument();
  });
});
