import type { AppBridge } from '@jtl-software/cloud-apps-core';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createAppBridgeClient, type AppBridgeClient } from './services/appBridgeClient';
import { AppBridgeProvider } from './services/appBridgeContext';

const {
  connectTenantMock,
  getCurrentCustomerIdMock,
  requestGraphQlOperationMock,
  requestGraphQlSchemaMock,
  requestAppInfoMock,
  requestErpInfoStatusMock,
  requestAuthorizationStatusMock,
  requestPlaygroundRequestMock,
} = vi.hoisted(() => ({
  connectTenantMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<{ message: string }>>(),
  requestGraphQlOperationMock: vi.fn<(appBridgeClient: AppBridgeClient, payload: unknown) => Promise<unknown>>(),
  requestGraphQlSchemaMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<string>>(),
  requestAppInfoMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<unknown>>(),
  requestErpInfoStatusMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<unknown>>(),
  requestAuthorizationStatusMock: vi.fn<(appBridgeClient: AppBridgeClient) => Promise<unknown>>(),
  requestPlaygroundRequestMock: vi.fn<(appBridgeClient: AppBridgeClient, request: { route: string; method: string }) => Promise<unknown>>(),
  getCurrentCustomerIdMock: vi.fn<() => Promise<string>>(),
}));

