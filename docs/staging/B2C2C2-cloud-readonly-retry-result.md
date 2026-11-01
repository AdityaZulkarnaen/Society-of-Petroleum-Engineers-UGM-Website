# B2C.2C.2 cloud read-only inspection retry result

2026-11-02, Asia/Jakarta. Branch feat/oprec-backend-staging.

**PASS: the ONE authorized retry completed its full reviewed inspection in one guarded READ ONLY transaction, ending with ROLLBACK.** Native psql and host wrapper exit 0, no stderr, exactly one guard-pass/completion pair, no failure markers and no automatic retry.

**GO to prepare a migration execution review packet; NO-GO for migration execution now.** The inspected application surface is fresh and no schema collision was found. Before writes, review the observed backend TLS property, remaining effective-privilege checks and exact migration-runner/history strategy, then obtain separate explicit authorization. No cloud migration or fixture was executed.

## Reviewed procedure and preflight

Read first-attempt result, B2C2C1 guard review, exact corrected SQL and retry instructions. All seven offline tests passed again. Corrected SQL and runner SHA-256 matched their review report; all 17 frozen migration filenames/order/hashes matched before and after inspection.

Local --prepare-only passed target/profile/client/CA/passfile metadata/ACL/ignore checks before the retry. No production environment or credential file was used. Password contents were never opened/printed by the agent; libpq read only the explicit protected staging passfile. The profile has no startup transaction-default option. CA fingerprint remains 807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa.

Executed exactly the reviewed scripts/staging/inspect-cloud-readonly.py --connect once, as the intended Lenovo account. It invoked protected psql 17.11 with -X --no-password --set=ON_ERROR_STOP=1 -qAt --file=-, a sanitized child environment, explicit service/password files and the pinned verify-full CA/profile. Connect timeout 10s; SET LOCAL statement/lock/idle-transaction timeouts 15s/2s/30s; host timeout 120s. No fallback target/TLS/credential, no CLI link/push/reset or second connection.

## Sanitized live identity and transport

| Field | Observed / verified |
| --- | --- |
| Project/ref | spe-ugm-staging / lavxddhrrwsjcshmnwvu, owner-confirmed Dashboard mapping |
| Organization | el-kocan's Org / abnfnzzearslinsxnjcb, owner-confirmed personal organization |
| Region | Mumbai, owner-confirmed |
| API origin | https://lavxddhrrwsjcshmnwvu.supabase.co, independently recorded; no API request |
| Client endpoint | aws-0-ap-south-1.pooler.supabase.com:5432, selected Session Pooler |
| Client routing username | postgres.lavxddhrrwsjcshmnwvu |
| TLS profile | sslmode=verify-full with the validated explicit CA; successful connection |
| Client TLS protocol/cipher | TLSv1.3 / TLS_AES_256_GCM_SHA384; compression off |
| current_database/current_user/session_user | postgres / postgres / postgres |
| PostgreSQL | 17.11 |
| Current transaction | transaction_read_only=on; guard passed and final read-only check passed |
| Default transaction mode | default_transaction_read_only=off; informational, correctly not a rejection |
| Backend address/port | Backend IPv6, port 5432; different from client-facing pooler IPv4, not used as project-ID proof |

TLS and the independently approved pooler/project-qualified username establish the intended route; database name/role alone are not unique project identity. No full connection string, password or key is recorded.

### Observed TLS-leg distinction

Client conninfo proves the client-to-pooler TLS connection used with verify-full. The backend pg_stat_ssl row for pg_backend_pid() returned ssl=false, with no protocol/cipher. That describes PostgreSQL's backend connection, not a failure of client-to-pooler certificate/hostname verification. It also means this result does NOT prove PostgreSQL TLS on the pooler-to-database leg. Provider private-network/underlay protection and SSL enforcement configuration were not inspected.

Review whether this transport property meets the staging security requirement before choosing a migration destination. Do not silently change endpoints, weaken TLS, toggle SSL enforcement or modify project settings. Any additional inspection or configuration correction requires separately scoped authorization. No such change was made here.

