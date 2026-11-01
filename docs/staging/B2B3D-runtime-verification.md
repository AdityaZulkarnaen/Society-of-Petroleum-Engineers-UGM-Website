# B2B.3D controlled Compose startup and runtime verification

2026-11-01, Asia/Jakarta. Branch feat/oprec-backend-staging.
Project spe-ugm-recruitment-b2b3-local.

**Startup/platform health PASS. NO-GO for B2B.4 as currently planned:** the requested
host database endpoint did not materialize, and the planned postgres execution
role needs review for Storage policy ownership. All four approved services remain
running and healthy; no unsafe host publication was detected.

## Authorized startup and preflight

Read the preparation/creation reports and validated the existing manifest, all
four exact pre-created IDs, project/service labels, image IDs, read-only vendor
bootstrap mounts and original requested port bindings. No application migrations,
SQL tests, seeds or user data are mounted/configured for execution. Manifest hash
remained ea59adb299744bda9890b9e117dbd010a56250bf7923664f93d1e17034bb5c7a.

Docker Engine 29.9.2/Linux responsive; C: initially 16.23 GiB free; port 55432 free.
UTS baseline running IDs and StartedAt values recorded; retained CLI PostgreSQL
remained exited. Only the four existing Compose containers were started.

Used installed Docker Compose v5.6.1 with reviewed project/workdir/env-file/manifest
arguments and `start --wait --wait-timeout 240`. No up/create, image pull, build,
restart, reset or deletion command was run. Command returned exit code **0**.
Child environment was allowlisted, Docker endpoint explicitly local, and raw
stdout/stderr captured privately rather than streamed into the report.

As in B2B.3C, the generated secret file needed a temporary READ grant for the exact
local Docker execution account. Values were not printed or changed. After startup
inspection the grant was removed and the original access-control SDDL verified
identical. The protected owner/SYSTEM ACL is restored; static validation still PASS.

## Actual effective bindings — captured while running

| Service | Container ID prefix | State / health | NetworkSettings.Ports |
| --- | --- | --- | --- |
| db | 11383fa59821 | running / healthy | {"5432/tcp":[]} |
| auth | 85f472931bb3 | running / healthy | {} |
| rest | 5e7b965ec4b8 | running / healthy | {"3000/tcp":null} |
| storage | 8f19443e74a1 | running / healthy | {"5000/tcp":null} |

Requested DB binding remains:

```json
{"5432/tcp":[{"HostIp":"127.0.0.1","HostPort":"55432"}]}
```

Auth, REST and Storage requested bindings remain empty. Every container references
only spe-ugm-recruitment-b2b3-local_isolated; this network remains internal=true,
IPv6=false with four attached target containers. No host networking or privileged
mode was introduced. The monitor saved sanitized requested/effective mappings
BEFORE evaluating them, throughout startup and at completion.

No effective published entries point to 0.0.0.0, :: or any other nonloopback address.
Docker ps shows only internal container ports; docker port for the DB prints no
mapping. Windows listener enumeration found no 55432 listener, and a direct
127.0.0.1:55432 TCP probe failed. Therefore the host database endpoint is **NOT
available**, despite the requested explicit loopback mapping. No localhost
reachability PASS is claimed. The internal network setting is recorded, but the
precise Docker publishing cause was not established or repaired in this task.

This is not the earlier wildcard-publish result: there are NO effective host
publications in the current stack. No unsafe address was observed, so project-only
safety stopping was not triggered. Healthy private services were left running.
The prior running-check helper expects an effective 127.0.0.1:55432 entry; that
expectation is NOT satisfied. Static requested-binding PASS must not hide it.

## Platform readiness, independently inspected

All four Docker health checks were healthy with last health-check exit code 0.
PostgreSQL was additionally reached via container-local Unix socket with psql,
not a host/cloud database URL.

Only catalog metadata was queried inside explicit **BEGIN READ ONLY / ROLLBACK**
transactions. No user/application-data query, manual write SQL, application test
or role/privilege change was executed. transaction_read_only reported on.

Verified PostgreSQL version: **17.6**.

| Required platform object | Catalog result |
| --- | --- |
| auth.users | Exists |
| auth.uid() | Exists |
| storage.buckets | Exists |
| storage.objects | Exists |
| gen_random_uuid() | Exists |
| anon/authenticated/service_role/authenticator roles | Exist |
| supabase_auth_admin / supabase_storage_admin | Exist |

