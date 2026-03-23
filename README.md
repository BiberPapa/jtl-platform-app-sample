# ![JTL logo](https://avatars.githubusercontent.com/u/31404730?s=25&v=4) JTL Cloud App

## Prerequisites

- Node.js 20+
- Corepack enabled (`corepack enable`)
- Install dependencies from the repository root with `pnpm install`

## Development

- Run `pnpm dev` to start the TypeScript backend and frontend
- Run `pnpm dev:backend:ts` to start only the backend on `http://localhost:50143`
- Run `pnpm dev:frontend` to start only the frontend

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
Keep `VITE_API_URL=http://localhost:50143` for the local backend.
The frontend developer start page loads environment and NOHUB information from the backend `GET /app-info` route.
The existing `apps/frontend/Dockerfile` is a legacy path and remains outside this pnpm migration; it references `src/sdk/js-core`, which does not exist in this repository and should be cleaned up separately.

## Ports

| Port  | Protocol | Service               |
| ----- | -------- | --------------------- |
| 50143 | HTTP     | API Main (TypeScript) |
| 50142 | HTTP     | React App             |

## Environment Variables

These environment variables have to be added in `apps/backend` for the project to start.

| Name                            | Description                                                 | Type       |
| ------------------------------- | ----------------------------------------------------------- | ---------- |
| `CLIENT_ID`                     | The client ID of the sample app                             | `Variable` |
| `CLIENT_SECRET`                 | The client secret of the sample app                         | `Secret`   |
| `API_ENVIRONMENT`               | The API environment (defaults to `prod`)                    | `Variable` |
| `LOG_LEVEL`                     | Backend application log level                               | `Variable` |
| `ERP_PROXY_LOG_LEVEL`           | ERP proxy log level (`off`, `basic`, `verbose`)             | `Variable` |
| `ERP_PROXY_LOG_BODY_MAX_LENGTH` | Max body length for verbose ERP proxy logs                  | `Variable` |
| `NOHUB_TENANT_ID`               | Fallback tenant ID for local runs without hub session token | `Variable` |

For local development, prefer `ERP_PROXY_LOG_LEVEL=basic` or `ERP_PROXY_LOG_LEVEL=verbose`.
`DEBUG_ERP_PROXY=true` is deprecated and only kept as a compatibility fallback.
