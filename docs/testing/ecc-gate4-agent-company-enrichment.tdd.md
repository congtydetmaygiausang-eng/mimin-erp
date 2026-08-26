# ECC Gate 4 — Agent company normalization and enrichment

## Source and scope

Journeys were derived during this TDD run. The change is restricted to the
`search_partners` result boundary used by the MIMIN AI Agent. Existing ERP
catalogues and the automatic-search pipeline remain unchanged.

## User journeys

- As a production manager, I see real company identities instead of article/list titles.
- As a production manager, I receive contact fields extracted by Jina only when the evidence belongs to that company.
- As a production manager, I see one rich profile instead of repeated tracking URLs for the same company.

## Task report

| Stage | Evidence |
|---|---|
| RED | `npm run test:gate4` failed with `TS2307` because the authoritative Gate 4 contract did not exist. Commit `096d4b7`. |
| GREEN | `npm run test:gate4` passed 5/5 after implementing the contract and integrating it at the Agent tool boundary. Commit `04496d4`. |
| Regression | `npm run test:agent-chat-contract` passed 3/3; `npm run test:b2b-search` passed 5/5. |
| Coverage | Gate 4 contract: 96.03% lines, 80.46% branches, 88.46% functions. Combined run: 88.82% lines. |
| Production build | `npm run build` compiled successfully and generated all 143 static pages. |

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | SEO/list titles are rejected as company identities | `rejects article and list titles...` | Unit | PASS |
| 2 | Jina phone, address, email and tax code evidence enriches the matching company | `merges Jina evidence...` | Unit | PASS |
| 3 | Tracking variants of the same source URL merge into one richer profile | `deduplicates tracking URLs...` | Unit | PASS |
| 4 | Separate companies on one directory domain are not merged | `does not merge different companies...` | Unit | PASS |
| 5 | Evidence from an unrelated source cannot overwrite an existing contact | `never overwrites...` | Unit | PASS |

## Contract

The authoritative boundary is `gate4-agent-company-contract.ts`. It defines the
minimum observable candidate fields, accepted evidence shape, canonical URL
rules, identity rejection, evidence selection and deduplication behavior.

## Coverage and known gaps

Unit coverage was collected with Node's test coverage for the Gate 4 target and
meets the Gate 4 threshold (96.03% lines, 80.46% branches).
External provider behavior remains covered by the existing API0–API8 and B2B
tests; production browser verification is intentionally performed after
Antigravity review and deployment.

## Merge evidence

Preserve RED commit `096d4b7` and GREEN commit `04496d4`, or copy this report
into the PR/squash body if the merge strategy squashes commits.
