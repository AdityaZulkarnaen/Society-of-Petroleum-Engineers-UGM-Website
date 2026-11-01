# B2B.4B controlled local migration execution

2026-11-01, Asia/Jakarta. **17/17 migrations succeeded. GO for separately authorized B2B.4C behavioral SQL tests.** No fixtures or behavioral tests were executed. Catalog existence is not evidence that authorization is secure.

## Verified target and preflight

- Branch: `feat/oprec-backend-staging`; commit `127017bad659a7958d23bce47f037022cc656236`.
- Compose project: `spe-ugm-recruitment-b2b3-local`.
- DB container: `11383fa59821673b0f1975ea222c4c5fae73263a192264f68242fb3338dc65d7`.
- Image: `supabase/postgres:17.6.1.136`; image ID `sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00`.
- Exact identities/project/service labels of all four containers matched B2B.4A. All services healthy, sole network `spe-ugm-recruitment-b2b3-local_isolated`. No effective host ports published before or after execution.
- PostgreSQL session/current role/database all `postgres`; inet_server_addr() NULL confirms Unix-socket transport. Executor remained nonsuperuser. Docker endpoint explicitly `npipe:////./pipe/dockerDesktopLinuxEngine`.
- Startup manifest SHA-256 remained `ea59adb299744bda9890b9e117dbd010a56250bf7923664f93d1e17034bb5c7a`. All 17 ordered migration filenames and byte hashes matched reviewed B2B4A-ddl-inventory.md; none edited.
- Freshness: no public tables, no repository migration history, zero Auth users, Storage objects and buckets before execution.
- C: initially 15.87 GiB free, final 15.84 GiB. Docker 29.9.2 responsive; PostgreSQL data filesystem mounted read-write before and after execution.

### Preflight guard correction

The initial read-only guard stopped because it treated every non-Auth/Storage table named migrations as repository history. The only result was `supabase_functions.migrations`, owned by supabase_functions_admin. Reviewed bootstrap/webhooks.sql lines 10-16 and 207 establish this as platform webhook history. Public tables and all checked data counts were empty. Corrected only the ignored local runner to recognize that reviewed platform schema, then reran all mandatory gates successfully. No application SQL ran before this correction; no database state or repository migration was modified to bypass a failure.

## Transport and transaction behavior

Used installed Compose v5.6.1 with explicit project/workdir, `--env-file NUL` and reviewed ignored `compose.exec-only.json`. This credential-free descriptor was used ONLY for exec, never startup. Original secret file was neither read nor ACL-modified. Child environment was allowlisted, excluding inherited database/cloud endpoint variables.

Exact command shape (migration bytes sent directly by Python subprocess, not a PowerShell text pipeline):

```text
docker-compose.exe --project-name spe-ugm-recruitment-b2b3-local --project-directory <absolute-disposable-workspace> --env-file NUL --file <absolute-disposable-workspace>/compose.exec-only.json exec -T --user postgres db psql -X --no-password --host=/var/run/postgresql --username=postgres --dbname=postgres --set=ON_ERROR_STOP=1 [--single-transaction] --file=-
```

First 14 files used --single-transaction. Last three used their reviewed explicit BEGIN/COMMIT without an outer wrapper. Each file ran in a fresh psql process. Target health/identity/isolation and C: >=10 GiB were checked before each file. Running/succeeded entries were flushed and fsynced to a host-only journal; no retries.

## Per-file results

| # | Migration | Result |
| --- | --- | --- |
| 1 | `20260917000000_admin_profiles.sql` | PASS, exit 0 |
| 2 | `20260917010000_divisions.sql` | PASS, exit 0 |
| 3 | `20260917020000_profile_details.sql` | PASS, exit 0 |
| 4 | `20260918000000_elections.sql` | PASS, exit 0 |
| 5 | `20260919000000_super_admin_dashboard.sql` | PASS, exit 0 |
| 6 | `20260919010000_account_period.sql` | PASS, exit 0 |
| 7 | `20260919020000_rekap.sql` | PASS, exit 0 |
| 8 | `20260919030000_proker.sql` | PASS, exit 0 |
| 9 | `20260919040000_division_overview.sql` | PASS, exit 0 |
| 10 | `20260919050000_election_admin.sql` | PASS, exit 0 |
| 11 | `20260919060000_voting_controls.sql` | PASS, exit 0 |
| 12 | `20260919070000_candidate_photos.sql` | PASS, exit 0 |
| 13 | `20260922000000_meetings.sql` | PASS, exit 0 |
| 14 | `20260922010000_division_overview_service_role.sql` | PASS, exit 0 |
| 15 | `20260930000000_update_competencies.sql` | PASS, exit 0 |
| 16 | `20261101000000_recruitment_schema.sql` | PASS, exit 0 |
| 17 | `20261101010000_recruitment_security.sql` | PASS, exit 0 |

