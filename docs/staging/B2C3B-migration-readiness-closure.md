# B2C.3B migration readiness closure

2026-11-02, Asia/Jakarta. feat/oprec-backend-staging.

**Local CLI/history rehearsal PASS. NO-GO for cloud migration writes.** SSL Enforcement is now owner-confirmed OFF; backend TLS readiness and effective Cloud DDL/type checks remain unresolved. No cloud connection, setting change or history repair occurred in this phase.

## Closure status

| Gate | Result |
| --- | --- |
| SSL Enforcement status evidence | CLOSED as an observation: owner confirms OFF for lavxddhrrwsjcshmnwvu on 2 November 2026 WIB; precise time not recorded. |
| Backend encryption requirement | OPEN: prior backend pg_stat_ssl=false is consistent with enforcement OFF; client verify-full/TLS 1.3 does not establish backend TLS. |
| Frozen migrations | PASS: all 17 filenames/order/SHA-256 values match B2C1 manifest, including untouched rehearsal copies. |
| Pinned CLI application/history | PASS locally: CLI 2.122.0 applied all 17 and recorded exact expected versions/names with nonempty statements arrays. |
| Authored-COMMIT/history gap | CONFIRMED locally for #15/#16/#17; explicit stop/recovery plan required, no automatic replay/repair. |
| Effective Cloud privileges/public types | OPEN: previous managed catalog did not directly establish database/public CREATE or public.admin_role absence. No new Cloud queries allowed/executed. |
| Cloud CLI/TLS preview and write approval | OPEN: local rehearsal is not a Cloud driver/TLS preview or write authorization. |

## Owner-provided SSL evidence and checklist

Evidence received during this task:

- Project spe-ugm-staging, reference lavxddhrrwsjcshmnwvu.
- ?Enforce SSL on incoming connections?: OFF/Disabled; gray toggle positioned left.
- Observation date 2 November 2026, WIB/UTC+7. Exact time not independently recorded: do not invent one.
- Owner confirms no toggle/save/settings change. Agent did not access Dashboard/API/database.

Before relying on future status evidence: confirm exact ref and personal organization context, record date/time/timezone and current state/pending-change indication, exclude secrets from any capture, and verify no accidental setting change. A display name or gray color alone is insufficient without project/context and the explicit state. This owner attestation resolves the status question, not remediation or a live API check. Refresh it before eventual execution.

Supabase documents enforcement as applying to both shared-pooler legs and warns that updating it reboots the database: https://supabase.com/docs/guides/platform/ssl-enforcement. This task reviewed that previously established guidance/plan without contacting cloud. The earlier backend row means PostgreSQL TLS was absent on that observed backend connection; it does not invalidate client-to-pooler verify-full, and it does not audit provider underlay/private-network protections.

For the recommended write gate, require backend encryption evidence as well as retained client verification. Owner must separately authorize any enforcement change/reboot and interruption window. After that, a separately authorized fresh single-transaction READ ONLY inspection must verify client TLS and its own backend pg_stat_ssl, plus effective privileges/types/freshness below. If enforcement is reported ON but backend remains false, stop and obtain provider clarification. Do not weaken TLS, auto-switch endpoints or bundle a settings change with migrations. No enforcement change or new probe was performed here.

## Safe new local environment: actual execution

Created ONLY project spe-ugm-recruitment-b2c3b-rehearsal, workspace .env.staging.private/b2c3b-rehearsal, four new containers, three new project-owned volumes and one dedicated bridge. Existing B2B Compose services, retained CLI container, UTS and other old resources were not reset/restarted/modified.

- Reused four already cached pinned images: supabase/postgres:17.6.1.136, supabase/gotrue:v2.197.0, postgrest/postgrest:v14.18, supabase/storage-api:v1.81.0. No image download or global Docker change.
- New independent generated LOCAL passwords/JWT/S3 values; no staging or production secret files read/copied. Protected directory access limited to Lenovo/SYSTEM through inherited ACL. The initial non-secret .next directory ACL setup failed; no secret was written there. A new subdirectory under already protected storage was verified before use. A metadata-template error was corrected before container creation.
- All four new services became healthy. Actual DB publication was exactly 127.0.0.1:55472; other services published no host ports. Dedicated bridge uses internal=false for host-loopback reachability, IPv6 disabled, only the four new containers attached. This is project/resource isolation, not an air-gap claim.
- Local CLI service explicitly selected 127.0.0.1, generated LOCAL passfile and new database names; no inherited PG/cloud endpoints. CLI home isolated, keyring and telemetry disabled, API/proxy destinations directed to closed localhost, no project credentials loaded. Local sslmode=disable was deliberate only for the distinct disposable loopback target; cloud profile/CA/verify-full remained untouched. This rehearsal does not validate Cloud CLI TLS.
- No repository migrations were mounted for automatic initialization. Vendor bootstrap/Auth/Storage initialized only the new project. Migration execution then used the pinned CLI, explicit service selector, frozen packet, seeds/roles off and skip-vault.
- All new services were stopped at completion; new volumes/network/evidence retained for diagnosis, not pruned. All ten preexisting container IDs/state/StartedAt/images/ports/networks/labels/health metadata compared unchanged. C: 12.12 GiB free, D: 27.79 GiB at final check; recheck capacity before more work. No existing volume/network targeted by a mutation.

