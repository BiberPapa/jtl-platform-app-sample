# JTL Platform UI usage guide for AI assistants

## Purpose

This document explains how to use `@jtl-software/platform-ui-react` in this repository.

It is not a full copy of Storybook documentation. It is a practical translation into repository-specific rules.

## Working assumptions

- Use platform-ui as the default UI layer.
- Prefer existing app patterns over generic examples from outside this repo.
- Do not assume compatibility with raw shadcn/ui recipes.
- Treat Storybook as a reference, but treat this repository's existing code as the implementation baseline.

## General rules

- Start from existing components and compositions already used in `apps/frontend`.
- Prefer consistent page structure over custom visual solutions.
- Prefer composition of existing components over creating new primitives.
- Only introduce a new wrapper component if the same composition repeats or the domain needs a stable abstraction.

## Imports

- Prefer imports from `@jtl-software/platform-ui-react`.
- Do not import from unrelated UI libraries.
- Do not add raw Radix or raw shadcn/ui primitives unless the task explicitly requires low-level extension work.

## Page composition

A typical page should include:

1. page shell
2. page title and contextual actions
3. optional filter or summary area
4. main content area
5. loading, empty, and error states

Prefer matching an existing page in the codebase over inventing a new arrangement.

## Forms

Use the existing form composition used in this app for:

- labels
- field spacing
- help text
- validation
- submit/cancel actions
- disabled and loading states

Rules:

- every field has a visible label unless there is a strong existing exception
- validation messages stay close to the field
- server and client validation should be visually consistent
- submit actions should be easy to identify
- destructive actions should be clearly separated

## Tables and lists

Prefer the existing app pattern for:

- column definitions
- row actions
- bulk actions
- filters
- pagination
- empty states
- loading skeletons or progress states

Rules:

- do not invent a new table toolbar pattern if one already exists
- do not hide important actions only in row menus if the app normally exposes them elsewhere
- empty states should explain what the user can do next

## Dialogs, drawers, overlays

Use existing local patterns first.

Rules:

- preserve focus handling
- provide a clear title
- make primary and secondary actions explicit
- do not overload dialogs with large multi-step workflows unless that pattern already exists

## Styling

Use utility classes conservatively.

Allowed use cases:

- layout
- spacing
- width and height adjustments
- responsive arrangement
- minor alignment fixes

Avoid:

- custom visual language outside the design system
- one-off colors, radii, shadows, or spacing values
- copying arbitrary Tailwind snippets from the internet

## Accessibility

Minimum expectations:

- keyboard accessibility
- visible focus handling
- labels for controls
- understandable error states
- semantic headings where relevant

## Do / Don't

### Do

- reuse local patterns
- keep screens visually consistent
- prefer platform-ui components
- make states explicit: loading, empty, error, success

### Don't

- introduce MUI, Chakra, Ant Design, Bootstrap, or raw shadcn/ui by default
- create parallel button/input/dialog primitives
- bypass existing UX patterns for convenience
- assume a Storybook example should be copied literally without adapting it to this app

## Examples

Reference these local examples when available:

- `docs/ai/examples/list-page.tsx`
- `docs/ai/examples/detail-form.tsx`

If those examples drift from production code, production code in `apps/frontend` wins.
