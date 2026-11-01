# B2C.2C first cloud read-only inspection

2026-11-02, Asia/Jakarta. feat/oprec-backend-staging.

**PARTIAL: first secure staging connection succeeded; inspection STOPPED at the read-only default guard. NO-GO for cloud migrations.** One connection attempt, no retry. The reviewed schema/history/Storage/extension inspection was not executed. No database objects or records were modified.

## Authorization and preconnection gates

This phase explicitly authorized the first staging-only read-only connection, superseding the preceding setup-only stopping point. Read the B2C1 plan/manifest, B2C2A target verification and SQL file, B2C2B client setup, CA validation and final readiness evidence. Production and the other organization remained out of scope.

All mandatory LOCAL gates passed before connection:

- Intended personal project: spe-ugm-staging, reference lavxddhrrwsjcshmnwvu; organization abnfnzzearslinsxnjcb, owner now names it el-kocan's Org; region Mumbai. API origin https://lavxddhrrwsjcshmnwvu.supabase.co. Organization/API mapping is owner-confirmed Dashboard evidence, not a new control-plane lookup.
- Exactly owner-confirmed Session Pooler aws-0-ap-south-1.pooler.supabase.com, port 5432, database postgres, routing username postgres.lavxddhrrwsjcshmnwvu. No inferred hostname/alternate endpoint or implicit link.
- Protected psql 17.11 executable and libpq hashes match installation evidence. Public CA DER SHA-256 matches 807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa; CA validity and parsing passed.
- Profile strictly matched expected fields only, with sslmode=verify-full, explicit CA/passfile paths, bounded connect/statement/lock/idle timeouts and startup default_transaction_read_only=on. No candidate profile modification.
- Password-file existence and private ACLs checked without agent opening, copying, hashing or displaying its contents. libpq alone read the authorized staging passfile for authentication. Intended Lenovo/SYSTEM-only permissions verified; no production environment loaded.
- All 17 migration filenames/order/SHA-256 values match B2C1 frozen manifest; unchanged inspection SQL hash a29e8ee9045054773ab87a60c2c2240f3a79f2324bdc4fc5cd9ef01497706a02.

Connection used an allowlisted child environment and explicit PGSERVICEFILE, PGPASSFILE and PGSERVICE. No inherited PG/database/Supabase/Node credentials or endpoints. GSS encryption disabled in the child to ensure the mandatory TLS path, not a GSS fallback; verify-full was never weakened. Client flags: -X, --no-password, ON_ERROR_STOP=1, quiet unaligned metadata output and stdin SQL; 120-second process bound, 10-second connection timeout. No credential URL/argv or full connection string logged.

## Connection and immediate live evidence

| Check | Actual result |
| --- | --- |
| Client-to-pooler TLS | PASS: successful libpq connection with strict validated verify-full profile |
| Client TLS protocol/cipher | TLSv1.3 / TLS_AES_256_GCM_SHA384, compression off |
| Client destination | Confirmed selected pooler host/port and project-qualified routing username, from client conninfo |
| current_database() | postgres |
| current_user | postgres |
| session_user | postgres |
| Server PostgreSQL version | 17.11 |
| First transaction | Explicit BEGIN READ ONLY |
| transaction_read_only | on |
| default_transaction_read_only | **off: guard failure** |
| Backend address/port | Backend IPv6 address, port 5432; differs from client-facing pooler IPv4 address, as pooling permits |

Client conninfo captured TLS attributes; the verify-full profile and validated CA were used without override. This is client-to-pooler verification evidence, not a claim about the pooler-to-database encryption leg. The reviewed pg_stat_ssl query was not reached. Database/user values alone do not prove unique project identity; the independently confirmed endpoint/username mapping and verified TLS are essential.

## First blocker and stopping behavior

The profile requests startup default_transaction_read_only=on, but the live session reported that default as off. The explicit transaction was safely read-only (on). The wrapper's stricter prerequisite required both values on before permitting the reviewed metadata file, so it emitted B2C2C_IDENTITY_FAILURE, issued ROLLBACK and exited. All catalog/application/presence queries after this gate were skipped.