## Actual CLI history and failure drills

Positive database is the NEW rehearsal project's postgres database. The platform-only baseline was dumped from that database before application migrations, then restored only into additional NEW databases within that same new container for fault drills. The shared predefined platform roles were not changed to force application success. Application migration executor remained postgres.

| Case (new local DB only) | Actual result |
| --- | --- |
| Dry-run on fresh baseline | CLI exit 0; no application executed and migration ledger remained absent. |
| All 17 unchanged files | CLI exit 0; exactly 17 expected versions AND names, every statements array nonempty. Seven RLS recruitment tables, 65 constraints, ten recruitment functions, private bucket. No Auth/applicant/object fixtures. |
| gap01: fail first history insert | CLI exit 1; version list empty; public.admin_role/profiles absent. Ordinary file body and history rolled back together. |
| gap15: fail #15 history insert | CLI exit 1; 14 earlier versions retained; #15 version absent but rating-column drop committed. |
| gap16: fail #16 history insert | CLI exit 1; 15 earlier versions retained; #16 version absent but recruitment tables committed. |
| gap17: fail #17 history insert | CLI exit 1; 16 earlier versions retained; #17 version absent but private bucket/security body committed. |

Fault injection used a deliberately failing BEFORE INSERT trigger on the standard ledger only in each new scratch database; it raised local_rehearsal_injected_history_failure for the selected version. It did not alter the 17 migration files, create application identities, fake an applied row, grant privileges or repair history. Each drill ran once in its own database; no blind rerun. Original successful rehearsal database remained intact.

This confirms the earlier tagged-source analysis in real local execution: first 14 bodies are ordinary transactional batches; the last three own their BEGIN/COMMIT and CLI records history afterward. There is no all-17 atomic transaction. The representative ordinary-file failure demonstrates the normal batching path; it is not 14 separately injected rollback tests. No cloud behavioral/RLS suite was executed.

Every migration was positively recorded on the happy path. For failure handling:

- #1?#14: stop at first error, preserve prior successful versions, verify failed-file objects/history before any approved resume. No automatic reset.
- #15?#17 before COMMIT: body should roll back; inspect actual outcome. This before-COMMIT case follows transaction semantics/source review, not a separately injected case here.
- #15?#17 after COMMIT/history failure or any uncertain acknowledgement: body may exist without ledger row, as directly observed. Freeze further execution, retain exact SHA/file/SQLSTATE/logs, compare actual body postconditions to approved source under separately authorized read-only inspection. Do NOT let another CLI push replay the file blindly.
- Any missing-row reconciliation is a new explicit recovery authorization after exact-state proof, not automatic repair and not covered by ordinary migration approval. If state cannot be proven, design a data-preserving forward fix. No destructive reset/recreation, fake markers, blanket CASCADE or privilege bypass. #15's dropped data cannot be recovered by rolling back a later file; verify backup/recovery facilities before future writes.

## Offline requirements versus missing Cloud checks

All 17 remain ordered as in B2C3A. #1 creates the only standalone declared application enum, public.admin_role; #2 adds divisions/multi-super-admin support; #3?#6 supply profile details, election dependencies, is_active and period; #7?#15 reproduce legacy management/voting/meeting objects; #16?#17 create recruitment schema/security/private storage. No cherry-picking, bootstrap import or source edits.

Existing managed observations support auth.uid/jwt/role, UUID, plpgsql/pgcrypto, API roles, Auth/Storage tables and active supautils policy whitelist. New public objects must be owned by postgres; SECURITY DEFINER alone needs no superuser. Managed Storage ownership differs intentionally; keep the observed policy hook and precise permissions, no owner override. Publication owner postgres is known; its membership must be explicitly checked after migration because #13 swallows errors.

A NEW authorized read-only supplement is still needed for:

1. Database owner and effective database CREATE (ledger schema), public USAGE/CREATE, plpgsql USAGE; Auth users REFERENCES/uid EXECUTE; Storage bucket INSERT and object SELECT as the actual executor.
2. All public standalone types/enum names/owners, especially to_regtype(public.admin_role) absent. Previous empty public pg_class result did not inspect pg_type. The local enum test proves local behavior only, not Cloud absence.
3. Scoped existing trigger/event-trigger metadata, policy-name conflicts, current function/object/history state and fresh Auth/object/bucket presence. Stop if unexpected/populated; no write-based DDL probe.
4. Fresh transport evidence after any separately approved SSL remediation. Keep one guarded BEGIN TRANSACTION READ ONLY and ROLLBACK, no pooled default changes, no side-effecting functions or private object reads.

