# Architecture

## Overview

This Cloud App is an **ERP-only plugin** for the JTL Cloud Platform. It integrates with JTL Hub via AppBridge and proxies requests to the ERP API.

For setup and security details, see [Setup and Security Guide](./setup-and-security.md).

## Design Principles

### 1. ERP-Only, No Fallbacks

- **No standalone functionality**: App requires JTL Hub and AppBridge session context
- **No fallback credentials**: No `NOHUB_TENANT_ID` or dummy bridges in production
- **Mandatory AppBridge**: Session tokens are always required
- **Clean error handling**: Validation errors return explicit HTTP status (400), never fall back to 500

### 2. Tenant-Aware Architecture

```
JTL Hub
  ↓ AppBridge Session
 Frontend (React + Vite)
  ↓ X-Session-Token header
 Backend (Express)
  ↓ Extract tenant from token
 ERP API
```

- **Frontend**: Calls `appBridgeClient.getSessionToken()` before requests
- **Backend**: Validates token, extracts tenant ID, uses for ERP context
- **ERP calls**: Include tenant header automatically

### 3. Single Deployable Unit

The repository contains one Cloud App:

- `apps/backend` – Express proxy for ERP API, OAuth client credentials flow
- `apps/frontend` – React UI, AppBridge integration, diagnostics pages

Both are deployed together as one unit behind a proxy/ingress layer.

## Repository Structure

```
apps/backend/
  src/
    app.ts                    ← Express app, route registration
    tenantContext.ts          ← Session token → tenant extraction
    config.ts                 ← Environment and configuration
    logger.ts                 ← Structured logging
    middleware/               ← Request context, CORS, etc.
    routes/                   ← HTTP route handlers
      erpProxyRoute.ts        ← ERP proxy entry point
      graphQlProxyRoute.ts    ← GraphQL proxy
      appInfoRoute.ts         ← /app-info endpoint
      connectTenantRoute.ts   ← /connect-tenant lifecycle
    services/                 ← Business logic
      erpProxy.ts             ← ERP request/response handling
      graphQlProxy.ts         ← GraphQL proxy logic
    errors/                   ← Error types and handling
    http/                     ← HTTP utilities
    assets/                   ← OpenAPI schema, GraphQL schema

apps/frontend/
  src/
    App.tsx                   ← Main app component, routing
    AppBootstrap.tsx          ← AppBridge initialization
    main.tsx                  ← Entry point
    services/
      apiClient.ts            ← HTTP requests with session token
      appBridgeClient.ts      ← AppBridge wrapper
      erpService.ts           ← ERP endpoint helpers
    pages/
      SetupPage.tsx           ← Lifecycle: user setup
      ErpPage.tsx             ← Menu items and tabs
      PanePage.tsx            ← Context pane
    components/               ← UI components
    routing/
      getAppRoute.ts          ← URL → route kind mapping
    hooks/                    ← Custom React hooks
```

## Backend

### Express-based TypeScript Service

- **Port**: 6143
- **Router**: Entrypoint at `apps/backend/src/app.ts`
- **Error handling**: Typed `AppError` with explicit HTTP status mapping
- **Session tokens**: Required for all routes (no fallbacks)

### Routes

| Path                      | Method | Purpose                                             |
| ------------------------- | ------ | --------------------------------------------------- |
| `/`                       | GET    | Returns 404 (backend is not a web server)           |
| `/app-info`               | GET    | App environment, capabilities, URLs                 |
| `/connect-tenant`         | POST   | Lifecycle endpoint: verify ERP connection           |
| `/setup`                  | GET    | Lifecycle endpoint: user setup page                 |
| `/disconnect`             | GET    | Lifecycle endpoint: cleanup on uninstall            |
| `/erp/*`                  | ANY    | ERP proxy (requires session token + tenant context) |
| `/openapi.json`           | GET    | OpenAPI schema                                      |
| `/graphql`                | POST   | GraphQL proxy                                       |
| `/graphql/schema.graphql` | GET    | GraphQL schema                                      |

### Session Token Validation

```typescript
// All routes require session token
const sessionToken = req.get('X-Session-Token');
if (!sessionToken) {
  return res.status(400).json({ error: 'X-Session-Token header required' });
}

const tenantContext = resolveTenantContext(sessionToken);
// tenantContext.tenantId used for all ERP requests
```

### Error Handling

Errors are returned with explicit HTTP status codes:

```typescript
// ✅ Correct
const error = new AppError('Missing session token', 'INVALID_SESSION_TOKEN', 400);
res.status(error.statusCode).json({ error: error.name, message: error.message });

// Never falls back or returns 500 for validation errors
```

## Frontend

### React Application (Vite 8.0.1)

- **Port**: 6142
- **Framework**: React 19.2.4, TypeScript
- **Build tool**: Vite (fast dev server, optimized production build)
- **AppBridge**: Integration via `@jtl-software/cloud-apps-core`

### Initialization Flow

1. `main.tsx` → Render `AppBootstrap`
2. `AppBootstrap.tsx` → Initialize AppBridge, provide context
3. `App.tsx` → Route detection, page rendering
4. Pages → Call backend API with session token

### Session Token Integration

```typescript
// All API calls include session token
const sessionToken = await appBridgeClient.getSessionToken();
const response = await fetch('/api/endpoint', {
  headers: { 'X-Session-Token': sessionToken },
});
```

### Routing

- `/setup` → SetupPage (lifecycle configuration)
- `/erp/menu/*` → ErpPage (menu items: Dashboard, API Dashboard)
- `/erp/pane/*` → PanePage (context pane: Orders)

- `/support`, `/privacy`, `/terms-of-use` → Info pages

### Diagnostics Pages

- **API Dashboard** (`/erp/menu/ApiDashboard`): Request timing, error logs
- **API Test** (part of ApiDashboard): Manual ERP endpoint testing

## Cross-Cutting Concerns

- Shared orchestration at repository root via pnpm workspaces and Turbo
- TypeScript in both apps (strict mode)
- CI runs lint, typecheck, build, and test from repository root
- Manifest (`manifest.json`) defines app capabilities and lifecycle endpoints

## Security Model

### Session Token Flow

1. **Hub**: User logs in to JTL Hub
2. **AppBridge**: Hub provides session token to app via AppBridge
3. **Frontend**: Retrieves token via `appBridgeClient.getSessionToken()`
4. **Request**: Includes token in `X-Session-Token` header
5. **Backend**: Validates token via JWKS endpoint
6. **Tenant**: Extracts tenant ID from token
7. **ERP**: Forwards request with tenant context

### No Fallbacks in Production

- ❌ No `NOHUB_TENANT_ID` environment variable
- ❌ No dummy AppBridge bridge fallback
- ❌ No hardcoded session tokens
- ❌ No skip session validation logic

### Logging and Redaction

- Request metadata logged (method, path, status, errors)
- Sensitive headers redacted (`Authorization`, `X-Session-Token`)
- ERP proxy timing tracked for diagnostics
- Structured JSON logging for parsing

## Testing

- **Backend**: 37 tests (unit + integration)
- **Frontend**: 89 tests (component + page tests)
- All tests verify session token requirements and tenant context handling

## References

- [Setup and Security Guide](./setup-and-security.md)
- [Development Guide](./development.md)
- [JTL Cloud Platform Documentation](https://developer.jtl.cloud/docs)
