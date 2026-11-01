# B2B.4C behavioral SQL and RLS security tests

2026-11-01, Asia/Jakarta. **PASS: existing suite executed once, psql exit 0, explicit ROLLBACK reached.** No failures, retries, SQL changes, resets or privilege bypasses.

**GO for cloud staging preparation/planning only. This is not approval or a complete security gate for cloud migrations, deployment or real applicant collection.** Broader SQL and API/Storage coverage remains outstanding below. No cloud connection occurred.

## Target and mandatory gates

- Branch feat/oprec-backend-staging; Compose project spe-ugm-recruitment-b2b3-local.
- Exact DB container 11383fa59821673b0f1975ea222c4c5fae73263a192264f68242fb3338dc65d7; image supabase/postgres:17.6.1.136; image ID sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00.
- All four exact approved container IDs/images/project/service labels matched, healthy, sole dedicated isolated network and no effective published host ports. UTS baseline IDs/state/StartedAt preserved.
- Container-local Unix socket: session_user=current_user=postgres, database=postgres, inet_server_addr() NULL; executor nonsuperuser. Pre/post catalog sessions explicitly read-only.
- All 17 migration hashes matched B2B.4A inventory. B2B.4B journal hash matched 3033d6838e8e5748aa4c5f5b62443b165253315bd9f5ab55915b179a996a082a, with 17 successful migration entries. Current checked tables/constraints/policies/functions/ACLs/indexes/triggers/bucket/publication catalog matched B2B.4B snapshot before execution.
- Every one of 18 public application tables, auth.users and storage.objects had zero rows before execution. Only the two expected migration-created buckets existed: candidate-photos and recruitment-documents. No real/shared data was present in checked application surfaces.
- Startup manifest hash unchanged; exec-only descriptor remained credential-free and was used only for exec. No environment secrets read; child environment allowlisted, --env-file NUL and explicit local Docker named pipe prevent endpoint inheritance.

Read B2B.4B execution, B2B.4A ownership preflight, B2A design, all 170 lines of the suite and both recruitment migrations. Reviewed fixed UUIDs, example.invalid identities, broad updates, scoped application delete, direct synthetic storage.objects INSERT, SET LOCAL ROLE authenticated/anon/service_role and RESET ROLE. Test metadata only: no file bytes, real account passwords, email or Storage API operations. Broad updates and whole-table audit counts are safe only on this verified empty disposable application database.

Suite has one BEGIN and terminal ROLLBACK, no COMMIT. Temporary assertion helper is transactional. No outer --single-transaction was added. ON_ERROR_STOP=1 would stop on first error and connection closure roll back an aborted transaction; in this actual successful run the explicit final ROLLBACK executed.

## Actual command and evidence

Installed Docker Compose v5.6.1, explicit local engine npipe:////./pipe/dockerDesktopLinuxEngine, reviewed project/workdir, NUL env file and ignored compose.exec-only.json:

```text
docker-compose.exe --project-name spe-ugm-recruitment-b2b3-local --project-directory <absolute-disposable-workspace> --env-file NUL --file <absolute-disposable-workspace>/compose.exec-only.json exec -T --user postgres db psql -X --no-password --host=/var/run/postgresql --username=postgres --dbname=postgres --set=ON_ERROR_STOP=1 --file=-
```

Exact unchanged supabase/tests/recruitment_design.sql bytes streamed with Python subprocess, no shell text conversion. Test SHA-256: `c1e1939a0d6243588242ad124ae53e5a524e21423089376538756da524144f67`.

