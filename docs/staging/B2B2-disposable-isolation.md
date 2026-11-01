# B2B.2 disposable local isolation preparation

2026-11-01, Asia/Jakarta. Worktree: D:\SPE UGM SC\spe-ugm-oprec-staging,
branch feat/oprec-backend-staging; HEAD at inspection:
127017bad659a7958d23bce47f037022cc656236.

Decision: **configuration prepared; NO-GO for startup**. No Supabase service,
database, SQL, migration, seed, database test or Storage operation was executed.
No cloud project was accessed. No Docker resource was created/changed/stopped.

## Exact prepared workspace

`D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b1-local`

Files:

- supabase/config.toml — actual installed CLI template, locally customized.
- supabase/.gitignore — generated CLI ignore rules.
- supabase/.temp/cli-latest — CLI-generated notification cache; values not read.
- source-migrations.manifest.json — filename/SHA-256 inventory of all 17 source
  migrations, not SQL copies and not migration history.

Config SHA-256:
`6d22cbf5320893b5917b548be787f72e274ded2e6bac354586e6e97f11886b57`.

Root /.next/ ignore rule covers the entire disposable workspace, verified with
git check-ignore. Nothing inside is tracked or should be force-added. Next build
cleanup can remove this workspace: it is intentionally disposable, not durable
configuration storage. No .env file, cloud link project-ref/pooler-url, seed SQL,
project migration SQL or declarative schema file was copied into it.

## Actual configuration

CLI 2.122.0 was rechecked using the repository .cmd shim, with DO_NOT_TRACK=1.
Actual help confirms --workdir, --network-id and migration up --local. No global
CLI install or implicit download was used. Only config-only init was run.

| Setting | Prepared value |
| --- | --- |
| project_id | spe-ugm-recruitment-b2b1-local |
| api | enabled, 55431 |
| db | 55432; shadow 55430; PostgreSQL major 17 |
| db.seed | enabled=false; sql_paths=[] |
| db.migrations | enabled=true; schema_paths=[]; currently zero copied migrations |
| auth / storage | enabled |
| auth signup, email signup, anonymous sign-in, SMS signup | disabled |
| auth site_url | http://127.0.0.1:3000; additional redirects=[] |
| storage max file size | 3MiB |
| realtime, studio, local_smtp, edge_runtime, analytics, pooler | disabled |
| storage S3 protocol, storage analytics/vector, experimental pgdelta | disabled |
| Unused provider/AI/S3 credential fields | empty template strings, no env() hooks |

Disabled-service ports are also separated: Studio 55433, SMTP UI 55434, analytics
55437, edge inspector 55438, pooler 55439. No host port is reserved by editing TOML.
55430–55440 have no observed listeners and do not overlap the inspected IPv4/IPv6
excluded-port ranges. Repeat checks immediately before any approved startup.

db.network_restrictions remains disabled; its CIDR arrays were narrowed to
127.0.0.1/32 and ::1/128, but these are NOT a Docker binding guarantee. No claim
is made that this setting enforces host-local publishing in local CLI mode.

Validation performed: Python TOML parsing and assertions for identity, port,
seed flags, essential service flags, disabled optional services, absence of env()
hooks and nonloopback URL values, absence of env/migration SQL copies. No actual
CLI start-time schema validation, service dependency resolution or health check
was performed. Empty unused credential placeholders are not real credentials.

Auth and Storage are enabled so the platform bootstrap can initialize the schemas
required by the 17 files: auth.users/auth.uid, platform roles, storage.buckets
and storage.objects. Their actual availability and owner privileges remain
UNVERIFIED until an explicitly authorized bootstrap. Disabling Realtime service
does not establish whether its publication exists; legacy SQL tolerates that case.

## Docker inventory and network decision

Docker Linux Engine 29.8.1 confirmed via explicit local named pipe:
npipe:////./pipe/dockerDesktopLinuxEngine. Read-only metadata inspection only.

The three UTS containers remain running with the same IDs:

- frontend: 8ea15b786275, host 8080 unchanged.
- backend: 8e22097dc328, no published host ports.
- MySQL: b2b0c5e225bd, no published host ports.

