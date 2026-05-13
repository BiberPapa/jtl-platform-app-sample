# Development

For **initial setup and security best practices**, see [Setup and Security Guide](./setup-and-security.md).

## Quick Start

1. Enable Corepack: `corepack enable`
2. Install dependencies: `pnpm install` (from repository root)
3. Configure backend `.env` (see [Setup and Security Guide](./setup-and-security.md))
4. Use `apps/frontend/.env.example` for frontend configuration
5. Run `pnpm dev`

## Local Development Commands

- `pnpm dev`
- `pnpm dev:backend:ts`
- `pnpm dev:frontend`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Troubleshooting

- **Missing workspace binaries**: Run `pnpm install`
- **Native module issues on Windows**: Stop dev processes and reinstall
- **ERP request debugging**: Set `ERP_PROXY_LOG_LEVEL=basic` in `apps/backend/.env`
- **AppBridge not available**: App must run inside JTL Hub, not via direct URL
- **Session token errors**: Ensure AppBridge initializes before API calls (see [Setup and Security Guide](./setup-and-security.md))

## Architecture Notes

- The app requires AppBridge session context from JTL Hub
- No fallback credentials or dummy bridges in production code
- All ERP requests require valid `X-Session-Token` header
- Tenant context is extracted server-side from the session token
