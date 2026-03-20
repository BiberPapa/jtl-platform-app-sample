# Agent rules for apps/frontend

## Scope

These instructions apply to all files under `apps/frontend`.

## Read first

Before changing UI code, read:

- `../../docs/ai/frontend-stack.md`
- `../../docs/ai/jtl-platform-ui.md`
- `../../docs/ai/patterns/page-layout.md`
- the most relevant pattern file for the task

## Source of truth

Within this app, existing feature code is the primary source of truth for:

- routing conventions
- page composition
- naming conventions
- state and data fetching patterns
- form structure
- table usage
- modal and drawer usage

## UI rules

- Use `@jtl-software/platform-ui-react` components wherever possible.
- Prefer existing page shells, forms, tables, filters, and action bars already used in this app.
- Do not introduce a second set of primitives for buttons, inputs, dialogs, or tables.
- Avoid one-off styling that makes a screen look detached from the rest of the app.

## When building new screens

Unless told otherwise, follow this order:

1. page shell
2. header and primary actions
3. filters or summary area
4. main content area
5. empty, loading, and error states

## Forms

- Follow existing label, hint, validation, and submit patterns.
- Keep validation messages near the field.
- Preserve keyboard and focus behavior.

## Tables and lists

- Prefer the existing table pattern for sorting, filtering, bulk actions, and empty states.
- Do not invent a new row action pattern if one already exists in the app.

## Terminology for user-visible text

Before changing labels, helper text, placeholders, empty states, dialogs, or validation messages:

- consult `../../docs/terminology/terminology.json`
- prefer canonical terms
- do not use forbidden terms
- resolve wording by product and UI context when available

Examples:

- use `Artikel`, not `Produkt`
- use `anmelden`, not `einloggen`
- use `Auftrag`, not `Bestellung`, when the terminology entry requires it

## Completion

A UI task is not done until the affected code is type-safe, consistent with local patterns, and passes the documented checks.
