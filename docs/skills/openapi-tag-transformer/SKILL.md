---
name: openapi-tag-transformer
description: Transform one OpenAPI tag area into clear, consistent business-language documentation in an OpenAPI transformation layer. Use when Codex should rename or refine a tag, rewrite tag descriptions, improve endpoint summaries and descriptions, normalize spelling and grammar, and rewrite documented response and error texts so the affected area reads like a clean business-facing specification without changing the technical contract.
---

# OpenAPI Tag Transformer

Transform one tag-focused area of an OpenAPI specification at a time. Work in the transformation layer, keep the source specification unchanged, and improve only the user-facing documentation unless the user explicitly asks for a contract change.

## Workflow

1. Read the existing transformation logic first.
   Start with the transformation entrypoint and the helpers that already touch tags, summaries, descriptions, or responses.
2. Define the exact tag scope.
   Capture the current tag name, tag description, affected operations, affected response descriptions, and nearby wording that should remain aligned.
3. Choose the business-facing target wording.
   Pick a short, descriptive tag name and a tag description that explains the business purpose of the area.
4. Rewrite the tag area for consistency.
   Normalize the tag name, tag description, operation `summary`, operation `description`, response descriptions, spelling, capitalization, grammar, and terminology so they read as one coherent business domain.
5. Ensure every endpoint in scope is described.
   Do not leave affected operations with missing or vague `summary` or `description` text when the transformation layer can improve them.
6. Ensure every documented response in scope is described.
   Every documented success or error response code must have a meaningful business-language description.
7. Rewrite error responses in business-case language.
   Replace generic or technical texts with wording that explains the business outcome for the caller.
   Keep `404` only for routes that address a concrete resource through a path identifier such as `{itemId}` or `{categoryId}`.
   Remove `404` from collection, search, and query routes without a concrete path identifier.
8. Preserve the technical contract.
   Do not change `operationId`, path keys, schema names, property names, enum values, or payload-relevant structures unless the user explicitly requests that.
9. Implement the change as focused transformation logic.
   Prefer one clearly named helper or rule for the tag area instead of scattering string edits across unrelated code.
10. Add or update tests.
    Cover the transformed tag, affected operations, endpoint descriptions, and response-text normalization, including added or removed `404` documentation where applicable.
11. Re-validate the transformed specification.
    Confirm that the transformed OpenAPI document remains valid and that the wording is internally consistent.

## Quality Rules

- Prefer business-oriented names over internal or technical labels.
- Prefer short, navigable tag names that work well in Swagger UI.
- Use the same domain term consistently across the tag name, tag description, summaries, descriptions, and responses.
- Prefer clear business-case language over implementation language.
- Fix spelling, grammar, capitalization, and awkward phrasing as part of the transformation.
- Avoid vague descriptions such as `Successful operation`, `Request processed`, or `Unknown error`.
- Make each endpoint description tell the reader what business action the endpoint supports.
- Make each error description tell the reader what business problem occurred, not merely that a status code was returned.

## Safe Boundaries

- Improve documentation quality by default, not runtime behavior.
- Keep changes local to the selected tag area unless broader wording alignment is clearly necessary.
- If the desired wording collides with nearby domain terminology, align the affected area consistently instead of changing one string in isolation.
- Treat spelling, grammar, capitalization, and documentation rewrites as safe unless they would alter a technical identifier or payload contract.

## Reference

Load `references/transformation-principles.md` when you need the detailed transformation rules and acceptance checks for clean business-facing OpenAPI documentation.
