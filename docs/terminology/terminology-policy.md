# Terminology policy

## Purpose
This repository uses a controlled terminology for user-visible wording.
Current automated validation focuses primarily on frontend UI text in `apps/frontend/src`.

This policy applies especially to:
- UI labels
- helper text
- placeholders
- empty states
- validation messages
- dialog text
- frontend page copy
- frontend component text

## Source of truth
Use `docs/terminology/terminology.json` as the machine-readable source of truth.

Each terminology entry may contain:
- canonical term
- allowed synonyms
- forbidden synonyms
- usage note
- product context
- UI path or module context
- German and English equivalents

## Core rules
1. Prefer the canonical term.
2. Do not use forbidden terms in user-visible text.
3. Allowed synonyms are not automatically preferred UI wording.
4. If a terminology entry includes a usage note, follow it.
5. If a term is context-sensitive, resolve it by product, module, or UI path.
6. If German and English are both needed, use the pair from the same terminology entry.

## Precedence
When choosing wording, use this order:
1. exact terminology match with matching product and UI context
2. exact terminology match with matching product context
3. exact terminology match without context
4. closest canonical term from the same concept family
5. existing repo wording only if it does not conflict with terminology

## Translation rules
- Do not translate literally if an official target term exists.
- Keep term pairs aligned across locales.
- Do not invent alternative English wording when the terminology file already defines one.
- Notes in either language may restrict usage and should be respected.

## Writing rules for UI
- Prefer short, canonical UI wording.
- Avoid paraphrasing terminology unnecessarily.
- Avoid mixing near-synonyms for the same concept across one screen.
- Keep repeated concepts stable across pages, dialogs, and tables.

## Conflict handling
If multiple entries share the same surface term:
1. prefer the entry with matching product context
2. then prefer matching module or UI path
3. then prefer the broader cross-product entry
4. if still ambiguous, flag it for review instead of guessing

## Examples
- Use `Artikel`, not `Produkt`, where the terminology entry requires it.
- Use `anmelden`, not `einloggen`.
- Use `Auftrag`, not `Bestellung`, when referring to the sales-order concept.
- Use `Auftragsnummer`, not `Bestellnummer`, when referring to the sales-order identifier.

## Validation
Changes that introduce frontend user-visible text should be checked against the terminology source.
The current checker is frontend-first and scans `apps/frontend/src` by default.
Preferred-term enforcement and context-aware validation can be added incrementally.
