# Phase B1: isolated staging preparation

Local inspection: 2026-11-01 (Asia/Jakarta). No project connections, external
APIs, dependency installation, SQL, migrations, seeds, storage operations,
application startup, push, or deployment were performed.

## Worktree and credential boundary

- Worktree: `D:\SPE UGM SC\spe-ugm-oprec-staging`.
- Branch: `feat/oprec-backend-staging`.
- HEAD: `a42f2e78ccb98af827e28dc2fd8ffe9615c7d4b1`.
- Initial `git status --short`: clean. The sibling worktree is on
  `feat/oprec-2026-2027` at the same commit; its files and credentials were not read.
- Linked Git worktrees share repository metadata and refs, not environment
  isolation. Do not change shared Git config or reuse sibling environment files.
- Recursive filename inspection found only `.env.example`; no `.env.local`,
  `.env.production*`, or staging credential file. No `.vercel` or Supabase link
  metadata was present in this checkout. No matching inherited Supabase,
  database URL, seed password, attendance secret, or Vercel variable names were found.
- A local scan emitted file names/counts only, never matching values: zero files
  matched hosted Supabase project URL, `sb_secret_`, JWT literal, or credentialed
  PostgreSQL URL patterns. This is bounded evidence, not a complete secret audit;
  opaque keys, binary contents, Git history, external credential stores and other
  worktrees were not audited. No production credential values were opened/copied.
- The project name `spe-ugm-staging` comes from the owner. Its project ref,
  organization ID, endpoint, keys, permissions, and actual schema remain unverified.
  Production belongs to another organization: assume no shared configuration.

## Dependencies and local tooling

