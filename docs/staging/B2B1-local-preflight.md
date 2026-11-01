# B2B.1 local database test preflight

Inspection date: 2026-11-01, Asia/Jakarta. Branch `feat/oprec-backend-staging`,
HEAD `eb05f3689dae8d7fe6da1b7c630494f2b1dbe0ab`. Initial Git tree clean.
This report is the only file added. No database started, connected, reset or
modified; no SQL, migration, seed, Storage operation, push or deployment executed.

## Readiness findings

| Item | Verified local result |
| --- | --- |
| Supabase CLI | Not found on PATH, repo .bin, npm shim, Scoop app/shim or common Program Files path. No installed version could be verified. Installation elsewhere is not excluded. |
| Docker CLI | `29.8.1`, build `4a63305`. |
| Docker engine | Explicit local probes of docker_engine and dockerDesktopLinuxEngine named pipes both failed: pipe does not exist. No running Docker Desktop/backend process found. No engine version verified. |
| Docker contexts | CLI could not enumerate user context metadata: filesystem access denied. No credential/config contents read. Default-context metadata resolved to a local named pipe; explicit pipe probes also bypassed user Docker config. Remote contexts may still exist; never rely on current context. |
| Existing containers/volumes | UNKNOWN: engine unavailable, so no successful inventory. Absence of a running daemon does not prove absence of stopped containers, volumes or WSL-hosted projects. |
| psql | Not found on PATH; future tests can use psql inside the verified local DB container. |
| Local Supabase config | No supabase/config.toml, configured project ID, seed SQL or checked-in local stack configuration. |
| Cloud link metadata | No supabase/.temp/project-ref, .temp/pooler-url, .branches/_current_branch, root .supabase or .vercel path found. |
| Remote-routing environment | No matching inherited variable names for SUPABASE, DATABASE, PG*, DOCKER, CONTAINER_HOST, STAGING_DB or DB_*. Values were not printed. This does not audit persistent credentials or other shells. |
| Environment files | Root filename enumeration found only .env.example. No environment values opened. |
| Ports | CIM TCP query failed; .NET local TCP-listener enumeration succeeded with zero matches among default/candidate ports. IPv4/IPv6 exclusions were 5357, 50000–50059 and 50131, outside candidate range. Recheck before binding. |
| Frontend browser | Chrome binary 156.0.8078.74 is present. Prior CDP failure remains unresolved; no browser launched in this preflight. |

No attempt was made to start Docker Desktop or inspect private Docker credentials.
Engine readiness and complete container/volume inventory are blockers.

## Proposed disposable target — NOT created or verified running

- Workdir: `D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b1-local`.
- Unique project ID: `spe-ugm-recruitment-b2b1-local`.
- Dedicated Docker network: `spe_b2b1_loopback`.
- Expected DB container name: `supabase_db_spe-ugm-recruitment-b2b1-local`, subject
  to confirmation against the pinned CLI's actual naming and labels.
- DB: `127.0.0.1:55432`, database `postgres`; candidate API `127.0.0.1:55431`.
- Reserve shadow port 55430. Optional services must be disabled or assigned distinct
  verified-free ports (55433–55440). Disable pooler, Studio, mail UI, analytics,
  Realtime and edge runtime where the pinned template supports it; Auth and Storage
  schema initialization must still be available for the migrations/tests.

Use an independent generated config and COPIES of the reviewed migrations, never
the sibling worktree, cloud staging config, production env, or shared local stack.
Keep fixtures out of automatic seed discovery. Target paths currently do not exist.
Do not delete a pre-existing directory/network/container to make the names available.
Choose another reviewed unique target if any collision is discovered.

