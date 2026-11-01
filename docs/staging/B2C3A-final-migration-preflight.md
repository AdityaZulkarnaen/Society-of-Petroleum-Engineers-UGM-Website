# B2C.3A final cloud staging migration preflight

2026-11-02, Asia/Jakarta. feat/oprec-backend-staging. Planning/local file review plus public official documentation/source review only. **No new cloud project/database inspection or write.**

**Decision: NO-GO for the first cloud write now. Recommend pinned Supabase CLI-managed migrations, explicit protected service target, and standard CLI history tracking.** Do not run the existing local psql runner as a cloud migration mechanism. Transport enforcement status, effective DDL/type checks and a version-matched CLI rehearsal remain gates. Nothing in this report authorizes migrations, history creation/repair, SSL changes or fixtures.

## Evidence reviewed and frozen source status

Reviewed B1/B2A dependency/design notes; B2B4A ownership/DDL inventory, B2B4B 17-file execution and B2B4C behavioral results; B2C1 frozen plan/manifest; B2C2A target/inspection procedure; client/CA/final-readiness evidence; B2C2C first attempt, B2C2C1 corrected guard, and B2C2C2 successful inspection. Earlier proposals for session transaction-default changes are superseded: future read-only checks retain one explicit guarded READ ONLY transaction and ROLLBACK, without changing pooled session defaults.

All 17 source-byte SHA-256 values and exact filename order still match B2C1-migration-manifest.json. No migrations edited. Local transaction scan found no CREATE INDEX CONCURRENTLY, VACUUM, ALTER SYSTEM or database-create/drop commands requiring a nontransactional path. Largest file is 17,270 bytes. These checks supplement source review; they are not a SQL parser or a new database execution result.

The prior live inspection is time-specific: PostgreSQL 17.11; no public relations/functions, recruitment tables, repository migration ledger, Auth users, Storage objects or buckets in inspected surfaces. Managed Auth/Storage/UUID objects exist; Storage policy whitelist is active. Do not extrapolate this to all custom schemas/types or current state without a newly approved check.

## TLS finding, official meaning and non-mutating status verification

PostgreSQL documents pg_stat_ssl as the SSL status of a backend connection. A pooler terminates the client connection, so backend ssl=false does not negate the observed client TLS 1.3/verify-full success. It establishes no PostgreSQL TLS on that observed backend leg; provider network protections were not inspected. [PostgreSQL pg_stat_ssl](https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-SSL-VIEW).

Supabase states SSL enforcement governs both shared-pooler legs; changing it restarts the database. Its documentation provides read-only Dashboard, CLI get and Management API GET status paths. We have NOT checked the project's setting. [Official SSL enforcement guidance](https://supabase.com/docs/guides/platform/ssl-enforcement).

Propose a separate approval for ONE setting/status investigation, scoped only to lavxddhrrwsjcshmnwvu:

- Preferred owner action: open this exact project's Database Settings -> SSL Configuration, read ?Enforce SSL on incoming connections? without clicking/toggling/saving it. Record project ref, current state and time, excluding keys/passwords.
- Alternative separately authorized CLI status operation: `supabase ssl-enforcement get --project-ref lavxddhrrwsjcshmnwvu --experimental`, using a staging-only protected API credential/profile. No global credential reuse or project enumeration. Not run here.
- Alternative separately authorized Management API GET path: `https://api.supabase.com/v1/projects/lavxddhrrwsjcshmnwvu/ssl-enforcement`. Private API authentication only; no token/header logging, no PUT/PATCH. Not run here.

Neither SHOW ssl nor client verify-full proves enforcement is enabled. Record current and any pending/requested state returned by the chosen interface; do not infer the setting solely from the earlier backend row.

**Remediation gate:** for the recommended migration route, require evidence of encryption on the backend leg as well as retained client verify-full. If enforcement is off, propose enabling it under a NEW explicit project-settings/reboot approval and agreed interruption window, then separately approve a fresh read-only TLS check. Do not enable it in this phase. If the setting is already enabled but a fresh backend remains ssl=false, preserve same-target evidence and obtain Supabase support clarification; do not weaken the requirement or assume the discrepancy is benign. A direct connection would require separately confirmed Dashboard endpoint/user/network reachability and approval; never auto-switch to it.

