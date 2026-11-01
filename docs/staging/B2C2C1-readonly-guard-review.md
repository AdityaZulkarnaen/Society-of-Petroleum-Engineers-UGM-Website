# B2C.2C.1 read-only guard review

2026-11-02, Asia/Jakarta. Local review/script correction only on feat/oprec-backend-staging.

**GO for a separately authorized cloud read-only inspection retry.** Corrected SQL/runner passed local preparation and seven offline regression tests. No SQL, cloud connection, migration, seed or fixture executed during this review. Managed metadata remains uninspected; NO-GO for migration execution.

## Root cause and prior command review

Reviewed B2C2C-first-cloud-readonly-inspection.md, B2C2A-readonly-inspection.sql, the exact old .next/staging-postgres-client/run_first_cloud_readonly.py, its prefix/suffix/command construction and prior sanitized evidence. Previous native command: protected psql -X --no-password --set=ON_ERROR_STOP=1 -qAt --file=-, explicit service/passfile environment, verify-full, one process. No credential URL or production environment used.

The old guard required BOTH transaction_read_only=on and default_transaction_read_only=on. The first was on: the explicit transaction was already READ ONLY. The latter was off: this describes the default for later transactions, not the current transaction's safety. Rejection was an overly strict/misdirected guard, not evidence that the explicit transaction permitted writes or that the staging project needed reconfiguration.

The old wrapper also ROLLBACKed its initial guarded transaction, appended the standalone B2C2A file (new BEGIN/ROLLBACK), then opened another transaction for additional metadata. Thus its initial guard was not in the same transaction as the full inspection. Those later portions were never executed on the first attempt.

The old numeric backslash-quit argument was ignored by psql, yielding native exit 0 despite a guard failure. Logical failure markers prevented a false success claim, but the new host wrapper must return a real failure status as well.

**Withdraw the previous report's suggested SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY.** No pooled session/database/role transaction-default change is needed or appropriate for this correction. No SET default_transaction_read_only, ALTER ROLE/ALTER DATABASE, configuration toggle or ownership/grant change was executed or proposed in the corrected path.

## Corrected execution contract

Canonical retry input is now B2C2C1-readonly-inspection.sql, not a concatenation around the old standalone SQL:

1. One protected psql invocation, one connection. -X, --no-password, ON_ERROR_STOP=1; explicit protected service/passfile, pinned verify-full/CA/target and no inherited endpoint/credentials.
2. Client-only conninfo, then exactly one BEGIN TRANSACTION READ ONLY.
3. SET LOCAL search_path=pg_catalog, statement_timeout=15s, lock_timeout=2s and idle_in_transaction_session_timeout=30s. Local settings end at ROLLBACK. Connect timeout remains 10s; host process timeout 120s.
4. Inside THIS transaction, verify current database/user/session_user, current transaction_read_only=on and expected nonsuperuser executor. default_transaction_read_only is printed diagnostically, never required to be on or modified.
5. Only the passing psql conditional branch executes all catalog, extension, bucket/presence and migration-version queries. The current transaction is never ended/restarted between the guard and these statements. No COMMIT, reconnect, separate psql call, include-file execution or dynamic SQL execution.
6. Check transaction_read_only again before the one successful-path ROLLBACK, then emit a completion marker. On a guard/shape/permission failure, emit a failure marker, ROLLBACK and plain backslash-quit (no numeric argument). Each executable branch ends its transaction; multiple ROLLBACK lines in source are mutually exclusive failure/success paths, not sequential transaction restarts.
7. Host success requires native exit 0, no stderr, exactly one correctly ordered guard-pass/completion pair and no failure marker. Missing/duplicate/reversed markers, warnings, timeout or a failure marker mean host exit 1, even if psql's native exit was 0. No automatic retry. SQL errors stop via ON_ERROR_STOP; connection closure rolls back the failed/open transaction if the explicit final ROLLBACK cannot be reached.

psql's AUTOCOMMIT client variable is explicitly on so it cannot insert an implicit BEGIN before the explicit transaction; this is not a database transaction-default setting and sends no COMMIT. There are no SQL statements after the final ROLLBACK, only client-side completion/conditional commands.

## Local profile correction

Removed the entire startup options line from both protected .env.staging.private/pg_service.conf and its template. This removes default_transaction_read_only and the former startup search_path/timeouts; those non-default settings now use SET LOCAL exclusively inside the guarded transaction. No session-wide transaction default is sent at connection startup.

Host, port, database, username, service name, password-file path, CA path, sslmode=verify-full, connect timeout and application identity remain unchanged. No password file read/edited or credential reset, no CA replacement and no Supabase setting change. Private ACLs remain Lenovo/SYSTEM only. Old evidence/runner/profile-change hashes retained in ignored artifacts. Earlier setup instructions were updated so they do not reintroduce startup transaction defaults.

## Query side-effect review

The original B2C2A catalog SELECT statements are retained inside the new guarded transaction. Their current_setting, pg_get_userbyid, pg_get_function_identity_arguments, pg_backend_pid, to_regclass and to_regprocedure calls are catalog/session introspection built-ins. to_regprocedure('gen_random_uuid()') resolves an identifier; it does not execute gen_random_uuid or any Auth/recruitment function. Function definitions/ACLs are inspected, not invoked. No application RPC, sequence allocation, advisory lock, network/extension worker function, pg_notify, role switch or arbitrary user-defined function call.

