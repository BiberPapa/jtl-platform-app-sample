import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { AppBridgeClient } from './services/appBridgeClient';
import { AppBridgeProvider } from './services/appBridgeContext';

const { connectTenantMock, getCurrentCustomerIdMock, requestErpInfoStatusMock, requestAuthorizationStatusMock, requestPlaygroundRequestMock } =
  vi.hoisted(() => ({
    connectTenantMock: vi.fn<(sessionToken: string) => Promise<{ message: string }>>(),
    requestErpInfoStatusMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<unknown>>(),
    requestAuthorizationStatusMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<unknown>>(),
    requestPlaygroundRequestMock: vi.fn<(appBridgeClient: AppBridgeClient, request: { route: string; method: string }) => Promise<unknown>>(),
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

vi.mock('./services/setupService', () => ({
  connectTenant: connectTenantMock,
}));

vi.mock('./services/erpService', () => ({
  requestErpInfoStatus: requestErpInfoStatusMock,
  requestAuthorizationStatus: requestAuthorizationStatusMock,
  requestPlaygroundRequest: requestPlaygroundRequestMock,
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
    vi.resetAllMocks();
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

  it('renders the ERP root page as the dashboard', () => {
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 12,
      erpTimeMs: 5.222,
      infrastructureTimeMs: 6.778,
      frontendTimeMs: 5.222,
      errorMessage: null,
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'authorized',
      message: null,
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 14,
      route: '/v1/worker',
      method: 'GET',
      body: { items: [] },
    });

    renderAtPath('/erp', appBridge);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders the root ERP menu page', () => {
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 12,
      erpTimeMs: 5.222,
      infrastructureTimeMs: 6.778,
      frontendTimeMs: 5.222,
      errorMessage: null,
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'authorized',
      message: null,
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 14,
      route: '/v1/worker',
      method: 'GET',
      body: { items: [] },
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders ERP dashboard status data and allows reloading', async () => {
    const user = userEvent.setup();
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock
      .mockResolvedValueOnce({
        reachable: true,
        tenantId: 'eazybusiness',
        version: '2.0.0+Sha.e01a5a0',
        totalTimeMs: 12,
        erpTimeMs: 5.222,
        infrastructureTimeMs: 8.75,
        frontendTimeMs: 3.25,
        errorMessage: null,
      })
      .mockResolvedValueOnce({
        reachable: true,
        tenantId: 'eazybusiness',
        version: '2.0.1+Sha.abcdef0',
        totalTimeMs: 134,
        erpTimeMs: 14,
        infrastructureTimeMs: 120,
        frontendTimeMs: 14,
        errorMessage: null,
      });
    requestAuthorizationStatusMock
      .mockResolvedValueOnce({
        state: 'authorized',
        message: null,
      })
      .mockResolvedValueOnce({
        state: 'authorized',
        message: null,
      });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 18,
      route: '/v1/worker',
      method: 'GET',
      body: { items: [] },
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findByText('eazybusiness')).toBeInTheDocument();
    expect(screen.getByText('Reachable')).toBeInTheDocument();
    expect(screen.getByText('Authorized')).toBeInTheDocument();
    expect(screen.getByText('2.0.0+Sha.e01a5a0')).toBeInTheDocument();
    expect(screen.getByText('12 ms')).toBeInTheDocument();
    expect(screen.getByText('8.75 ms')).toBeInTheDocument();
    expect(screen.getByText('3.25 ms')).toBeInTheDocument();
    expect(screen.getByText('5.222 ms')).toBeInTheDocument();
    expect(screen.getAllByText('Good')).toHaveLength(2);
    expect(screen.getByText('Okay')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    expect(await screen.findByText('2.0.1+Sha.abcdef0')).toBeInTheDocument();
    expect(screen.getByText('134 ms')).toBeInTheDocument();
    expect(screen.getAllByText('Warning')).toHaveLength(2);
    expect(requestErpInfoStatusMock).toHaveBeenCalledTimes(2);
    expect(requestAuthorizationStatusMock).toHaveBeenCalledTimes(2);
  });

  it('renders an unavailable ERP dashboard status when no info endpoint succeeds', async () => {
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: false,
      tenantId: null,
      version: null,
      totalTimeMs: 9,
      erpTimeMs: 4.1,
      infrastructureTimeMs: 4.9,
      frontendTimeMs: 4.1,
      errorMessage: 'The /v2/info endpoint could not be loaded.',
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'error',
      message: 'Authorization check could not be completed.',
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: false,
      status: 500,
      responseTimeMs: 21,
      route: '/v1/worker',
      method: 'GET',
      body: { error: 'failed' },
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findByText('No tenant information')).toBeInTheDocument();
    expect(screen.getAllByText('Unavailable')).toHaveLength(2);
    expect(screen.getByText('The /v2/info endpoint could not be loaded.')).toBeInTheDocument();
  });

  it('renders the app as not authorized when the workers check returns an authorization error', async () => {
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 12,
      erpTimeMs: 5.222,
      infrastructureTimeMs: 6.778,
      frontendTimeMs: 5.222,
      errorMessage: null,
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'unauthorized',
      message: 'Authorization error: access to workers is denied.',
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 11,
      route: '/v1/worker',
      method: 'GET',
      body: { items: [] },
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findByText('Not authorized')).toBeInTheDocument();
    expect(screen.getByText('Authorization error: access to workers is denied.')).toBeInTheDocument();
  });

  it('expands the playground and shows a manual request result with response time', async () => {
    const user = userEvent.setup();
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 12,
      erpTimeMs: 5.222,
      infrastructureTimeMs: 6.778,
      frontendTimeMs: 5.222,
      errorMessage: null,
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'authorized',
      message: null,
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 37,
      route: '/v1/worker',
      method: 'DELETE',
      body: { workerId: 'worker-42' },
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    await user.click(screen.getByRole('button', { name: 'Show playground' }));
    expect(screen.getByRole('heading', { name: 'API playground' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Method'), 'DELETE');
    await user.clear(screen.getByLabelText('Route'));
    await user.type(screen.getByLabelText('Route'), '/v1/worker');
    await user.keyboard('{Enter}');

    expect(requestPlaygroundRequestMock).toHaveBeenCalledWith(expect.anything(), { route: '/v1/worker', method: 'DELETE' });
    expect(await screen.findByText('Response time:')).toBeInTheDocument();
    expect(screen.getByText('37 ms')).toBeInTheDocument();
    expect(screen.getByText(/worker-42/)).toBeInTheDocument();
  });

  it('shows empty playground responses explicitly', async () => {
    const user = userEvent.setup();
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 12,
      erpTimeMs: 5.222,
      infrastructureTimeMs: 6.778,
      frontendTimeMs: 5.222,
      errorMessage: null,
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'authorized',
      message: null,
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 204,
      responseTimeMs: 9,
      route: '/workers',
      method: 'GET',
      body: null,
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    await user.click(screen.getByRole('button', { name: 'Show playground' }));
    await user.click(screen.getByRole('button', { name: 'Send request' }));

    expect(await screen.findByText('Empty response body')).toBeInTheDocument();
  });

  it('marks slow ERP and infrastructure timings as problematic', async () => {
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockResolvedValue({
      reachable: true,
      tenantId: 'eazybusiness',
      version: '2.0.0+Sha.e01a5a0',
      totalTimeMs: 400,
      erpTimeMs: 55,
      infrastructureTimeMs: 345,
      frontendTimeMs: 55,
      errorMessage: null,
    });
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'authorized',
      message: null,
    });
    requestPlaygroundRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      responseTimeMs: 11,
      route: '/v1/worker',
      method: 'GET',
      body: { items: [] },
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findAllByText('Problematic')).toHaveLength(2);
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
