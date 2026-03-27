# OAuth / AppBridge Cloud API Integration

Diese Module ermöglichen den Zugriff auf JTL Cloud Platform APIs über OAuth-Bearer-Token-Authentifizierung, wobei das Session Token aus der AppBridge genutzt wird.

## Übersicht

Vier externe APIs werden unterstützt:

| API                                               | Zweck                              | Service                  |
| ------------------------------------------------- | ---------------------------------- | ------------------------ |
| `https://api.jtl-cloud.com/account/tenants`       | Liste der Mandanten des Benutzers  | `tenantsService.ts`      |
| `https://api.jtl-cloud.com/account/user-settings` | Benutzereinstellungen              | `userSettingsService.ts` |
| `https://api.jtl-cloud.com/erp/instance/status`   | ERP-Instanzstatus                  | `erpStatusService.ts`    |
| `https://auth.jtl-cloud.com/sessions/whoami`      | Session- und Benutzerinformationen | `sessionService.ts`      |

## Architektur

```
┌─────────────────────────────────────────────┐
│  React Components (CloudApiExample.tsx)     │
└────────────┬────────────────────────────────┘
             │
┌─────────────▼────────────────────────────────┐
│  React Hooks (useCloudApi.ts)               │
│  - useTenants()                             │
│  - useUserSettings()                        │
│  - useCurrentSession()                      │
│  - useErpInstanceStatus()                   │
└────────────┬────────────────────────────────┘
             │
┌─────────────▼────────────────────────────────┐
│  Services                                    │
│  - tenantsService.ts                        │
│  - userSettingsService.ts                   │
│  - sessionService.ts                        │
│  - erpStatusService.ts                      │
└────────────┬────────────────────────────────┘
             │
┌─────────────▼────────────────────────────────┐
│  cloudApiClient.ts                          │
│  - requestCloudApi<T>()                     │
│  - Bearer Token Authentifizierung           │
└────────────┬────────────────────────────────┘
             │
┌─────────────▼────────────────────────────────┐
│  appBridgeClient.ts                         │
│  - getSessionToken()                        │
└─────────────────────────────────────────────┘
```

## Verwendung

### Mit React Hooks (empfohlen)

```tsx
import { useTenants, useCurrentUser } from './hooks/useCloudApi';

function MyComponent() {
  const { data: tenants, isLoading, error } = useTenants();
  const { data: user } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Hello {user?.traits.name.first}</h1>
      <ul>
        {tenants?.map(tenant => (
          <li key={tenant.id}>{tenant.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Direkt mit Services

```tsx
import { fetchTenants } from './services/tenantsService';
import { fetchUserSettings } from './services/userSettingsService';
import { useContext } from 'react';
import { AppBridgeContext } from './services/appBridgeContext';

async function loadData() {
  const appBridgeClient = useContext(AppBridgeContext);

  const tenants = await fetchTenants(appBridgeClient);
  const settings = await fetchUserSettings(appBridgeClient);

  console.log(tenants, settings);
}
```

## API-Dokumentation

### Tenants

```tsx
// Alle Mandanten des Benutzers abrufen
const tenants = await fetchTenants(appBridgeClient);

// Einen spezifischen Mandanten abrufen
const tenant = await fetchTenant(tenantId, appBridgeClient);

// Den Standard-Mandanten abrufen
const defaultTenant = await fetchDefaultTenant(appBridgeClient);
```

**Typ: `Tenant`**

```typescript
{
  id: string;
  name: string;
  slug: string;
  kid: string;
  ownerId: string;
  defaultUISetting: {
    contentLanguage: string;
  }
  createdAt: string;
  updatedAt: string;
}
```

### User Settings

```tsx
// Benutzereinstellungen abrufen
const settings = await fetchUserSettings(appBridgeClient);

// Benutzereinstellungen aktualisieren
const updated = await updateUserSettings(appBridgeClient, {
  theme: 'dark',
  applicationLanguage: 'en',
});

// Einzelne Werte abrufen
const language = await getUserLanguage(appBridgeClient);
const theme = await getUserTheme(appBridgeClient);
const timezone = await getUserTimezone(appBridgeClient);
```

**Typ: `UserSettings`**

```typescript
{
  id: string;
  theme: 'light' | 'dark' | 'system';
  applicationLanguage: string;
  userTimezone: string;
  notationCurrency: string;
  printer: string;
}
```

### Session / Authentication

```tsx
// Aktuelle Session abrufen
const session = await fetchCurrentSession(appBridgeClient);

// Benutzerinformationen abrufen
const user = await getCurrentUser(appBridgeClient);

// Einzelne Benutzer-Daten
const email = await getCurrentUserEmail(appBridgeClient);
const fullName = await getCurrentUserName(appBridgeClient);

// Session-Status überprüfen
const isActive = await isSessionActive(appBridgeClient);
const aal = await getAuthenticationAssuranceLevel(appBridgeClient);
const has2fa = await is2faEnabled(appBridgeClient);
```

**Typ: `Session`**

```typescript
{
  id: string;
  active: boolean;
  expires_at: string;
  authenticated_at: string;
  authenticator_assurance_level: string;
  authentication_methods: AuthenticationMethod[];
  issued_at: string;
  identity: Identity;
  devices: Device[];
}
```

### ERP Instance Status

```tsx
// ERP-Status abrufen
const status = await fetchErpInstanceStatus(appBridgeClient);

// Verbindungsstatus überprüfen
const connected = await isErpInstanceConnected(appBridgeClient);

// Zeit seit letztem Kontakt in Minuten
const minutesAgo = await getErpLastSeenMinutesAgo(appBridgeClient);
```

**Typ: `ErpInstanceStatus`**

```typescript
{
  tenantId: string;
  product: 'erp-api';
  instanceId: string;
  metadata: {
    connected: boolean;
    lastSeen: string;
    lastConnection: string;
    lastConnectionVersion: string;
    lastConnectedApiVersion: string;
  }
}
```

## Fehlerbehandlung

Alle Services werfen `Error` bei Fehlern. Mit Hooks ist die Fehlerbehandlung integriert:

```tsx
const { data, isLoading, error } = useTenants();

if (error) {
  console.error('Failed to load tenants:', error.message);
}
```

Bei direkter Service-Nutzung:

```tsx
try {
  const tenants = await fetchTenants(appBridgeClient);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Typen

Alle API-Responses sind in `src/types/jtlCloudApi.ts` definiert:

- `Tenant`
- `UserSettings`
- `Session`
- `Identity`
- `ErpInstanceStatus`
- Und weitere spezielle Typen (AuthenticationMethod, Device, etc.)

## Authentifizierung

Alle Requests verwenden Bearer Token-Authentifizierung:

```
Authorization: Bearer {sessionToken}
```

Das Session Token wird automatisch von der AppBridge bereitgestellt über `appBridgeClient.getSessionToken()`.

## Tests

Siehe `*.test.ts` Dateien für Beispiele von Unit Tests für Services.

## Beispiel-Komponente

Eine vollständige Beispielkomponente ist in `src/components/CloudApiExample.tsx` verfügbar, die zeigt:

- Alle vier API-Endpoints verwenden
- Loading- und Error-States handhaben
- Daten formatieren und anzeigen