`package.json` and `pnpm-lock.yaml` specify Next.js 16.3.5, React 19.2.8,
`@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.116.0 (locked).
Package manager: pnpm 11.24.0. There is no project Supabase CLI dependency,
`supabase/config.toml`, seed SQL, or checked-in link state.

`node_modules` is absent. The required version-specific Next.js guide under
`node_modules/next/dist/docs/` is consequently unavailable here; no application
code was written. Before future code changes, install dependencies under separate
network authorization and read that local guide, particularly environment loading.
Do not download CLI/tooling implicitly through `npx` during offline preparation.
CLI version and supported flags must be checked locally before execution.

## Environment template and private configuration

`staging.env.example` contains names and safe placeholders only. It is stored in
this directory to keep the existing production-oriented `.env.example` untouched.
The root `.gitignore` already ignores `.env*` except `.env.example`; therefore
root `.env.staging.local` will be ignored. Never use `git add -f` for credentials.

After authorization to configure staging:

1. Copy this template to root `.env.staging.local` using the command below.
2. Obtain values independently from the personal staging organization; never
   copy any file/key from the live organization's project. Record the exact
   staging organization ID, project ref and endpoint in private local notes.
3. Populate the public URL and publishable key from that project. Keep
   `SUPABASE_SECRET_KEY` server-only; use a fresh random attendance secret and
   unique synthetic test passwords. Leave optional seed/DB variables empty
   until needed. Never commit database passwords, CLI tokens, or private notes.
4. Use a password manager/private editor, restrictive local file permissions,
   and no terminal echo, screenshots, chat paste, or shell history containing keys.
   Verify ignore behavior before populating and before committing.
5. `.env.staging.local` is NOT an automatically selected Next.js environment.
   `NODE_ENV=staging` is not a supported isolation strategy. Normal development
   may load `.env.development.local`, `.env.local`, `.env.development`, `.env`,
   and inherited process variables. Existing process variables can override
   Node `--env-file`; specifying a file alone is insufficient.

The marker variables in the template are documentation inputs, NOT an enforced
runtime guard. Opaque secret/publishable keys cannot be proven to belong to the
endpoint by parsing their strings. Provenance must be confirmed independently;
eventual authentication tests require separate connection approval.

## Existing commands and network/write hazards

| Entry point | Risk / required treatment |
| --- | --- |
| `pnpm seed:divisions` | Explicit `node --env-file=.env.local`; upserts the organization catalogue using the secret client. No target check. Do not run. |
| `pnpm seed:super-admins` | Same env loader; lists Auth users, creates/updates division coordinators and profiles, resets existing passwords to one shared seed password. Uses organization usernames/internal email domain. Do not run or reuse as staging fixtures. |
| Direct `scripts/seed-*.mjs` | Inherited environment alone is sufficient to target a backend; bypassing package scripts does not make them safe. |
| `pnpm dev`, `build`, `start` | No staging guard. Next.js environment loading and proxy/auth/server clients may contact the configured project. Google fonts may download at build time; analytics can make browser requests. Do not run in B1. |
| `src/lib/supabase/admin.ts` | Secret client bypasses RLS; target comes solely from environment. Existing authorization must be reviewed when adding endpoints. |
| `src/modules/admin/presensi/token.ts` | Falls back to Supabase secret when attendance secret is absent. Set a distinct staging secret later. |
| `src/lib/site.ts` | Falls back to Vercel production hostname; undefined `VERCEL_ENV` also means indexable. Set localhost explicitly; do not treat this as a staging noindex guard. |
| `.github/workflows/keep-supabase-alive.yml` | Scheduled/manual curl uses repository secrets `SUPABASE_URL`/`SUPABASE_KEY`. Their target is unknown, possibly live. Do not dispatch it or reuse these secrets for staging. Future CI needs a separately scoped staging environment and exact target guard. |
| `scripts/recruitment-mock/check.mjs` | Inspected credential-free copy/environment allowlist and network guard. Existing source-only mode still requires installed dependencies and cached font/build assets, absent here. Not run. This harness is for mock QA, not a backend target guard. |
| `cloudflared.exe` | Tracked tunnel binary; not executed. Do not expose this local staging session via a tunnel. |

## Migration inventory and clean-project assessment

Apply only in filename order, if later approved. No migration was edited.

| Filename prefix | Purpose / dependency |
| --- | --- |
| `20260917000000` | Base enum, profiles referencing `auth.users`, timestamp trigger, super-admin helper and RLS. |
| `20260917010000` | Divisions, profile FK and division helper; removes single-super-admin index. |
| `20260917020000` | Profile details, division tags and summary RPC. |
| `20260918000000` | Elections, candidates, votes and voting RPCs. |
| `20260919000000` | Active profile flag, super-admin summary reading Auth, updated voting eligibility. |
| `20260919010000` | Profile management period. |
| `20260919020000` | Rekap/competencies, division management helper and save RPC. |
| `20260919030000` | Proker/members and RPCs; uses active profiles/divisions. |
| `20260919040000` | Existing division name update and aggregate RPC; empty divisions are valid. |
| `20260919050000` | Election administration RPCs and candidate position. |
| `20260919060000` | Voting switch, delete and live results. |
| `20260919070000` | Inserts public `candidate-photos` bucket and Storage write policies. |
| `20260922000000` | Meetings, attendance, RPCs and optional Realtime publication addition. |
| `20260922010000` | Changes division aggregate RPC to service-role-only. |
| `20260930000000` | Competency rename, 12-value constraint, score precision/ranges, sort order, drops rating and replaces save RPC. |

Static verdict: the 15-file chain appears internally ordered and plausible for a
clean standard Supabase database. No definite clean-project blocker was found
by source review. SQL compilation, privileges and runtime behavior are UNTESTED.

Dependencies and concerns before approval:

- Not generic PostgreSQL: requires `auth.users`, `auth.uid()`, `anon`,
  `authenticated`, `service_role`, Storage schema/tables, `gen_random_uuid()` and
  an execution role permitted to create types/tables/functions/policies and
  modify Storage policies/publication. Do not infer these from production.
- Most creates lack `IF NOT EXISTS`: run via migration history, not repeated
  manual SQL pastes. A partial application needs inspection, not blind replay.
- The bucket migration is a Storage metadata write even when bundled as SQL.
  `candidate-photos` is PUBLIC and intended for election portraits, never
  recruitment IDs/CVs. `ON CONFLICT DO NOTHING` does not reconcile a pre-existing
  bucket's settings. Confirm the target is clean and approve this side effect.
- Meetings catches all errors around Realtime publication changes. A successful
  migration does not prove Realtime was enabled; check explicitly later.
- Final `division_overview` and `record_attendance` require service role and
  server authorization. Test anonymous/authenticated denial and server checks;
  a service-key-only happy path cannot validate RLS.
- SECURITY DEFINER functions and default table grants require explicit role
  testing. Profile activity is not checked by every helper; test deactivated
  users with an existing session, not only fresh login denial.
- Competency conversion updates existing rows, can conflict with mixed old/new
  labels, and adds score constraints before dropping `rating`. Empty tables avoid
  existing-data issues; the last migration is not generally replay-safe.
- Division name updates on empty tables do nothing; migrations create no Auth
  test users and do not populate divisions. This is valid, but UI can be empty.
- There are NO recruitment application/period/upload/reviewer tables or policies
  in this chain. Phase A remains a memory-only demo; the approved recruitment
  catalogue is empty. Applying these migrations will not enable real recruitment.
  Applicant authentication, reviewer roles, statuses, duplicate rules, private
  bucket access, retention and consent need a separately reviewed schema design.

## Safe command plan

Offline inspection commands (no backend target):

```powershell
git branch --show-current
git rev-parse HEAD
git status --short
git diff --check
git check-ignore --no-index .env.staging.local
```

Future placeholder copy only, refusing to overwrite private config:

```powershell
if (Test-Path -LiteralPath '.env.staging.local') { throw 'Staging file already exists' }
Copy-Item -LiteralPath 'docs/staging/staging.env.example' -Destination '.env.staging.local'
git check-ignore --no-index .env.staging.local
```

Before any future development command, implement/review a fail-closed launcher:

1. Require this absolute worktree and branch; reject every root `.env*` except
   `.env.example` and `.env.staging.local` by name without reading unexpected files.
2. Create an allowlisted child environment; exclude inherited Supabase, DB,
   Vercel, seed, Node preload/options and package-manager injection variables.
   Parse ONLY `.env.staging.local`; reject missing, duplicate or placeholder inputs.
3. Require the exact independently verified staging ref and project name;
   compare HTTPS origin exactly with `https://<verified-ref>.supabase.co`, reject
   userinfo, custom ports, query, fragment and alternative hosts. Verify DB host
   and project-qualified username separately for direct/pooler URLs. Never rely
   on a substring containing 'staging'. Keep expected identity separate from
   the candidate config so a self-consistent wrong file cannot pass.