Loopback is not guaranteed by project ID or a localhost URL. Docker may publish
ports on all interfaces. Proposed custom bridge option
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1` must be supported by the local
Linux engine and respected by CLI publishing. Verify network option and EVERY
container PortBindings; reject 0.0.0.0/:: or nonloopback bindings. A host firewall
must prevent exposure during initial startup if publishing cannot be proven safe
beforehand. If CLI --network-id support/binding semantics cannot be verified, STOP
and prepare a reviewed explicit loopback-only alternative. Do not claim this target
is safe until those gates pass.

## Migration and test review

17 SQL files are ordered uniquely by timestamp: all 15 legacy files first, then:

| File | SHA-256 at inspection |
| --- | --- |
| 20261101000000_recruitment_schema.sql | 132063EAE3B54E196753092404EDE8BFC6D0F2538956C2C5CA631B949BCA287D |
| 20261101010000_recruitment_security.sql | F4AC72D19C1E8DE12A6C7382F57EE0B35A77F43CB2056E0B8C060C0CBE503765 |
| recruitment_design.sql test | C1E1939A0D6243588242AD124AE53E5A524E21423089376538756DA524144F67 |

Full legacy hashes were calculated locally; regenerate/compare all source and copied
files immediately before execution. No SQL syntax, RLS or permission success is
claimed. Legacy dependencies are profiles/role, is_active, standard Supabase Auth/
Storage objects and platform roles. Legacy history also creates a PUBLIC
candidate-photos bucket; recruitment security creates its separate PRIVATE bucket.
Both are database/Storage metadata writes, even in an otherwise empty rehearsal.

The test is a custom SQL script with DO assertions, not TAP output. Do not assume
`supabase test db`/pg_prove can execute it as a passing pgTAP suite. Use psql with
ON_ERROR_STOP, no startup rc file and one connection. It has its own BEGIN/ROLLBACK;
do not wrap it in a conflicting transaction mode or continue after an error.
Failure closes the connection, rolling back the outstanding transaction.

Destructive/nonempty-data hazards in the test:

- Creates three synthetic Auth/profile rows (including active/inactive super-admin
  fixtures), configuration, applications, files metadata and audit events.
- Broad UPDATE statements have no WHERE clause, including options, applications
  and preference rank updates. They can touch unrelated rows if present.
- The Storage INSERT SELECT copies ALL recruitment_documents, not just one fixture.
- Permission-negative DELETE of recruitment_audit is intentionally attempted.
  If privilege behavior is wrong it can delete rows inside the test transaction
  before the assertion fails. Rollback is not a license to use a shared database.
- Fixed UUIDs/usernames, one-visible-period and global audit-count assertions assume
  no pre-existing recruitment data. Prior fixtures/seed data can invalidate results.
- Requires owner privileges to populate Auth, SET LOCAL ROLE across API roles and
  insert synthetic Storage metadata. pg_temp helper accessibility, Auth insert
  defaults, role memberships and Storage schema/triggers are version assumptions.
- English error-substring matching and deferred-constraint behavior must be verified
  on the selected local PostgreSQL/Supabase image. Configure English diagnostics if
  needed; do not weaken assertions merely to get a green result.
- Fake Storage rows are not uploaded bytes and do not validate Storage API access.

Do not reuse any existing container or run these tests against populated data.
Do not launch the app against the rehearsal stack while testing: fixtures must
never be used for actual login, upload, email or API activity.

## Exact proposed command sequence — DO NOT EXECUTE IN B2B.1

These are conditional PowerShell commands for a later authorized phase. The CLI
is missing, so its flags and generated config syntax cannot yet be verified.
Resolve a reviewed, pinned local binary first; no implicit npx download. Starting
Docker Desktop, installing tools/pulling images, creating networks/config and
database startup/migrations/tests all remain unperformed. Separate approval must
cover those effects. No cloud credentials are needed.

After approved tool installation, verify help locally first:

```powershell
$cli = (Get-Command supabase.exe -ErrorAction Stop).Source
& $cli --version
& $cli init --help
& $cli start --help
& $cli migration up --help
```

Require the pinned version and support for `--workdir`, `start --network-id` and
`migration up --local`. If unsupported, revise the plan before proceeding.

Run subsequent commands in a dedicated process. Remove inherited routing variables
and force a local Docker endpoint; do not output credential values:

```powershell
$repo = 'D:\SPE UGM SC\spe-ugm-oprec-staging'
Set-Location -LiteralPath $repo
if ((git branch --show-current) -ne 'feat/oprec-backend-staging') { throw 'Wrong branch' }
$testRoot = Join-Path $repo '.next\supabase-b2b1-local'
if (Test-Path -LiteralPath $testRoot) { throw 'Target already exists; inspect, do not overwrite' }
Get-ChildItem Env: | Where-Object {
  $_.Name -match 'SUPABASE|DATABASE|^PG|^DB_|STAGING_DB|DOCKER|CONTAINER_HOST'
} | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_.Name) }
$env:DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
$env:DOCKER_CONFIG = Join-Path $repo '.next\b2b1-docker-config'
if (Test-Path -LiteralPath $env:DOCKER_CONFIG) { throw 'Inspect existing Docker config directory first' }
New-Item -ItemType Directory -Path $env:DOCKER_CONFIG | Out-Null
docker --host $env:DOCKER_HOST version --format '{{.Server.Version}}'
docker --host $env:DOCKER_HOST ps -a --format '{{.Names}} | {{.State}} | {{.Ports}}'
docker --host $env:DOCKER_HOST volume ls --format '{{.Name}}'
docker --host $env:DOCKER_HOST network ls --format '{{.Name}}'
```

STOP unless the engine is LOCAL/Linux, no target-name/volume collision exists,
all candidate ports are free again, and no instance will be reused. Verify approved
registry access/image cache separately; do not copy private Docker registry tokens.

```powershell
New-Item -ItemType Directory -Path $testRoot | Out-Null
& $cli init --workdir $testRoot
docker --host $env:DOCKER_HOST network create --driver bridge `
  --opt 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' spe_b2b1_loopback
```

