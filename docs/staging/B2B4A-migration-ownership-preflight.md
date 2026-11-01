# B2B.4A migration transport and ownership preflight

2026-11-01. Branch `feat/oprec-backend-staging`, commit `127017bad659a7958d23bce47f037022cc656236`.

**GO for separately approved, fail-fast local migration rehearsal; no migration execution authorized or performed in this phase.** Actual DDL, SQL assertions and application RLS remain unverified. No ownership, role-membership or privilege correction is justified by the catalog evidence.

## Evidence and correction to B2B.3D

Read B2B3D runtime verification, B2A design, every ordered migration and the recruitment SQL test. See B2B4A-ddl-inventory.md for per-file hashes and source-line inventory of privileged DDL, grants and SECURITY DEFINER declarations.

Container-local read-only catalog sessions succeeded as postgres and supabase_admin. Transactions explicitly used BEGIN READ ONLY / ROLLBACK; transaction_read_only was on. No application data, secret file, password or role password hash was read. The superseded B2B3D ownership inference omitted Supabase's policy-management extension:

- postgres is not superuser; it has BYPASSRLS, CREATE ROLE/DB and owns database postgres. It can CREATE in public and TEMP in postgres.
- auth/storage schemas belong to supabase_admin. auth.users belongs to supabase_auth_admin. storage.objects/buckets belong to supabase_storage_admin, with RLS enabled, not FORCE RLS.
- postgres is not a member of supabase_storage_admin. Ordinary DML grants and BYPASSRLS do not confer ownership-based policy DDL permission.
- However, postgres sessions load `supautils` through session_preload_libraries. Active `supautils.policy_grants` explicitly lists storage.objects and storage.buckets for postgres. The extension supports CREATE/ALTER/DROP/COMMENT POLICY by designated nonowners. Thus the ordinary ownership check does NOT establish that these migrations fail. Actual DDL is still untested.
- `supautils.privileged_role` is supabase_privileged_role; postgres inherits this existing group. `supautils.superuser` is supabase_admin. Do not change these settings or memberships.

Primary reference: https://github.com/supabase/supautils (policy_grants and privileged role documentation). This describes the mechanism; runtime settings establish its presence in this pinned image. No application migration requires changing Storage table ownership. If an actual future policy statement fails, stop and inspect that exact failure rather than grant superuser.

## Owners, memberships and grants

postgres can SET ROLE anon, authenticated and service_role, and has memberships including authenticator, supabase_functions_admin, pg_read_all_data, pg_monitor and supabase_privileged_role. API anon/authenticated roles are nonsuperuser and lack BYPASSRLS; service_role has BYPASSRLS. authenticator is NOINHERIT. Auth/Storage service login roles are nonsuperuser, NOINHERIT and own their service tables.

public belongs to pg_database_owner; postgres is database owner. API roles have schema USAGE. Auth users has postgres INSERT/REFERENCES and other table grants; Storage buckets/objects grant postgres DML/REFERENCES. postgres INSERT on auth.users, storage.objects and storage.buckets was explicitly confirmed true. No missing mandatory-without-default columns outside the fixture-supplied auth.users(id,email) and storage.objects(bucket_id,name) were found.

Default privileges for postgres-created public tables/functions/sequences grant API roles broad access. B2A migrations explicitly revoke and regrant recruitment access; validate these assertions, never assume defaults are safe. supabase_admin has separate public default privileges, so changing executor can change object ownership/SECURITY DEFINER semantics even where grants look similar. Keep application objects owned by postgres.

## Migration dependencies and privileged operations

All 17 files must run in filename order, not only recruitment migrations. Profiles reference auth.users; divisions, helper functions and is_active are prerequisites for recruitment authorization. Earlier voting, recap, proker and meeting objects must compile too. Candidate photos and recruitment security insert Storage buckets and create Storage policies. Application-table ALTER/RLS/policy/trigger operations require owner authority, satisfied by consistent postgres execution for newly created application objects. SECURITY DEFINER alone does not require superuser; its owner and search_path affect runtime authority.

The inventory includes CREATE TYPE/TABLE/INDEX/FUNCTION/TRIGGER/POLICY, ALTER TABLE, DROP POLICY, grants/revokes, and dynamic RLS statements. No ALTER POLICY statement was found. Migration meetings alters publication supabase_realtime inside a catch-all exception block: a success exit would not prove publication attachment. Publication exists and belongs to postgres; inspect membership after execution. Candidate-photo policies and recruitment restrictive policies both target tables in the observed supautils whitelist.

No demonstrated environment bootstrap mismatch remains for the required SQL objects: auth.users, auth.uid(), auth.role(), auth.jwt(), storage.buckets/objects, gen_random_uuid(), API/service roles and supabase_realtime publication exist. PostgreSQL 17.6 and healthy Auth/REST/Storage match the reviewed four-service bundle. public.profiles, public.admin_role and recruitment_applications are absent. Realtime server, gateway and browser/API upload/download coverage are absent from this minimal stack; SQL tests cannot validate those flows. CLI migration history and CLI-local orchestration are not provided by this self-hosted transport.

## Executor and transport

Use postgres for migrations and test harness, not supabase_admin. System bootstrap administrator is reserved for system initialization; no escalation is proposed. Test harness needs owner-level fixture setup plus existing auth/storage INSERT, TEMP and SET ROLE permissions. It must switch to real authenticated/anon/service_role roles for authorization assertions. postgres BYPASSRLS would invalidate tests that forgot these switches.

