# B2B.3 controlled local startup retry

2026-11-01, Asia/Jakarta. Project spe-ugm-recruitment-b2b1-local, existing
disposable workdir .next/supabase-b2b1-local, feat/oprec-backend-staging.

**NO-GO for migration testing. The retry was aborted by the binding safety guard.
Only the newly created disposable PostgreSQL container was stopped.**

## Preflight and authorized startup

- Supabase CLI 2.122.0; responsive local Linux Docker Engine 29.9.2.
- C: free space at retry start: 20.27 GiB, exceeding the earlier diagnosis.
- Config hash remained
  6d22cbf5320893b5917b548be787f72e274ded2e6bac354586e6e97f11886b57.
- Seeds disabled, seed/schema paths empty, zero SQL files in target supabase
  directory, no env file or project-ref/pooler-url/linked-project.json metadata.
- No listeners on candidate 55430–55440 ports before startup; target DB 55432,
  API 55431, shadow 55430.
- No existing disposable containers. Existing UTS resources inventoried first.
- Existing network spe_b2b1_loopback retained ID
  fc3eea4d7c2411c3974e95575351622a3d965aa6a1328155c0fc9dbb143818c3,
  host_binding_ipv4=127.0.0.1, IPv4 enabled/IPv6 disabled, zero initial attachments.
  No network was recreated or changed.

Repository-installed native CLI was invoked with:

```text
start --workdir "D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b1-local" --network-id spe_b2b1_loopback
```

Child environment used an allowlist, explicit local Docker named pipe and empty
disposable Docker config directory, no inherited Supabase/PG/DB routing values,
and telemetry opt-out. stdout/stderr were kept in private ignored local logs.
No cloud project was linked or supplied as a target.

## Monitoring and storage outcome

The retry polled C: capacity, startup logs, new container identities, network modes
and requested/effective port bindings. The low-storage stop threshold was 5 GiB:
an operational reserve for this attempt, not a guaranteed minimum for all images.
Extraction/I/O/read-only/out-of-space markers triggered immediate abort.

Elapsed monitoring: 38.1 seconds. Minimum observed C: free: 19.20 GiB;
final check: 19.20 GiB. No renewed read-only filesystem, input/output error,
out-of-space or failed-snapshot-commit marker appeared in the private retry logs.

The previously incomplete images are now tagged in the local cache:

- public.ecr.aws/supabase/postgres:17.11.0.006 — 1.7 GB image size.
- public.ecr.aws/supabase/storage-api:v1.84.19 — 1.43 GB image size.

No prune, removal, Docker restart, WSL shutdown or host storage change was performed.

## Binding guard, stop and evidence limitation

The guard raised:

```text
Unsafe actual published binding: supabase_db_spe-ugm-recruitment-b2b1-local
```

That branch rejects a NetworkSettings.Ports entry whose HostIp is missing,
unspecified, or not 127.0.0.1/::1. It terminated the startup process, then stopped
only newly created running containers belonging to this project, excluding every
baseline container ID. No remaining supabase startup process was found afterward.
The process exited with code 1 following abort; this is not an independently
established application SQL/health failure.

IMPORTANT: the guard did not persist the offending entry or container state before
stopping. Therefore the exact offending address is UNKNOWN. No claim is made that
a specific 0.0.0.0 or :: runtime binding has been proven, nor that the network
option was conclusively overridden. A transient/unspecified address also causes
this guard to abort. This evidence gap prevents declaring localhost isolation.

Final read-only inspection of the retained stopped container:

| Field | Observed value |
| --- | --- |
| Container | supabase_db_spe-ugm-recruitment-b2b1-local |
| ID prefix | 4886fea0e28b |
| State | exited |
| Started | 2026-11-01 16:21:57.952 WIB |
| Finished | 2026-11-01 16:22:02.514 WIB |
| Requested binding | 5432/tcp: HostIp empty, HostPort 55432 |
| Effective bindings after stop | empty |
| NetworkMode | spe_b2b1_loopback |
| Health after abort/stop | unhealthy; does not establish the reason a full startup would succeed/fail |

A stopped container's empty effective bindings cannot reconstruct its prior
published address. Default network options alone do not prove effective service
bindings. Do not restart the retained container merely to fill this evidence gap.

## Service readiness and preserved resources

PostgreSQL ran briefly but never completed verified startup. Auth, Storage and
API service containers were not created. No Auth/Storage schema readiness,
database connectivity, API health or localhost isolation PASS is claimed.

Retained new project resources: the stopped DB container, volume
supabase_db_spe-ugm-recruitment-b2b1-local, cached images, and existing dedicated
network. Network final attachments: zero. Nothing was reset or deleted.

All unrelated baseline containers remain as before. UTS frontend/backend/MySQL
are running, with unchanged IDs and StartedAt timestamps:

| Container ID | UTS service | StartedAt UTC |
| --- | --- | --- |
| 8ea15b786275 | frontend | 2026-11-01T08:58:33.786030107Z |
| 8e22097dc328 | backend | 2026-11-01T08:58:35.800367434Z |
| b2b0c5e225bd | MySQL | 2026-11-01T08:58:33.79543001Z |

The UTS data volume and all existing networks were preserved. Exited laravel-app
and keen_visvesvaraya were untouched. No unrelated process/container was stopped.

## Application boundary and next decision

No repository migration was copied or applied; target SQL-file count remains
zero. No recruitment SQL assertions/fixtures, seed script or manual SQL ran.
The CLI was authorized to bootstrap its own platform, but completion of platform
initialization is unverified. No cloud Supabase access, push or deployment.

Before a separately authorized retry:

1. Improve the local guard to persist a sanitized offending binding, container
   state and requested/effective mapping BEFORE stopping. Distinguish pending
   network state from a proven nonloopback published endpoint without weakening
   the rejection of unsafe active bindings.
2. Inspect retained stopped DB/container/volume state, installed CLI publishing
   behavior and Docker's network-default behavior read-only. Reconcile the
   evidence; do not silently accept unspecified/wildcard bindings or reuse
   partial database state as a clean rehearsal.
3. Present a corrected explicit-loopback startup plan if needed; obtain approval
   for any configuration/recovery/start changes. Preserve UTS and retained evidence.
4. Repeat complete startup/network/health verification before considering B2B.4.
   Application migration/testing permission has not been granted.

Private ignored evidence is under
.next/supabase-b2b1-local/evidence/controlled-retry-aqukiac2. The sanitized result
retains the guard reason, process code, duration and capacity samples. Raw local
startup logs may contain development keys and must not be published.

Only this report is added as a new tracked candidate. Earlier reports remain
preserved; implementation/migration/test/environment files are unchanged. No
commit or deployment. Work stopped after verification of the aborted retry.
