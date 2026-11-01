# B2B.3 isolated Compose configuration preparation

2026-11-01, Asia/Jakarta. Configuration/static validation only.
**NO-GO for container creation now: the exact pinned image references are not
cached. No image was pulled and no container was created or started.**

## Reviewed disposable artifacts

Workspace: `D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b3-compose`.

- compose.local.yaml — four-service manifest (JSON-form YAML, accepted by Compose).
- local-secrets.env — newly generated local-only values, restrictive Windows ACL.
- bootstrap/ — seven unexecuted official platform SQL assets.
- reference/ — immutable upstream snapshot, parsed source, source/hash inventories.
- bundle.manifest.json — source commit, exact image versions, bootstrap SHA-256s.
- validation.sanitized.json — actual static validation results, no secrets.
- validate_bundle.py — repeatable static validator; no database/container actions.
- review_container_bindings.py — prepared read-only inspection helper for a future
  authorized create/start; NOT run against containers in this phase.
- prepare_bundle.py — one-time configuration/secret generator; refuses secret
  overwrite and must not be rerun against the populated secret file.
- docker-config/ — empty isolated Docker client configuration directory.

All artifacts are ignored by root /.next/ rule, verified with git check-ignore.
Only this report is added as a tracked candidate. The previous reports/work are
preserved. No application source, migrations, tests or production env were changed.
Do not run Next build cleanup against this disposable directory if retaining the
reviewed bundle is desired; a cleanup can delete it. It is not durable secret storage.

Compose project name: **spe-ugm-recruitment-b2b3-local**.
Manifest SHA-256:
`ea59adb299744bda9890b9e117dbd010a56250bf7923664f93d1e17034bb5c7a`.

## Official reference and compatible version selection

Official supabase/supabase Docker source pinned to commit:
`a05e7ec1d79e67cba65e3871b7caf105db27f8b1`.

The manifest keeps the PostgreSQL/Auth/REST/Storage image tuple selected together
by that upstream Compose snapshot. This establishes reference alignment, NOT a
passing runtime compatibility test. Version tags are fixed, never latest; after
a separately approved download, record resolved image digests before creation.

| Service | Exact image | Why retained | Cache result |
| --- | --- | --- | --- |
| db | supabase/postgres:17.6.1.136 | PostgreSQL 17, platform roles/extensions/bootstrap | Not cached |
| auth | supabase/gotrue:v2.197.0 | Genuine Auth schema/user migrations | Exact Docker Hub reference not cached |
| rest | postgrest/postgrest:v14.18 | Official Storage dependency / role-aware REST | Not cached |
| storage | supabase/storage-api:v1.81.0 | Genuine Storage schema/migrations and service | Not cached |

Some CLI-cache images have different registry aliases or versions (PostgreSQL
17.11.0.006, REST 16.5, Storage 1.84.19). They were NOT silently substituted or
retagged. No claim of equivalence between registry aliases is made without digest
verification. No download or alias modification occurred.

