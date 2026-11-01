# B2A confirmed-rules revision: local verification

Date: 2026-11-01. Branch: feat/oprec-backend-staging. Starting tracked tree was
clean. No SQL, migration, seed, Storage operation, cloud API or database connection
was executed. No environment file or legacy auth/voting policy was changed.

## Actual frontend checks

| Check | Result |
| --- | --- |
| Credential-free copy and network-guard probes | PASS: external Node fetch/TCP/TLS/HTTP/HTTPS/DNS blocked; guard inherited by worker. |
| Source mock assertions | PASS: identical preferences rejected at both ranks and final validation; same-parent distinct choices allowed; all four assignment states, parent-child rules, format/size boundaries, draft/demo/approved separation and no persistence/backend import. |
| Next.js webpack production build | PASS in sanitized copy, including build-time TypeScript. |
| Explicit TypeScript noEmit | PASS in sanitized copy. |
| Harness frontend ESLint | No errors; one pre-existing unused SPONSORS warning in src/modules/home/hero/index.tsx. |
| Focused ESLint on four changed frontend/test files | PASS with no warnings/errors. |
| Actual sanitized Next.js server proof | PASS: no backend credentials; external request blocked. |
| Desktop/mobile Chrome flow | NOT VERIFIED: runner attempted, stopped at local Chrome debugging transport before form assertions. Initial ECONNRESET, subsequent Page.enable timeout / debugging-endpoint unavailable. |
| JavaScript syntax and git diff whitespace checks | PASS. |
| SQL/RLS/integration suite | NOT RUN, explicitly prohibited. |

The full mock command was `node scripts/recruitment-mock/check.mjs`. The second
build/check copy was `.next/recruitment-mock-Slbj5f`; artifacts/logs are ignored.
Browser-only diagnostics reused that exact sanitized build and repeated the actual
server isolation proof. No networking protection was removed to make Chrome pass.
Browser startup now uses a fresh profile per attempt and bounded loopback debugging
readiness retries, avoiding a stale DevToolsActivePort on reruns. The updated
desktop/mobile assertions for duplicate choices, same-parent acceptance, assignment
clearing and restoring valid choices remain authored but NOT browser-verified.

Dependencies were reused through an ignored node_modules junction to the existing
sibling worktree's installed packages; no install/download or sibling env read.
Only cached static font assets were copied into ignored .next/static directories
to satisfy the existing offline-font harness. Read the installed Next.js 16.3.5
environment/form guides before frontend changes. The harness launched Next.js only
inside its sanitized copy, never the original checkout. Temporary next-env.d.ts
and diagnostic runners under .next are ignored; no generated artifacts are staged.

## Changed tracked source files

1. supabase/migrations/20261101000000_recruitment_schema.sql
2. supabase/migrations/20261101010000_recruitment_security.sql
3. supabase/tests/recruitment_design.sql
4. docs/staging/B2A-recruitment-design.md
5. src/modules/recruitment/validation.ts
6. src/modules/recruitment/wizard.tsx
7. scripts/recruitment-mock/assert-source.cjs
8. scripts/recruitment-mock/browser.mjs
9. This new verification report.

## Before isolated database tests

All SQL remains UNVERIFIED. Explicit approval for a disposable LOCAL Supabase stack
and synthetic fixtures is required before testing any of the 17 migrations.
Verify pinned tooling, no cloud target, complete migration order and reviewed
hashes. No CLI installation or stack startup occurred here. Resolve the local
Chrome/CDP runner issue separately before declaring browser QA passed.

Real backend use additionally needs the documented submission/download/CSV server
endpoints, server canonicalization/hash checks, file scanning, duplicate abuse
protection, consent/retention and an authorized committee correction procedure.
Those are not prerequisites to testing SQL with synthetic data in an approved
isolated local stack, but remain blockers to collecting real applicant data.

No push, deployment, privileged account creation or production credential access.