A fresh approved probe should record client conninfo TLS and pg_stat_ssl for its own backend under the same guarded transaction. Backend ssl=true proves PostgreSQL encryption, not independently the provider's upstream certificate-verification policy; obtain provider assurance if that is also required. No remediation has yet been shown necessary by a verified setting value, but the observed backend encryption gap must be resolved before writes.

## Managed compatibility and executor matrix

| Requirement | Evidence / remaining verification |
| --- | --- |
| Executor | postgres is nonsuperuser with existing privileged-role membership; use postgres, not supabase_admin. Do not add memberships/superuser/owner overrides. |
| Public schema | Owner pg_database_owner, postgres explicit USAGE. Database owner/effective CREATE was not directly queried; must verify has_schema_privilege(public, CREATE) and database CREATE for history schema. |
| Auth dependencies | auth.users and auth.uid/jwt/role resolve. postgres SELECT passed; ACL indicates Auth access. Verify REFERENCES on auth.users and EXECUTE on auth.uid for the actual migration executor. No Auth accounts required for schema bootstrap. |
| Storage dependencies | buckets/objects exist, owned by supabase_storage_admin; RLS enabled. postgres SELECT passed and observed ACL includes DML. Verify effective INSERT on buckets and existing policy-name conflicts. No ownership change. |
| Policy DDL | Session-loaded supautils grants postgres policy management on storage.buckets/objects. This is encouraging compatibility evidence, not an executed Cloud CREATE POLICY test. |
| Types | public.admin_role is created by #1; standalone types/enums were not inventoried. Require to_regtype(public.admin_role) absent and inspect public pg_type rows/enum labels/owners. Empty pg_class is insufficient. |
| Extensions | pgcrypto 1.3, plpgsql 1.0, uuid-ossp 1.1, pg_stat_statements 1.11, supabase_vault 0.3.1 present. gen_random_uuid resolves. Application files require no pg_net or local webhook bootstrap. |
| Existing triggers | No application table can carry an application row trigger when no public relations exist. Additional enabled event/managed Auth trigger metadata was not fully inventoried; review unexpected hooks before writes, do not disable them. |
| Function ownership | Public functions should be created/owned by postgres; SECURITY DEFINER does not require superuser. Preserve empty search_path and precise function grants; inspect final owner/prosecdef/proconfig/ACL. |
| RLS/defaults | No public/Storage policies returned; broad public defaults for API roles exist. Retain explicit recruitment revoke/regrant/RLS statements. BYPASSRLS owner reads do not validate applicant/staff access. |
| Publication | supabase_realtime exists, owner postgres, no members. #13 catches publication errors; explicit postcheck needed. |
| Cloud version | Managed 17.11 versus local 17.6, same major; actual CLI runner/managed DDL still unrehearsed here. Do not import self-hosted roles/bootstrap or assume service version parity. |

Propose a separately authorized guarded read-only supplement (NOT run): database owner and effective public/database CREATE; auth REFERENCES/uid EXECUTE; Storage INSERT/SELECT; role existence; all public types and admin_role absence; scoped existing trigger/event-trigger metadata; refreshed relation/function/policy/history/user/object/bucket state; own-backend TLS. Inspect to_regclass/column shape before querying any existing ledger. No DDL dry-test, history creation, permission correction or arbitrary function invocation. Stop on conflicts rather than repair them.

## Per-file ordering, dependencies and transaction handling

Apply exactly this full chain, including required legacy objects. Recruitment directly needs profiles/role/is_active/Auth/Storage, but the unmodified active-profile migration also references divisions/elections, and the app session/account UI needs other profile fields. Cherry-picking is not the rehearsed application baseline.

Modes: A = no authored outer transaction; all statements are transaction-compatible and need the runner's per-file transaction/batch. B = authored BEGIN/COMMIT makes the body atomic, but CLI history is recorded afterward (gap explained below). No all-17 atomicity claim.