Exited laravel-app and keen_visvesvaraya are preserved. The sole volume remains
uts-pl-24-54454-sv-25445_db_data. Networks remain bridge, host, none and the UTS
app-network; no Supabase project resources were found.

spe_b2b1_loopback is unused, but NOT created. Creating it now is unnecessary
while the startup binding gate remains unresolved. A dedicated bridge can specify
com.docker.network.bridge.host_binding_ipv4=127.0.0.1 without changing existing
networks. However, that supplies a DEFAULT and does not override an explicitly
wildcard-bound port requested by a CLI service or delegated sidecar. Existing
default bridge has host_binding_ipv4=0.0.0.0 and must remain untouched.

The installed help has no start --dry-run/create-only option to inspect the full
container plan without starting it. --network-id support and generic loopback
publishing code are insufficient evidence for ALL Supabase start services.
No live PortBindings exist for this unstarted target. Therefore the CLI's complete
localhost-only publishing is NOT proven, and startup remains blocked. Do not use
post-start inspection as the sole protection against initial public exposure.

Safe alternative proposal, not implemented: use a separately reviewed pinned
Compose/container-create specification derived from matching Supabase platform
images, with every published port explicitly 127.0.0.1:host:container and no host
networking. Inspect the created-but-unstarted container PortBindings before any
service is started. It must include Auth/Storage platform initialization and
correct platform roles, not a bare PostgreSQL image. This is a separate execution
plan, not a drop-in assumption that CLI migration --local will discover Compose
containers. Its migration transport and credentials need independent review.
Alternatively, a dedicated VM with no LAN-reachable inbound service and explicit
host-loopback forwarding can isolate a CLI rehearsal from the UTS Docker daemon.
Neither alternative nor any firewall change is authorized/executed here.

## Exact command plan — prepared, NOT executed

First resolve the publishing gate and obtain explicit local startup/bootstrap
approval (plus image pulls if needed). If continuing with the CLI, prove the
installed per-service publish behavior or provide independent pre-start network
containment. Otherwise use the reviewed alternative; do not run the CLI block.

In a dedicated shell with no inherited remote credentials/routing:

```powershell
$repo = 'D:\SPE UGM SC\spe-ugm-oprec-staging'
Set-Location -LiteralPath $repo
if ((git branch --show-current) -ne 'feat/oprec-backend-staging') { throw 'Wrong branch' }
$cli = Join-Path $repo 'node_modules\.bin\supabase.cmd'
$testRoot = Join-Path $repo '.next\supabase-b2b1-local'
$project = 'spe-ugm-recruitment-b2b1-local'
Get-ChildItem Env: | Where-Object {
  $_.Name -match 'SUPABASE|DATABASE|^PG|^DB_|STAGING_DB|DOCKER|CONTAINER_HOST'
} | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_.Name) }
$env:DO_NOT_TRACK = '1'
$env:SUPABASE_TELEMETRY_DISABLED = '1'
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
# Use a reviewed empty Docker config directory, never copy user registry tokens.
$env:DOCKER_CONFIG = Join-Path $repo '.next\b2b2-docker-config'
if (Test-Path -LiteralPath $env:DOCKER_CONFIG) { throw 'Review existing Docker config directory first' }
New-Item -ItemType Directory -Path $env:DOCKER_CONFIG | Out-Null
& $cli --version
Get-FileHash -Algorithm SHA256 (Join-Path $testRoot 'supabase\config.toml')
docker --host $env:DOCKER_HOST ps -a --format '{{.ID}} | {{.Names}} | {{.State}} | {{.Ports}}'
docker --host $env:DOCKER_HOST network ls --format '{{.Name}}'
```

Manually verify exact CLI version/config hash, free ports, no source SQL yet,
seed-disabled flags, no links/env files, empty reviewed Docker config, target
container/volume/network names unused, and the UTS inventory unchanged. Stop on
any mismatch. No broad cleanup or overwrite operation is part of this plan.

Only if the separate network is still absent and approved/necessary:

```powershell
if (@(docker --host $env:DOCKER_HOST network ls --format '{{.Name}}') -contains 'spe_b2b1_loopback') {
  throw 'Network already exists; inspect instead of reusing'
}
docker --host $env:DOCKER_HOST network create --driver bridge `
  --opt 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' spe_b2b1_loopback