4. Print only PASS/FAIL, branch and approved project ref; never key/password/DSN.
   Start the local Next binary from the sanitized environment on loopback, with
   localhost origin and deliberate staging indexing/analytics safeguards.

Proposed future interface: `node scripts/staging/run.mjs verify`, then
`node scripts/staging/run.mjs dev`. These commands are a DESIGN ONLY: no launcher
exists yet. No existing package command currently enforces this boundary.
Do not substitute a plain `pnpm dev` or `node --env-file` command.

## Staged migration checklist — execution NOT authorized

1. Obtain explicit approval for staging connection and dry-run first. Confirm
   personal organization ID, project ref, project name, endpoint, DB identity
   and empty project/history using staging-only access. Never enumerate live
   projects to find staging or borrow production access.
2. Provision/review a locally installed, pinned CLI; inspect `supabase --version`
   and `supabase db push --help` offline. Verify supported flags against that
   version. Use a clean CLI context, no inherited link or production tokens.
3. Capture migration file hashes and commit; freeze that set. Review bucket
   side effects and all dependencies above. Configure a staging-only database
   credential privately; no DSN in shell history or report.
4. With authorization for a disposable LOCAL database, configure a Supabase local
   stack and rehearse the exact full chain without seeds. This requires tooling,
   possible image downloads and actual local writes, so it was not done in B1.
   A remote CLI dry-run does not execute/compile SQL and cannot replace rehearsal.
