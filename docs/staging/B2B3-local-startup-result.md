# B2B.3 local startup and isolation result

2026-11-01, Asia/Jakarta. Branch feat/oprec-backend-staging, HEAD
127017bad659a7958d23bce47f037022cc656236.

**NO-GO for B2B.4 migration testing. Startup failed during image download/extraction,
before any disposable Supabase container or database was created.**

## Preconditions verified

- Installed Supabase CLI 2.122.0, local Linux Docker Engine 29.8.1.
- Workdir D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b1-local.
- Project ID spe-ugm-recruitment-b2b1-local.
- Config SHA-256 unchanged:
  6d22cbf5320893b5917b548be787f72e274ded2e6bac354586e6e97f11886b57.
- Database port 55432, API 55431, reserved shadow port 55430. No listener in
  55430–55440 immediately before startup or in the final check.
- Automatic seeds disabled, sql_paths empty; schema_paths empty. ZERO SQL files
  anywhere in the disposable supabase directory, before and after the attempt.
- Auth/Storage enabled in config, optional services disabled.
- No .env file copied; no project-ref, pooler-url or linked-project.json metadata
  found. No cloud URL/credentials supplied; routing variables cleared in the child
  process and local Docker named pipe explicitly selected.
- All existing Docker containers, volumes and networks inventoried first; no
  Supabase resources or dedicated-network-name collision existed.

## Network created and verified

Name: spe_b2b1_loopback.

ID: fc3eea4d7c2411c3974e95575351622a3d965aa6a1328155c0fc9dbb143818c3.

Driver: bridge. IPv4 subnet 172.19.0.0/16, gateway 172.19.0.1. IPv6 disabled.

Verified options:

```text
com.docker.network.bridge.host_binding_ipv4=127.0.0.1
com.docker.network.enable_ipv4=true
com.docker.network.enable_ipv6=false
```

Network was created only after checking its name was unused. Existing default and
UTS networks were not modified. Final connected-container count: ZERO. The new
network remains in place; no network/volume/container removal was attempted.

## Exact startup attempt and failure

The repository-installed native CLI executable from
node_modules/.pnpm/@supabase+cli-windows-x64@2.122.0/node_modules/@supabase/cli-windows-x64/bin/supabase.exe
was launched with these arguments:

```text
start --workdir "D:\SPE UGM SC\spe-ugm-oprec-staging\.next\supabase-b2b1-local" --network-id spe_b2b1_loopback
```

The launcher used an empty disposable Docker config directory, explicit
npipe:////./pipe/dockerDesktopLinuxEngine, telemetry opt-out and a hidden process
window. No ignore-health-check option was used. Stdout/stderr were redirected to
ignored private local logs, never streamed into the report/chat. A monitoring
loop checked all newly observed project containers for unsafe bindings/networks
and was prepared to stop only new project containers if needed.

Images began downloading. During download/extraction Docker reported:

```text
commit failed: input/output error
write /var/lib/desktop-containerd/daemon/io.containerd.metadata.v1.bolt/meta.db: read-only file system
```

Affected pull attempts included postgres:17.11.0.006 and storage-api:v1.84.19.
The CLI retried registry pulls internally, then exited. No manual startup retry
was attempted after the failure was identified. Some downloaded image layers may
remain in the authorized local Docker cache.

The monitoring command returned exit status 1. Its Windows Process.ExitCode capture
was null, so the exact native CLI numeric exit code is UNKNOWN; this is not a
successful exit. Ignored startup-result.json contains that null value and zero
observed containers. Its unsafeBinding=false means no unsafe binding was OBSERVED,
not proof of isolation. The error evidence and final resource inventory establish
that this attempt did not reach database/service startup.

Root cause is not established beyond Docker storage I/O/read-only errors. Disk
capacity, host filesystem health and Docker virtual-disk state were not diagnosed.
Do not label this merely a network or image-authentication error, and do not assume
that pruning images or restarting Docker is an authorized repair.

## Actual bindings and service readiness

| Disposable service | Container / published binding | Health / readiness |
| --- | --- | --- |
| PostgreSQL | Not created; no 55432 listener | Not initialized or verified |
| API gateway / REST | Not created; no 55431 listener | Not available |
| Auth | Not created; no published binding | Platform schema/service readiness unverified |
| Storage | Not created; no published binding | Platform schema/service readiness unverified |

There are zero disposable containers to inspect, and no completed per-container
PortBindings or network attachments to report. The loopback-default network option
is verified; actual Supabase localhost isolation is NOT proven. No unsafe
disposable binding was detected and no project-only stop was necessary. The CLI
process had already exited when failure was reviewed.

## Unrelated resources preserved

Final read-only Docker inventory matched the baseline:

| Resource | Final state |
| --- | --- |
| UTS frontend 8ea15b786275 | running; existing 8080 IPv4/IPv6 wildcard publishing unchanged |
| UTS backend 8e22097dc328 | running; internal ports only |
| UTS MySQL b2b0c5e225bd | running; internal 3306/33060 only |
| laravel-app 05121808ded8 | exited, unchanged |
| keen_visvesvaraya 955a7034f14a | exited, unchanged |
| uts-pl-24-54454-sv-25445_db_data | still the sole volume |

No existing container was stopped/restarted/reconfigured. No Docker restart,
WSL shutdown, prune, reset, network modification or volume removal was performed.
The unrelated frontend's existing wildcard binding is outside the disposable
project and was deliberately left untouched.

## Application migration boundary and next gate

No repository migration was copied into the disposable project or executed.
No recruitment fixture/test, SQL command, super-admin seed, Storage operation,
db push/pull/reset or supabase link was run. The allowed platform bootstrap did
not reach a database container. No production/cloud staging project was contacted.

Before another startup attempt, Docker storage must be diagnosed and restored to
a healthy writable state through a separately authorized host-maintenance plan
that accounts for the running UTS stack. Do not restart Docker or remove resources
implicitly as part of this task. The dedicated network now exists: a future
preflight must inspect its exact ID/options and zero/known attachments rather
than blindly creating or deleting it. If state differs, stop for review.

After recovery, repeat the local-only preflight and approved startup, inspect
actual bindings of ALL target containers, network membership and service health,
confirm Auth/Storage bootstrap and no cloud links. Only then consider a separate
explicit approval for the 17 local application migrations and SQL assertions.
B2B.4 remains blocked.

## Artifacts and changes

New report: docs/staging/B2B3-local-startup-result.md.
Existing untracked B2B2 report preserved. Implementation, migrations, tests and
environment files were not modified. Ignored target-only artifacts include the
monitoring script, empty Docker config directory, baseline IDs, private startup
logs and sanitized result JSON under .next/supabase-b2b1-local.

No keys/passwords/raw sensitive payloads appear in this report. No commit, push
or deployment. Work stopped before application migrations.
