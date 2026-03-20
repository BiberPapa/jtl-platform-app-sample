# ![JTL logo](https://avatars.githubusercontent.com/u/31404730?s=25&v=4) JTL Hello World App

## Prerequisites

- Node.js 20+
- Corepack enabled (`corepack enable`)
- Install dependencies from the repository root with `corepack yarn install`

## Development

- Run `corepack yarn dev` to start the TypeScript backend and frontend
- Run `corepack yarn dev:backend:ts` to start only the backend on `http://localhost:50143`
- Run `corepack yarn dev:frontend` to start only the frontend

## Commands

- `corepack yarn lint`
- `corepack yarn typecheck`
- `corepack yarn test`
- `corepack yarn build`
- `corepack yarn run check`
- `corepack yarn test:backend:ts`

## Structure

- `apps/backend` contains the TypeScript backend proxy
- `apps/frontend` contains the React frontend

Use `apps/frontend/.env.example` as the starting point for frontend configuration.
Keep `VITE_API_URL=http://localhost:50143` for the local backend.

## Ports

| Port  | Protocol | Service               |
| ----- | -------- | --------------------- |
| 50143 | HTTP     | API Main (TypeScript) |
| 50142 | HTTPS    | React App             |

## Environment Variables

These environment variables have to be added in `apps/backend` for the project to start.

| Name                        | Description                                        | Type       |
| --------------------------- | -------------------------------------------------- | ---------- |
| `CLIENT_ID`                 | The client ID of the sample app                    | `Variable` |
| `CLIENT_SECRET`             | The client secret of the sample app                | `Secret`   |
| `API_ENVIRONMENT`           | The API environment (defaults to production)       | `Variable` |
| `LOG_LEVEL`                 | Backend application log level                      | `Variable` |
| `ERP_PROXY_LOG_LEVEL`       | ERP proxy log level (`off`, `basic`, `verbose`)    | `Variable` |
| `ERP_PROXY_LOG_BODY_MAX_LENGTH` | Max body length for verbose ERP proxy logs     | `Variable` |

For local development, prefer `ERP_PROXY_LOG_LEVEL=basic` or `ERP_PROXY_LOG_LEVEL=verbose`.
`DEBUG_ERP_PROXY=true` is deprecated and only kept as a compatibility fallback.