| # | Exact migration | Mode | Dependency / notable effect |
| --- | --- | --- | --- |
| 1 | 20260917000000_admin_profiles.sql | A | Creates admin_role, profiles FK to auth.users, legacy helper/RLS; type collision gate. |
| 2 | 20260917010000_divisions.sql | A | Divisions/profile FK and helper; removes single-super-admin index. |
| 3 | 20260917020000_profile_details.sql | A | Profile contact/details and division summary fields used by app. |
| 4 | 20260918000000_elections.sql | A | Elections/candidates/votes and typed voting dependencies. |
| 5 | 20260919000000_super_admin_dashboard.sql | A | Adds is_active; division/election dependent dashboard/voting replacements. |
| 6 | 20260919010000_account_period.sql | A | Adds management period to profiles. |
| 7 | 20260919020000_rekap.sql | A | Rekap/competencies and management/save helpers. |
| 8 | 20260919030000_proker.sql | A | Proker/member tables and profile/division-dependent RPCs. |
| 9 | 20260919040000_division_overview.sql | A | Division label DML and overview; empty catalogue valid. |
| 10 | 20260919050000_election_admin.sql | A | Election administration/candidate position/functions. |
| 11 | 20260919060000_voting_controls.sql | A | Voting switch and revised election functions. |
| 12 | 20260919070000_candidate_photos.sql | A | PUBLIC candidate-photos bucket metadata and Storage policies; explicit side effect. |
| 13 | 20260922000000_meetings.sql | A | Meetings/attendance/RPCs; swallowed publication errors require postcheck. |
| 14 | 20260922010000_division_overview_service_role.sql | A | Final division_overview execution restricted to service_role. |
| 15 | 20260930000000_update_competencies.sql | B | Competency data/type/constraint conversion and DROP rating; requires #7, data-loss risk if unexpectedly populated. |
| 16 | 20261101000000_recruitment_schema.sql | B | Seven recruitment tables/constraints/triggers and initial privilege lockdown; depends on profiles/Auth/Storage. |
| 17 | 20261101010000_recruitment_security.sql | B | Active-super-admin checks, precise grants/RPCs/audit/private bucket and restrictive Storage policies; depends on #16. |

All bodies use ordinary transactional DDL/DML; no detected nontransactional statement or external job invocation. Most creates are not idempotent. #15 updates/drops data and assumes the correct predecessor schema. #12 ON CONFLICT DO NOTHING does not reconcile an unexpected bucket. #16 closes broad default access before commit even if #17 fails. No migration inserts catalogue approvals, privileged people or applicants. Source comments saying DESIGN ONLY do not prevent SQL execution; the frozen files are the locally tested artifacts.

## Existing mechanism and history: precise limits

B2B's controlled psql execution used per-file transactions plus a host JSONL journal. It did **not** create or populate supabase_migrations.schema_migrations. Cloud read-only wrappers are inspection-only, likewise no history writer. Running either as-is would not correctly track 17 Cloud migrations.

CLI v2.122.0 history code defines version/name/statements and normal migration inserts. The ledger stores no frozen-file SHA-256; retain the independent manifest. Its setup is itself a database write. [Tagged history implementation](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/command-internal/migration-history.ts).

Version-matched application code batches ordinary files with the history insert, respects authored transaction boundaries, and records history after those files finish. Therefore the first 14 can have body/history atomicity; the last 3 may COMMIT their body before history INSERT. A history failure then leaves applied objects without a version. The routine resets connection settings between files. [Tagged application implementation](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/command-internal/migration-apply.ts).

Do not assert that source review is a CLI database rehearsal. Successful CLI completion must be independently verified as exactly 17 expected versions/names and the expected objects. History entries are not content checksums or behavioral test evidence. No repair/history mutation was run here.

## Strategy comparison and ONE recommendation

| Option | Benefit | Limitation |
| --- | --- | --- |
| CLI-managed, pinned 2.122.0 | Standard history, ordering/pending checks and structured outcomes, avoids a bespoke ledger writer. | Must validate driver/TLS/target configuration and rehearse own-transaction files; known Mode B history gap. |
| Controlled native psql | Existing protected libpq/TLS/passfile path demonstrated; per-file execution easy to audit. | No automatic CLI ledger. Custom DDL/bookkeeping/transaction normalization required for standard history; manually marking files afterward is not an atomic migration strategy. |