Confirmed transport: installed Docker Compose v5.6.1 `exec -T`, existing db service, container OS user postgres, Unix socket /var/run/postgresql, database/user postgres. No host port is required or to be repaired. Explicit local Docker named pipe prevents a remote Docker context. psql -X ignores startup files, --no-password prevents interactive secrets, ON_ERROR_STOP stops at errors.

Prepared ignored `.next/supabase-b2b3-compose/compose.exec-only.json`: credential-free descriptor naming only the existing db service and pinned image. Use ONLY with exec; never create/up/start this descriptor. --env-file NUL suppresses .env discovery. Original startup manifest/secrets are not needed for exec. Read-only probe with equivalent stdin descriptor succeeded. The persistent descriptor below enables byte-preserving SQL stdin without mounting repository files.

### Proposed commands: NOT EXECUTED

PowerShell setup (local paths only):

```powershell
$execRoot = Join-Path (Get-Location) '.next/supabase-b2b3-compose'
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
$env:DOCKER_CONFIG = Join-Path $execRoot 'docker-config'
$composeExe = 'C:/Users/Lenovo/AppData/Local/Programs/DockerDesktop/resources/cli-plugins/docker-compose.exe'
$execArgs = @('--project-name','spe-ugm-recruitment-b2b3-local','--project-directory',$execRoot,'--env-file','NUL','--file',(Join-Path $execRoot 'compose.exec-only.json'))
& $composeExe @execArgs exec -T --user postgres db psql -X --no-password --host=/var/run/postgresql --username=postgres --dbname=postgres --set=ON_ERROR_STOP=1 --command 'BEGIN READ ONLY; SELECT session_user,current_user,current_database(),current_setting(''transaction_read_only''); ROLLBACK;'
```

Before execution, inspect project container labels, exact image and running healthy state. Required db ID: 11383fa59821673b0f1975ea222c4c5fae73263a192264f68242fb3338dc65d7; image ID sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00. Fail if these differ, extra project services appear, migrations are already present, or effective host publishing appears. Preserve UTS IDs and start times. Ensure child process environment contains no inherited PG*/SUPABASE_* endpoint variables; explicit socket/user/database and NUL env file are mandatory.

For each later approved migration, Python subprocess avoids PowerShell pipeline encoding changes. This is the precise transport primitive (run only after approval and checkpoint guards):

```python
# compose_exe, exec_args and child_env as above; child_env is an OS allowlist
# plus only the explicit local DOCKER_HOST and DOCKER_CONFIG values.
command = [compose_exe, *exec_args, 'exec', '-T', '--user', 'postgres', 'db',
           'psql', '-X', '--no-password', '--host=/var/run/postgresql',
           '--username=postgres', '--dbname=postgres', '--set=ON_ERROR_STOP=1']
# First 14 migrations have no own BEGIN/COMMIT:
if migration_index < 14:
    command += ['--single-transaction']
command += ['--file=-']
result = subprocess.run(command, input=migration_path.read_bytes(),
                        env=child_env, capture_output=True)
if result.returncode:
    raise SystemExit('Migration failed; stop and inspect private diagnostics')
```

Last three migrations contain BEGIN/COMMIT: do not double-wrap. For SQL assertions use the same transport with path supabase/tests/recruitment_design.sql, without --single-transaction: it has its own BEGIN/ROLLBACK. These commands contain no cloud URL, CLI link, remote push/pull or host PostgreSQL endpoint. Do not print full environment or raw SQL outputs containing future sensitive values.

## Checkpoint and SQL-test safety

Freeze the exact ordered 17-file list and hashes from inventory, branch/commit, DB ID/image and executor. Create host-only JSONL journal in ignored workspace. Before each file record running plus timestamp/hash; after a successful psql exit record succeeded; on first nonzero record failed and stop. Capture stdout/stderr to restricted local artifacts; publish only redacted errors. Verify read-only postconditions before advancing to SQL tests, including publication membership and recruitment policies/private bucket.

This journal is not a Supabase migration ledger. If DB commit succeeds but journaling fails, checkpoint is ambiguous: STOP, inspect, do not blindly rerun non-idempotent migrations. No automatic reset/retry. Each file is transactional using its own transaction or psql single-transaction. Review before any recovery from failure.

Tests are intentionally write-heavy fixtures followed by ROLLBACK: synthetic auth/profile identities, approved synthetic config, application/document metadata and role changes. They contain broad updates, fixed UUIDs and assumptions about empty tables/counts. Run ONLY on this verified fresh disposable DB; not a populated development or cloud DB. A lost connection rolls back the open transaction; a failure must still stop and be reviewed. No real Auth sign-in, document bytes or email are tested. No super-admin seed script is needed.

## Gate and limits

Minimal correction is documentation and transport only: supersede the premature Storage-owner blocker; retain default postgres executor, existing supautils configuration and no host exposure. Approval for B2B.4 must explicitly authorize these 17 local migrations and, separately or together, rollback-only SQL fixtures/tests. Require unchanged container/image/config identities, healthy services/storage, no remote links/URLs, no unexpected host ports and fresh application schema at that time. Stop at first error, no privilege bypass. Actual extension handling of each policy form and all application behavior remain unverified until that run.

No application migrations, SQL fixtures, seeds, manual write SQL, role/grant/ownership changes, database restart, Docker resource mutation or cloud access occurred during B2B.4A. No UTS resource was modified. No secrets were printed. Files added: this report, B2B4A-ddl-inventory.md, and ignored credential-free compose.exec-only.json. Existing work preserved.

Final read-only resource check: all four project containers healthy; all three UTS container IDs unchanged and running. C: free 16.18 GiB. git diff --check passed; exec-only descriptor confirmed ignored by Git.
