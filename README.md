# ![JTL logo](https://avatars.githubusercontent.com/u/31404730?s=25&v=4) JTL Cloud App

An **ERP-only plugin** for the JTL Cloud Platform.

This is a reference implementation that demonstrates secure integration with the JTL Cloud Platform, AppBridge session management, and ERP API proxying.

## Quick Start

For a **clean, secure setup from the start**, see [Setup and Security Guide](./docs/setup-and-security.md).

For the quick version:

1. Register app in [JTL Partner Portal](https://partner.jtl.cloud)
2. Copy OAuth credentials to `apps/backend/.env`
3. Run `pnpm install && pnpm dev`
4. Access via JTL Hub (not directly via URL)

## Architecture

- **ERP-only**: No standalone functionality. Requires AppBridge session and JTL Hub context.
- **Mandatory AppBridge**: Session tokens are always required. No fallback credentials.
- **Tenant-aware**: Backend extracts tenant context from session token for all ERP calls.
- **Secure by design**: Clean error handling, no deprecated code paths, structured logging.

See [Architecture](./docs/architecture.md) and [Setup and Security Guide](./docs/setup-and-security.md) for details.

## Official JTL Documentation

- [JTL Cloud Platform Overview](https://developer.jtl.cloud/docs) – Platform architecture and integration model
- [App Shell Integration](https://developer.jtl.cloud/docs/app-shell) – AppBridge and host communication
- [OAuth & Security](https://developer.jtl.cloud/docs/auth) – Authentication flows and best practices
- [ERP API Reference](https://developer.jtl.cloud/docs/erp-api) – ERP endpoint structure and tenant context
- [App Registration Guide](https://developer.jtl.cloud/docs/app-registration) – Partner Portal setup

## Prerequisites

- Node.js 20+
- Corepack enabled (`corepack enable`)
- Install dependencies from the repository root with `pnpm install`

## Development

- Run `pnpm dev` to start the TypeScript backend and frontend
- Run `pnpm dev:backend:ts` to start only the backend on `http://localhost:6143`
- Run `pnpm dev:frontend` to start only the frontend
- If Windows reserves frontend port `6142`, the Vite dev server now falls back to `5173`; set `VITE_DEV_PORT` in `apps/frontend/.env` to pin a different local port.

## Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm check`
- `pnpm test:backend:ts`

## Structure

- `apps/backend` contains the TypeScript backend proxy
- `apps/frontend` contains the React frontend

Use `apps/frontend/.env.example` as the starting point for frontend configuration.
Keep `VITE_API_URL=http://localhost:6143` for the local backend.

The app gets environment/capabilities info from the backend and initializes AppBridge before rendering the UI.

## Ports

| Port | Protocol | Service               |
| ---- | -------- | --------------------- |
| 6143 | HTTP     | API Main (TypeScript) |
| 6142 | HTTP     | React App             |

## Environment Variables

Required in `apps/backend/.env` (get from [JTL Partner Portal](https://partner.jtl.cloud)):

| Name              | Description                           | Type       |
| ----------------- | ------------------------------------- | ---------- |
| `CLIENT_ID`       | OAuth client ID from Partner Portal   | `Variable` |
| `CLIENT_SECRET`   | OAuth client secret (keep secure)     | `Secret`   |
| `API_ENVIRONMENT` | API environment: `dev`, `qa`, `prod` | `Variable` |
| `LOG_LEVEL`       | Backend log level                     | `Variable` |
| `ERP_PROXY_LOG_LEVEL` | ERP proxy log level: `off`, `basic`, `verbose` | `Variable` |
| `ERP_PROXY_LOG_BODY_MAX_LENGTH` | Max body length for verbose logs | `Variable` |

**Security notes:**
- Never commit `CLIENT_SECRET` to version control
- Use `.env.local` or secure environment injection in CI/CD
- No fallback credentials (e.g., `NOHUB_TENANT_ID`) – app requires AppBridge session
- In production, set `LOG_LEVEL=warn` and `ERP_PROXY_LOG_LEVEL=off`

For local development with the dummy AppBridge:
- `ERP_PROXY_LOG_LEVEL=basic` helps debug requests
- Session tokens are validated against JTL's JWKS endpoint (no hardcoded tokens)
