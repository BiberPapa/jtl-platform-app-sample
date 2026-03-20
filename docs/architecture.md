# Architecture

## Overview

The repository contains one application with two deployable parts:

- `apps/backend`
- `apps/frontend`

## Backend

- Express-based TypeScript service
- Primarily acts as an ERP proxy
- Handles session token validation
- Adds structured logging and proxy timing headers

## Frontend

- React application built with Vite
- Uses the backend as its API boundary
- Surfaces ERP health and timing information in the UI

## Cross-Cutting Concerns

- Shared orchestration happens at repository root through pnpm workspaces and Turbo
- TypeScript is used in both apps
- CI runs lint, typecheck, build, and test from repository root
