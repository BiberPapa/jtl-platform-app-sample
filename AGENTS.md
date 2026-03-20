# AGENTS

## Purpose

This repository contains a single Hello World application with:

- `apps/backend` for the TypeScript backend proxy
- `apps/frontend` for the React frontend

## Working Agreement

- Treat the repository root as the workspace root.
- Prefer targeted changes over broad refactors.
- Keep backend and frontend responsibilities separate.
- Do not commit generated output from `dist`, `.turbo`, or `coverage`.
- Preserve existing behavior unless a change explicitly requires it.
- Verify changes from repository root whenever possible.

## Verification

- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Documentation

- Start in `README.md` for project setup.
- Use `docs/` for architecture, runbooks, and implementation notes.
- Use `docs/ai-context.md` for task-oriented repository hotspots.