No Cloud privilege/type gate is marked closed from local results. Broad observed default grants and BYPASSRLS require later scoped user-role/API testing; catalog ownership is not authorization certification. Recruitment checks current active super_admin rather than legacy is_super_admin; existing legacy inactive-account behavior remains unchanged/outside recruitment assurance.

## Concise staging execution runbook ? future approvals only

1. **Identity gate:** reference lavxddhrrwsjcshmnwvu, personal org abnfnzzearslinsxnjcb/el-kocan's Org, Mumbai, exact API origin https://lavxddhrrwsjcshmnwvu.supabase.co; selected Session Pooler aws-0-ap-south-1.pooler.supabase.com:5432, database postgres, username postgres.lavxddhrrwsjcshmnwvu. Match owner evidence to strict candidate profile; no inferred/linked/alternate host.
2. **Transport/privilege gate:** record approved SSL status/remediation and fresh backend/client TLS; complete the read-only type/DDL/freshness supplement. No write until passed.
3. **Packet gate:** CLI 2.122.0 binary/hash and exact 17 original filename/SHA values; isolated config with migrations enabled, seeds disabled, no project env/link/roles/schema/vault artifacts. Private target profile uses explicit existing staging passfile and validated CA, verify-full, no startup transaction-default changes. Local rehearsal profile must NEVER be substituted for this cloud profile.
4. **Preview approval:** separately authorize a guarded CLI dry-run using explicit protected staging service, skip-vault and no include-all/seed/roles flags. Require exactly 17 pending files and no unexpected remote history. Local dry-run was non-mutating; cloud route/TLS still needs separate preview verification. No password-bearing argv or raw shared-shell environment.
5. **Write approval:** present identity/TLS/supplement/preview/hashes/recovery evidence and obtain explicit permission for ledger bootstrap and all 17 DDL/DML bodies, including legacy public bucket, recruitment private bucket, policies and publication. Then execute the reviewed CLI plan from B2C3A with the same explicit target. One writer, no automatic retry, bounded watchdog and protected logs/checkpoints. Stop on first error/ambiguity; do not repair history or continue automatically.
6. **Postcheck:** exact 17 versions/names, original hashes, 18 expected public tables including profiles/is_active; seven recruitment tables with RLS, 65 expected constraints, 19 indexes, seven triggers and ten function signatures/owners/search_path/ACL; six recruitment table policies/two restrictive Storage fences. Compare definitions, not counts only. Confirm private recruitment-documents (3 MiB/MIME allowlist), expected public candidate-photos and meeting_attendance publication membership. No unexpected accounts/catalogue/applicants/objects. Actual role/JWT/HTTP/upload/download/export security needs NEW scoped fixture/test approval; never run local recruitment_design.sql on Cloud.

No cloud execution wrapper/approval is implied by local success. Preserve and review the known commit/history gap before approving writes. Frozen sources were not normalized or edited to hide it.

## Artifacts and final decision

Added this report, B2C3B-local-rehearsal-result.json (sanitized results/SSL owner attestation) and scripts/staging/rehearse-cli-local.py (local-only orchestration, no Cloud path). Protected raw evidence/config/generated local credentials/fault results remain under .env.staging.private/b2c3b-rehearsal, Git-ignored; do not print them. The earlier failed-ACL .next/b2c3b-rehearsal folder contains only non-secret initial inventory evidence. No local password copied from staging/production. No image pull, history repair, real staff/admin/applicant account, cloud query/settings change, Docker reset/prune, old-service mutation, push or deployment.

Local mechanism/history blocker is closed with explicit failure semantics; SSL status question is closed as OFF with owner-supplied provenance and missing exact timestamp. **Cloud writes remain NO-GO:** SSL/backend remediation and fresh verification require new authorization, effective DDL/type checks need new read-only authorization, Cloud CLI preview must be approved, and exact write/recovery scope must be approved. Stop after this rehearsal/report.

## Final minimum inspection update ? 2026-11-02

One subsequently authorized Cloud READ ONLY inspection closed the effective DDL/type gate: postgres owns the database; database/public CREATE, public/Auth/Storage USAGE, plpgsql USAGE, Auth REFERENCES/uid EXECUTE, Storage INSERT/SELECT, API role existence, publication ownership and both Storage policy grants all passed. public.admin_role is absent; public types/relations and repository history are absent. TLS 1.3/verify-full and the in-transaction guard passed; ROLLBACK completed. Backend ssl remains false. Evidence: final-ddl-readonly-result.json. No write, setting change, production access or repeated rehearsal. The remaining pre-write security gate is SSL Enforcement remediation and fresh backend TLS verification, followed by the already documented guarded CLI preview/migration/postcheck sequence under consolidated explicit approval.
