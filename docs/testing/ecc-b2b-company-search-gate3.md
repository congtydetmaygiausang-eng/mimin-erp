# ECC Gate 3 - Production Agent Contract

## Production finding

Both the condition builder and direct follow-up input returned `Tin nhắn trống` on
`https://mimin.vn/mang-luoi-san-xuat/`.

The client posted `{ message, history, lastResults }`, while the agent endpoint reads
the conversation from `body.messages`. The endpoint therefore rejected every request
before provider routing or B2B filtering could run.

## Isolated correction

- Build one bounded `messages` array from the last six bubbles plus the current user message.
- Keep `lastResults` unchanged for forward compatibility.
- Do not change search providers, B2B policy, ERP data, database schema or UI filters.

## Verification

- Agent chat contract tests: 3/3 passed.
- B2B company policy tests: 5/5 passed.
- Full Next.js build: passed, including all 143 static pages.

## Production acceptance status

Pending cross-review, merge and deployment. The three location scenarios must be rerun
after production receives this fix.
