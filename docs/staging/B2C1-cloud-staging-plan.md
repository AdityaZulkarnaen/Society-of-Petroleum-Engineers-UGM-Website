# B2C.1 cloud staging migration and testing plan

2026-11-01, Asia/Jakarta. Local-file planning only on feat/oprec-backend-staging, HEAD 895e715c2cd561004762e2bcb2d68362d9b0a164.

**GO for review/preparation. NO-GO for any cloud connection or write now.** Update 2026-11-02: owner confirmed the Dashboard identity and session-pooler destination recorded in B2C1-staging-target.example.json: personal organization abnfnzzearslinsxnjcb, reference lavxddhrrwsjcshmnwvu, Mumbai, exact API origin and project-qualified database username. Local identity comparison passes. Credentials, secure inspection tooling, live destination/TLS and managed-platform state remain unverified. The owner explicitly requires continued planning only; no cloud connection is authorized. No production credential or sibling worktree is needed.

## Evidence and its limits

Reviewed the B2B report sequence (preflight/isolation, CLI failure/probe, Compose preparation/image/container/runtime reports, ownership preflight/DDL inventory, migration execution and behavioral tests), all 17 migration sources/dependency statements, recruitment suite, B2A design and current target-selecting scripts/workflow. Earlier NO-GO reports are historical: the effective current evidence is B2B4A/B/C, not a claim that earlier startup failures still apply.

- B2B4B: exact reviewed 17-file chain succeeded on isolated PostgreSQL 17.6 under postgres; seven recruitment tables, 65 constraints, 19 indexes, seven triggers, six table policies and two restrictive Storage policies installed. No source changes or privilege workaround.
- B2B4C: unchanged rollback-only suite exit 0; 22 expected-error calls and 16 explicit invariant checks, plus positive operations. This is not a pgTAP count. Transaction rolled back, checked application/Auth/object rows remained empty, bucket/schema definitions unchanged.
- Existing suite covers some authorization, approval, preferences, uniqueness, finalization/retry and audit paths. It does not cover all assignments, concurrency/deadlines or actual HTTP/Storage/Auth behavior. Owner setup and SQL identity claims do not verify server authentication.
- Prior Docker/disk checks are historical, not refreshed in this planning task. No Docker, database, CLI backend, HTTP or web operation was performed here; local Compose and UTS resources left untouched.

`B2C1-migration-manifest.json` freezes all 17 current file hashes and the local suite hash. All migration hashes were recomputed and matched B2B4A-ddl-inventory.md. This manifest is review evidence, not migration history or permission to execute.

## Migration ordering and dependencies

Retain the full tested chain, in exact timestamp order below. Do not cherry-pick, squash, reorder, import production schema or regenerate an untested baseline for this phase.

| # / file prefix | Purpose and dependency |
| --- | --- |
| 1 / 20260917000000 | admin_role, profiles FK to managed auth.users, timestamps, legacy helper and RLS; core identity substrate. |
| 2 / 20260917010000 | divisions, profile division FK/current_division_id, removes single-super-admin index; supports multiple active super-admins. |
| 3 / 20260917020000 | profile contact/details and division summary; fields queried by application session/dashboard. |
| 4 / 20260918000000 | elections/candidates/votes and typed RPC dependencies required by subsequent dashboard/voting definitions. |
| 5 / 20260919000000 | profiles.is_active and active voting/summary definitions. Recruitment authorization requires this flag; file also depends on #2 and #4. |
| 6 / 20260919010000 | profile management period; queried by existing account management/UI. |
| 7 / 20260919020000 | rekap/competencies, profile-management helper and save RPC. |
| 8 / 20260919030000 | proker/members and active profile/division dependent RPCs. |
| 9 / 20260919040000 | legacy division-name DML and aggregate RPC; empty divisions are valid. |
| 10 / 20260919050000 | election administration/candidate positions; requires #4. |
| 11 / 20260919060000 | election controls and revised RPCs; requires election chain. |
| 12 / 20260919070000 | public candidate-photos bucket metadata and Storage policies; explicit legacy side effect needing approval. |
| 13 / 20260922000000 | meetings/attendance/RPCs, optional publication attachment; requires profiles/divisions/helpers. |
| 14 / 20260922010000 | division_overview becomes service-role-only, replaces earlier function. |
| 15 / 20260930000000 | competency conversion/drop rating and replacement save_rekap; requires #7, contains BEGIN/COMMIT. |
| 16 / 20261101000000 | seven recruitment tables, FKs, guards and initial privilege lockdown; profiles/auth/storage dependencies; BEGIN/COMMIT. |
| 17 / 20261101010000 | live active-super-admin authorization, restricted grants/RPCs/audit, private bucket and restrictive Storage policies; requires #16; BEGIN/COMMIT. |

