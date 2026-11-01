# B2C.2A staging target verification and read-only inspection preparation

2026-11-01, Asia/Jakarta. Branch feat/oprec-backend-staging; HEAD 895e715c2cd561004762e2bcb2d68362d9b0a164.

**Local consistency/hash checks PASS; Dashboard identity comparison PASS based on owner attestation dated 2026-11-02. NO-GO for a cloud connection.** Owner provided all requested non-secret Dashboard/Connect fields and explicitly confirmed they belong to this personal staging project. Agent compared local fields only, with no cloud contact. Credentials, secure tooling, TLS/live database identity, schema and history remain unverified. The owner explicitly instructed continued planning only.

Read B2C1-cloud-staging-plan.md, B2C1-migration-manifest.json and B2C1-staging-target.example.json. No Supabase CLI, SQL, DNS/HTTP/TCP probe, Dashboard/API access or Docker command was run. Production credentials were not read; no environment values were printed.

## Target evidence and remaining match

| Item | Evidence / decision |
| --- | --- |
| Project name | spe-ugm-staging, owner supplied; insufficient alone. |
| Project reference | lavxddhrrwsjcshmnwvu; explicitly supplied twice by owner and matches local target record. Confirmed intended reference. |
| Organization | abnfnzzearslinsxnjcb; owner confirms personal organization, separate from production. |
| API origin | https://lavxddhrrwsjcshmnwvu.supabase.co; owner-confirmed Dashboard Project URL, exact local origin/reference match. Not contacted. |
| Region | South Asia (Mumbai), owner-confirmed. |
| Inspection destination | Session pooler; hostname aws-0-ap-south-1.pooler.supabase.com; port 5432; database postgres; username postgres.lavxddhrrwsjcshmnwvu. All separately owner-confirmed from staging Connect panel. No live connection/TLS test. |
| Credentials | Not configured/inspected in this task. Staging-only provenance must be established before use. |
| Managed DB schema/history | Unknown, no connection. Local Compose results do not establish cloud state. |

Requested non-secret Dashboard evidence was supplied on 2026-11-02: personal organization ID, region, exact Project URL, and chosen Connect panel session hostname/port/database/username, with explicit confirmation that all belong to this reference. Do not supply full connection strings, passwords, keys or screenshots containing secrets. Evidence can be recorded by the owner from the existing Dashboard; this agent has not opened it.

Local comparison completed: the supplied Dashboard reference matches the recorded reference and the HTTPS API origin has no unexpected userinfo/port/path/query/fragment. The pooler hostname and port are a recorded session target, not proof of identity alone; the supplied project-qualified username matches the reference. Live TLS, session identity and server state are not checked. Before later connection, revalidate the literal Dashboard reference to lavxddhrrwsjcshmnwvu and Project URL to the exact origin above, including scheme/host/no alternate ports/userinfo/query/fragment. Compare Connect fields independently with the selected inspection profile. Shared pooler hostname alone cannot establish project identity; project-qualified username and the owner-confirmed mapping are required. Direct endpoint must also come from Connect, not guessed DNS. Reject any mismatch; do not look up production to compare it. Record evidence source, date, organization/ref and transport mapping separately from credential configuration.

## Local link/conflict inspection

Filename inspection only for potentially sensitive metadata/environment files:

- supabase/.temp contains only cli-latest. No project-ref, pooler-url or linked-project.json filename found there.
- supabase/.branches, root .supabase and .vercel absent. Root supabase/config.toml absent. No implicit cloud link established from these inspected locations.
- Root environment filenames: only .env.example. No .env.local or .env.staging.local found by filename; neither created or modified. Contents of potential production secret stores/sibling worktrees were not read.
- Matching inherited variable names for Supabase/database/PG/staging/seed/attendance/Vercel/Node preload were absent in this inspection process. Values were not accessed or printed. A different later process can have a different environment: repeat this gate.
- Bounded local source scan agrees on recorded staging reference. Existing ignored .next Compose/CLI workdirs are local-test configuration, not cloud identity evidence. They were not executed/modified. Do not let CLI ancestor discovery or a linked worktree choose a cloud target.
- Git confirms correct branch. Existing B2C1 documents remain untracked/preserved. New report artifacts only; no remote/workflow/global credential settings inspected. Absence of these local files is bounded evidence, not proof about external account state.

## Hash verification