Additional SELECTs inspect pg_extension, privilege/existence checks, Auth/Storage presence booleans, public bucket configuration and only repository version values after column-shape checks. No user profiles/PII/document bytes/object rows or stored migration statement payloads returned. No DDL/DML/DO/CALL/COPY, seed, fixture, temporary table or history initialization. SET LOCAL and transaction control affect only the inspection transaction; rollback never substitutes for permission to execute writes.

Fixed pg_catalog search_path prevents unqualified built-in/catalog names resolving to public functions. Expected Auth/Storage tables are explicitly schema-qualified. If managed privileges/shape differ, stop rather than grant access or assume empty state. Ordinary engine connection/statistics/audit logging is outside application transaction writes and is not suppressed by READ ONLY.

## Preserved checks and local verification

New tracked runner: scripts/staging/inspect-cloud-readonly.py. It has no import-time connection, requires an explicit mode, refuses optimized Python that disables preflight assertions, and has a separate --prepare-only mode. Only --connect can invoke a database connection, and it requires a future explicit authorization. An atomic private attempt.json blocks automatic second attempts.

Retained checks: branch, owner-attested reference lavxddhrrwsjcshmnwvu/org abnfnzzearslinsxnjcb/API origin, exact Session Pooler and project-qualified username, strict password-free profile whitelist, protected passfile existence only, client/version/library hashes, CA fingerprint/validity, all private owner/ACL/Git-ignore gates and exactly 17 ordered frozen migration hashes. No arbitrary environment fallback. GSS encryption disabled only in child environment so verified TLS remains mandatory. No secrets printed.

Actual local results:

- Revised runner --prepare-only: PASS. Validated protected configuration/source files, ACLs and psql --version; copied the reviewed SQL as local evidence. No SQL sent or database connection attempted.
- Seven standard-library offline tests: PASS. Cover current-transaction/default distinction, one-transaction happy paths with/without history, root/later failure branch rollback behavior, no-write/reconnect controls, numeric-quit regression and host failure classification on missing/duplicate/reversed markers, stderr, timeout and native errors.
- Python compilation, git diff --check, all 17 migration hashes: PASS.
- Initial test-only numeric-quit regex incorrectly spanned a newline; corrected to horizontal whitespace. No SQL assertion/production permission was weakened.

These tests inspect text/control flow and mock output classification, not SQL syntax compilation, pooler behavior or database security. Nothing was executed against a database. Existing B2B behavioral tests were not rerun or applied to Cloud.

## Exact revised instructions

Local-only review/preparation (safe now; already run):

```powershell
# Intended Lenovo account, in D:/SPE UGM SC/spe-ugm-oprec-staging
& 'C:/Python313/python.exe' 'scripts/staging/test_readonly_guard.py'
& 'C:/Python313/python.exe' 'scripts/staging/inspect-cloud-readonly.py' --prepare-only
```

Only AFTER a separate explicit approval for the corrected staging-only read-only retry:

```powershell
& 'C:/Python313/python.exe' 'scripts/staging/inspect-cloud-readonly.py' --connect
if ($LASTEXITCODE -ne 0) { throw 'Inspection stopped; review protected evidence; do not retry' }
```

The wrapper invokes the same protected psql 17.11 with -X --no-password --set=ON_ERROR_STOP=1 -qAt --file=- and streams exactly the new SQL bytes in a single invocation. It does not concatenate another transaction/file. It saves logs and an immutable attempt marker in .env.staging.private/inspection-b2c2c1, checks source hash before connection and returns a nonzero logical failure as described above. No raw errors/credentials printed. Do not run the obsolete .next runner or B2C2A standalone file directly for the retry.

SQL SHA-256: fb1e82bd1a39258aea4cead1a7e708388eb8723b752247ea732924d4be8cf85d.
Runner SHA-256: ab49f8c8b4af2c17f765bf17c9b86ceb63aa8d6af0226f4d2b2928f95713cdd6.
Prepared evidence: protected inspection-b2c2c1/prepared.json and reviewed-execution.sql; no attempt.json was created during this review.

## Remaining uncertainty and stopping point

Live execution of the corrected guard and managed catalog permissions is unverified. Pooler acceptance of SET LOCAL timeouts, extension/default grants, Auth/Storage schemas, repository history and unexpected application state still need the authorized inspection. Client-to-pooler TLS previously passed, but must be enforced and observed again on retry; backend pg_stat_ssl is not proof of that client leg. A populated/conflicting schema requires a reviewed migration plan, not a reset.

GO to request/perform a separately authorized corrected read-only inspection. No reconnect, SQL, migration, seed, fixture, session-default change, project setting change, production access, Docker operation, push or deploy occurred in this phase. Stop after local review; do not interpret --prepare-only PASS as cloud or migration readiness.

## Exact file summary

Added docs/staging/B2C2C1-readonly-guard-review.md, B2C2C1-readonly-inspection.sql, scripts/staging/inspect-cloud-readonly.py and scripts/staging/test_readonly_guard.py. Updated B2C2B-secure-setup-procedure.md to remove the old startup-default expectation; its previously corrected native ACL/error handling is unchanged. Updated protected ignored active/template profiles by removing only startup options. Added ignored local profile-change/preparation evidence. Original B2C2A SQL, first-attempt raw logs/runner, migration files/manifest, password, CA and unrelated work preserved.