Recruitment's direct legacy data dependency is profiles(id, role, is_active), auth.uid() and the API roles, not election/rekap/proker data. However, unchanged #5 couples is_active to division/election functions, #2 supplies plural super-admin support, and #3/#6 support the existing application session/account fields. This is why 'only profiles plus two recruitment files' is not a safe substitute for the tested chain. The remaining legacy migrations reproduce the current application's complete schema/history; recruitment does not require any real legacy users, elections or division seed data.

Recruitment uses its own flattened period/main/sub catalogue, not legacy divisions as applicant choices. No recruitment_access table or legacy is_super_admin() authorization dependency. Do not modify voting/auth logic. The legacy helper does not enforce activity everywhere, so recruitment test results cannot certify all legacy endpoints.

## Managed Cloud compatibility risks: inspect later, do not assume

| Locally demonstrated | Managed project gate, still unverified |
| --- | --- |
| Pinned Postgres 17.6, Auth 2.197.0, REST 14.18, Storage 1.81.0; copied official bootstrap. | Capture Cloud PostgreSQL/platform capabilities and required objects, not assume identical versions/roles/default grants. Never run local vendor bootstrap SQL against Cloud. |
| postgres nonsuperuser; supautils policy_grants permits Storage policy DDL. | Inspect actual executor, schema/table owners, grants, memberships, session policy hook and existing Storage policies read-only. Cloud may differ; stop on unsupported policy DDL. No superuser/ownership workaround. |
| Local broad public default grants reset explicitly by recruitment migrations. | Check function/table/column privileges for PUBLIC/anon/authenticated/service_role after application. Do not assume same defaults or infer safety from RLS enabled alone. |
| Unix socket inside private Docker network, no effective host publication. | Verified TLS network destination; direct or session-pooler transport selected from staging's own Connect panel. No transaction-pooler assumption, no local DSN reuse. |
| Minimal stack omitted gateway/Realtimeserver/mail/pooler/browser flow. | Check gateway routes, JWT signing/issuer/audience, key type, PostgREST schema cache, Storage HTTP restrictions, Auth URLs/providers/email settings and operational limits separately. |
| Local migration completion recorded in host journal, no CLI ledger. | Cloud history must be independently inspected. Empty project must have no application migration versions or application objects/users/data; platform service history is expected and distinguished by schema. |
| Policy/bucket DDL and publication mutation succeeded locally. | Fresh target must have no conflicting candidate-photos or recruitment-documents bucket/policy. Candidate bucket is PUBLIC by legacy design; recruitment remains PRIVATE. Meetings swallows publication errors, so verify membership explicitly. |

Most CREATEs are non-idempotent. Competency updates/drop rating are unsafe on unexpected existing data. Existing bucket ON CONFLICT DO NOTHING does not reconcile privacy/settings. Require a fresh target and stop on any conflict. SECURITY DEFINER functions need correct ownership, empty search_path, explicit grants and API role tests. Cloud version parity and privileges remain hypotheses until separately authorized inspection.

## Positive target verification: fail closed

Use `B2C1-staging-target.example.json` only as a non-secret review template. All null identity fields block progress. It is not an implemented runtime guard. Keep the independently approved expected identity separate from the candidate environment/DSN; deriving both from the same file is circular validation.