5. After exact target verification, proposed remote preview command:
   `supabase db push --dry-run --db-url "$env:STAGING_DB_URL"`.
   It contacts staging even though it should not apply migrations. Run only after
   approval; inspect installed CLI behavior first. The DSN can be visible to local
   process inspection: use a private session, no tracing/transcript/debug output,
   and do not publish raw CLI logs. Use only verified staging credentials.
6. Inspect preview: exactly these 15 files in order, no unknown remote history,
   no unreviewed files or seed flag. Stop on mismatches. Save a redacted summary,
   not raw credentials or debug traces. Never repair history automatically.
7. Present dry-run and rehearsal results; obtain explicit migration execution
   approval. Approval of B1 documentation does not authorize migration writes.
8. Only then use the same verified explicit DB target and pinned CLI with
   `db push` without `--dry-run`, no seeds. Re-check identity immediately before
   execution. Do not use implicit linked targets, `--include-all`, `db reset`,
   production imports, or copied production schema/data.
9. Record applied versions and test schema, RLS/RPC role matrix, Auth separation,
   Storage privacy and Realtime independently. Stop on first failure. Do not
   assume all files form one atomic transaction; the competency file has its own
   BEGIN/COMMIT. For a failed disposable staging bootstrap, inspect history and
   propose recovery; destructive reset/recreation needs separate approval.
10. Review a separate synthetic fixture script and approve its execution before
    adding users/data. Do not run existing production-shaped seeds.

## Minimum synthetic fixture plan (nothing created)

For existing dashboard authorization tests: two fake divisions `test-a`/`test-b`
and six Auth identities: active super-admin A, active super-admin B, active admin
A, active admin B, inactive admin A, and authenticated user with NO profile.
Also test anonymous access without an account. Use `test.*` usernames and fake
names; internal Auth emails must follow the app's username mapping until that
mapping is separately changed. Use `.invalid` for contact emails, dummy phone/NIM,
no real people, outbound email/SMS or reused passwords. Creating these synthetic
super-admins would be staging-only and requires later explicit seed approval.

For recruitment, start with five synthetic application scenarios in the demo;
these are test cases, not proposed persisted status enum values:

| Case | Minimum coverage |
| --- | --- |
| A | Complete data, first preference required assignment attached; second has none. |
| B | Optional assignment omitted, then attached; reverse preference coverage. |
| C | Unconfirmed assignment blocks submission; incomplete required fields/files. |
| D | Invalid/oversized documents, invalid subdivision, invalid date/email/phone. |
| E | Same identity/period repeated, changed period, reset/reload; define expected backend duplicate behavior before persistence. |

Use synthetic PDF/PNG fixtures for CV, ID card, commitment, follow proof and
story proof; boundary cases at 3 MiB and one byte over, plus extension/MIME
mismatch. Assignment rules must use `2026-2027-demo` and its example divisions,
never be presented as approved organization requirements. Do not upload any
files yet. Applicant accounts are not required for the current anonymous demo;
if future backend design authenticates applicants, add two synthetic applicants
to test ownership/isolation. Reviewer access and application lifecycle tests must
wait for an approved recruitment role/status model, not reuse dashboard roles
by assumption.

## B1 stopping point

Preparation artifacts only. No backend isolation has been validated through a
connection, no SQL compatibility has been proven by execution, and no migration
or fixture is authorized by this report. Next decision: review staging identity,
launcher/schema design and authorize the scoped connection/rehearsal/dry-run
phase. Actual migration execution remains a separate explicit approval gate.
