# B2B.3B controlled image acquisition

2026-11-01, Asia/Jakarta. Branch feat/oprec-backend-staging.
Project spe-ugm-recruitment-b2b3-local.

**PASS: all four approved fixed-version images acquired and verified. GO for a
separately authorized container-creation-only phase. No container was created
or started, and database/platform initialization was not performed.**

This resolves only the image-cache blocker in B2B3-compose-preparation.md; it
does not authorize startup, SQL, migrations, seeds or database tests.

## Preflight

- Reviewed the preparation report and manifest; reran validate_bundle.py.
- Exact manifest SHA-256 unchanged:
  ea59adb299744bda9890b9e117dbd010a56250bf7923664f93d1e17034bb5c7a.
- Approved image list matched all four services and the pinned official reference.
- Static publication remained exactly 127.0.0.1:55432/tcp to db:5432; no gateway,
  other published services, privileged mode, host networking or external networks.
- Docker Engine 29.9.2/Linux responsive; already-running Docker WSL data filesystem
  verified rw before pulling. No WSL startup/restart or remount command used.
- C: initial free space 19.19 GiB. UTS frontend/backend/MySQL running; retained CLI
  PostgreSQL container exited. Captured baseline container IDs/state/StartedAt/
  requested port bindings, network IDs/names, volumes and existing image IDs.

## Exact acquisition results

Only these four docker pull targets were invoked, sequentially. Every pull exited
successfully. No latest tag, Compose create/up, build or container command was used
to acquire images. Anonymous public-registry access used an empty disposable
Docker config directory, explicit local engine endpoint and OS environment
allowlist; no registry/production/cloud project credentials were supplied.

| Approved image | Result | Exact locally reported image ID |
| --- | --- | --- |
| supabase/postgres:17.6.1.136 | PASS | sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00 |
| supabase/gotrue:v2.197.0 | PASS | sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b |
| postgrest/postgrest:v14.18 | PASS | sha256:c7cd7e265a85b05248abf53f4473fcec7e327c282d0bd0cf60f1551996d09fcf |
| supabase/storage-api:v1.81.0 | PASS | sha256:98ffec5d0678803783c30e404c27f4ec65e97efbe014088f2a86b4b8b54b9f54 |

Recorded repository digests respectively:

```text
supabase/postgres@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00
supabase/gotrue@sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b
postgrest/postgrest@sha256:c7cd7e265a85b05248abf53f4473fcec7e327c282d0bd0cf60f1551996d09fcf
supabase/storage-api@sha256:98ffec5d0678803783c30e404c27f4ec65e97efbe014088f2a86b4b8b54b9f54
```

Auth content also retains its existing public.ecr.aws repository digest alias.
All pre-existing image IDs remained present. No image/tag deletion, prune,
retagging command or resource cleanup was performed. The reviewed manifest's
fixed-version references were not rewritten during acquisition.

## Capacity and storage monitoring

Pull monitoring sampled C: free capacity, scanned private pull logs for I/O,
read-only, out-of-space and layer extraction/commit failures, and periodically
rechecked the Docker data mount. A conservative 5 GiB stop reserve was used.
No fatal marker or reserve breach occurred. No image pull failed or was aborted.

- Start: 19.19 GiB free.
- Minimum during acquisition monitor: 16.63 GiB.
- Independent post-acquisition check: **16.26 GiB free**; this later reading is
  lower than the pull-loop sample and is the capacity used for the readiness call.
- Post-acquisition Engine responds; data filesystem remains rw.

Docker usage summary after pulling: 15 images / 8.203 GB; 6 containers, 3 running;
2 local volumes / 266.5 MB; unchanged build-cache inventory at 146 entries /
2.182 GB. These categories are Docker accounting, not a measurement of additional
Windows VHD growth. No cleanup is authorized or recommended implicitly here.

## Resource preservation and manifest revalidation

Before/after container metadata, networks and volume-name inventories compared
identically. Existing image IDs are a subset of the final image inventory.

UTS containers remain running with unchanged StartedAt values:

| Service | ID prefix | StartedAt UTC |
| --- | --- | --- |
| frontend | 8ea15b786275 | 2026-11-01T08:58:33.786030107Z |
| backend | 8e22097dc328 | 2026-11-01T08:58:35.800367434Z |
| MySQL | b2b0c5e225bd | 2026-11-01T08:58:33.79543001Z |

Stopped CLI PostgreSQL 4886fea0e28b remains exited, with its prior StartedAt.
Both existing volumes and all networks remain unchanged. No containers exist
with Compose project label spe-ugm-recruitment-b2b3-local.

Reran validate_bundle.py after acquisition: PASS. Exactly four services, correct
project and version references, one explicit loopback publication, private network,
no application SQL/test/seed mounts and no unexpected runtime settings. Expanded
Compose environment remained in memory only; generated secret values were not
printed or included in this report.

## Next gate: creation only

The environment is ready for the next separately approved phase to run the exact
prepared Compose create command with --pull never, --no-build and --no-recreate,
then review_container_bindings.py created. Recheck free ports/storage, image
IDs/digests, no target-name/resource collision and the reviewed manifest hash
immediately beforehand. If existing unexpected project resources appear, stop
instead of reusing or deleting them.

Require four created-but-unstarted containers, requested HostIp exactly 127.0.0.1
for PostgreSQL 55432, no other published ports and correct project-scoped network/
volumes. Actual effective bindings, platform bootstrap and service health remain
UNVERIFIED until a distinct authorized startup phase. Prior wildcard publishing
evidence is not superseded by successful pulls or static configuration.

No database initialization, SQL, migrations, seeds, recruitment fixtures/tests,
Storage operations, cloud Supabase project connection, Docker restart, global
configuration change, UTS modification, push or deployment occurred.

## Evidence and files

Ignored evidence:
.next/supabase-b2b3-compose/image-acquisition-lrjijrs5 and
.next/supabase-b2b3-compose/image-acquisition.sanitized.json.
Includes exact IDs/digests, sanitized result, resource snapshots and private pull
logs. The ignored acquisition helper is acquire_images.py. Only this report is
added as a tracked candidate; earlier untracked reports are preserved. Application
implementation, SQL, tests, package/lock files and reviewed Compose manifest are
unchanged. No commit was created.