1. Owner independently opens the intended personal Supabase organization and spe-ugm-staging project, records organization ID, project reference, project name and region. Display name alone is insufficient. Do not enumerate/access the other organization's production project.
2. Independently record staging's Project URL and Connect-panel database endpoint, port, database and username. API origin must exactly equal `https://<approved-ref>.supabase.co` for this plan; no custom-domain fallback. Reject userinfo, custom port, query/fragment, non-HTTPS and substring matches. Pooler host may be shared: verify region/host AND project-qualified username against staging Connect, not a guessed hostname regex.
3. Confirm the project reference in the Dashboard project context, API URL and independently recorded destination all match. Standard direct DB host should match the approved ref where provided by Connect. If using a shared pooler, document that mapping and use the approved session endpoint. Reject unknown transport/custom endpoint rather than infer identity.
4. Credentials must be newly obtained from that exact project, with owner-confirmed provenance. Public/opaque key strings cannot prove project ownership by parsing. Never paste keys/DSNs in report/chat. No access to production is needed to prove staging identity.
5. After a separate read-only connection approval, use trusted TLS verification (verify-full with the appropriate trusted CA) and an explicit destination. Record redacted host/port/database/user, current role/session/database, server version/address and system object metadata. current_database()='postgres' or SELECT 1 alone does not identify a project. Combine TLS/endpoint and independent control-plane mapping. Inspect empty application schema/history/Auth users/Storage objects and platform owners/permissions; query metadata/counts only, no real data export.
6. If ownership, endpoint mapping, credential source, history or data differs, STOP. Do not 'repair history', reset or grant permissions. Obtain a new reviewed plan. Read-only inspection uses explicit read-only transactions; if a credential cannot support safe inspection, resolve that before writes.
7. Immediately before any later write, revalidate branch/manifest hashes, independently approved identity, exact connection mapping and empty baseline. Show the user a redacted approval packet containing org/ref/API origin/DB host-username mapping, expected 17-file set, preview and side effects. A dry-run approval is not write approval.

No cloud dry-run command is run here: it contacts a database. CLI history initialization may also require writes depending on installed behavior; inspect/rehearse that behavior first and include any bookkeeping in explicit authorization. Do not label an unverified CLI dry-run as guaranteed read-only.

## Staging-only environment and execution tooling

Use the existing safe names in docs/staging/staging.env.example. Later create ignored `.env.staging.local` without overwriting an existing file, populate only from independently verified staging. Leave `.env.local` untouched and never copy production files. .gitignore covers .env* and /supabase/.temp/. Staging template is documentation only, not a launcher.

- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: staging public endpoint/key only. SUPABASE_SECRET_KEY: server-only staging secret, never NEXT_PUBLIC_. Generate a separate PRESENSI_TOKEN_SECRET; do not use the current fallback to Supabase secret in staging.
- Keep optional SEED_SUPER_ADMIN_PASSWORD empty; legacy seeds prohibited. Migration credential/PG service/password file separately protected and never committed. Do not log DSNs, password-bearing arguments, JWTs, request hashes or applicant payloads. Redacted errors only.
- Clear inherited SUPABASE_*/PG*/database URLs/Vercel/seed/preload variables in a future allowlisted launcher. Reject unexpected root environment files by filename without reading them. Only .env.example currently exists by filename inspection. supabase/.temp contains only cli-latest by filename; do not use implicit CLI links.
- Next.js does not automatically select .env.staging.local; NODE_ENV=staging is not a guard. Inherited values can override explicit env-file loaders; standard Next development can load .env.local. Build-time NEXT_PUBLIC values remain baked into output. Read version-local Next environment guide before implementing launcher/integration; rebuild into isolated staging output rather than promoting a production bundle.
- No safe staging launcher/migration wrapper exists yet. Implement and review one in a later authorized local-code phase before running application/dev commands with cloud credentials. Expected identity must be pinned independently, environment values strictly parsed and secrets redacted. Local app binds loopback, no tunnel, explicit localhost origin and separate staging cookie/session/storage namespaces; no production analytics or accidental indexing.

Recommended future migration mechanism: pinned installed Supabase CLI with explicit verified target and its migration ledger, no implicit linked target, include-all or seeds. First inspect installed flags and rehearse its handling of these exact transaction-bearing files against a separately approved fresh local target; B2B's direct psql run did not validate CLI runner semantics. Preserve current local stack rather than reset it. If CLI behavior/credential handling cannot meet the gate, propose a separate explicit-TLS psql plan using the B2B per-file transaction model and an approved completion-ledger strategy; do not mix manual SQL and CLI history silently.

Cloud preview and application must use the same frozen source bundle/CLI/target. Do not expose password-bearing --db-url arguments in terminal logs or shared process inspection; select and review supported private credential transport before execution. This report deliberately supplies no ready-to-run cloud write command while identity/transport are unresolved.

## Existing wrong-target hazards

