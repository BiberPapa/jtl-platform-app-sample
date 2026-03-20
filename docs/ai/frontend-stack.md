# Frontend stack

## Purpose

This document explains the frontend implementation constraints for AI assistants and contributors.

## Main framework

- React
- TypeScript

## UI layer

- `@jtl-software/platform-ui-react` is the default UI library for application UI.
- Treat it as the primary source for UI primitives and higher-level composition.

## Design approach

- The UI library may be conceptually similar to shadcn-style composition, but it must not be treated as raw shadcn/ui.
- Do not assume upstream shadcn patterns are valid here without checking local usage and the docs in this repository.

## Preferred workflow for UI implementation

1. inspect existing code in `apps/frontend`
2. inspect `docs/ai/jtl-platform-ui.md`
3. inspect a matching pattern in `docs/ai/patterns/`
4. implement with platform-ui components first
5. only add custom composition where needed

## Non-goals

- Do not optimize for novelty.
- Do not create custom component systems in parallel.
- Do not import another UI framework to solve local layout problems.
