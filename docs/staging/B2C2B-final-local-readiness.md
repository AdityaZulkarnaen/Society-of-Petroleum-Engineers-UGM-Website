# B2C.2B final local readiness verification

2026-11-02, Asia/Jakarta. Branch feat/oprec-backend-staging; HEAD 895e715c2cd561004762e2bcb2d68362d9b0a164.

**GO for a separately authorized first cloud read-only inspection.** All requested LOCAL readiness checks passed. This task does not authorize a connection, prove the password works, validate the live server certificate, establish empty managed schema/history, or authorize cloud migrations.

## Verification results

| Requested gate | Actual local result |
| --- | --- |
| Password file | .env.staging.private/pgpass.conf exists as a regular file. Only existence and ACL metadata inspected. Contents never opened, copied, hashed, displayed or parsed. Owner attests staging-only password reset and entry. Password correctness remains untested. |
| Windows permissions | Private root has inheritance protection; all 29 private directory/file items recursively checked. Owner is RIZKI-LAPTOP/Lenovo; access rules permit only Lenovo and SYSTEM. No unexpected identity/deny/reparse-link found. Password file included. |
| Git ignore | Every private directory/file checked with git check-ignore: PASS, including password, active/template profile, public CA/provenance, both helpers and client/runtime DLLs. Nothing force-added. |
| Client version/path | psql (PostgreSQL) 17.11, verified with --version only; absolute path below. psql.exe and libpq.dll SHA-256 hashes match the recorded official-archive client installation. No server/client connect invocation. |
| CA fingerprint | DER SHA-256 matches B2C2B-certificate-validation.json exactly; PEM file hash also matches. Offline CA parsing and current validity pass; one recognized CA. |
| TLS configuration | Active service contains sslmode=verify-full and exact explicit protected root-ca-bundle.pem path. No unexpected options/aliases or password embedded in profile. |
| Session Pooler target | Exact host/port/database/project-qualified username matches independently owner-confirmed Dashboard record. Project/API/org match below. No inferred or alternate endpoint. |
| Read-only configuration | Startup default_transaction_read_only=on, fixed pg_catalog search_path and finite statement/lock/idle-in-transaction timeouts present. Pooler support/session enforcement must still be verified live; no claim that an unconnected session is read-only. |
| Source migrations | Exactly 17 filenames in frozen order, all SHA-256 values match B2C1-migration-manifest.json, no extra/missing migration. |
| Stop boundary | No cloud/database connection, DNS/HTTP probe, SQL, fixture, seed, migration, production credential read, Docker command, push or deployment. |

Client:

```text
D:/SPE UGM SC/spe-ugm-oprec-staging/.env.staging.private/client/postgresql-17.11-5/psql.exe
```

Public CA certificate DER SHA-256 fingerprint:

```text
80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
```

This task reused the previously recorded client provenance. Archive binaries were previously reported NotSigned; matching local hashes are integrity/reproducibility checks, not a new Authenticode signature claim.

## Exact intended target

- Project: spe-ugm-staging; reference lavxddhrrwsjcshmnwvu.
- Personal organization: abnfnzzearslinsxnjcb; South Asia (Mumbai).
- API origin: https://lavxddhrrwsjcshmnwvu.supabase.co.
- Chosen transport: Session Pooler.
- Host: aws-0-ap-south-1.pooler.supabase.com; port 5432.
- Database: postgres; username postgres.lavxddhrrwsjcshmnwvu.

All comparisons were against the owner's recorded Dashboard evidence, not live cloud data. Shared pooler hostname/database name alone do not prove project identity. No connection string or secret is recorded here.

## Required next authorization and live gates

No further local password/CA entry is indicated by these existence/readiness checks. Do not enter or reset the password again merely for verification. The owner must separately authorize resuming the first cloud read-only inspection; this turn explicitly stops before any connection. That authorization does not include migration writes or CLI link/push/pull/reset.

On a later authorized run, use the pinned client/profile/CA through an allowlisted child environment, -X, --no-password and ON_ERROR_STOP=1. Verify client-to-pooler chain/hostname under verify-full, confirm live session/current role/database and transaction_read_only before the reviewed catalog queries. Pooler startup-option rejection, TLS/credential/identity/privilege failure means STOP; do not remove security settings, auto-retry, reset passwords or change permissions.

Then inspect managed roles/owners/privileges, extensions, expected Auth/Storage bootstrap, public application objects, bucket metadata and repository history/empty-state through the reviewed read-only scope only, using ROLLBACK. No fixture or migration SQL. Backend pg_stat_ssl alone does not establish the client-to-pooler certificate validation. Populated/unexpected state needs a new migration plan, not a reset. No managed migration compatibility or RLS security claim is established by this readiness report.

## Artifacts and preservation

Added B2C2B-final-local-readiness.md and B2C2B-final-local-readiness.json. Detailed per-item ACL/ignore and per-migration hash evidence in the JSON; no password information beyond existence/provenance status. Ignored operational ACL check record: .next/staging-postgres-client/final-readiness-acl.json. No credential/profile/CA/client/SQL/migration/application changes; existing work preserved. git diff --check passed. Local Compose and UTS resources were neither contacted nor modified; current Docker health was not rechecked.
