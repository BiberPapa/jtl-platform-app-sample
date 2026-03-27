/**
 * Example usage of Cloud API hooks
 * This demonstrates how to use the OAuth/AppBridge-powered APIs
 */

import { useTenants, useUserSettings, useCurrentSession, useErpInstanceStatus } from '../hooks/useCloudApi';

export function CloudApiExample() {
  const tenants = useTenants();
  const userSettings = useUserSettings();
  const session = useCurrentSession();
  const erpStatus = useErpInstanceStatus();

  return (
    <div>
      <h2>Cloud API Data</h2>

      {/* Tenants */}
      <section>
        <h3>Tenants</h3>
        {tenants.isLoading && <p>Loading tenants...</p>}
        {tenants.error && <p style={{ color: 'red' }}>Error: {tenants.error.message}</p>}
        {tenants.data && (
          <ul>
            {tenants.data.map(tenant => (
              <li key={tenant.id}>
                {tenant.name} ({tenant.slug})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* User Settings */}
      <section>
        <h3>User Settings</h3>
        {userSettings.isLoading && <p>Loading settings...</p>}
        {userSettings.error && <p style={{ color: 'red' }}>Error: {userSettings.error.message}</p>}
        {userSettings.data && (
          <dl>
            <dt>Theme:</dt>
            <dd>{userSettings.data.theme}</dd>
            <dt>Language:</dt>
            <dd>{userSettings.data.applicationLanguage}</dd>
            <dt>Timezone:</dt>
            <dd>{userSettings.data.userTimezone}</dd>
            <dt>Currency:</dt>
            <dd>{userSettings.data.notationCurrency}</dd>
          </dl>
        )}
      </section>

      {/* Current Session */}
      <section>
        <h3>Session Info</h3>
        {session.isLoading && <p>Loading session...</p>}
        {session.error && <p style={{ color: 'red' }}>Error: {session.error.message}</p>}
        {session.data && (
          <dl>
            <dt>User:</dt>
            <dd>
              {session.data.identity.traits.name.first} {session.data.identity.traits.name.last}
            </dd>
            <dt>Email:</dt>
            <dd>{session.data.identity.traits.email}</dd>
            <dt>Active:</dt>
            <dd>{session.data.active ? 'Yes' : 'No'}</dd>
            <dt>2FA Enabled:</dt>
            <dd>{(session.data.identity.metadata_public['2fa_enforcement'] as Record<string, unknown>)?.['is_2fa_enabled'] ? 'Yes' : 'No'}</dd>
            <dt>Expires at:</dt>
            <dd>{new Date(session.data.expires_at).toLocaleString()}</dd>
          </dl>
        )}
      </section>

      {/* ERP Status */}
      <section>
        <h3>ERP Instance Status</h3>
        {erpStatus.isLoading && <p>Loading ERP status...</p>}
        {erpStatus.error && <p style={{ color: 'red' }}>Error: {erpStatus.error.message}</p>}
        {erpStatus.data && (
          <dl>
            <dt>Instance ID:</dt>
            <dd>{erpStatus.data.instanceId}</dd>
            <dt>Connected:</dt>
            <dd style={{ color: erpStatus.data.metadata.connected ? 'green' : 'red' }}>
              {erpStatus.data.metadata.connected ? 'Connected' : 'Disconnected'}
            </dd>
            <dt>Last Seen:</dt>
            <dd>{new Date(erpStatus.data.metadata.lastSeen).toLocaleString()}</dd>
            <dt>Version:</dt>
            <dd>{erpStatus.data.metadata.lastConnectionVersion}</dd>
          </dl>
        )}
      </section>
    </div>
  );
}
