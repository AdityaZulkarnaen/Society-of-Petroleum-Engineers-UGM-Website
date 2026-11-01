# B2B.3C stopped Compose container creation and inspection

2026-11-01, Asia/Jakarta. Branch feat/oprec-backend-staging.
Project: **spe-ugm-recruitment-b2b3-local**.

**PASS: exactly four approved containers created, inspected, and NEVER started.**
GO for a separately authorized controlled startup/verification phase only.
Actual effective bindings, platform initialization and health remain unverified;
this is NOT a GO for application migrations or database tests.

## Verified preflight

- Reviewed preparation/acquisition reports and reran validate_bundle.py: PASS.
- Reviewed manifest hash unchanged:
  ea59adb299744bda9890b9e117dbd010a56250bf7923664f93d1e17034bb5c7a.
- All four fixed image references/IDs matched the successful acquisition record.
- Local-only secret file exists; no values were printed. No production/cloud
  credentials were used. Explicit env-file and sanitized child environment used.
- No application migration, test or seed configured for automatic execution.
  Only seven reviewed official platform bootstrap assets are mounted; no entrypoint
  has run, so those scripts were NOT executed during creation.
- C: free 16.22 GiB; Docker Engine 29.9.2 responsive, data filesystem verified rw.
- No target port listener or project resource/name collision before creation.
- UTS and retained CLI resources inventoried and compared before/after.

## Actual create command

Used installed standalone Docker Compose v5.6.1, since empty isolated Docker client
config does not discover the Desktop plugin through docker compose automatically.

```text
"C:\Users\Lenovo\AppData\Local\Programs\DockerDesktop\resources\cli-plugins\docker-compose.exe"
  --project-name spe-ugm-recruitment-b2b3-local
  --project-directory "D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b3-compose"
  --env-file "D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b3-compose\local-secrets.env"
  --file "D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b3-compose\compose.local.yaml"
  create --no-build --pull never --no-recreate
```

DOCKER_HOST explicitly selected the local dockerDesktopLinuxEngine named pipe;
DOCKER_CONFIG referenced the empty target-only directory. Output captured privately.
Creation returned exit code 0. No up/start/restart, image pull, build or deletion
command was used.

## Every created container

Container-name prefix: spe-ugm-recruitment-b2b3-local-. All have the expected
com.docker.compose.project label and matching service label.

| Service / name suffix | Full container ID | State | Requested host publication |
| --- | --- | --- | --- |
| db / db-1 | 11383fa59821673b0f1975ea222c4c5fae73263a192264f68242fb3338dc65d7 | created | 127.0.0.1:55432 -> 5432/tcp |
| auth / auth-1 | 85f472931bb30a932c0f0095d02f74f14e34700f3de5b86a5efa19455fe42ec8 | created | None |
| rest / rest-1 | 5e7b965ec4b84e7c5aaec746a4bb743e2434c28672c3eba2afc10648846ef332 | created | None |
| storage / storage-1 | 8f19443e74a1e194c68f04367148c5b9e1728fe2dfca19b08248ea6babec892e | created | None |

For EVERY container: Running=false, StartedAt=0001-01-01T00:00:00Z,
Privileged=false, NetworkMode references the new isolated project network.
These are created-but-unstarted containers, not previously running/exited ones.

PostgreSQL HostConfig.PortBindings:

```json
{"5432/tcp":[{"HostIp":"127.0.0.1","HostPort":"55432"}]}
```

Auth, REST and Storage HostConfig.PortBindings are empty objects. Every container's
NetworkSettings.Ports is empty BEFORE startup. This is expected and is not proof
of runtime isolation. No current target host listener exists from these unstarted
containers; no network reachability or database health test was performed.

## Verified image identities

| Service | Exact reference | Image ID |
| --- | --- | --- |
| db | supabase/postgres:17.6.1.136 | sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00 |
| auth | supabase/gotrue:v2.197.0 | sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b |
| rest | postgrest/postgrest:v14.18 | sha256:c7cd7e265a85b05248abf53f4473fcec7e327c282d0bd0cf60f1551996d09fcf |
| storage | supabase/storage-api:v1.81.0 | sha256:98ffec5d0678803783c30e404c27f4ec65e97efbe014088f2a86b4b8b54b9f54 |

