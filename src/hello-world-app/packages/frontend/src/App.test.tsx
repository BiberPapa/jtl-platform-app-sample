import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { AppBridgeClient } from './services/appBridgeClient';
import { AppBridgeProvider } from './services/appBridgeContext';

const { connectTenantMock, getCurrentCustomerIdMock, requestCustomersMock } = vi.hoisted(() => ({
  connectTenantMock: vi.fn<(sessionToken: string) => Promise<{ message: string }>>(),
  requestCustomersMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<unknown>>(),
  getCurrentCustomerIdMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<string>>(),
}));

vi.mock('@jtl-software/platform-ui-react', () => ({
  Button: ({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  Input: ({ value }: { value?: string }) => <input readOnly value={value ?? ''} />,
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('swagger-ui-react', () => ({
  default: ({ url }: { url?: string }) => <div>Swagger UI placeholder for {url ?? 'missing-url'}</div>,
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
  methodCall: ReturnType<typeof vi.fn<(methodName: string) => Promise<unknown>>>;
  subscribe: ReturnType<typeof vi.fn>;
};

function createAppBridgeMock(): BridgeMock {
  const methodCall = vi.fn<(methodName: string) => Promise<unknown>>();
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
  render(
    <AppBridgeProvider appBridge={appBridge}>
      <App />
    </AppBridgeProvider>,
  );
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

    expect(screen.getByRole('heading', { name: 'Nutzungsbedingungen bestätigen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeDisabled();

    await user.click(screen.getByLabelText('Ich habe die Nutzungsbedingungen gelesen und stimme ihnen zu.'));
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    await user.click(screen.getByRole('button', { name: 'Verbindung testen' }));

    expect(await screen.findByText('Tenant connected successfully.')).toBeInTheDocument();
    expect(await screen.findByText('Die Einrichtung wurde erfolgreich an den Host übermittelt.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fertig' }));
    expect(screen.getByText('Du kannst dieses Fenster jetzt manuell schließen und zur Host-Anwendung zurückkehren.')).toBeInTheDocument();
    expect(methodCall).toHaveBeenCalledWith('setupCompleted');
  });

  it('shows setup errors without hiding them behind console output', async () => {
    const user = userEvent.setup();
    const { appBridge, methodCall } = createAppBridgeMock();

    methodCall.mockResolvedValue('session-token');
    connectTenantMock.mockRejectedValue(new Error('Backend validation failed.'));

    renderAtPath('/setup', appBridge);

    await user.click(screen.getByLabelText('Ich habe die Nutzungsbedingungen gelesen und stimme ihnen zu.'));
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    await user.click(screen.getByRole('button', { name: 'Verbindung testen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend validation failed.');
    expect(methodCall).not.toHaveBeenCalledWith('setupCompleted');
  });

  it('renders the support page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/support', appBridge);

    expect(screen.getByRole('heading', { name: 'Hilfe und Support' })).toBeInTheDocument();
    expect(screen.getByText(/support-team beispielhaft/i)).toBeInTheDocument();
  });

  it('renders the privacy page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/privacy', appBridge);

    expect(screen.getByRole('heading', { name: 'Datenschutzhinweise' })).toBeInTheDocument();
    expect(screen.getByText(/technische Sitzungsdaten/i)).toBeInTheDocument();
  });

  it('renders the terms-of-use page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/terms-of-use', appBridge);

    expect(screen.getByRole('heading', { name: 'Allgemeine Nutzungsbedingungen' })).toBeInTheDocument();
    expect(screen.getByText(/Test-, Evaluierungs- und Demonstrationszwecke/i)).toBeInTheDocument();
  });

  it('renders the hub page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/hub', appBridge);

    expect(screen.getByRole('heading', { name: 'Cloud App Launcher' })).toBeInTheDocument();
    expect(screen.getByText(/App Launcher entry point/i)).toBeInTheDocument();
  });

  it('renders the ERP home page and shows the returned backend payload', async () => {
    const user = userEvent.setup();
    const { appBridge } = createAppBridgeMock();

    requestCustomersMock.mockResolvedValue({
      items: [{ id: 'customer-1' }],
    });

    renderAtPath('/erp', appBridge);

    await user.click(screen.getByRole('button', { name: 'Load customer data' }));

    expect(await screen.findByText(/customer-1/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ERP view: default' })).toBeInTheDocument();
  });

  it('renders the root ERP menu page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('This dashboard is the main entry point for the ERP area.')).toBeInTheDocument();
  });

  it('renders the swagger ERP menu page from the registry', async () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/erp/menu/Swagger', appBridge);

    expect(await screen.findByRole('heading', { name: 'API Documentation' })).toBeInTheDocument();
    expect(await screen.findByText('Swagger UI placeholder for /erp/openapi.json')).toBeInTheDocument();
  });

  it('renders ERP tabs from the registry', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/erp/tabs/ExampleTab2', appBridge);

    expect(screen.getByRole('heading', { name: 'Customer Notes' })).toBeInTheDocument();
    expect(screen.getByText('This tab shows customer-focused information inside the detail view.')).toBeInTheDocument();
  });

  it('renders an ERP-specific fallback for unknown menu items', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/erp/menu/unknown-menu-item', appBridge);

    expect(screen.getByRole('heading', { name: 'Unknown ERP page' })).toBeInTheDocument();
    expect(screen.getByText('menuItemId: unknown-menu-item')).toBeInTheDocument();
  });

  it('renders an ERP-specific fallback for unknown tabs', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/erp/tabs/unknown-tab', appBridge);

    expect(screen.getByRole('heading', { name: 'Unknown ERP page' })).toBeInTheDocument();
    expect(screen.getByText('tabId: unknown-tab')).toBeInTheDocument();
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