All 17 ordered filenames and exact source-byte SHA-256 hashes match B2C1-migration-manifest.json; no extra migration present and none missing. Local recruitment_design.sql hash also matches the frozen test manifest. Individual migration evidence is in B2C2A-local-verification.json. Manifest reviewed_commit equals current HEAD. Hash checks do not establish target identity, migration authorization or Cloud compatibility.

## Secure staging-only credential setup (instructions, not performed)

1. Resolve the non-secret independent identity fields first. Obtain a credential solely from lavxddhrrwsjcshmnwvu inside the personal staging organization. Do not copy any local production file, existing Compose password/JWT, shared seed password, repository/CI secret or another organization's credential.
2. For DB catalog inspection, an existing staging read-only login with required metadata visibility is preferable. Do not create one or GRANT anything in this phase. If unavailable, an owner may later authorize the existing staging postgres login solely for explicit read-only transactions; it is potentially write-capable and must not be described as a least-privilege account just because the client requests READ ONLY. Creating a new role is a separate future cloud write approval.
3. API publishable/secret keys and CLI access tokens are unnecessary for direct psql metadata inspection; do not collect them now. Never use a service API secret as a database password. Do not change/reset a database password merely to finish this step without separate authorization.
4. Use a password manager/private local editor to populate a protected staging-only PostgreSQL service profile and separate password file, e.g. ignored `.env.staging.private/pg_service.conf` and `.env.staging.private/pgpass.conf`. git check-ignore confirmed both paths ignored. Do not create them with echoed secret-bearing shell commands. Restrict Windows ACL to the intended execution account and SYSTEM before storing secrets; inspect ACL identities only, never file contents in tool logs. No broad Users/Everyone grant. Do not weaken ACLs to work around execution-account differences.
5. Profile contains only independently approved host/port/database/user, sslmode=verify-full, a trusted CA file where required, connect_timeout and application_name=spe-b2c-readonly. Password stays out of the profile/argv/connection URL and in the private password file, scoped to exact host/port/database/user rather than wildcards. Handle password-file escaping privately. Obtain CA from an independently trusted official source in a later permitted phase, not an arbitrary certificate copied from an unverified endpoint. Do not silently downgrade TLS verification or accept SSL errors.
6. Future launcher must parse/validate the candidate profile against an independently approved non-secret identity record, then create an allowlisted child environment. Remove inherited PGHOST/PGHOSTADDR/PGPORT/PGDATABASE/PGUSER/PGPASSWORD/PGSERVICE and all unrelated DB/Supabase/Node variables before deliberately setting PGSERVICEFILE, PGPASSFILE, PGSERVICE and PGOPTIONS for this single profile. Require default_transaction_read_only=on at session startup, fixed search_path=pg_catalog, finite timeouts and explicit read-only SQL. No inherited credentials/pg_service/psqlrc fallback.
7. Use pinned/verified psql executable with -X, --no-password and --set=ON_ERROR_STOP=1. No password-bearing argv, tracing/transcripts, full environment/DSN printing or raw sensitive error streams. A fixed service profile name may be logged, never its contents/password. Fail if profile is incomplete/unreadable or identity differs. No automatic fallback to another host, pooler mode, environment file or user.
8. `.env.staging.local` is for later application integration, not required for this DB-only phase. Populate it later solely from staging and a reviewed launcher; do not modify .env.local. Never stage private files with git add -f. Keep public target metadata separate from all secret files. Rotate/revoke only under separately approved scope; delete only owned credential artifacts when no longer required.

The secure launcher/profile/CA/psql path is NOT implemented or validated in B2C.2A. No credential file was created, read, ACL-modified or tested. Missing tooling/credentials/identity = NO-GO, not permission to use a raw URL or SQL editor.

## Exact later metadata inspection: two read-only stages

Prepared `B2C2A-readonly-inspection.sql` for review only; it was not executed. It uses BEGIN READ ONLY, session transaction timeouts, catalog SELECTs and ROLLBACK. Never substitute recruitment_design.sql or platform bootstrap files. No role switching, SET ROLE, CREATE TEMP, extension creation, history initialization, migration, GRANT or write statement.

After explicit connection authorization and independently validated private profile, the command shape is:

```text
<verified-absolute-psql-executable> -X --no-password --set=ON_ERROR_STOP=1 --file=docs/staging/B2C2A-readonly-inspection.sql
```

PGSERVICE/PGSERVICEFILE/PGPASSFILE and restrictive PGOPTIONS must be deliberately supplied by the reviewed allowlisted launcher. Do not run the command from an arbitrary inherited shell. No executable is launched here. Later run once, stop on first error, redact diagnostics and close connection on failure (rollback pending read-only transaction); no automatic retries or role escalation.