This is an observed mismatch in establishing the expected client session default, not evidence of a recruitment migration defect. The exact cause (pooler startup-option handling/session initialization) is unproven. Do not assert that the managed database is misconfigured or that all options were ignored. Role/database identity matched; the combined guard failed specifically because of the read-only default.

The wrapper used backslash-quit with numeric argument 4. psql warned that the extra argument was ignored and returned native exit 0. This wrapper exit-code mistake did not allow queries to continue: the explicit failure marker is present, reviewed-metadata start/completion markers absent, and inspection_complete=false. We did NOT interpret exit 0 as inspection success. Future wrapper must use a supported host-side failure-marker/nonzero outcome mechanism rather than numeric backslash-quit. No retry or wrapper alteration was executed after this observation.

## Schema and compatibility findings

| Required finding | Status |
| --- | --- |
| Application/recruitment schemas, tables, RLS/policies | NOT INSPECTED: stopped before reviewed file |
| Managed roles/owners/grants/bootstrap/extensions | NOT INSPECTED, except minimal nonsuperuser/current-role check used by guard |
| Migration history | NOT INSPECTED; no history initialized or modified |
| Storage bucket metadata/object presence | NOT INSPECTED; no private object accessed |
| Existing users/application data/production-shaped records | Unknown; no data query/export performed; cannot certify empty target |
| Unexpected/conflicting objects | Unknown; do not infer absence |
| Local source compatibility | Frozen 17-file set still matches; local B2B tests remain evidence only for local environment |

The live server is 17.11 compared with local rehearsal PostgreSQL 17.6; no schema/privilege/default-grant equivalence has been established. Managed Storage policy privilege behavior, Auth/Storage objects, extensions, private/public bucket conflicts, publication and migration history remain gates. No recommendation to apply migrations can be made from this partial inspection.

## Minimal proposed correction, not executed

Review a transient client-session read-only establishment step before a new inspection attempt, for example SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY, followed by verification of default_transaction_read_only=on and explicit BEGIN READ ONLY/transaction_read_only=on. This affects only the authorized inspection session, unlike ALTER ROLE/ALTER DATABASE; no permanent managed configuration, grants or ownership should change. Confirm supported pooler behavior rather than automatically dropping the failed guard/startup settings or moving to a different endpoint.

Also correct wrapper failure signaling and retain complete/identity markers and first-error stop. Present the revised query/control sequence for review and obtain explicit authorization for an inspection retry; do not retry automatically. No migrations, fixtures, seeds, password reset, role creation or privilege escalation is needed/proposed to bypass the blocker.

## Evidence and preservation

Protected ignored raw evidence: .env.staging.private/inspection-b2c2c/preflight.json, reviewed-execution.sql (exact attempted sequence), stdout.txt, stderr.txt and result.json. Execution payload SHA-256 d117bb53f083a67d267125be723f940ea67bdf9558930370bceec2ca4c203a38. These raw artifacts were kept private; sanitized summary in B2C2C-first-cloud-readonly-inspection.json. No passwords/keys/full connection strings recorded or exposed. Prepared SQL source and connection profile remain unchanged.

Exactly one psql connection attempt completed and its process exited after explicit ROLLBACK. Only session-control/read-only identity/default/role-check SELECTs executed; none of the 17 application migrations, reviewed bulk metadata file, local recruitment behavioral tests, seed or fixture scripts ran. No permanent database configuration/object/record writes, Storage operations, production access, Docker changes, push or deployment. Platform connection/audit logging may occur as part of the authorized connection.

Added this report and sanitized JSON plus ignored local runner/private evidence. Existing reports/migrations/tests/profile/password/CA preserved. Recomputed 17 hashes after the attempt; git diff --check passed. **Stop here: NO-GO for cloud migration execution and no automatic inspection retry.**