**Recommend CLI-managed execution, not a custom psql history writer.** Preserve all frozen files unchanged, use an isolated packet and explicit protected service target, forbid seeds/roles/vault/link shortcuts, and treat Mode B ambiguity as a stop requiring separate recovery review. Standard tooling is more maintainable here than introducing a new ledger protocol. The recommendation is conditional on the rehearsal and gates below, not a claim the existing CLI already ran these Cloud migrations.

Installed CLI version 2.122.0 and top-level help were executed locally with a sanitized environment only. Binary SHA-256: f51f287379f72f8d3cdf8469836fd1474141e57f9935a6fb8edd0f60bdb4995e. Tagged source commit 5afad870388552d0198087d27037da7ac745ba2b was inspected; no downloaded source executed. The older Go source paths do not apply to this TypeScript/Bun release.

Version-specific source establishes that explicit db-url selection supports service/passfile resolution, verify-full loads CA and retains hostname validation, and the db-url path avoids linked temporary-role provisioning. Do not assume a psql profile automatically proves this different driver path. [Tagged parser](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/command-internal/db-config.parse.ts), [TLS driver](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/command-internal/db-connection.sql-pg.layer.ts), [target resolver](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/command-internal/db-config.layer.ts).

The push path reads project environment/config and can include vault work; skip-vault is explicit and seeds/roles stay off. Dry-run skips application in the core but still connects; linked resolution can have other behavior. Require the explicit service route and reviewed isolated packet. No preview was run here. [Tagged push core](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/command-internal/db-push-core.ts), [flags](https://raw.githubusercontent.com/supabase/cli/v2.122.0/apps/cli/src/commands/db/push/push.command.ts).

## Executable plan, FUTURE AUTHORIZATION ONLY

None of the following cloud commands were run. Existing local stack/UTS must not be reset or reused blindly for a fresh history rehearsal.

1. Prepare an isolated ignored packet containing only the exact 17 hash-verified migrations and reviewed minimal config. No .env*, .temp link, seed.sql, roles.sql, functions, schema glob or vault entries. Packet supabase/config.toml proposal:

```toml
project_id = "spe-ugm-staging-migration-packet"
[db.migrations]
enabled = true
[db.seed]
enabled = false
```

Validate this against installed 2.122.0 before using it; no init/start/reset command is authorized. Packet ID is local, not cloud identity. The approved reference must remain a separate pinned guard.

2. Later create a separate password-free migration service profile named spe_ugm_staging_migration with the SAME independently verified host/port/database/user, explicit existing protected passfile/CA, sslmode=verify-full and bounded connect timeout. No startup transaction-default changes. Give it a distinct migration application_name so the read-only profile is not mislabeled as a writer. Protect ACL and Git-ignore it. Reuse no production credentials and send no password-bearing URL/argument. No new credential/role needed.

3. Under separate authorization, rehearse the selected CLI and exact packet against a fresh isolated local Supabase-compatible target (never reset the existing Compose/UTS resources). Verify all 17 history rows, file/body transaction behavior, injected failure before/after authored COMMIT and ledger ambiguity detection. This phase performed no Docker/SQL work. If rehearsal cannot support the strategy, stop and review rather than silently switch mechanisms or change frozen files.

4. Obtain the SSL/status and supplemental Cloud read-only approvals above. Refresh target identity/type/privilege/emptiness and confirm backend TLS meets requirement. Do not create a ledger in read-only inspection.

5. Explicitly approve a CLI dry-run connection using the reviewed packet/service and no extra flags. For this tagged explicit-db-url route, source review indicates the core does not apply migrations/history setup on dry-run; still verify behavior in rehearsal and do not equate any generic CLI preview with an offline command.

Proposed commands below use a NON-SECRET service selector, not a credentialed connection string. They must be launched by a reviewed allowlisted wrapper as the intended user. Variables refer to future reviewed local files, not files claimed to exist now:

```powershell
$cliExe = 'D:/SPE UGM SC/spe-ugm-oprec-staging/node_modules/.pnpm/@supabase+cli-windows-x64@2.122.0/node_modules/@supabase/cli-windows-x64/bin/supabase.exe'
$packetRoot = 'D:/SPE UGM SC/spe-ugm-oprec-staging/.next/b2c3a-migration-packet'
# Child environment ONLY: OS/runtime allowlist + explicit protected
# PGSERVICEFILE, PGPASSFILE, PGSERVICE; no inherited PG/Supabase/Node/seed vars.
# Service name: spe_ugm_staging_migration. Validate its full target/TLS/ACL first.
& $cliExe --workdir $packetRoot db push --db-url 'service=spe_ugm_staging_migration' --dry-run --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Preview failed; STOP, no retry or repair' }
```

Raw shared-shell environment setting is not an adequate guard. The packet/profile/launcher are design requirements and not implemented by this document. Suppress debug/tracing/telemetry support-ticket workflows; keep raw outcomes protected and publish redacted version/file/status summaries only. CLI may load packet environment files; assert none exist. No --linked/--remote/default target, --include-all, --include-seed, --include-roles, --password, automatic yes or link operation.

6. Preview must show exactly the 17 frozen files, no unexpected history/config side effects. Present target/SSL/privilege/rehearsal/preview/rollback evidence. Obtain explicit cloud write approval including ledger bootstrap, ordinary DDL/DML within the 17 files, legacy public bucket, recruitment private bucket, policies and publication changes. Approval must name lavxddhrrwsjcshmnwvu; not inferred from display name.

7. Revalidate immediately; only after write approval invoke the same command without dry-run:

```powershell
# NOT AUTHORIZED NOW; same reviewed wrapper/environment/packet/identity as preview.
& $cliExe --workdir $packetRoot db push --db-url 'service=spe_ugm_staging_migration' --skip-vault
if ($LASTEXITCODE -ne 0) { throw 'Migration stopped; preserve evidence; no automatic rerun' }
```

Use one controlled writer, no app/fixture traffic during bootstrap, bounded external process watchdog verified in rehearsal, and per-file host checkpoint records (source SHA, name/version, start/outcome, redacted SQLSTATE). CLI history is authoritative applied-version state; host log supports forensic reconciliation, never guesses success from one terminal line. No auto-reconnect/reissue of an ambiguous file. The runbook is executable only once its missing wrapper/packet/rehearsal and approvals are completed; do not copy these commands into an unguarded shell now.

## Failure and non-destructive recovery

- Mode A failure normally rolls back that file and its version together; earlier files and independently created history schema may remain. Confirm actual objects/history read-only before resuming.
- Mode B failure before authored COMMIT rolls back the body; after COMMIT or on lost acknowledgement the body may exist without the history row. Do not rerun a non-idempotent file, claim rollback undid it, or allow the next CLI run to blindly reapply it.
- On any connection loss, timeout, missing history, SQLSTATE or unknown commit status: stop, preserve private logs/source hashes/checkpoints, freeze traffic and inspect history plus exact object postconditions under a NEW approval. No automatic migration repair/reset/recreation.
- If an applied body lacks history, reconcile it only through a separately reviewed/explicitly approved recovery operation after proving exact object state; that is outside this phase and ordinary run authorization. An unproven/partial state needs a data-preserving forward fix, not fake applied markers.
- There are no reviewed down migrations. #15 DROP rating can destroy populated data and is not reversed by a later rollback. Before future writes confirm available backup/recovery capabilities on this actual project; do not assume PITR entitlement. Empty-state evidence still needs refreshing.
- Destructive project reset/recreate, schema drops, CASCADE, history repair and Storage object cleanup require distinct approval and data inventory; never use them as generic failure handling. No managed Auth/Storage owner/grant manipulation to force success.

## Pre-execution checklist

- [ ] Explicit intended ref lavxddhrrwsjcshmnwvu; personal org abnfnzzearslinsxnjcb/el-kocan's Org; Mumbai; owner-confirmed API origin and Session Pooler fields independently match the candidate profile.
- [ ] Client-to-pooler verify-full preserved; enforcement status and fresh backend TLS evidence reviewed. Any settings remediation/reboot separately approved/performed/verified, not silently bundled with migrations.
- [ ] Supplementary read-only type/CREATE/REFERENCES/Storage privilege/trigger checks pass; no public.admin_role or other conflicting objects. Fresh Auth/object/bucket/history/application state as expected.
- [ ] Source branch/commit and all 17 hashes frozen; no extra/changed migration; packet/config/profile/CLI binary hashes approved.
- [ ] Native psql inspection remains single READ ONLY transaction; CLI migration workflow is separately labeled/written and does not inherit transaction-default settings.
- [ ] Fresh isolated CLI rehearsal and failure recovery drill passed, especially Mode B; existing Docker/UTS unchanged.
- [ ] Guarded preview reviewed; no roles/seeds/vault/implicit linked target or credential leak; finite watchdog and stop behavior demonstrated.
- [ ] Recovery/backup/commit-ambiguity plan accepted; owner grants specific first-write approval for full set and ledger/bucket/publication side effects.

## Mandatory post-migration verification (read-only, no fixtures)

1. Exactly 17 expected history versions/names in order, no extras, no missing suffix; each source hash still equals manifest. Do not expose stored statements; CLI ledger has no checksum field.
2. Required legacy profiles/divisions/admin_role/is_active/period and authorization functions; expected owners/grants, no unwanted identities or seed data. Legacy inactive-helper behavior is not repaired or certified by recruitment changes.
3. Seven recruitment tables, all RLS enabled; expected 65 constraints, 19 indexes and seven noninternal triggers compared with reviewed source/local evidence, not counts alone. Normalized NIM/period and idempotency uniqueness, distinct ranked preferences and composite FKs present.
4. Ten recruitment functions with correct signatures, postgres ownership, SECURITY DEFINER and search_path/ACL. Active super-admin helper checks auth.uid, role=super_admin and is_active=true; no recruitment_access dependence. Finalization execute restricted to intended server role; no sensitive-column/default-grant leaks.
5. Six expected recruitment SELECT policies and two restrictive Storage fences, correct expressions/roles; audit table direct API access denied by grants/policy design. Service-role bypass is not proof of endpoint authorization. Actual inactive/admin denial/idempotency tests remain a later phase.
6. recruitment-documents exists private, 3 MiB limit, exact MIME allowlist; public candidate-photos settings separately expected from #12, never used for recruitment IDs/CVs. No object bytes uploaded and no real applicants/config approvals created.
7. Explicit supabase_realtime meeting_attendance membership and owner checked; #13's swallowed error cannot stand in for this result. No deployment/API/Storage behavior claim from catalog presence.
8. Zero synthetic/real fixture accounts/applications/documents/audit events expected after schema-only bootstrap, no unintended data writes. Real server/JWT/HTTP/upload/download/CSV security tests require purpose-built scoped staging fixtures and NEW approval; never execute local recruitment_design.sql on Cloud.

## Remaining blockers, approvals and stop

NO-GO now: enforcement setting unknown/backend TLS unresolved, effective schema/type/hook checks incomplete, CLI packet/launcher/security-path and transaction/history rehearsal not yet completed, and no cloud write authorization. The inspected fresh surface and stable hashes are positive evidence, not permission or proof of all DDL compatibility.

Required approvals in sequence: (1) project-specific read-only SSL setting and supplemental DB inspection; (2) ONLY if needed, explicit staging setting change/reboot and follow-up verification; (3) separate isolated local CLI/ledger rehearsal; (4) scoped Cloud CLI preview; (5) first cloud write for exact 17 files/ledger/side effects; (6) later scoped synthetic/API/security tests. No hidden production scope and no automatic phase advancement.

This phase executed only local file/hash analysis, installed CLI version/top-level help and public official documentation/source fetches. No staging/production DB or Management API connection, SQL/DDL/DML/migration/seed/fixture, enforcement toggle, history change/repair, Docker mutation, push or deploy. No production credentials or password contents read. Added this report and ignored source-review/evidence files only; existing work preserved. Stop before any cloud write.
