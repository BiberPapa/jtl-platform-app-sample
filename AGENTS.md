# AGENTS

## Purpose

This repository contains a single Cloud App application with:

- `apps/backend` for the TypeScript backend proxy
- `apps/frontend` for the React frontend

## Working Agreement

- Treat the repository root as the workspace root.
- Prefer targeted changes over broad refactors.
- Keep backend and frontend responsibilities separate.
- Do not commit generated output from `dist`, `.turbo`, or `coverage`.
- Preserve existing behavior unless a change explicitly requires it.
- Verify changes from repository root whenever possible.

## Commit and Validation Policy

- Do not use `git commit --no-verify` unless the user explicitly asks for it.
- Before committing, fix errors instead of bypassing hooks.
- After each code change, run linting and checks from the repository root and fix any errors introduced by the change.
- At minimum, run `pnpm lint` and `pnpm typecheck`; run `pnpm test` when behavior changes or tests are affected.

## Backend Guardrails

- Preserve upstream payload semantics in proxy code; do not coerce binary/file responses into text or JSON.
- Map request, auth, and validation failures to explicit non-500 HTTP responses instead of defaulting to internal server errors.
- Keep route handlers thin by centralizing shared error mapping and proxy response handling.
- Split production files before they turn into mixed logic-and-policy hotspots; use separate modules for large static rule tables.
- When backend behavior changes, add or update edge-case tests for proxy payload handling, environment normalization, and HTTP error semantics.

## AI Notes

- Prefer typed/domain errors over generic `Error` for backend request flows.
- When touching proxy behavior, verify both success and failure cases from the repository root with the documented commands.
- Treat large declarative transformations as data-first modules so future AI edits stay targeted and reviewable.

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