Evidence in ignored .next/supabase-b2b3-compose/b2b4c-tests/: preflight.json, started.json, stdout.txt, stderr.txt, result.json and final-health.json. stdout contains synthetic fixture values only; stderr was empty. The suite is not pgTAP and emits no formal assertion total. Runtime shows 22 completed expect_error calls, nine completed DO blocks, and ROLLBACK. Source contains 16 explicit scenario IF/RAISE checks inside those nine blocks (excluding the assertion helper's internal guard): **38 explicit checks**, plus successful positive SQL/RPC operations. This is a source/runtime accounting, not 38 independently named TAP test cases.

## Passed and limited coverage

| Scenario | Actual result / scope |
| --- | --- |
| Approved configuration | Unconfirmed option blocks approval; draft-to-approval works with completed synthetic none-state catalogue; approved option and batch mutation rejected. |
| Preferences | Missing preferences rejected; two ranked distinct sub-divisions in the same parent accepted; identical choice rejected when deferred constraints forced immediate. Invalid rank values and the full rank/state matrix were not separately tested. |
| Supporting documents | Missing required documents rejected; synthetic verified metadata plus Storage object rows permit finalization. Actual upload/scanning/content validation not tested. |
| Assignment states | unconfirmed approval rejection and none-state finalization exercised. required/optional assignment behavior and all four states at both ranks remain untested. |
| Application identity | Identity/request-hash mutation rejected; same email with another NIM allowed; same normalized NIM with changed email rejected, including after rejection. Case/space/Unicode variants, withdrawal and concurrent collisions remain untested. |
| Finalization/retry | First finalize and same-key/hash replay succeed; conflicting hash rejected; submitted email mutation rejected. Setup/finalization uses owner harness; authenticated direct finalization denied. Service-role successful finalization and concurrent retries not exercised. |
| Active super-admin | Live profile grants access across both periods; uploading application hidden; narrow application column grants reject SELECT *; direct status update denied; review/export/document RPCs work when authorized. |
| Inactive and demoted | Inactive and ordinary admin helper denial; same identity after live deactivation denied despite unchanged claims; inactive and demoted users cannot see finalized rows/export; unauthorized ordinary-admin review/document requests denied. No real JWT verification occurs in SQL: request identity is set in transaction. |
| Anonymous | Only approved catalogue visible; applicant table access denied; private bucket metadata hidden. |
| Audit | One submission audit despite replay; two review audits with rejected decision; two export audits; download-authorization audit exists; authenticated raw audit SELECT and service_role audit DELETE denied. Actual document receipt or every ordinary SELECT is not audited/proven by these tests. |
| Private Storage | Recruitment bucket remains private with expected limit; restrictive policies remain installed; anonymous bucket metadata hidden. Storage object list/get/upload/upsert/move/copy and signed URLs not exercised. |

No failed scenarios or first PostgreSQL error: psql exit 0, stderr empty. No assertions weakened, no migration/test source modified and no permissions/ownership changed.

## Rollback and integrity verification

- Explicit ROLLBACK observed. Post-test counts for all 18 public tables, auth.users and storage.objects exactly equal the empty baseline. Synthetic profiles, periods, options, applications, preferences, documents and audit records removed.
- Both bucket metadata records equal the pre-test snapshot. recruitment-documents still public=false with file_size_limit 3145728 and reviewed MIME types.
- Checked schema definitions exactly match pre-test snapshot, including seven recruitment tables with RLS enabled, six recruitment SELECT policies, two restrictive Storage policies, function definitions/ACLs, constraints, indexes and triggers. No persistent fixture DDL remains from the temporary function's transaction.
- Four services remain healthy; no effective host ports. UTS metadata unchanged. No containers, images, networks or volumes created/deleted/restarted.
- Final Docker Engine 29.9.2 responsive, PostgreSQL data filesystem read-write. C: 14.74 GiB free at final check (space fell during the session; still above the 10 GiB execution guard, recheck before later work).

## Remaining gates

Before treating the database as security validated, expand the local SQL matrix for all required/optional/none/unconfirmed assignment combinations, invalid ranks, deadline/manual pause behavior, missing/mismatched object metadata, service-role positive paths, concurrent duplicate NIM/idempotency requests, every status/withdrawal transition, and audit failure atomicity. Existing source substring-based expect_error checks verify message fragments rather than exact SQLSTATE; retain this limitation in interpretation.

Real server/API integration must verify caller JWT signatures/expiry, live profile checks at every endpoint, CSRF/rate limits, server canonical hash/NIM normalization, file verification/scanning, private Storage list/get/write/move/copy denial, broad-policy resistance, cross-application object tampering, streamed downloads and audit delivery semantics, CSV injection/escaping/pagination, credential redaction and signup/recovery boundaries. No production-readiness claim follows from SQL mocks/metadata.

Cloud staging planning can proceed; any contact, dry-run, migration, fixture or deployment needs a separate explicit scope and independently verified personal-organization project identity/credential provenance. Production in the other organization remains out of scope. No application intake until business approvals and server security controls are complete.

## File changes and stop boundary

Added docs/staging/B2B4C-behavioral-security-tests.md and ignored local run_b2b4c.py/evidence artifacts. Existing SQL, migrations, frontend, environment files, credentials and prior reports preserved. No cloud access, seeds, production resources, push or deployment. Stopped after this single authorized suite and read-only verification.