| File/entry point | Risk and plan |
| --- | --- |
| package.json seed:divisions | node --env-file=.env.local then catalogue upsert; no target guard. Prohibited for staging. |
| seed:super-admins / scripts/seed-super-admins.mjs | Lists users, creates organization-shaped accounts, resets existing passwords with updateUserById to a shared seed password, upserts super-admins/divisions. Never reuse for synthetic staging. Direct node execution still inherits endpoints. |
| scripts/seed-divisions.mjs / divisions.mjs | Organization catalogue, not minimal synthetic data. Do not run. |
| .github/workflows/keep-supabase-alive.yml | Scheduled/manual REST GET, not a DB migration workflow; repository-secret target unknown. Do not dispatch, change secrets or point it at staging. Future CI requires a separate protected staging environment and exact identity gate; no automatic migrations. |
| src/modules/super-admin/accounts/actions.ts | Creates/deletes Auth users and edits profiles through secret client. Never browse/action-test against an unverified backend. No standalone reset-password flow was found in bounded source scan; seed reset is confirmed. |
| src/modules/admin/auth/actions.ts and session.ts | Real password sign-in/session checks can contact environment-selected project; do not start plain dev to 'check'. DUMMY_DATA bypass must be disabled in future real auth tests. |
| src/lib/supabase/admin.ts, server/client/proxy | Shared endpoint env selection; admin secret bypasses RLS. Every new recruitment endpoint must enforce verified caller/live profile before privileged operations. |
| supabase/tests/recruitment_design.sql | Owner-level broad UPDATEs, DELETEs, fixed UUIDs, Auth/profile and synthetic Storage rows, role switches, global count assumptions. LOCAL DISPOSABLE ONLY. Never execute on spe-ugm-staging, production, any populated/shared database, or through HTTP APIs. ROLLBACK is not permission to run it there. |
| .next disposable runners/reference compose/bootstrap | Prior-phase execution artifacts, not cloud tools. Never run local bootstrap/role SQL on Cloud. Do not run compose up/down, local reset or cleanup as part of cloud preparation. |

No supabase/config.toml or checked-in seed.sql currently exists; no migration workflow found among the one .github workflow. Reinspect before execution because files/settings may change. No external workflow settings/secrets inspected.

## Minimal synthetic staging data plan: approval required, nothing created

Use a dedicated run UUID and `test.*` profile usernames, no real names/NIM/IDs. Five Auth identities suffice for the initial recruitment matrix:

| Identity | Initial state and tests |
| --- | --- |
| SA-A | active super_admin; review/download/export in two periods; use existing JWT after deactivate, restore then demote to admin and verify immediate denial. Restore only synthetic fixture in approved cleanup. |
| SA-B | active super_admin in a different synthetic division; proves all active super-admins without per-period grant rows. |
| SA-inactive | super_admin, is_active=false throughout initial tests. |
| Admin-A | active ordinary admin, denied recruitment administration. |
| Auth-no-profile | authenticated identity with no profiles row, denied. |

Anonymous requires no account. Applicants require no Auth/staff account. Two optional synthetic legacy divisions support existing dashboard sign-in/navigation; recruitment catalogue is independent. If exercising existing username UI, its accountEmail mapping requires `test.*@accounts.spe-ugm.internal`, not arbitrary .invalid Auth emails. Keep synthetic contact fields .invalid, disable outbound mail/SMS and avoid recovery links to real addresses. Use independently generated strong passwords, no shared seed password, no overwriting existing users. Use reviewed staging Auth admin API fixture tooling with explicit target gate and allowlisted created IDs; fixture approval includes scoped live-state transitions. Never insert/delete managed Auth rows directly as a cloud setup shortcut.

Create two isolated test periods (synthetic-open/second-period) and a draft-unconfirmed period. Four synthetic sub-divisions within one parent cover required/optional/none/unconfirmed. Label all data SYNTHETIC TEST; this is not an approved committee catalogue. Approve only coherent synthetic required/optional/none configuration for test periods, never publish the unconfirmed/draft rules as approved. Approved config is immutable: use new test periods for changed rules, not disable guards. Calendar, batch and document-slot rules explicit; no real registration advertised.