## Project resource ownership

Exactly one NEW network:

- spe-ugm-recruitment-b2b3-local_isolated
- ID 1427a977da1d22b350683cbe0d5346d3b94a8004e75136889742241ab8346bcd
- bridge, internal=true, IPv6=false, correct Compose project label.
- All four created containers reference only this network; no host/external network.

Exactly three NEW local-driver volumes, with matching project and volume-key labels:

- spe-ugm-recruitment-b2b3-local_db-data
- spe-ugm-recruitment-b2b3-local_db-config
- spe-ugm-recruitment-b2b3-local_storage-data

No existing network or volume reused. Bind mounts were verified as read-only,
target-only reviewed vendor bootstrap filenames; no Docker socket/application
mounts. No other container, network or volume appeared during this operation.

## Existing resources preserved

Before/after metadata for every baseline container compared identically, including
ID, state, StartedAt and requested host bindings. Existing network/volume sets
were retained; only the approved one-network/three-volume additions occurred.

UTS frontend/backend/MySQL remain running with unchanged IDs and StartedAt:

| ID prefix | Service | StartedAt UTC |
| --- | --- | --- |
| 8ea15b786275 | frontend | 2026-11-01T08:58:33.786030107Z |
| 8e22097dc328 | backend | 2026-11-01T08:58:35.800367434Z |
| b2b0c5e225bd | MySQL | 2026-11-01T08:58:33.79543001Z |

Retained CLI PostgreSQL 4886fea0e28b remains exited with its original StartedAt;
laravel-app and keen_visvesvaraya remain exited. No unrelated stop/restart/change.
C: free space after creation: **16.22 GiB**.

## Local secret ACL access issue, resolved without exposure

Initial preflight under the Docker execution account failed to read the protected
local secret file; no Docker creation occurred in those failed preflight attempts.
The sandbox file-owner account and Docker execution account differ. A first
Set-Acl attempt failed for lack of SeSecurityPrivilege and did not resolve access.
Using the file owner's icacls access, granted READ temporarily only to the exact
local Docker execution account, not a general group. Secret values unchanged and
not printed. This allowed the intended explicit env-file interpolation.

After creation and inspection, removed the temporary account grant and verified
the access-control SDDL matches the original EXACTLY. Secret file remains protected
to the sandbox owner and SYSTEM. Static validation still passes under that owner.
Any future Compose startup must handle execution-account access deliberately;
do not broadly relax ACLs or copy secrets into logs/command-line arguments.

## Independent postchecks and next gate

review_container_bindings.py created: PASS-metadata-created, all four service labels,
one exact requested loopback port, all states created, correct project network.
validate_bundle.py after ACL restoration: PASS-static-only.

Before any future startup: obtain explicit startup/platform-bootstrap approval;
recheck storage/ports, exact IDs, config hash, secret access and unchanged UTS state.
Monitor EVERY target container during startup, persist effective bindings BEFORE
stopping on unsafe/ambiguous results, and verify healthy Auth/Storage/REST/DB.
Application migrations and SQL tests remain separately gated. Do not infer runtime
network safety or initialized schemas from these create-only checks.

No container was started/restarted; no database initialized, SQL/migration/seed/
database test/Storage operation executed, cloud project accessed, resource pruned/
deleted, Docker global setting changed, push or deployment performed.

## Evidence and files

Ignored sanitized evidence:
.next/supabase-b2b3-compose/container-create-5w5dqrwj and
.next/supabase-b2b3-compose/container-creation.sanitized.json,
plus bindings-created.sanitized.json. Full environments/secrets are excluded.
Creation helper and ACL backup remain ignored in the disposable workspace.

Only this report is a new tracked candidate; earlier untracked reports preserved.
Existing implementation, migrations, tests, packages and reviewed manifest unchanged.
No commit created. Stop after created-container verification.
