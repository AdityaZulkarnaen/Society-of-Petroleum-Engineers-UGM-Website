# Staging migration execution ? 2026-11-02

Result: **17/17 applied and recorded.** Only independently verified staging project `lavxddhrrwsjcshmnwvu` was targeted. Owner explicitly authorized this execution and confirmed SSL Enforcement enabled.

## Safety and execution evidence

- Exact owner-confirmed Session Pooler, database postgres and project-routing username matched the protected profile. Production credentials/environment files were not used.
- Native PostgreSQL 17.11 client and CA hashes verified. Client verify-full succeeded with TLS 1.3; backend pg_stat_ssl.ssl=true. Identity/current role postgres, explicit READ ONLY transaction and ROLLBACK passed before and after execution.
- Prewrite target had no public relations/types, repository history, Auth users, Storage objects or buckets. All reviewed effective DDL privilege gates passed.
- Frozen source hashes: 17/17 match before execution and after verification. Original migration SQL was unchanged.
- Pinned CLI 2.122.0 binary SHA matched. Isolated packet contained only the 17 reviewed files and seed-disabled config. Explicit protected staging service, validated CA/passfile, isolated CLI home, no inherited credentials or project links. Skip-vault; no seed/role flags.
- Preview exited 0 and listed exactly the 17 expected pending migrations. Apply exited 0 and emitted exactly 17 ordered Applying migration events. No retry, repair or reset.
- The host log checker initially flagged duplicate filenames because both confirmation and execution list them. Execution was stopped; subsequent read-only verification established all 17 ledger rows. No migration was rerun. Protected original parser result retained alongside this explanation.

## Per-file results

| Migration | Apply | Standard history |
| --- | --- | --- |
| 20260917000000_admin_profiles.sql | PASS | version/name match; statements nonempty |
| 20260917010000_divisions.sql | PASS | version/name match; statements nonempty |
| 20260917020000_profile_details.sql | PASS | version/name match; statements nonempty |
| 20260918000000_elections.sql | PASS | version/name match; statements nonempty |
| 20260919000000_super_admin_dashboard.sql | PASS | version/name match; statements nonempty |
| 20260919010000_account_period.sql | PASS | version/name match; statements nonempty |
| 20260919020000_rekap.sql | PASS | version/name match; statements nonempty |
| 20260919030000_proker.sql | PASS | version/name match; statements nonempty |
| 20260919040000_division_overview.sql | PASS | version/name match; statements nonempty |
| 20260919050000_election_admin.sql | PASS | version/name match; statements nonempty |
| 20260919060000_voting_controls.sql | PASS | version/name match; statements nonempty |
| 20260919070000_candidate_photos.sql | PASS | version/name match; statements nonempty |
| 20260922000000_meetings.sql | PASS | version/name match; statements nonempty |
| 20260922010000_division_overview_service_role.sql | PASS | version/name match; statements nonempty |
| 20260930000000_update_competencies.sql | PASS | version/name match; statements nonempty |
| 20261101000000_recruitment_schema.sql | PASS | version/name match; statements nonempty |
| 20261101010000_recruitment_security.sql | PASS | version/name match; statements nonempty |

## Read-only postcheck

18 public tables; seven recruitment tables with RLS; 65 validated recruitment constraints, 19 indexes, seven triggers, ten recruitment functions, eight relevant policies (including Storage fences). Functions/ACL/config, indexes and bucket match the local verified catalog exactly. Constraint/trigger/policy definitions match after normalizing public schema qualification introduced by inspection search_path=pg_catalog.

Private recruitment-documents bucket is present with 3 MiB limit and expected MIME allowlist; candidate-photos is public as explicitly approved. meeting_attendance belongs to supabase_realtime. Auth users and Storage objects remain zero. No fixtures or accounts were created. Postcheck ended with ROLLBACK. No Docker resources were modified, no production access, push or deployment.

**GO for separately scoped backend integration and API/security testing.** Migration/history blockers are closed. Catalog checks do not certify behavioral RLS security in Cloud. Real HTTP submission, active/inactive role authorization, deadlines/concurrency, private upload/download and audited CSV export remain untested in Cloud and require scoped test authorization. The disposable-local recruitment_design.sql suite must not be run here.

Protected raw logs, gate results, packet and catalog evidence remain Git-ignored under .env.staging.private/approved-staging-migration. No secrets are included in this report.