if ($LASTEXITCODE -ne 0) { throw 'Network creation failed' }
docker --host $env:DOCKER_HOST network inspect spe_b2b1_loopback --format '{{json .Options}}'
```

BLOCKED until the loopback publishing gate is resolved and startup approved:

```powershell
& $cli start --workdir $testRoot --network-id spe_b2b1_loopback
if ($LASTEXITCODE -ne 0) { throw 'Bootstrap failed; no migrations/tests' }
```

Do not publish raw startup output/local generated keys. After approved startup,
inspect ALL target project containers (not only PostgreSQL), using the actual
CLI project label and expected names. Proposed binding check:

```powershell
$ids = @(docker --host $env:DOCKER_HOST ps -aq --filter "label=com.supabase.cli.project=$project")
if (!$ids.Count) { throw 'No expected project containers; verify actual labels, do not broaden blindly' }
foreach ($id in $ids) {
  $json = docker --host $env:DOCKER_HOST inspect --format '{{json .HostConfig.PortBindings}}' $id
  if ($LASTEXITCODE -ne 0) { throw 'Container inspection failed' }
  $bindings = $json | ConvertFrom-Json
  foreach ($entry in $bindings.PSObject.Properties) {
    foreach ($binding in $entry.Value) {
      if ($binding.HostIp -notin @('127.0.0.1','::1')) { throw 'Nonloopback or unspecified binding; migrations prohibited' }
    }
  }
  docker --host $env:DOCKER_HOST inspect --format '{{.Name}} | {{.State.Status}} | {{json .NetworkSettings.Ports}}' $id
}
```

Also require expected PostgreSQL binding 127.0.0.1:55432, API 55431, correct
network, no host networking, expected container count/health/image/labels and
no unexpected services. Compare with host listeners. Repeat UTS state checks.
An empty/null binding is not proof of the required DB/API published ports.
The project label and DB Unix socket must be verified against actual startup;
the check above intentionally stops if its assumptions are wrong.

After a separate explicit approval for the reviewed 17 migrations and SQL suite,
and verification of clean application schemas/history on this disposable target:

```powershell
$source = Join-Path $repo 'supabase\migrations'
$dest = Join-Path $testRoot 'supabase\migrations'
if (Test-Path -LiteralPath $dest) { throw 'Review existing migration directory before copying' }
New-Item -ItemType Directory -Path $dest | Out-Null
Get-ChildItem -LiteralPath $source -Filter '*.sql' -File | Sort-Object Name |
  Copy-Item -Destination $dest
# STOP: compare all 17 filenames and SHA-256 against source-migrations.manifest.json.
& $cli migration up --local --workdir $testRoot
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; no SQL tests' }
Get-Content -Raw -LiteralPath (Join-Path $repo 'supabase\tests\recruitment_design.sql') |
  docker --host $env:DOCKER_HOST exec -i --user postgres "supabase_db_$project" `
    psql -X --no-password --host=/var/run/postgresql --username=postgres `
      --dbname=postgres --set=ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw 'SQL assertions failed; inspect disposable state before retry' }
```

If startup creates an EMPTY migrations directory, inspect that it is empty and
adapt the copy step only after review; never overwrite existing SQL/history.
No --db-url, --linked, project-ref, db push/pull/reset, automatic seed, pgTAP
assumption or cleanup/removal is authorized. The suite is custom SQL with its own
BEGIN/ROLLBACK and broad-write/fixture assumptions; it must run through psql on a
fresh owner connection, never a shared or cloud database. It is not a read-only
test even though it rolls back.

## Remaining unverified operations and stopping point

Pre-start work completed: ignored target config, static validation, migration
manifest, current port/network inventory, seed disabled, enabled Auth/Storage
configuration and planned gated commands. No network was needed or created.

Unverified: actual CLI config acceptance, selected image versions/cache/pulls,
complete loopback publishing, initialized Auth/Storage schemas, platform roles,
container names/labels/socket, service health with optional services disabled,
clean database/history, migration compilation, RLS/RPC permissions and SQL suite
results. Browser failure remains separate and unchanged.

Only this report is a new tracked candidate; disposable config/cache/manifest
remain ignored. Existing source, migrations, tests, credentials and UTS resources
were preserved. No commit, push or deployment. STOP before database startup.