No failing migration. Candidate-photo and recruitment Storage policy DDL both succeeded under the unchanged postgres executor. No manual ownership/grant/membership correction or superuser escalation was required. Reviewed GRANT/REVOKE statements within the authorized migrations ran as written.

## Read-only post-migration verification

- 18 public tables installed, owned by postgres, including profiles/divisions and seven recruitment tables. Every recruitment table has RLS enabled; FORCE RLS is false as designed. Owner/BYPASSRLS behavior must be considered by later tests.
- 65 recruitment constraints are catalogued and validated: primary/foreign/check/unique constraints, unique (period_id,nim), unique idempotency_key, rank check, deferred distinct application/main/sub preference uniqueness, composite application/period and configured-option FKs.
- 19 recruitment indexes and seven noninternal recruitment triggers installed.
- Six recruitment-table SELECT policies plus two restrictive Storage policies installed with expected roles, expressions and commands. Recruitment audit has no direct API policy, as designed.
- Ten recruitment functions installed, owned by postgres and SECURITY DEFINER; catalog captures signatures, definitions, search_path settings and ACLs. Legacy is_super_admin/current_division_id/touch_updated_at exist. recruitment_allowed definition checks authenticated identity against current profiles role super_admin and is_active true; no recruitment_access table was introduced.
- Private bucket recruitment-documents exists: public=false, file_size_limit=3145728, reviewed PDF/PNG/PPT/PPTX MIME types. No document bytes uploaded or Storage API operation executed. Bucket metadata was created only by the approved migration.
- supabase_realtime contains public.meeting_attendance: verified rather than relying on the migration catch-all exception block. No Realtime server/browser flow was tested.
- Zero Auth users, profiles, recruitment periods, applications, documents, audit events and Storage objects remain. No synthetic accounts or draft catalogue published.

## Reproducible execution evidence

Ignored artifacts under `.next/supabase-b2b3-compose/b2b4b-execution/`: preflight.json (identity, hashes, resource snapshot), journal.jsonl (34 running/succeeded entries, UTC timestamps, exact hashes/executor/container IDs and exit codes), per-file stderr diagnostics, result.json, catalog-verification.json (constraints/policy/function/trigger definitions), final-health.json. Journal SHA-256: `3033d6838e8e5748aa4c5f5b62443b165253315bd9f5ab55915b179a996a082a`.

No Supabase CLI database migration ledger was created; supabase_migrations.schema_migrations remains absent. Host journal plus frozen source hashes is the completion record. Do not run migration up/db reset or blindly rerun these non-idempotent files. Existing scripts intentionally refuse another execution journal/freshness mismatch. Preserve ignored evidence before cleaning .next.

## Resource preservation and next gate

All four approved services remain running/healthy with no effective host publication. UTS frontend 8ea15b786275, backend 8e22097dc328 and MySQL b2b0c5e225bd retain identical IDs, StartedAt, state and recorded metadata. No container/network/volume/image lifecycle action was performed; old CLI resources left untouched.

GO for separately approved rollback-only recruitment_design.sql execution using the same local target and postgres harness with actual API-role switches. Revalidate identity/isolation/health and unchanged migration/test sources first. No production/cloud project was accessed, no .env.local or cloud secrets read, no seeds or fixture tests run, no push/deploy. Behavioral RLS, inactive-superadmin denial, duplicate/finalization semantics and audited operations remain unverified until B2B.4C. Gateway/browser/upload/download flows are outside this SQL-only evidence.

## Files changed

Added this report. Added ignored local execute_b2b4b.py, verify_b2b4b.py and execution artifacts; no repository migrations, application code, tests, legacy logic or existing reports changed. git diff --check passed.
