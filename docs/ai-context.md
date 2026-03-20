# AI Context

## Focus Areas

- `apps/backend/src/services/erpProxy.ts` contains the ERP proxy request flow.
- `apps/backend/src/logger.ts` contains backend logging configuration and ERP log helpers.
- `apps/backend/src/routes/erpProxyRoute.ts` is the main HTTP entry point for ERP proxy requests.
- `apps/frontend/src/services/erpService.ts` contains frontend-side ERP timing extraction and API helpers.
- `apps/frontend/src/pages/erp-page/DashboardPage.tsx` and `apps/frontend/src/pages/erp-page/ApiTestPage.tsx` surface diagnostics in the UI.

## Typical Verification

- `corepack yarn lint`
- `corepack yarn typecheck`
- `corepack yarn test`
- `corepack yarn build`

## Change Hints

- When changing proxy behavior, verify both backend response handling and frontend diagnostics pages.
- When changing logging, check header redaction, body truncation, and request timing output together.
- When changing root scripts or workspace structure, verify CI-facing commands from repository root.
