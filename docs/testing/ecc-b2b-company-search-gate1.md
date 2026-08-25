# ECC Gate 1 - B2B Company Search

## Scope

- Keep the existing provider integrations and UI contracts unchanged.
- Add a B2B eligibility gate before candidates reach the user-facing result list.
- Require source-backed contact fields and keep location uncertainty explicit.

## TDD evidence

### RED

`npm run test:b2b-search` initially failed because `b2b-company-policy` did not exist.

### GREEN

The policy module now covers:

1. Retail-only rejection.
2. Direct B2B capability evidence.
3. B2B-only query variants.
4. Same-entity field evidence selection.
5. Separation of inside, unknown, outside and conflicting locations.

## Verification

- `npm run test:b2b-search`: 5/5 passed.
- Full sourcing suite: 63/63 passed.
- `npm run build`: passed, including all 143 static pages.
- `git diff --check`: passed.

## Expected behavior change

- Retail listings, generic articles and other noise remain diagnostic-only.
- A candidate needs direct producer/supplier/processor capability evidence and a business identity.
- Phone, email, address, website and tax code are retained only when attached to accepted evidence or an already verified source field.
- Prefer-near mode excludes known outside/conflicting candidates; unknown coordinates remain in a separate verification lane.

## Rollback boundary

Revert the policy module and the isolated integration points in `search-engine.ts`. No database schema, API contract, environment variable or UI component was changed.
