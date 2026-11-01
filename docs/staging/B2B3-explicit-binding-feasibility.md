# B2B.3 explicit loopback binding feasibility

2026-11-01, Asia/Jakarta. Analysis only: no container creation/start/restart,
SQL, migrations, seed, Storage operation, cloud database connection, Docker global
configuration change, push or deployment. Existing Docker resources preserved.

## Recommendation and decision

**Recommend a separate pinned official Supabase Compose deployment, adapted into
one reviewed local file with explicit HostIp=127.0.0.1 on EVERY published port.**
Create its containers WITHOUT starting them, inspect all requested bindings and
resources, then permit startup only after those checks pass. Do not reuse the
stopped CLI PostgreSQL container or its partially initialized volume.

GO to a separately authorized implementation/preparation phase for that manifest
and validation tooling. **NO-GO for startup now:** the reviewed Compose bundle,
local-only secret material, pinned bootstrap files and runtime binding verification
do not yet exist. Commands below are proposed, not executed, and intentionally
depend on those future artifacts. The CLI's implicit publish path remains NO-GO.

Docker documents explicit IP addresses in published ports, including loopback.
Our previous probe establishes that a network default alone is ineffective in
this installation; explicit binding still needs a controlled runtime probe here.
[Docker port publishing](https://docs.docker.com/engine/network/port-publishing/).

## Installed evidence

- Supabase CLI 2.122.0: ordinary start help has exclude/ignore-health-check and
  global workdir/network-id options, but NO host-IP/publish-address option.
  Generated config controls service ports/URLs, not a supported per-service Docker
  HostIp. No verified ordinary CLI option can force 127.0.0.1 for all services.
- Installed binary string inspection found no --host-ip/--bind/bind_address switch;
  that is supporting evidence, not a complete proof about undocumented internals.
- Docker Engine 29.9.2; network spe_b2b1_loopback still has the loopback default.
  Prior running probe captured requested HostIp empty, effective 0.0.0.0 AND ::.
  Stopped PostgreSQL still has only the requested empty HostIp; it was not started.
- Docker Desktop Compose executable is installed at
  C:\Users\Lenovo\AppData\Local\Programs\DockerDesktop\resources\cli-plugins\docker-compose.exe,
  version v5.6.1. Its create help supports --no-build, --no-recreate and --pull never;
  start supports --wait and --wait-timeout. Using an empty Docker config hid plugin
  discovery from docker compose; the installed executable works directly. No
  global plugin/config change is necessary.

### Experimental CLI path, separately evaluated

The installed CLI also contains experimental supabase stack commands. Help is
enabled by a process-local SUPABASE_EXPERIMENTAL_STACK=1; only HELP was executed.
It identifies itself as unstable and outside the CLI compatibility promise.
Docker runtime/eager activation/named stacks are supported. The installed binary
contains an explicit `--publish 127.0.0.1::<container-port>` Docker path and local
host bindings. This is materially different from ordinary start, but we have not
proven every experimental service/gateway uses that path or supports our complete
configuration. It is a candidate for future investigation, not a certified fix.

Official documentation confirms different identities/data, configuration limits,
and command routing for experimental stacks. Switching that flag must not silently
resume or reinterpret the existing disposable project. Lazy services would also
make a partial port inventory inadequate; eager activation is needed for a full
audit. Given those extra unknowns, prefer an inspectable Compose specification.
[Supabase experimental local projects](https://supabase.com/docs/guides/local-development/running-multiple-local-projects).

## Options comparison

| Option | Security boundary | Effort | All 17 migrations and test fidelity |
| --- | --- | --- | --- |
| Ordinary CLI + network default | Failed wildcard-publish probe here | Low, but no verified HostIp control | Platform-compatible if it could start safely; currently blocked |
| Experimental CLI Docker stack | Explicit loopback path exists in installed code; whole runtime unverified | Medium; unstable API/config/runtime differences | Potentially high, but requires separate proof and compatibility review |
| Pinned Supabase Compose, explicit bindings | Per-container requested bindings inspectable BEFORE start; runtime checked after | Medium/high initial setup | High when authentic Auth/Storage bootstrap and privileges are retained; recommended |
| Standalone PostgreSQL / Supabase Postgres image | Easy explicit loopback or no published ports at all; docker exec for tests | Low for SQL engine, substantial for real platform bootstrap | Bare engine is insufficient; full coverage only after authentic platform dependencies are established |
| Personal-organization cloud staging | Managed platform; no local publishing issue | Lower local infrastructure effort, separate cloud permissions/data risk | Good platform fidelity, but owner/SET ROLE/Storage fixture assumptions must be checked; not authorized now |

Docker's project-scoped practical control is the container's explicit port binding,
expressible in a separate Compose project. There is no verified Docker Desktop
per-project policy that retroactively forces this CLI's arbitrary publish requests.
Daemon/global default changes and host firewall changes would extend beyond the
project and potentially affect UTS; do not use them for this plan.

### Why not a bare PostgreSQL shortcut?

The migrations require auth.users, auth.uid(), anon/authenticated/service_role,
Storage buckets/objects, UUID generation, owner privileges and policy/function
grants. Tests insert Auth rows, change API roles and insert synthetic Storage
metadata. A stock PostgreSQL image does not supply these Supabase objects.
The cached Supabase PostgreSQL image is
sha256:c141fd17ac6a76c4323e90b3aee8ff1a23d2e89e547c2b963cfadc309c079cc2,
with docker-entrypoint.sh and postgres -D /etc/postgresql. Those metadata facts
do NOT establish that auth.users/storage.objects are initialized on a fresh volume.

Do not invent stub auth/storage tables or superuser-equivalent grants to make SQL
tests pass: that would change the behavior being tested. A no-published-port DB
container can be useful for preliminary syntax testing, but full RLS/Storage
coverage still needs the version-matched platform initialization and service
migrations. Auth/Storage API tests additionally need their actual services.

Supabase's supported self-hosting bundle includes service dependencies and database
initialization scripts. Preserve/review those rather than rebuilding them from
memory; pin the source commit and image digests before implementation.
[Supabase Docker self-hosting](https://supabase.com/docs/guides/self-hosting/docker),
[official configuration/bootstrap reference](https://github.com/supabase/supabase/blob/master/docker/CONFIG.md).

### When cloud staging becomes preferable

If maintaining a reviewed Compose bundle is disproportionate, the personal-org
staging project is a reasonable NEXT authorized target for platform testing. It
would be operationally simpler, but no connection or schema/credential parity is
assumed. It remains wholly separate from the live organization's production.
Use synthetic data only and verify a clean/disposable target first. The current
rollback-only test suite contains broad writes, fixed fixtures, role switching
and direct Storage metadata inserts; do not run it against an existing cloud
dataset or assume managed postgres has the required privileges. A fresh local
Compose rehearsal remains preferable before an eventual hosted migration.

## Proposed implementation prerequisites

1. First verify explicit 127.0.0.1 publishing with a cached harmless container,
   including effective IPv4/IPv6 mappings, loopback HTTP and host nonloopback
   address rejection. This is a NEW test requiring authorization, not performed.
2. Pin an official Supabase Docker source COMMIT and all image digests, selecting
   compatible PostgreSQL 17/Auth/Storage bootstrap. Keep authentic roles/grants.
   Source download and any missing-image pulls need scoped authorization.
3. Prepare .next/supabase-explicit-compose/compose.local.yaml as ONE final manifest,
   with matching vendor bootstrap files and private local-secrets.env. No artifact
   at those paths has been created by this analysis. Generate fresh local-only
   credentials; never copy any production/staging values or emit expanded config.
4. Use new Compose project spe-oprec-explicit-local, new project-scoped volumes/
   network and no explicit globally shared container names or external volumes.
   Keep every existing CLI/UTS resource unchanged. Relative mounts must stay inside
   the new workspace and target-only bootstrap assets, with no Docker socket mount.
5. Retain required db/Auth/REST/Storage/gateway dependencies. Disable optional
   services only after checking the pinned bundle's dependency graph. No app
   migrations, seeds, bucket/files imports or demo users in bootstrap paths.
6. Default to NO host publishing for DB/services not needed from the host. If host
   SQL is desired, explicitly publish DB 127.0.0.1:55432:5432; publish only gateway
   127.0.0.1:55431:8000. Auth/REST/Storage stay internal. Do not publish TLS, Studio,
   mail, analytics or pooler ports unless separately needed and explicitly loopback.
7. Do not rely on an additive Compose override: merged ports may retain an original
   wildcard mapping. Audit the fully resolved standalone manifest, EVERY port,
   network_mode, mounts, resource names and secrets handling before creation.

Example binding portions, not a complete runnable manifest:

```yaml
services:
  db:
    ports:
      - target: 5432
        published: "55432"
        host_ip: "127.0.0.1"
        protocol: tcp
  kong:
    ports:
      - target: 8000
        published: "55431"
        host_ip: "127.0.0.1"
        protocol: tcp
```

Omit db.ports entirely if SQL uses only docker exec. Explicit addresses control
host publishing; this does not isolate against a trusted Docker administrator
or other processes on the same host.

## Exact proposed commands and safety gates — NOT EXECUTED

These require the future reviewed manifest/secrets/bootstrap bundle above. They
are not commands to run on the existing CLI project. No startup-ready bundle is
claimed by this feasibility analysis.

```powershell
$repo = 'D:\SPE UGM SC\spe-ugm-oprec-staging'
$root = Join-Path $repo '.next\supabase-explicit-compose'
$docker = 'C:\Users\Lenovo\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe'
$compose = 'C:\Users\Lenovo\AppData\Local\Programs\DockerDesktop\resources\cli-plugins\docker-compose.exe'
$project = 'spe-oprec-explicit-local'
# Use a dedicated process; strip inherited routing/Compose overrides.
Get-ChildItem Env: | Where-Object {
  $_.Name -match 'SUPABASE|DATABASE|^PG|^DB_|STAGING_DB|DOCKER|CONTAINER_HOST|^COMPOSE_'
} | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_.Name) }
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
$env:DOCKER_CONFIG = Join-Path $root 'docker-config'
# Prerequisite: reviewed empty docker-config directory, not user registry config.
$argsLocal = @('--project-name',$project,'--project-directory',$root,
  '--env-file',(Join-Path $root 'local-secrets.env'),
  '--file',(Join-Path $root 'compose.local.yaml'))
& $compose @argsLocal config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Compose validation failed' }
# Capture expanded config in memory only; it contains private local values.
$resolved = (& $compose @argsLocal config --format json) | ConvertFrom-Json
foreach ($service in $resolved.services.PSObject.Properties) {
  if ($service.Value.network_mode -eq 'host') { throw 'Host networking forbidden' }
  foreach ($port in $service.Value.ports) {
    if ($port.host_ip -ne '127.0.0.1') { throw 'Missing/nonloopback host IP' }
    if ([int]$port.published -notin @(55431,55432)) { throw 'Unreviewed published port' }
  }
}
# STOP for remaining dependency/mount/name/digest/seed audit and fresh ports/storage checks.
& $compose @argsLocal create --no-build --pull never --no-recreate
if ($LASTEXITCODE -ne 0) { throw 'Create failed; no start' }
$ids = @(& $compose @argsLocal ps -a -q)
if (!$ids.Count) { throw 'No target containers' }
foreach ($id in $ids) {
  $bindings = (& $docker inspect --format '{{json .HostConfig.PortBindings}}' $id) | ConvertFrom-Json
  foreach ($entry in $bindings.PSObject.Properties) {
    foreach ($binding in $entry.Value) {
      if ($binding.HostIp -ne '127.0.0.1') { throw 'Unsafe requested binding; DO NOT START' }
    }
  }
}
# STOP: require all containers created-but-unstarted, correct project labels,
# expected port count, unique volumes/network, no image pulls/builds or UTS changes.
# Only AFTER explicit startup/platform-bootstrap authorization:
& $compose @argsLocal start --wait --wait-timeout 180
if ($LASTEXITCODE -ne 0) { throw 'Health/startup failed; no application migrations' }
foreach ($id in $ids) {
  $ports = (& $docker inspect --format '{{json .NetworkSettings.Ports}}' $id) | ConvertFrom-Json
  foreach ($entry in $ports.PSObject.Properties) {
    foreach ($binding in $entry.Value) {
      if ($binding.HostIp -ne '127.0.0.1') { throw 'Unsafe effective binding; stop ONLY this new project' }
    }
  }
}
```

Check command exit codes for every inspect/config query in the eventual scripted
implementation; do not treat an empty failed query as an empty safe port map.
Persist sanitized pre/post-start bindings, verify expected DB/API bindings actually
exist (or DB deliberately unexposed), health and Auth/Storage bootstrap, then test
loopback and local nonloopback reachability. Monitor C: capacity and storage errors.
Approved unsafe-start containment must stop only containers with the new verified
Compose project label/recorded IDs, never UTS or the retained stopped CLI DB.

Compose create is documented to create service containers; its --pull never and
--no-build settings avoid implicit image fetch/build. Required images must already
be present or separately authorized for download.
[Docker Compose create reference](https://docs.docker.com/reference/cli/docker/compose/create/).

No application migration/test command is part of startup approval. For a Compose
target, use an explicit, verified container-local psql pathway later; ordinary
supabase migration up --local is NOT assumed to discover Compose services. An
audited ordered migration runner/history strategy and the existing custom SQL
assertion runner must be prepared under separate authorization.

## Final boundary

Current task executed only help, metadata/source-string inspection and official
documentation research. No project database or secret was accessed. Only this
analysis report is added as a tracked candidate. No Compose manifest, runtime
setting, test container or platform was created/changed by this analysis.