vi.mock('@jtl-software/platform-ui-react', () => ({
  Alert: ({ title, description, variant }: { title?: ReactNode; description?: ReactNode; variant?: string }) => (
    <div role={variant === 'destructive' ? 'alert' : undefined}>
      {title}
      {description}
    </div>
  ),
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  Button: ({
    label,
    onClick,
    disabled,
    type,
    icon,
    badgeNum,
    'aria-label': ariaLabel,
  }: {
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    icon?: ReactNode;
    badgeNum?: number;
    'aria-label'?: string;
  }) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {icon ? <span>{typeof icon === 'string' ? icon : 'icon'}</span> : null}
      {label}
      {badgeNum != null ? <span>{badgeNum}</span> : null}
    </button>
  ),
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  Checkbox: ({ label, value, onChange }: { label?: ReactNode; value?: boolean; onChange?: (checked: boolean) => void }) => (
    <label>
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={event => {
          onChange?.(event.target.checked);
        }}
      />
      {label}
    </label>
  ),
  Input: ({
    value,
    label,
    onChange,
    ...props
  }: {
    value?: string;
    label?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    'aria-label'?: string;
    placeholder?: string;
  }) => (
    <label>
      {label ?? props['aria-label']}
      <input
        {...props}
        value={value ?? ''}
        onChange={event => {
          onChange?.(event.target.value);
        }}
      />
    </label>
  ),
  Select: ({
    label,
    value,
    onChange,
    options,
  }: {
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    options?: Array<{ value?: string; label?: string }>;
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={event => {
          onChange?.(event.target.value);
        }}
      >
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('./services/setupService', () => ({
  connectTenant: connectTenantMock,
}));

vi.mock('./services/appInfoService', () => ({
  requestAppInfo: requestAppInfoMock,
}));

vi.mock('./services/graphQlSchemaService', () => ({
  requestGraphQlOperation: requestGraphQlOperationMock,
  requestGraphQlSchema: requestGraphQlSchemaMock,
}));

vi.mock('./services/erpService', () => ({
  requestErpInfoStatus: requestErpInfoStatusMock,
  requestAuthorizationStatus: requestAuthorizationStatusMock,
  requestPlaygroundRequest: requestPlaygroundRequestMock,
}));

vi.mock('swagger-ui-react', () => ({
  default: ({ url }: { url: string }) => <div data-testid="swagger-ui">Swagger UI: {url}</div>,
}));

vi.mock('graphiql', () => ({
  GraphiQL: ({ schema }: { schema?: unknown }) => <div data-testid="graphiql">GraphiQL {schema ? 'ready' : 'missing schema'}</div>,
}));

vi.mock('@graphiql/plugin-explorer', () => ({
  explorerPlugin: () => ({ title: 'GraphiQL Explorer', icon: () => null, content: () => null }),
}));

type BridgeMock = {
  appBridge: AppBridge;
  methodCall: ReturnType<typeof vi.fn<(methodName: string) => Promise<unknown>>>;
  subscribe: ReturnType<typeof vi.fn>;
};

function createAppBridgeMock(): BridgeMock {
  const methodCall = vi.fn<(methodName: string) => Promise<unknown>>((methodName: string) => {
    if (methodName === 'getSessionToken') {
      return Promise.resolve(createSessionToken({ tenantId: 'global-tenant-id' }));
    }

    return Promise.resolve(undefined);
  });
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
    <AppBridgeProvider appBridgeClient={createAppBridgeClient(appBridge)}>
      <App />
    </AppBridgeProvider>,
  );
}

describe('get app mode rendering', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requestGraphQlOperationMock.mockResolvedValue({ data: { __typename: 'Query' } });
    requestGraphQlSchemaMock.mockResolvedValue(`
      type Query {
        product(id: ID!): Product
      }

      type Product {
        id: ID!
        name: String!
      }
    `);
  });

  it('renders the fallback for an unknown path', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/unknown', appBridge);

    expect(screen.getByRole('heading', { name: 'Unknown app mode' })).toBeInTheDocument();
  });

  it('renders the developer start page on the root route', () => {
    requestAppInfoMock.mockResolvedValue({
      environment: 'prod',
      nohubTenantId: null,
      isNohubConfigured: false,
      hubUrl: 'https://hub.jtl-cloud.com',
      cloudErpUrl: 'https://erp.jtl-cloud.com',
      apiBaseUrl: 'https://api.jtl-cloud.com',
      authUrl: 'https://auth.jtl-cloud.com/oauth2/token',
    });
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/', appBridge);

    expect(screen.getByRole('heading', { name: 'Developer Start Page' })).toBeInTheDocument();
  });

  it('renders backend app info on the developer start page', async () => {
    requestAppInfoMock.mockResolvedValue({
      environment: 'qa',
      nohubTenantId: 'tenant-1',
      isNohubConfigured: true,
      hubUrl: 'https://hub.qa.jtl-cloud.com',
      cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
      apiBaseUrl: 'https://api.qa.jtl-cloud.com',
      authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
    });
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/', appBridge);

    expect(await screen.findByText('qa')).toBeInTheDocument();
    expect(screen.getByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('Tenant ID: tenant-1')).toBeInTheDocument();
    expect(screen.getByText('https://api.qa.jtl-cloud.com')).toBeInTheDocument();
    expect(screen.getByText('https://auth.qa.jtl-cloud.com/oauth2/token')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'JTL Hub' })).toHaveAttribute('href', 'https://hub.qa.jtl-cloud.com');
    expect(screen.getByRole('link', { name: 'Cloud ERP' })).toHaveAttribute('href', 'https://erp.qa.jtl-cloud.com');
  });

  it('shows a developer app info error when the backend request fails', async () => {
    requestAppInfoMock.mockRejectedValue(new Error('Backend app info failed.'));
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/', appBridge);

    expect(await screen.findByRole('alert')).toHaveTextContent('The backend app info could not be loaded.');
  });

  it('records API errors in the global error history and shows a toast', async () => {
    const user = userEvent.setup();
    requestAppInfoMock.mockRejectedValue(new Error('Backend app info failed.'));
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/', appBridge);

    expect(await screen.findByText('The backend app info could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open error history (1 error)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open error history (1 error)' }));

    expect(screen.getByRole('dialog', { name: 'Error history' })).toBeInTheDocument();
    expect(screen.getByText('Backend app info failed.')).toBeInTheDocument();
    expect(screen.getAllByText(/\/app-info/).length).toBeGreaterThan(0);
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

    expect(screen.getByRole('heading', { name: 'Confirm terms and conditions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await user.click(screen.getByLabelText('I have read and agree to the terms and conditions.'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Test connection' }));

    expect(await screen.findByText('Tenant connected successfully.')).toBeInTheDocument();
    expect(await screen.findByText('Setup was successfully submitted to the host.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('You can now close this window manually and return to the host application.')).toBeInTheDocument();
    expect(methodCall).toHaveBeenCalledWith('setupCompleted');
  });

  it('shows setup errors without hiding them behind console output', async () => {
    const user = userEvent.setup();
    const { appBridge, methodCall } = createAppBridgeMock();

    methodCall.mockResolvedValue('session-token');
    connectTenantMock.mockRejectedValue(new Error('Backend validation failed.'));

    renderAtPath('/setup', appBridge);

    await user.click(screen.getByLabelText('I have read and agree to the terms and conditions.'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Test connection' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected error occurred while testing the connection.');
    expect(methodCall).not.toHaveBeenCalledWith('setupCompleted');
  });

  it('renders the support page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/support', appBridge);

    expect(screen.getByRole('heading', { name: 'Help and support' })).toBeInTheDocument();
    expect(screen.getByText(/support team at support@example.com/i)).toBeInTheDocument();
  });

  it('renders the privacy page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/privacy', appBridge);

    expect(screen.getByRole('heading', { name: 'Privacy notice' })).toBeInTheDocument();
    expect(screen.getByText(/technical session data/i)).toBeInTheDocument();
  });

  it('renders the terms-of-use page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/terms-of-use', appBridge);

    expect(screen.getByRole('heading', { name: 'General terms and conditions' })).toBeInTheDocument();
    expect(screen.getByText(/testing, evaluation, and demonstration purposes/i)).toBeInTheDocument();
  });

  it('renders the hub page', () => {
    const { appBridge } = createAppBridgeMock();

    renderAtPath('/hub', appBridge);

    expect(screen.getByRole('heading', { name: 'Cloud App Launcher' })).toBeInTheDocument();
    expect(screen.getByText(/App Launcher entry point/i)).toBeInTheDocument();
  });

  it('renders the ERP root page as the API dashboard', async () => {
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

    expect(await screen.findByText('Local: eazybusiness')).toBeInTheDocument();
    expect(screen.getByText('Global: global-tenant-id')).toBeInTheDocument();
    expect(screen.getByText('API Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh API dashboard' })).toBeInTheDocument();
  });

  it('renders the root API dashboard menu page', async () => {
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findByText('Local: eazybusiness')).toBeInTheDocument();
    expect(screen.getByText('Global: global-tenant-id')).toBeInTheDocument();
    expect(screen.getByText('API Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh API dashboard' })).toBeInTheDocument();
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findByText('Local: eazybusiness')).toBeInTheDocument();
    expect(screen.getByText('Global: global-tenant-id')).toBeInTheDocument();
    expect(screen.getByText('Reachable')).toBeInTheDocument();
    expect(screen.getByText('Authorized')).toBeInTheDocument();
    expect(screen.getByText('2.0.0+Sha.e01a5a0')).toBeInTheDocument();
    expect(screen.getByText('12 ms')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Timing' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Good')).toHaveLength(3);

    await user.click(screen.getByText('Show timing details'));

    expect(screen.getByText('9 ms')).toBeInTheDocument();
    expect(screen.getByText('3 ms')).toBeInTheDocument();
    expect(screen.getByText('5 ms')).toBeInTheDocument();
    expect(screen.getAllByText('Good')).toHaveLength(3);
    expect(screen.getByText('Okay')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh API dashboard' }));

    expect(await screen.findByText('2.0.1+Sha.abcdef0')).toBeInTheDocument();
    expect(screen.getByText('134 ms')).toBeInTheDocument();
    expect(screen.getAllByText('Warning')).toHaveLength(3);
    expect(requestErpInfoStatusMock).toHaveBeenCalledTimes(2);
    expect(requestAuthorizationStatusMock).toHaveBeenCalledTimes(2);
  });

  it('shows the dashboard load error in the top status area', async () => {
    const { appBridge } = createAppBridgeMock();

    requestErpInfoStatusMock.mockRejectedValue(new Error('Dashboard fetch failed.'));
    requestAuthorizationStatusMock.mockResolvedValue({
      state: 'authorized',
      message: null,
    });

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(screen.getByText('Loading API dashboard status...')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('API dashboard status could not be loaded');
    expect(screen.getByRole('alert')).toHaveTextContent('The API dashboard status could not be loaded.');
    expect(requestErpInfoStatusMock).toHaveBeenCalledTimes(1);
    expect(requestAuthorizationStatusMock).toHaveBeenCalledTimes(1);
  });

  it('renders an unavailable ERP dashboard status when no info endpoint succeeds', async () => {
    const { appBridge, methodCall } = createAppBridgeMock();
    methodCall.mockImplementation((methodName: string) => {
      if (methodName === 'getSessionToken') {
        return Promise.resolve('');
      }

      return Promise.resolve(undefined);
    });

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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findByText('Local: No tenant information')).toBeInTheDocument();
    expect(screen.getByText('Global: No tenant information')).toBeInTheDocument();
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findByText('Not authorized')).toBeInTheDocument();
    expect(screen.getByText('Authorization error: access to workers is denied.')).toBeInTheDocument();
  });

  it('opens the manual API playground popup and shows a request result with response time', async () => {
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(screen.getAllByRole('heading', { name: 'API playground' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'API Playground' }));
    expect(await screen.findByRole('dialog', { name: 'API Playground' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Method'), 'DELETE');
    await user.clear(screen.getByLabelText('Route'));
    await user.type(screen.getByLabelText('Route'), '/v1/worker');
    await user.keyboard('{Enter}');

    expect(requestPlaygroundRequestMock).toHaveBeenCalledWith(expect.anything(), { route: '/v1/worker', method: 'DELETE' });
    expect(await screen.findByText('Response time:')).toBeInTheDocument();
    expect(screen.getByText('37 ms')).toBeInTheDocument();
    expect(screen.getByText(/worker-42/)).toBeInTheDocument();
  });

  it('shows the three API tools buttons in the dashboard status card', async () => {
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findByRole('button', { name: 'REST API Explorer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GraphQL Explorer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'API Playground' })).toBeInTheDocument();
  });

  it('opens the GraphQL explorer from the API tools section', async () => {
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
      method: 'GET',
      body: { workerId: 'worker-42' },
    });

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    await user.click(await screen.findByRole('button', { name: 'GraphQL Explorer' }));

    expect(await screen.findByRole('dialog', { name: 'GraphQL API Explorer' })).toBeInTheDocument();
    expect(await screen.findByTestId('graphiql')).toHaveTextContent('GraphiQL ready');
    expect(requestGraphQlSchemaMock).toHaveBeenCalledWith(expect.anything());
  });

  it('opens the REST explorer from the API tools section', async () => {
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
      method: 'GET',
      body: { workerId: 'worker-42' },
    });

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    await user.click(await screen.findByRole('button', { name: 'REST API Explorer' }));

    expect(await screen.findByRole('dialog', { name: 'REST API Explorer' })).toBeInTheDocument();
    expect(await screen.findByTestId('swagger-ui')).toHaveTextContent('Swagger UI: https://api.example.test/openapi.json');
  });

  it('closes the API explorer modal without leaving the dashboard', async () => {
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
      method: 'GET',
      body: { workerId: 'worker-42' },
    });

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    await user.click(await screen.findByRole('button', { name: 'GraphQL Explorer' }));
    await user.click(screen.getByRole('button', { name: 'Close Explorer' }));

    expect(screen.queryByRole('dialog', { name: 'GraphQL API Explorer' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'API playground' })).toHaveLength(1);
  });

  it('closes the manual playground modal without leaving the dashboard', async () => {
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    await user.click(await screen.findByRole('button', { name: 'API Playground' }));
    await user.click(screen.getByRole('button', { name: 'Close Playground' }));

    expect(screen.queryByRole('dialog', { name: 'API Playground' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'API playground' })).toHaveLength(1);
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    await user.click(screen.getByRole('button', { name: 'API Playground' }));
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

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findAllByText('Problematic')).toHaveLength(3);
  });

  it('shows no global tenant information when the session token is malformed', async () => {
    const { appBridge, methodCall } = createAppBridgeMock();
    methodCall.mockImplementation((methodName: string) => {
      if (methodName === 'getSessionToken') {
        return Promise.resolve('malformed-token');
      }

      return Promise.resolve(undefined);
    });

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
      responseTimeMs: 11,
      route: '/v1/worker',
      method: 'GET',
      body: { items: [] },
    });

    renderAtPath('/erp/menu/ApiDashboard', appBridge);

    expect(await screen.findByText('Local: eazybusiness')).toBeInTheDocument();
    expect(screen.getByText('Global: No tenant information')).toBeInTheDocument();
  });

  it('renders the ERP dashboard menu route with live GraphQL data', async () => {
    const { appBridge } = createAppBridgeMock();

    mockDashboardGraphQlResponses({
      salesOrders: [
        { salesOrderDate: '2026-01-05T08:00:00.000Z', totalGrossAmount: 12000, salesInvoiceStatus: 'COMPLETELY_INVOICED' },
        { salesOrderDate: '2026-02-10T08:00:00.000Z', totalGrossAmount: 18000, salesInvoiceStatus: 'COMPLETELY_INVOICED' },
        { salesOrderDate: '2026-03-11T08:00:00.000Z', totalGrossAmount: 15000, salesInvoiceStatus: 'PARTIALLY_INVOICED' },
        { salesOrderDate: '2026-04-12T08:00:00.000Z', totalGrossAmount: 4000, salesInvoiceStatus: 'NOT_INVOICED' },
        { salesOrderDate: '2026-05-13T08:00:00.000Z', totalGrossAmount: 14000, salesInvoiceStatus: 'COMPLETELY_INVOICED' },
        { salesOrderDate: '2026-06-03T08:00:00.000Z', totalGrossAmount: 22000, salesInvoiceStatus: 'PARTIALLY_INVOICED' },
      ],
      topSellers: [
        { name: 'Premium Laptop XPS-15', stockAvailable: 24, minimumStock: 5, averagePurchasePriceNet: 1000, profit: 220, isTopItem: true },
        { name: 'Wireless Kopfhorer Pro', stockAvailable: 56, minimumStock: 12, averagePurchasePriceNet: 90, profit: 32, isTopItem: true },
        { name: '4K Monitor 32"', stockAvailable: 4, minimumStock: 6, averagePurchasePriceNet: 280, profit: 75, isTopItem: true },
        { name: 'Mechanische Tastatur RGB', stockAvailable: 8, minimumStock: null, averagePurchasePriceNet: 60, profit: 20, isTopItem: true },
        { name: 'Smartphone Galaxy S24', stockAvailable: 24, minimumStock: 8, averagePurchasePriceNet: 650, profit: 140, isTopItem: true },
      ],
      inventoryItems: [
        { name: 'Premium Laptop XPS-15', stockAvailable: 24, minimumStock: 5, averagePurchasePriceNet: 1000, profit: 220, isTopItem: true },
        { name: 'Wireless Kopfhorer Pro', stockAvailable: 56, minimumStock: 12, averagePurchasePriceNet: 90, profit: 32, isTopItem: true },
        { name: '4K Monitor 32"', stockAvailable: 4, minimumStock: 6, averagePurchasePriceNet: 280, profit: 75, isTopItem: true },
        { name: 'Mechanische Tastatur RGB', stockAvailable: 8, minimumStock: null, averagePurchasePriceNet: 60, profit: 20, isTopItem: true },
        { name: 'Smartphone Galaxy S24', stockAvailable: 24, minimumStock: 8, averagePurchasePriceNet: 650, profit: 140, isTopItem: true },
      ],
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Umsatz aktuell')).toBeInTheDocument();
    expect(screen.getByText('Gewinn')).toBeInTheDocument();
    expect(screen.getByText('Offene Auftrage')).toBeInTheDocument();
    expect(screen.getByText('Lagerwert Gesamt')).toBeInTheDocument();
    expect(screen.getByText('Umsatzentwicklung')).toBeInTheDocument();
    expect(screen.getByText('Bestand an Top-Sellern')).toBeInTheDocument();
    expect(screen.getAllByText('Vorubergehend deaktiviert').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Keine GraphQL-Abfrage aktiv').length).toBeGreaterThan(0);
  });

  it('shows a loading state while the ERP dashboard queries are in flight', () => {
    const { appBridge } = createAppBridgeMock();

    requestGraphQlOperationMock.mockImplementation(() => new Promise(() => undefined));

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(screen.getByText('Lade Dashboard-Daten...')).toBeInTheDocument();
  });

  it('shows a dashboard error when the GraphQL request fails', async () => {
    const { appBridge } = createAppBridgeMock();

    requestGraphQlOperationMock.mockRejectedValue(new Error('Dashboard GraphQL failed.'));

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findByRole('alert')).toHaveTextContent('Die Dashboard-Daten konnten nicht geladen werden.');
  });

  it('shows an empty state when the ERP dashboard receives no records', async () => {
    const { appBridge } = createAppBridgeMock();

    mockDashboardGraphQlResponses({
      salesOrders: [],
      topSellers: [],
      inventoryItems: [],
    });

    renderAtPath('/erp/menu/Dashboard', appBridge);

    expect(await screen.findByText(/Keine ERP-Daten verfugbar/i)).toBeInTheDocument();
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
    const { appBridge, methodCall, subscribe } = createAppBridgeMock();

    getCurrentCustomerIdMock.mockResolvedValue('customer-from-call');
    methodCall.mockImplementation((methodName: string) => {
      if (methodName === 'getCurrentCustomerId') {
        return getCurrentCustomerIdMock();
      }

      throw new Error(`Unexpected bridge method: ${methodName}`);
    });

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

  it('reports pane bridge failures through the shared app error flow', async () => {
    const user = userEvent.setup();
    const { appBridge, methodCall } = createAppBridgeMock();

    methodCall.mockImplementation((methodName: string) => {
      if (methodName === 'getCurrentCustomerId') {
        return Promise.reject(new Error('Bridge customer lookup failed.'));
      }

      throw new Error(`Unexpected bridge method: ${methodName}`);
    });

    renderAtPath('/pane', appBridge);

    await user.click(screen.getByRole('button', { name: 'Get Current Customer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The current customer could not be loaded.');
    expect(screen.getByRole('button', { name: 'Open error history (1 error)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open error history (1 error)' }));

    expect(screen.getByRole('dialog', { name: 'Error history' })).toBeInTheDocument();
    expect(screen.getByText('Bridge customer lookup failed.')).toBeInTheDocument();
  });
});

function createSessionToken(payload: Record<string, unknown>): string {
  const encodedHeader = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));

  return `${encodedHeader}.${encodedPayload}.signature`;
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function mockDashboardGraphQlResponses(input: {
  salesOrders: Array<{ salesOrderDate: string; totalGrossAmount: number; salesInvoiceStatus: string }>;
  topSellers: Array<{
    name: string;
    stockAvailable: number;
    minimumStock: number | null;
    averagePurchasePriceNet: number;
    profit: number;
    isTopItem: boolean;
  }>;
  inventoryItems: Array<{
    name: string;
    stockAvailable: number;
    minimumStock: number | null;
    averagePurchasePriceNet: number;
    profit: number;
    isTopItem: boolean;
  }>;
}): void {
  requestGraphQlOperationMock.mockImplementation((_appBridgeClient: AppBridgeClient, payload: unknown) => {
    const query = getGraphQlQuery(payload);

    if (query.includes('DashboardSalesOrders')) {
      return Promise.resolve({
        data: {
          salesOrders: {
            nodes: input.salesOrders,
          },
        },
      });
    }

    if (query.includes('DashboardTopSellers')) {
      return Promise.resolve({
        data: {
          items: {
            nodes: input.topSellers,
          },
        },
      });
    }

    if (query.includes('DashboardInventory')) {
      return Promise.resolve({
        data: {
          items: {
            nodes: input.inventoryItems,
          },
        },
      });
    }

    return Promise.resolve({ data: { __typename: 'Query' } });
  });
}

function getGraphQlQuery(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return typeof (payload as { query?: unknown }).query === 'string' ? (payload as { query: string }).query : '';
}
