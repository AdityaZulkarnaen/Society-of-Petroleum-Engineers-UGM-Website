# B2B.1 final local readiness recheck

2026-11-01, Asia/Jakarta. Branch: feat/oprec-backend-staging.
HEAD: 8ff7fcbb678672836f9a2119c5813460f6373ea3.

Decision: **NO-GO for starting Supabase now. Tooling checks PASS; target-specific
configuration and loopback binding remain unprepared/unverified.** No database
operation was performed. This supersedes the earlier tool-availability findings
in B2B1-local-preflight.md; its SQL/destructive-operation warnings still apply.

## Verified tools and committed installation

- Local Docker CLI AND Linux Engine: 29.8.1. Read-only engine queries explicitly
  targeted npipe:////./pipe/dockerDesktopLinuxEngine, bypassing user Docker config.
  Sandbox access initially failed; read-only queries succeeded with escalation.
  No container, volume, network, Docker context or engine setting was changed.
- Repository Supabase CLI: 2.122.0. Invoke with
  `& '.\node_modules\.bin\supabase.cmd'`; it is not on the global command PATH.
- Actual help confirms global --workdir and --network-id, plus
  `migration up --local`. --workdir uses the supplied directory exactly, without
  ancestor search. --db-url, --linked and --project-ref are separate supported
  options and must NOT be used for this local rehearsal.
- Commit 8ff7fcb includes package.json, pnpm-lock.yaml, pnpm-workspace.yaml and the
  earlier preflight report. No diff exists in those installation files. Manifest
  range is ^2.122.0; lockfile and installed package resolve 2.122.0. Future installs
  must honor the frozen lockfile; the caret range alone is not a strict pin.
- Initial CLI help/version attempts failed on a global telemetry-file write.
  Setting process-local DO_NOT_TRACK=1 allowed the version/help/config-only
  inspection to succeed, without changing global settings or reading credentials.
  The installed binary also recognizes SUPABASE_TELEMETRY_DISABLED. Preserve
  telemetry opt-out and avoid --debug/--create-ticket during the isolated workflow.

## Existing Docker inventory — preserved

| Container | ID | State | Published ports |
| --- | --- | --- | --- |
| uts-pl-24-54454-sv-25445-frontend-1 | 8ea15b786275 | running | 8080 on IPv4/IPv6 wildcard |
| uts-pl-24-54454-sv-25445-backend-1 | 8e22097dc328 | running | None; container-internal ports only |
| uts-pl-24-54454-sv-25445-db-1 | b2b0c5e225bd | running | None; MySQL 3306/33060 internal only |
| laravel-app | 05121808ded8 | exited | Configured host 8000 |
| keen_visvesvaraya | 955a7034f14a | exited | None |

Volume: uts-pl-24-54454-sv-25445_db_data (local driver).

Networks: bridge (c7800a2b7580), host (f98463fae3a8), none (6317f66b8c38),
uts-pl-24-54454-sv-25445_app-network (52b61af567e5).
UTS uses its app-network, subnet 172.18.0.0/16, IPv4 enabled/IPv6 disabled.
Default bridge uses 172.17.0.0/16 and host_binding_ipv4=0.0.0.0.

No Supabase containers/volumes/network or proposed project/network-name collision
was observed. This is a point-in-time inventory. Preserve ALL listed resources,
including exited containers; no compose down, stop, prune, rm or volume/network
removal is permitted as part of preparation. Do not attach Supabase to UTS network.

## Target, ports and actual CLI template

The intended .next/supabase-b2b1-local workdir does not exist. Neither does root
supabase/config.toml. Proposed project ID remains
spe-ugm-recruitment-b2b1-local and dedicated network spe_b2b1_loopback.

Local TCP listener enumeration found no listeners on 55430–55440. IPv4/IPv6 port
exclusions include 5357, 50000–50059, 50131 and 60115–60714; none overlap this
candidate range. Database 55432, API 55431 and shadow 55430 are available at
inspection time. Repeat checks immediately before startup; this is not a reservation.

To inspect the exact installed template, ran ONLY config generation:

```powershell
$env:DO_NOT_TRACK = '1'
& '.\node_modules\.bin\supabase.cmd' init --workdir '.next/b2b1-template-inspection'
```

This generated ignored local config/.gitignore files, not a database or the target
workdir. No migration was copied, no network created, no service started. The
template's project ID is b2b1-template-inspection and MUST NOT be used as the target.

Actual v2.122.0 template facts and necessary changes:

| Setting | Actual default | Intended isolated target |
| --- | --- | --- |
| project_id | Workdir name | spe-ugm-recruitment-b2b1-local |
| api.port | 54321 | 55431 |
| db.port / shadow_port | 54322 / 54320 | 55432 / 55430 |
| db.major_version | 17 | Keep 17 for the disposable rehearsal; this does not verify any cloud version |
| db.migrations | enabled; schema_paths=[] | Keep empty schema_paths; start with no project migrations, copy reviewed 17 only after bootstrap verification |
| db.seed | enabled; sql_paths=[./seed.sql] | enabled=false; sql_paths=[] before first start |
| realtime / studio | enabled | Disable |
| local_smtp | enabled, UI 54324 | Disable; correct section is local_smtp, not older inbucket |
| edge_runtime / analytics | enabled, inspector 8083 / analytics 54327 | Disable |
| db.pooler | disabled, port 54329 | Keep disabled; optionally reserve alternate port if configured |
| storage / auth | enabled | Retain for platform schema dependencies |
| storage.vector / s3_protocol | enabled | Disable unnecessary services/interfaces |
| auth signup | enabled | Disable; SQL fixtures do not need real sign-in |
| auth site_url / redirects | loopback defaults | Keep explicit loopback-only values |

The stock template contains env() hooks, including Studio AI, disabled external
providers and experimental S3 values. Remove/neutralize unused hooks in the
reviewed target config; never resolve them from user/cloud credentials. No values
were supplied or read in this inspection. The generated template is NOT an
approved ready-to-start config and no claim of start-time validation is made.
db.network_restrictions defaults to disabled/allow-all CIDRs; it is not proof of
local host-port binding. A localhost URL and local project ID are also insufficient.

## Loopback assessment and remaining startup gates

--network-id is supported, so a dedicated bridge with
com.docker.network.bridge.host_binding_ipv4=127.0.0.1 can be requested in the next
authorized preparation phase. Existing default bridge is wildcard-bound: DO NOT
change it, since it is shared Docker infrastructure. Create a separate network.

Loopback-only publishing is feasible, but NOT yet demonstrated for this target.
The installed CLI contains a generic Docker loopback publish path; that does not
prove every Supabase start service or delegated sidecar uses it. Network defaults
also cannot override an explicitly wildcard-bound port. Do not turn this static
observation into a claim that all eventual containers are localhost-only.

Before changing decision to GO:

1. Prepare and review target-only config using the actual template corrections
   above, no env/link metadata, no migrations or seed hooks at first startup.
2. Prepare the dedicated loopback-default bridge after explicit authorization;
   verify network options and protect host publishing before initial startup.
3. Establish evidence for the installed CLI's per-service publish behavior, or
   prepare a reviewed alternative with explicit 127.0.0.1 bindings. A suitable
   preexisting host firewall restriction can protect a controlled first-start
   verification, but changing firewall rules is not authorized in this report.
4. Recheck ports, unique names, exact CLI version, local Docker endpoint and absence
   of remote-routing variables. Never reuse an existing volume or target directory.
5. Obtain explicit approval for local startup/bootstrap and any image pulls. Stop
   on unexpected bindings or health errors; do not ignore health checks. Inspect
   ALL created target-container PortBindings, labels and networks, never full env.
   Preserve the UTS inventory and verify it remains running afterward.

Validated invocation forms for that future phase, NOT executed here:

```powershell
$cli = Join-Path $repo 'node_modules\.bin\supabase.cmd'
& $cli start --workdir $testRoot --network-id spe_b2b1_loopback
# Separate migration/test approval remains required after platform verification:
& $cli migration up --local --workdir $testRoot
```

The earlier report's Get-Command supabase.exe lookup should be replaced by this
repo-local .cmd path. Keep explicit local Docker selection, the isolated workdir,
telemetry opt-out and the prior no-cloud/no-reset constraints. Do not execute
these commands merely because help confirms their syntax.

## supabase/.temp and Git safety

Initial status showed only untracked supabase/.temp/. Filename-only inspection
found cli-latest, with no project-ref or pooler-url filename. Its content was not
opened. The installed CLI implementation uses cli-latest as a latest-version
notification cache; the filename alone is not evidence of a cloud project link.

Root .gitignore lacked the rule normally supplied by supabase init's generated
supabase/.gitignore (.temp/.branches entries). Added /supabase/.temp/ to root
.gitignore. Verified cli-latest and hypothetical project-ref/pooler-url paths are
ignored and git ls-files contains zero .temp entries. Ordinary git add will skip
them; forced staging can bypass ignores and must never be used for CLI metadata.

No credentials were read and no cache files deleted. Final changes in this turn:
.gitignore and this report only; both remain uncommitted. CLI installation changes
are already committed in 8ff7fcb. No auto-commit or push was requested/performed.

## Migration/test boundary

All 17 migration files remain unchanged. Recruitment schema/security and SQL-test
SHA-256 values match the earlier preflight exactly. SQL remains UNEXECUTED and
tests retain their empty-disposable-database assumptions and broad-write hazards.
Browser QA remains unverified and independent of this database startup decision.

No Supabase start/reset/status, SQL, migrations, seeds, Storage operations,
container modifications, cloud project connections, push or deployment occurred.