Auth/Storage service bootstrap therefore completed sufficiently for healthy
services and these required objects. This does NOT establish application RLS/RPC
correctness or API document-upload/download behavior; none was tested.

Catalog checks also found public.profiles, public.admin_role and
public.recruitment_applications absent, consistent with no repository application
migrations having run. No repository SQL was copied into platform bootstrap paths.

## Migration-owner compatibility issue

The self-hosted platform is not identical to the assumed CLI owner environment:

- Current inspection role postgres: **not superuser**, BYPASSRLS=true.
- postgres can create in public, INSERT into auth.users/storage.buckets and
  SET ROLE authenticated/service_role, per read-only privilege checks.
- auth.users is owned by supabase_auth_admin.
- storage.buckets/objects are owned by supabase_storage_admin and have RLS enabled.
- postgres does NOT inherit supabase_storage_admin privileges (pg_has_role USAGE
  false), so the current runner cannot be assumed to have Storage policy-owner
  authority. BYPASSRLS does not by itself grant object ownership/DDL authority.
- A built-in supabase_admin superuser exists. It was NOT selected as a new write
  executor, granted to another role, or used to run application SQL in this task.

Legacy candidate-photo migration and recruitment security migration CREATE POLICY
on storage.objects (and the new security migration also storage.buckets). Review
the exact migration/test executor and owner model BEFORE B2B.4; do not weaken
Storage grants or modify legacy SQL simply to bypass this concern. No CREATE
POLICY or other write was attempted to experimentally test the permission.

No startup blocker occurred in Auth/REST/Storage. The two outstanding items are
transport/acceptance and migration-executor readiness, not failed service health.

## Capacity, errors and existing resources

C: free space started 16.23 GiB, remained above the 5 GiB safety reserve, and was
**16.19 GiB** at final inspection. Docker Engine remained responsive and the data
filesystem mounted rw. No read-only filesystem/input-output/out-of-space marker
appeared in the inspected startup/service logs. Raw service logs were kept private.

All non-project baseline container identities, states and StartedAt values compare
unchanged. In particular UTS containers remain running:

| Service | ID prefix | StartedAt UTC |
| --- | --- | --- |
| frontend | 8ea15b786275 | 2026-11-01T08:58:33.786030107Z |
| backend | 8e22097dc328 | 2026-11-01T08:58:35.800367434Z |
| MySQL | b2b0c5e225bd | 2026-11-01T08:58:33.79543001Z |

Retained CLI PostgreSQL 4886fea0e28b remains exited. No unrelated container, image,
network or volume was modified; no additional container appeared during startup.
Only authorized platform services initialized their own schemas/internal state in
their existing dedicated volumes.

## Decision and next gate

NO-GO for executing the 17 application migrations/tests under the previous plan.
Before a separately authorized B2B.4:

1. Explicitly choose either container-local-only SQL transport (which has now
   worked for read-only catalog inspection) with no host endpoint requirement,
   or review why the requested loopback publication is absent and authorize any
   needed configuration/recreation. Do not silently claim 55432 is reachable or
   change network/publishing settings during this verification phase.
2. Review a suitable local migration/test owner and how to invoke it, accounting
   for genuine Storage ownership and required role switching. Avoid application
   permission changes or artificial auth/storage stubs.
3. Reconfirm the exact 17-file hashes/order, no previous application migration
   history/data, health and UTS baseline, then obtain explicit migration/test
   approval. A running platform does not authorize application writes.

No repository migration, recruitment fixture/test, application seed, manual write
SQL or Storage operation ran. Only the explicitly allowed read-only catalog SQL
was executed. No cloud Supabase project connection, push, deployment or commit.

## Artifacts

New tracked candidate: this report only. Ignored target evidence:
controlled-start-rdzolj8p/, startup-runtime.sanitized.json,
bootstrap-readonly.sanitized.json, bootstrap-privileges.sanitized.json,
host-db-endpoint.sanitized.json and the monitoring helper start_existing.py.
Private logs contain no report output; complete environments/JWTs/passwords are
never printed. Existing source, SQL files, tests, packages and manifest unchanged.
Work stopped after startup and readiness verification, with all four target
services running privately and healthy.