Small staged fixture set (reuse scenario definitions, not duplicate NIMs): complete required/none, optional absent, optional present, two distinct same-parent choices, same normalized NIM/different email duplicate, and fresh NIM/shared email success; repeat rank reversals and period-isolation cases. Rejected/withdrawn applications retain NIM; no applicant self-service editing or email-only recovery. All documents generated PDF/PNG/PPT/PPTX with conspicuous synthetic watermark, no real identity scans. Test exact 3 MiB, one byte over, empty files and MIME/extension/content mismatch. Staging Storage writes use its API, not SQL object-row fixtures.

## Expanded test matrix and expected behavior

1. Assignment matrix: for each rank, required missing fails/present-valid passes; optional absent/present-valid passes; none absent passes/present rejected; unconfirmed blocks approval/intake. Swap ranks and preference choices and verify stale assignment files removed/revalidated, two distinct choices in same parent allowed, duplicate exact choice/invalid ranks rejected. Test rules on server as authoritative, not client-supplied flags. Unconfirmed corrupt approved data must not be manufactured in Cloud; approval rejection is the valid cloud negative test, deeper forced-corruption tests stay disposable local.
2. Deadlines: server/db clock is authoritative, opens_at inclusive/closes_at exclusive. Test before-open, exactly-open, just-before-close, exactly-close, after-close, manual pause and unapproved/missing period; finalize an upload started before deadline after close and expect rejection. Deterministic boundary/fake-clock and concurrent pause races first local; cloud test periods use short schedules, no system clock changes, no immutable-calendar bypass.
3. Concurrency: parallel same-NIM/different emails/keys gives one application reservation; same key/hash retry yields stable receipt and one submission audit; changed payload/hash conflicts; different periods independent. Exercise two HTTP workers, upload/finalize race, review race and rollback failure path. Never log raw NIM/hash/key. Current schema idempotency_key is globally unique; use unique request keys across periods and review any different intended API semantics. DB uniqueness rejects noncanonical NIM; server must consistently normalize before lookup/write. Unicode/punctuation normalization remains a business decision.
4. Authorization: real JWT issuance/signature/issuer/audience/expiry and current profile checks on every endpoint. Active super-admins allowed across periods; inactive/demoted/admin/no-profile/anonymous denied even with retained JWT/session. Test RPC and REST paths as real API roles, never use secret-key success to claim RLS proof. Direct applicant finalization denied; approved server service-role path succeeds. Browser/service secrets never exposed.
5. Private Storage: authorize writes via reviewed server path; test public URL, anonymous and ordinary-auth list/get/download/upload/upsert/move/copy/delete denied for recruitment documents; active super-admin must use authorized audited download endpoint rather than direct Storage bypass. Check cross-period/app/document path tampering and forged metadata, short-lived signed URL policy if adopted, byte limits/content scanning and interrupted-upload cleanup. Broad permissive-policy resistance tests that require DDL remain isolated local, not on shared cloud staging. Audit event proves authorization, not receipt of bytes. Inventory/list policies alone are not proof.
6. Actual HTTP submission: implement endpoint first (current wizard is memory-only simulation). Validate server personal fields/catalogue/exact two preferences, canonical hash, file bytes/scanner, active period, NIM uniqueness and idempotency; orchestrate staged uploads/finalize with safe failures. Reject forged status/role/period/rule/object paths and unexpected fields; verify CSRF/origin protections as applicable, abuse/rate limits, missing/invalid session handling and no raw sensitive logs. No email-only recovery or self-service editing after submit. Committee correction workflow remains separately designed.
7. Audit/export: submission once, each allowed review, export and document authorization attributed to correct actor/period; failure atomicity; no raw documents/tokens/passwords/full payloads in logs. Verify CSV escaping/formula injection, field minimization, pagination, export row isolation and access after deactivation. Do not claim ordinary direct SELECTs are audited; they are not routed through an audit hook.

Expanded local cases and new scoped HTTP fixture tooling need implementation/review before being called tests that passed. Synthetic cloud suite must be purpose-built and ID-scoped, tolerate only its own run IDs, fail on collisions, record created resources, and never use global UPDATE/DELETE or whole-table rollback assumptions.

## Execution checklist and approvals

Every phase is a separate decision; nothing below was executed.