## Transaction and actual queries

Exactly one BEGIN TRANSACTION READ ONLY. SET LOCAL search_path=pg_catalog and bounded timeouts. Identity/role/current-transaction guard ran inside this transaction, followed by all inspection SELECTs in the same connection/transaction. Final transaction_read_only check passed. Successful-path ROLLBACK precedes the completion marker; ON_ERROR_STOP, empty stderr and source-hash match support that control-flow evidence. Quiet psql mode suppresses the command tag; no COMMIT or transaction restart was issued. The process exited and the connection closed.

Actual inspected query groups:

1. Current session/database/version/read-only/address metadata; backend pg_stat_ssl.
2. Selected role attributes/memberships; public/auth/storage/extensions schema ownership/ACLs.
3. Public and selected managed relation ownership/RLS/ACLs; platform/repository migration-column metadata.
4. Public default privileges, public/Storage policy definitions, public function signatures/security/ACL metadata.
5. Required Auth/Storage/UUID object resolution; active supautils policy settings; Realtime publication/membership.
6. Installed pg_extension names/versions/schema; managed table existence/SELECT permission checks.
7. Auth-user and Storage-object presence booleans, and bucket metadata (no private objects/user records).
8. Repository-history existence. Its relation is absent, so the conditional SELECT of version rows was correctly skipped; no ledger initialized.
9. Final read-only mode check and ROLLBACK.

No application RPC or arbitrary side-effecting function executed. No role switch, seed, synthetic identity, document access, write test or local recruitment_design.sql. This was metadata/presence inspection, not behavioral RLS certification.

## Actual schema and data findings

| Surface | Result |
| --- | --- |
| Public relations | No rows returned: no application tables/views/indexes/sequences in public |
| Recruitment schema | No recruitment tables/functions installed; no legacy profiles/divisions yet |
| Public functions | No rows returned |
| public/Storage policies | No rows returned by the scoped pg_policies query |
| Repository migration history | supabase_migrations.schema_migrations absent; supabase_migrations schema not returned |
| Auth users | has_auth_users=false |
| Storage objects | has_storage_objects=false; no object contents read |
| Storage buckets | Empty list; candidate-photos/recruitment-documents not yet created |
| Managed bootstrap | auth.users, auth.uid(), auth.jwt(), auth.role(), gen_random_uuid(), storage.buckets/objects all resolve |
| Publication | supabase_realtime owned by postgres, not all-tables; no members yet |

No unexpected existing application data or conflicting public/recruitment objects appeared in these inspected surfaces. This is not a universal audit of every managed/custom schema or organizational provenance of every possible record. We did not enumerate/read arbitrary data outside the reviewed scope. Absence of repository history is not absence of platform history: auth.schema_migrations and storage.migrations column metadata exist as expected.

## Roles, ownership and privilege compatibility

- postgres is nonsuperuser, login/INHERIT, CREATE ROLE/DB and BYPASSRLS; anon/authenticated are nonsuperuser and do not bypass RLS. service_role bypasses RLS; authenticator is NOINHERIT.
- postgres has API/authenticator memberships plus supabase_privileged_role. Authenticator has anon/authenticated/service_role memberships.
- public owner is pg_database_owner; extensions owner postgres. auth/storage schemas owner supabase_admin. auth.users owner supabase_auth_admin, storage.buckets/objects owner supabase_storage_admin. Their RLS flags are enabled, FORCE RLS false.
- Observed postgres table ACLs include Auth/Storage access; all SELECT checks required for this metadata/presence inspection passed. No grants or owner changes.
- supautils is session-loaded. Its active postgres policy-grants whitelist includes storage.buckets and storage.objects; privileged role supabase_privileged_role exists. This matches the mechanism that allowed Storage-policy migrations locally, but actual Cloud DDL remains untested.
- Broad public default table/function/sequence privileges for API roles are present for postgres/supabase_admin creators, similar to local bootstrap. Recruitment migrations must run their explicit privilege revokes/regrants unchanged. Policy existence/owner reads do not prove active/inactive-super-admin behavioral security.
- The reviewed query set did not directly probe database owner or effective public-schema CREATE and every DDL-specific privilege. Do not infer those solely from pg_database_owner's ACL; confirm before selecting the final executor. Do not grant privileges to force the migration through.

