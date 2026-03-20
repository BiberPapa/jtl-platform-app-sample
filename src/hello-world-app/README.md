# ![JTL logo](https://avatars.githubusercontent.com/u/31404730?s=25&v=4) JTL-Platform Sample Hello World App

## ⚡️ Prerequisites

- Node.js 20+
- Corepack enabled (`corepack enable`)
- Install dependencies in this workspace with `corepack yarn install`

## 🛠️ Development

- Run `corepack yarn dev` to start the TypeScript backend and frontend
- Run `corepack yarn dev:backend:ts` to start only the TypeScript backend on `http://localhost:50143`
- Run `corepack yarn dev:frontend` to start only the frontend

## ✅ Code Standards

This sample is intended as onboarding code for new developers.

- TypeScript remains strict and favors explicit types over broad assertions.
- React components are plain functions with focused responsibilities.
- Comments are reserved for non-obvious context, not for narrating simple code.
- Exported TypeScript functions should use JSDoc when behavior, side effects, caching, fallbacks, or failure modes are not obvious from names and types alone.
- UI flows model loading, success and error states explicitly.
- Side effects belong in focused service or utility functions when possible.

## 🧪 Commands

- `corepack yarn lint`
- `corepack yarn typecheck`
- `corepack yarn test`
- `corepack yarn build`
- `corepack yarn run check`
- `corepack yarn test:backend:ts`

- Use `apps/frontend/.env.example` as the starting point for frontend configuration.
- Keep `VITE_API_URL=http://localhost:50143` for the TypeScript backend.
- The frontend stays backend-agnostic and only needs `VITE_API_URL`.
- The backend caches the ERP access token in-memory until shortly before it expires.
- Runtime ERP requests send a fresh session token from the bridge to the backend instead of using a stored tenant mapping.

## 🔌 Ports

This is a mono-repo, both backend and frontend is expected to start from one machine

| Port  | Protocol | Service               |
| ----- | -------- | --------------------- |
| 50143 | HTTP     | API Main (TypeScript) |
| 50142 | HTTPS    | React App             |

## Environment specific Secrets & Variables

These are the environment variables that have to be added in `apps/backend` for the project to start.

| Name              | Description                                        | Type       |
| ----------------- | -------------------------------------------------- | ---------- |
| `CLIENT_ID`       | The ClientID of the Sample App                     | `Variable` |
| `CLIENT_SECRET`   | The Client Scret of the Sample App                 | `Secret`   |
| `API_ENVIRONMENT` | The enviroment of the API (defaults to production) | `Variable` |
| `LOG_LEVEL` | Backend application log level (`error`, `warn`, `info`, `debug`) | `Variable` |
| `ERP_PROXY_LOG_LEVEL` | ERP proxy log level (`off`, `basic`, `verbose`) | `Variable` |
| `ERP_PROXY_LOG_BODY_MAX_LENGTH` | Max body length for verbose ERP proxy logs | `Variable` |

For local development, prefer `ERP_PROXY_LOG_LEVEL=basic` or `ERP_PROXY_LOG_LEVEL=verbose`.
`DEBUG_ERP_PROXY=true` is deprecated and only kept as a compatibility fallback.