Reference: [immutable official Compose source](https://github.com/supabase/supabase/blob/a05e7ec1d79e67cba65e3871b7caf105db27f8b1/docker/docker-compose.yml).

## Required dependencies and deliberate omissions

Auth waits for healthy db. REST waits for healthy db. Storage waits for healthy
db, Auth and REST. Every retained service has a health check inherited from the
reference; startup grace/retries were expanded for first-time schema initialization.

Storage file backend is retained, while image transformation is disabled and its
imgproxy dependency removed. No image transformation is needed by the SQL suite.
Gateway, Studio, Realtime runtime, metadata API, functions, analytics runtime,
pooler and mail delivery are omitted. The API gateway is unnecessary for local
SQL migration/RLS assertions, so host port 55431 is NOT published. Auth/Storage API
traffic can only originate within the project network unless a future reviewed
gateway is added. This bundle is not wired to the frontend.

Platform bootstrap files are exact copies from the SAME upstream commit:
realtime.sql, webhooks.sql, roles.sql, jwt.sql, _supabase.sql, logs.sql, pooler.sql.
They preserve official Postgres initialization dependencies and reserved roles;
the small metadata schemas do not start omitted services. Bootstrap mount targets
match the upstream ordering. They are read-only file mounts with create_host_path
false; missing assets fail rather than silently creating directories.

This is platform initialization, not application seeding. No repository SQL,
test fixture, seed script, user data or Storage object import is mounted. There
is no Supabase CLI process here, so db.seed flags do not apply: application seed
execution is prevented by the allowlisted entrypoints/mounts and absence of seed
assets/hooks. Automatic application tests and migrations are likewise absent.

## Explicit host binding and resource isolation

Actual resolved Compose port list:

```json
[{"service":"db","hostIP":"127.0.0.1","hostPort":"55432","target":5432}]
```

Auth, REST and Storage have NO host-published ports. Their container-internal
0.0.0.0 service listeners are not wildcard HOST port publications.

All services use one new Compose-scoped bridge network, isolated, with
internal=true and IPv6 disabled. There are no external networks, host networking,
privileged services, Docker socket mounts, device mounts, extra capabilities,
container-name overrides or shared UTS namespaces. The internal network blocks
ordinary service egress; actual host-loopback publish reachability still needs
runtime verification. No network was created by static validation.

Fresh project-scoped resources will be named under
spe-ugm-recruitment-b2b3-local: network _isolated and volumes _db-data, _db-config,
_storage-data. The complete standalone file replaces upstream publish definitions;
no additive port overlay can retain a hidden upstream wildcard mapping.

Existing stopped CLI DB 4886fea0e28b, its volume and spe_b2b1_loopback network
remain unchanged and are NOT reused. Current resource inventory has no collision
with the new Compose names. UTS frontend/backend/MySQL remain running. Ports
55431/55432 currently have no listener; recheck immediately before creation/start.

## Local secret handling

Six fresh values were generated using Python's cryptographic secrets module:
database password, JWT signing secret, local anon/service-role JWTs and local
Storage S3-compatible credential placeholders. Database/JWT secrets contain 256
bits of random entropy. JWT signatures/roles and expiry were statically checked;
test JWTs expire after 30 days and must be regenerated safely if preparation ages.

No production/cloud credential or public example credential was used as an active
value. The vendor .env.example is reference-only and never supplied to Compose.
local-secrets.env has protected ACL inheritance disabled and explicit full access
only for the current account and SYSTEM. Values were never printed. Manifest
contains required-variable references, not literal secret values. Signups,
anonymous users, phone/email signup and outbound delivery configuration are disabled.

Compose interpolation was run using an OS-variable allowlist and an explicit env
file, with no inherited Supabase/DB/Compose overrides. Expanded configuration was
parsed IN MEMORY only and never printed/persisted. Avoid unfiltered compose config,
inspect Env, logs or screenshots that could expose generated local values.
These are legacy JWT credentials for platform testing, not a claim of modern
publishable/secret-key frontend integration or production equivalence.

## Static validation actually executed

PASS using installed Docker Compose v5.6.1 at the Docker Desktop plugin executable:

- config --quiet and config --format json (captured only in memory).
- Correct project identity, exact four services and fixed reference image tags.
- Exactly one host publication, explicitly 127.0.0.1:55432/tcp to db:5432.
- No host network, privileged mode, external/shared networks, devices or Docker
  sockets; no builds; pull_policy=never and restart=no for every service.
- Dependency graph points only to included services, no residual imgproxy/gateway.
- Named volumes scoped to the new project; all seven bind mounts are read-only
  bootstrap files in this workspace, with hashes equal to the pinned reference.
- No application migration/test/seed path mounted; no nonlocal endpoint in service
  database/API URL variables; no unresolved Compose variables.
- Secret format/JWT signatures and no literal generated values in the manifest.
- Git ignores and protected secret ACL confirmed. Prepared helper scripts compiled.

No runtime schema, owner-role privilege, RLS, health, network or endpoint PASS is
claimed. Vendor bootstrap execution and image entrypoint behavior are untested.

## Exact later create/inspect/start procedure — NOT EXECUTED

Prerequisites: separate approval for required image downloads or digest-verified
cache aliases; all exact references available locally; repeat validation/hash,
storage/port checks and confirm no new-project resources exist. No image pull is
implicit in the following creation command.

```powershell
$repo = 'D:\SPE UGM SC\spe-ugm-oprec-staging'
Set-Location -LiteralPath $repo
if ((git branch --show-current) -ne 'feat/oprec-backend-staging') { throw 'Wrong branch' }
$root = Join-Path $repo '.next\supabase-b2b3-compose'
$compose = 'C:\Users\Lenovo\AppData\Local\Programs\DockerDesktop\resources\cli-plugins\docker-compose.exe'
Get-ChildItem Env: | Where-Object {
  $_.Name -match 'SUPABASE|DATABASE|^PG|^POSTGRES|^DB_|STAGING_DB|DOCKER|CONTAINER_HOST|^COMPOSE_|^JWT_SECRET$|^ANON_KEY$|^SERVICE_ROLE_KEY$|^LOCAL_S3_'
} | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_.Name) }
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
$env:DOCKER_CONFIG = Join-Path $root 'docker-config'
$argsLocal = @('--project-name','spe-ugm-recruitment-b2b3-local',
  '--project-directory',$root,'--env-file',(Join-Path $root 'local-secrets.env'),
  '--file',(Join-Path $root 'compose.local.yaml'))
python (Join-Path $root 'validate_bundle.py')
if ($LASTEXITCODE -ne 0) { throw 'Static validation failed' }
# STOP: verify exact image cache/digests, fresh resource names, free ports/space.
# Only AFTER explicit container-creation approval:
& $compose @argsLocal create --no-build --pull never --no-recreate
if ($LASTEXITCODE -ne 0) { throw 'Create failed; no start' }
python (Join-Path $root 'review_container_bindings.py') created
if ($LASTEXITCODE -ne 0) { throw 'Created-container metadata check failed; DO NOT START' }
```

The helper requires exactly four new-project containers, state=created, correct
project labels/network, no privileged/host mode, and exactly one requested port
with HostIp=127.0.0.1. It records sanitized bindings before evaluating them. An empty
requested HostIp is not accepted for this deliberately explicit-binding manifest.
Confirm additionally that new mounts/volumes match the reviewed bundle.

After separately approved STARTUP/platform-bootstrap, with storage/error monitoring
and project-only containment ready:

```powershell
& $compose @argsLocal start --wait --wait-timeout 240
if ($LASTEXITCODE -ne 0) { throw 'Startup/health failed; no application SQL' }
python (Join-Path $root 'review_container_bindings.py') running
if ($LASTEXITCODE -ne 0) { throw 'Runtime safety check failed; stop ONLY the new project' }
```

Immediately inspect continuously during startup too; do not wait for final health
to discover an unsafe binding. Running validation requires exact effective DB
127.0.0.1:55432 publication, no other effective publications, correct network and
healthy db/Auth/REST/Storage. Test loopback reachability and rejection on the host's
nonloopback addresses after binding checks pass. Do not infer reachability merely
from static internal-network or HostIp settings. Preserve all UTS and stopped CLI
resource IDs. No reset/down/remove/orphan/volume cleanup command is proposed.

## CLI/self-hosted incompatibilities and remaining risks

- supabase/config.toml, CLI seed flags, CLI local project labels and CLI migration
  discovery do not manage this Compose bundle. Do not run migration up --local
  assuming it discovers this DB. Prepare a verified container-local psql migration
  runner/history strategy in a separately authorized phase.
- Official self-hosted PostgreSQL 17.6/Auth/Storage/REST tuple differs from cached
  CLI 17.11/Storage 1.84/REST 16.5. Schema/default grant parity is not assumed.
- All 17 application files still require authentic Auth/Storage schemas, UUID
  generation, API roles and a migration owner with required privileges. Auth and
  Storage service migrations must complete before application migrations. SQL
  tests' owner role-switching/Storage writes remain unverified.
- Omitted Realtime service does not validate Realtime behavior; legacy publication
  creation must be inspected later. Gateway/API frontend flows are out of scope.
- Image first-start initialization occurs only on fresh volumes. Never mount the
  retained CLI database volume or treat partial state as a clean rehearsal.
- At inspection C: had 19.19 GiB free and D: 28.24 GiB. Docker's VHD is on C: even
  though this bundle is on D:. Additional official-version images can duplicate
  cached CLI layers; adequate extraction reserve, writable storage and resource
  capacity must be rechecked. UTS shares the engine's CPU/RAM/disk resources.
- Both source commit and tags are recorded, but tags are not immutable image
  digests. Record/approve resolved digests when image acquisition is authorized.
- Creation/start and true localhost isolation remain UNVERIFIED. The explicit
  harmless runtime probe from the feasibility plan also remains outstanding.

Stop decision: static bundle review PASS, container creation NO-GO until image
availability/authorization gates are resolved. No create/start/pull, SQL, migration,
seed, test against a database, global Docker change, UTS modification, cloud project
access, commit, push or deployment occurred during preparation.