1. [ ] Independently approve non-secret staging identity record (personal org ID, explicit ref, API URL, direct/session destination mapping). Missing fields = NO-GO. Local wrapper/credential-handling review completed; source hashes remain frozen.
2. [ ] Approve **read-only staging connection/catalog inspection only**. Confirm managed versions/owners/grants/bootstrap/API roles/auth.uid/UUID, fresh application objects/history/users and buckets. If any data or unexpected history exists, STOP and redesign for that populated state.
3. [ ] Approve **CLI preview/dry-run contact**, after inspecting installed behavior and any migration-ledger bootstrap side effect. Rehearse CLI runner transactions on a separately authorized fresh local target if CLI is selected. Preview exactly 17 known files, no seed flags, include-all, reset, repair or inferred link.
4. [ ] Present redacted target+preview+diff+rehearsal+rollback packet. Obtain **explicit cloud migration write approval** for the exact org/ref/destination and all 17 hashes, including public candidate-photo bucket, private recruitment bucket, publication and migration-ledger writes. Credentials from staging only, no app/CI traffic during bootstrap.
5. [ ] Recheck target/hashes/freshness immediately; execute with first-error stop, sanitized logs and per-file checkpoint/history inspection. Do not assume whole-batch atomicity. Preserve transaction semantics for first 14 versus last 3 files; reject untested runner behavior. Reconcile history read-only after interruption before any further action.
6. [ ] Read-only postchecks: all 18 legacy/recruitment tables, owners, constraints, RLS, policy/function definitions/ACLs, explicit public/anon/auth/service privileges, private bucket settings, expected public legacy bucket, publication membership and exact applied history. No automatic account creation.
7. [ ] Review new staging-only synthetic fixture and cleanup scripts and proposed counts/periods/files. Obtain **explicit Auth/profile/config/Storage fixture-write approval** and separately scoped **HTTP/RLS behavioral test approval**, including live profile changes. Existing local recruitment_design.sql remains forbidden in cloud.
8. [ ] Run scoped integration matrix with user-JWT and unauthorized paths; preserve sanitized results, clean only owned synthetic IDs through approved safe workflow; verify bucket privacy and no unintended users/rows. Stop on first security failure; no privilege bypass. Deployment and real intake require separate approval, business rules/consent/retention and closed security gaps.

A failed/missing gate is NO-GO for its dependent phase, not permission to switch to production, use SQL editor as an escape hatch or assume a project with the same name is equivalent.

## Rollback/recovery

There are no reviewed down migrations. Prefer a reviewed forward fix; never replay the whole non-idempotent chain. Before migration, record verified empty baseline and available backup/recovery capabilities in this particular project (do not assume paid PITR or snapshot entitlement). Freeze app traffic and keep migration/fixture logs with hashes and version statuses. A single file's rollback does not undo earlier committed files; CLI ledger success must be reconciled with actual objects, especially files with their own COMMIT. If uncertain after connection loss, stop rather than replay.

If brand-new empty disposable staging bootstrap fails, a project reset/recreation is an OPTION requiring fresh explicit approval, independent target proof and data/resource inventory; no automatic db reset/drop/CASCADE/history repair. Platform roles/schema ownership are not recovery knobs. If populated, take an approved backup and design a data-preserving forward migration; the clean-project plan no longer applies.

Synthetic cloud cleanup is also a write phase: restrict to run-owned IDs, account for FK/immutable-child guards, approved catalogue immutability and audit/retention. Delete actual object bytes through Storage API before metadata cleanup via a separately reviewed maintenance path; do not directly delete storage.objects or disable triggers/RLS. Do not delete unrelated users/buckets or scrub operational audit evidence. Auth deletion/profile FK cascades are not a generic cleanup shortcut. Review cleanup mechanics before approving fixture creation so test data is not stranded.

## Stop decision and file summary

GO for plan review. NO-GO now for cloud connection, migration, dry-run, fixtures or HTTP tests: owner-confirmed Dashboard identity now recorded but secure credential/tooling path and connection authorization outstanding, managed bootstrap/privileges unknown, safe launcher/migration transport not implemented/rehearsed for Cloud, expanded security/HTTP matrix unexecuted, official catalogue/calendar/consent/retention/correction and NIM identity checks unresolved. Local successes do not close these gates.

Added this plan, B2C1-migration-manifest.json and B2C1-staging-target.example.json. No migrations/tests/application/environment/workflow files changed. No credential values read/copied, no .env.local change, no cloud/API/database/CLI operation or Docker mutation, no Auth/Storage creation, push or deployment. Local stack and UTS untouched. Documentation-only checks: frozen hashes equal reviewed 17-file inventory, JSON templates parse, git diff --check.