## Extension inventory and local differences

| Extension | Version | Schema |
| --- | --- | --- |
| pg_stat_statements | 1.11 | extensions |
| pgcrypto | 1.3 | extensions |
| plpgsql | 1.0 | pg_catalog |
| supabase_vault | 0.3.1 | vault |
| uuid-ossp | 1.1 | extensions |

Managed server is PostgreSQL 17.11; local rehearsal was 17.6. Required Auth/Storage/UUID bootstrap is present. pg_net was installed by local vendor bootstrap but is not in this Cloud extension inventory; the 17 application migrations have no direct pg_net/net/supabase_functions dependency. No instruction to copy local vendor bootstrap into Cloud. supabase_functions schema was not returned, unlike the local webhook bootstrap; no direct dependency found in the frozen application SQL. Managed Auth/Storage API runtime versions were not queried or compared. Standalone public types/enums were not included in the reviewed query set: in particular public.admin_role collision absence is not yet proven by an empty pg_class/public-relations result. Other custom schemas were not exhaustively inventoried. Include those read-only checks before asserting complete clean-project compatibility.

## Frozen migration plan and remaining gates

17/17 byte hashes still match B2C1-migration-manifest.json. The plan remains the full filename-ordered chain, not a recruitment-only subset. No clean-public-schema/bucket/history collision found. Future application creates legacy/voting/meeting objects as well as recruitment; approval must include the public candidate-photos bucket side effect and private recruitment bucket, policies, publication and any migration-ledger creation.

Before cloud writes:

1. Review the backend TLS observation and choose/approve the permitted migration transport. Do not assume this inspection proves encryption on both legs.
2. Confirm final executor's effective schema/DDL privileges through a separately scoped read-only check if needed. Existing whitelist/grants are encouraging, not a DDL execution result.
3. Review the exact migration executor and history/checkpoint/transaction strategy. B2B validated direct psql per-file transactions; CLI semantics, especially files with their own BEGIN/COMMIT, were not rehearsed by this inspection. No implicit links, seeds, include-all, reset or history repair.
4. Recheck target/hashes/freshness immediately before any future write; this inspection is time-specific. Obtain explicit approval for the exact 17-file write set and side effects. No write authorization is implied by read-only PASS.
5. Purpose-built scoped staging integration fixtures require separate approval. Never run the local rollback-only recruitment_design.sql against cloud staging; broad updates/global assumptions remain forbidden there.

Recommendation: **GO for migration execution planning/review; NO-GO to execute migrations now**, pending the above transport/executor/runner decisions and separate explicit write authorization. This decision does not invalidate the successful read-only inspection or claim a known application SQL defect.

## Evidence and preservation

Protected raw evidence: .env.staging.private/inspection-b2c2c1/attempt.json, prepared.json, reviewed-execution.sql, stdout.txt, stderr.txt and result.json. One retry attempt marker, immutable against automatic rerun. SQL SHA-256 fb1e82bd1a39258aea4cead1a7e708388eb8723b752247ea732924d4be8cf85d; runner matched review hash ab49f8c8b4af2c17f765bf17c9b86ceb63aa8d6af0226f4d2b2928f95713cdd6. Sanitized findings also in B2C2C2-cloud-readonly-retry-result.json.

Added this report/JSON; no source/SQL/migration/credential/profile/client modification. Previous evidence preserved. No transaction-default changes, DDL/DML, migration, seed, fixture, Auth account, Storage modification, production access, Docker operation, push or deployment. Platform connection/audit/statistics logging can occur from authorized reads. Stop after reporting; no additional connection or migration execution.