Stage 1 file inspects:

- current/session role, database, version, transaction/default read-only state, server address/port; SSL state/version/cipher for current session. These are consistency checks, not a unique project ID. TLS verified endpoint plus independent Dashboard mapping is required to establish destination.
- Selected role attributes via pg_roles (never pg_authid/password hashes), memberships, auth/storage/public/schema owners and table grants/RLS, relevant default privileges.
- Public objects/functions/policies, managed Auth/Storage objects, required UUID/auth helpers; supautils policy settings when available, publications and meeting attachment.
- Repository ledger relation/column metadata only, plus expected platform migration relation metadata. Platform auth/storage/supabase_functions history is not repository application history.

Stage 2 is an adaptive follow-up in a NEW BEGIN READ ONLY / ROLLBACK transaction, after reviewing Stage 1. Before any SELECT, confirm relation existence/column shape and SELECT permission from metadata. Do not construct/execute arbitrary SQL/function bodies from retrieved rows.

```sql
-- Proposed only; execute only after identity and relation/privilege gates pass.
begin read only;
set local statement_timeout = '15s';
set local lock_timeout = '2s';
select exists(select 1 from auth.users) as has_auth_users;
select exists(select 1 from storage.objects) as has_storage_objects;
select id, public, file_size_limit, allowed_mime_types
from storage.buckets order by id;
-- ONLY if supabase_migrations.schema_migrations exists with a version column:
-- select version from supabase_migrations.schema_migrations order by version;
rollback;
```

If the repository ledger exists, read only version values after verified shape; never fetch stored migration SQL payloads or repair the ledger. If absent, record absent and do not create it. If application tables/versions, unexpected users/objects/buckets exist, stop the clean-project migration path. Do not export user records: presence booleans plus object metadata suffice for the empty-state gate. If object absence/permission prevents a query, record an incomplete gate; do not elevate/grant/reset or assume empty.

Stage 1 SQL is a proposed reviewed query list, not an already tested Cloud-compatible runner. Some managed catalogs/settings/privileges may differ. On SSL/read-only/identity/query mismatch stop and report; no silent fallback or fix. SQL READ ONLY permits some PostgreSQL temporary/session behavior in general; safety here also depends on executing ONLY these reviewed SELECT/session-control statements, not arbitrary SQL or user-defined functions.

## Minimum future authorization and decision

Owner-confirmed non-secret identity/Connect mapping is now recorded. Before any connection, establish staging-only credential provenance and reviewed launcher/profile/TLS/psql readiness. Then ask for one narrowly scoped authorization:

?Authorize one read-only metadata inspection of personal-organization project spe-ugm-staging, reference lavxddhrrwsjcshmnwvu, using the independently confirmed direct/session destination and staging-only credential. Scope: BEGIN READ ONLY catalog queries, migration version values and empty-data presence/bucket metadata checks, with ROLLBACK. No schema/history initialization, DDL/DML, accounts, Storage objects, API traffic, CLI link/dry-run or migration writes.?

This wording is a proposed scope, not approval already given. Cloud TLS authentication/connection necessarily contacts that one project; it may generate platform connection/audit logs. It does not authorize production or other projects, API keys/users, project enumeration or a migration preview. Later cloud writes/dry-run/fixtures need separate approval as B2C1 specifies.

**Current recommendation: NO-GO for starting cloud read-only inspection. GO for reviewing the prepared procedure.** Remaining blockers: secure staging credential/tooling/TLS path and explicit connection approval. Owner-confirmed API URL/org/region/DB transport mapping is recorded; no need to request those same fields again. No database compatibility/empty-state gate can be marked passed without that later authorized inspection. Project name or matching derived URLs cannot substitute.

## Changes and boundaries

Added this report, B2C2A-local-verification.json (17 file hashes and bounded metadata findings), B2C2A-readonly-inspection.sql (unexecuted metadata query plan). Existing B2C1 artifacts/environment/migrations/tests/workflows unchanged. No cloud/production access, no SQL/seed/migration/CLI operation, no credential values read/copied/logged, no Docker resource mutation, no push/deploy. Local Compose and UTS left untouched. Local JSON/hash/whitespace validation only.

Update 2026-11-02: changed only the non-secret identity record, local verification JSON and identity/gate wording in B2C1/B2C2A reports. No credential/service/password files created or read, no SQL executed, no cloud contact or Docker operation. Frozen migration manifest and prepared SQL unchanged.