STOP to review the generated config. Set exactly the project ID/ports above and
`[db.seed] enabled = false`, `sql_paths = []`; ensure no remote URL/env() reference,
no schema_paths import and no automatic seed hook. Use the pinned template's DB
major version, rather than inventing a version before installation. Verify the
custom network's loopback binding option. No migration files should be present
in the disposable workdir yet: CLI start may automatically apply migrations/seeds.

Only after approval for LOCAL database startup, platform bootstrap and any image
pulls, using the reviewed configuration:

```powershell
& $cli start --workdir $testRoot --network-id spe_b2b1_loopback
if ($LASTEXITCODE -ne 0) { throw 'Local startup failed; no migrations/tests' }
docker --host $env:DOCKER_HOST ps --format '{{.Names}} | {{.Ports}}'
docker --host $env:DOCKER_HOST inspect `
  --format '{{json .HostConfig.PortBindings}}' supabase_db_spe-ugm-recruitment-b2b1-local
```

Do not publish raw start/status output: it may contain LOCAL development keys.
Inspect bindings, labels, image and network for ALL target containers using narrow
format projections, never full inspect/env output. Stop if any are unexpected.
Do not run `supabase status` just to print keys. Verify bootstrap health and clean
application schemas/history in the authorized LOCAL-only execution phase before
copying reviewed files. A healthy engine alone is not database readiness.

After approval for the exact 17 local migrations and SQL fixtures:

```powershell
$migrationCopy = Join-Path $testRoot 'supabase\migrations'
New-Item -ItemType Directory -Path $migrationCopy -Force | Out-Null
Get-ChildItem -LiteralPath (Join-Path $repo 'supabase\migrations') -File -Filter '*.sql' |
  Sort-Object Name | Copy-Item -Destination $migrationCopy
# Compare count/order AND SHA-256 with source; STOP on any mismatch.
& $cli migration up --local --workdir $testRoot
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; no tests' }
Get-Content -Raw -LiteralPath (Join-Path $repo 'supabase\tests\recruitment_design.sql') |
  docker --host $env:DOCKER_HOST exec -i --user postgres `
    supabase_db_spe-ugm-recruitment-b2b1-local `
    psql -X --no-password --host=/var/run/postgresql --username=postgres `
      --dbname=postgres --set=ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw 'SQL test failed; keep redacted evidence, inspect before retry' }
```

Container name, Unix socket and owner connection must first be confirmed from the
chosen local image. No host psql, database URL, remote host or linked target is
used. This command is a DATABASE WRITE test despite ending in ROLLBACK.
No cleanup/reset/volume deletion is authorized by this plan. If anything fails,
stop and review the partial disposable state; never repair history or reset blindly.
Database network operations and migration/test commands above were NOT run.

## Browser recovery plan — no attempt performed in this preflight

1. Treat prior build/TypeScript/source-test passes as prior evidence, not a browser
   pass. Use the credential-free harness and dead proxy/DNS/network guards intact.
2. Existing unique profile and bounded HTTP readiness retries are already present;
   do not assume repeating them alone fixes Page.enable timeout.
3. Add bounded, redacted Chrome stderr/exit diagnostics and CDP socket error/close
   capture, plus explicit WebSocket-open timeout. Current stdio=ignore and swallowed
   readiness errors conceal the failing stage. Do not collect real form data.
4. Validate numeric DevTools port, HTTP status and expected page-target JSON; require
   ws localhost/127.0.0.1 origin with the SAME debugging port before connecting.
   Preserve the app-origin-only request interception before synthetic form input.
5. Run a minimal fresh-profile about:blank CDP handshake on loopback first:
   HTTP /json/version and /json/list, WebSocket open, Browser.getVersion,
   Runtime.enable and Page.enable, with timestamped failure stages. Investigate
   browser exit, endpoint readiness, Node WebSocket frame handling and host security
   software from evidence. Do not disable sandbox/security/network protection.
6. Only after that succeeds, rerun desktop/mobile synthetic flows via
   `node scripts/recruitment-mock/check.mjs`. If reusing an existing sanitized
   build for diagnostics, match source hashes and repeat actual server isolation
   proof first. Rebuild for changed application source. Do not start the normal app
   with backend credentials or connect the browser suite to the DB rehearsal.
7. Confirm duplicate rejection, same-parent acceptance, assignment clearing, four
   assignment states, draft separation, no submission/API requests, zero overflow
   and cleanup of only the spawned server/browser. Browser remains UNVERIFIED.

## Stop decision

NOT READY for database execution: CLI missing, Docker engine unavailable, old
container/volume inventory unknown, config/binding not yet prepared or verified,
and SQL is untested. The proposed target is a candidate, not an existing approved
connection. Obtain further approval only for a concrete scoped next phase; this
preflight does not authorize installs, startup, migrations, tests or destruction.
