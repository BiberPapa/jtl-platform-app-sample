# Development

## Setup

1. Enable Corepack.
2. Run `corepack yarn install` from repository root.
3. Configure backend `.env` values in `apps/backend`.
4. Use `apps/frontend/.env.example` for frontend configuration.

## Common Commands

- `corepack yarn dev`
- `corepack yarn dev:backend:ts`
- `corepack yarn dev:frontend`
- `corepack yarn lint`
- `corepack yarn typecheck`
- `corepack yarn test`
- `corepack yarn build`

## Troubleshooting

- If workspace binaries are missing, run `corepack yarn install`.
- If Vite or Vitest native modules are locked on Windows, stop running dev processes and reinstall.
- If ERP request logging is needed locally, configure `ERP_PROXY_LOG_LEVEL` in `apps/backend/.env`.
