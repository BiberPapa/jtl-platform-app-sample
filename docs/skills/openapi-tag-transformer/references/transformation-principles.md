# OpenAPI Transformation Principles

Use these principles when transforming one tag area and its surrounding endpoint documentation.

## Goal

Produce a clean OpenAPI specification that is:

- easy to understand
- linguistically consistent
- business-oriented
- easy to navigate in Swagger UI
- still technically valid

## Tag Principles

- Choose short, clear, domain-oriented tag names.
- Write tag descriptions that explain the business purpose of the area.
- Treat tags as a primary navigation system in Swagger UI.
- Prefer names that help API consumers understand the business use case quickly.

## Endpoint Documentation Principles

- Ensure every affected endpoint has a meaningful `summary`.
- Ensure every affected endpoint has a meaningful `description` when the transformation layer can provide one.
- Describe business intent, not implementation details.
- Keep wording aligned across sibling operations that belong to the same tag area.

## Text Quality Principles

- Review spelling, grammar, punctuation, and capitalization in all user-facing texts.
- Keep wording consistent across tag names, summaries, descriptions, and response descriptions.
- Prefer one English variant consistently within the transformed output.
- Improve clarity without changing the intended business meaning.
- Normalize wording so that business terms are used consistently across the whole transformed tag area.

## Response Documentation Principles

- Every documented response code should contain a meaningful description.
- Document success and error responses in business-case language.
- Review response descriptions for spelling, grammar, capitalization, and wording just like other user-facing texts.
- Remove generic or misleading response texts when the route semantics are clearer than the original wording.
- Keep `404` only for routes that identify a concrete resource through a path identifier such as `{itemId}`.
- Remove `404` from collection, list, search, and query routes that do not contain a path identifier.
- When a `404` remains, replace generic messages with a resource-specific not-found text.
- Prefer precise messages such as:
  - `No item with the given ID exists.`
  - `No category with the given ID exists.`
  - `No item image with the given ID exists.`
  - `No item preview image with the given ID exists.`

## Safety Principles

- Do not edit source OpenAPI files directly when a transformation layer exists.
- Implement changes in the transformation layer.
- Do not change technical identifiers without an explicit decision.
- Avoid changing:
  - `operationId`
  - path keys
  - schema names
  - property names
  - enum values
  - payload-relevant structures

## Acceptance Checks

A tag transformation is good only if:

- the affected tag has a clear business-oriented name
- the affected tag has a clear business-oriented description
- each affected endpoint is described
- each documented response code in scope is described
- error responses read in business-case language
- wording is consistent across the transformed area
- no unintended contract change is introduced
- the transformed specification remains valid
