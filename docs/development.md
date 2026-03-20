# Development

## Setup

1. Enable Corepack.
2. Run `pnpm install` from repository root.
3. Configure backend `.env` values in `apps/backend`.
4. Use `apps/frontend/.env.example` for frontend configuration.

## Common Commands

- `pnpm dev`
- `pnpm dev:backend:ts`
- `pnpm dev:frontend`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Troubleshooting

- If workspace binaries are missing, run `pnpm install`.
- If Vite or Vitest native modules are locked on Windows, stop running dev processes and reinstall.
- If ERP request logging is needed locally, configure `ERP_PROXY_LOG_LEVEL` in `apps/backend/.env`.
- The existing `apps/frontend/Dockerfile` is intentionally not part of the pnpm migration and should be cleaned up separately before it is relied on.
