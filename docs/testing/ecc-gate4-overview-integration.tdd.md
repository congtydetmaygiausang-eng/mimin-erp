# ECC Gate 4 - Overview AI integration

## Scope

- Consumer: `AgentSearchBox` on MIMIN GROUP Overview.
- Contract: `gate4-agent-company-contract.ts`, shared with the advanced supplier search.
- Guardrail: normalize, reject invalid company identities and merge duplicates before UI state is updated.

## TDD evidence

### RED

- Commit: `c22dd30`
- Test: `normalizes the Overview AgentSearchBox payload through the same Gate 4 contract`
- Expected failure: TypeScript reported that `normalizeAgentSearchPayload` was not exported.

### GREEN

- `npm run test:gate4-overview`: 6 passed, 0 failed.
- `npm run test:gate4`: 6 passed, 0 failed.
- `npm run test:agent-chat-contract`: 3 passed, 0 failed.
- `npm run build`: completed 143/143 static pages.

### Coverage

- `gate4-agent-company-contract.js`: 96.47% lines, 80.68% branches, 88.89% functions.

## Compatibility

The adapter preserves provider and diagnostic metadata. Only the `candidates` collection is normalized and a `gate4` metrics object is appended, so other ERP catalog modules are not changed.
