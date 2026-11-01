# B2B.3 non-database network publishing probe

2026-11-01, Asia/Jakarta. **NO-GO for implicit-HostIp publishing on the dedicated
network in this Docker Desktop/Engine installation.** Actual unsafe bindings were
captured while the test container was running, before stopping/removing it.

## Exact test

- Docker Engine 29.9.2, explicit local Linux-engine named pipe.
- Container: spe-loopback-probe-b2b3-20261101.
- ID: 3878d616ed90e17357170982cf1827eac6cc612179841ea03387f7c314fc2ce2.
- Cached image: uts-pl-24-54454-sv-25445-frontend:latest (73.9 MB), pinned by ID
  sha256:a94d1aac1280df824744414a20b33280140d158eb6cd10bace6a4e1fd61aa76b.
- Image declares no volumes. No image download: docker create used --pull=never.
- Test host port: 55441, container port: 8080/tcp; free and unique at preflight.
- Network: spe_b2b1_loopback, unchanged ID
  fc3eea4d7c2411c3974e95575351622a3d965aa6a1328155c0fc9dbb143818c3.
- Verified network option host_binding_ipv4=127.0.0.1, IPv6 disabled; no initial
  container attachments or test-container name collision.

The existing image's application entrypoint was bypassed. A new container-only
shell wrote a minimal nginx configuration in /tmp that returned constant text
spe-loopback-probe on port 8080. No product files were served, no host/container
volumes mounted, no database process or application backend started.

Relevant creation arguments:

```text
docker create --pull=never --name spe-loopback-probe-b2b3-20261101
  --network spe_b2b1_loopback --publish 55441:8080
  --label spe.task=B2B3-network-probe --entrypoint /bin/sh
  sha256:a94d1aac1280df824744414a20b33280140d158eb6cd10bace6a4e1fd61aa76b
  -c <constant nginx probe setup>
```

No HostIp was supplied, mirroring the relevant implicit publishing behavior.
Only the newly returned container ID was started, then stopped and removed.

## Requested and effective evidence

Before start, state=created:

```json
{
  "HostConfig.PortBindings": {
    "8080/tcp": [{"HostIp": "", "HostPort": "55441"}]
  },
  "NetworkSettings.Ports": {}
}
```

While RUNNING on spe_b2b1_loopback, captured before any stop:

```json
{
  "HostConfig.PortBindings": {
    "8080/tcp": [{"HostIp": "", "HostPort": "55441"}]
  },
  "NetworkSettings.Ports": {
    "8080/tcp": [
      {"HostIp": "0.0.0.0", "HostPort": "55441"},
      {"HostIp": "::", "HostPort": "55441"}
    ]
  }
}
```

Both NetworkMode and actual network attachment referenced only the dedicated
network. Nevertheless the effective mappings were wildcard IPv4 AND IPv6. The
network option did not achieve the required effective publishing behavior in
this test. No claim is made about the underlying Docker Desktop implementation
cause or about whether another installation behaves the same way.

The test immediately stopped on the unsafe effective mapping. Loopback HTTP and
nonloopback-address TCP reachability checks were intentionally NOT performed:
the unsafe-binding stop rule took precedence. Therefore no assertion of LAN
reachability or firewall behavior is made, and localhost-only reachability was
not verified. Binding evidence alone fails the stated acceptance criterion.

After stop, effective mappings became empty. This confirms why examining a stopped
container cannot reconstruct its prior effective addresses. The test container
was then removed, and port 55441 had no remaining local listener.

## Preserved resources and cleanup

- Three UTS containers remained running with identical IDs and StartedAt times.
- Stopped Supabase PostgreSQL container 4886fea0e28b remained exited, with unchanged
  StartedAt. It was NOT started or removed.
- Existing UTS and Supabase volumes were retained; no volume created by this test.
- Existing images were retained; no pull/prune/image removal.
- Network options remained unchanged and final dedicated attachments were zero.
- Exited laravel-app and keen_visvesvaraya were not touched.
- No Supabase CLI startup, SQL, migration, seed, cloud access, push or deployment.

## Safety-guard interpretation and next gate

The previous guard should be improved, but not relaxed to accept wildcard runtime
bindings:

1. Empty REQUESTED HostIp is neutral: Docker may resolve defaults. Do not label
   it inherently safe or unsafe.
2. Empty NetworkSettings.Ports before start or after stop is not isolation proof.
   Distinguish unresolved/pending state from a running published endpoint.
3. Persist sanitized container state, requested/effective mappings and network
   metadata BEFORE aborting, as this test did.
4. Accept only resolved effective 127.0.0.1 bindings for this requirement. Reject
   0.0.0.0, :: and other nonloopback addresses immediately; bounded unresolved
   state should stop as inconclusive, not be silently accepted.

This test confirms that rejecting a RUNNING wildcard mapping is necessary here.
It does not retroactively identify the exact unrecorded mapping from the earlier
Supabase retry. No production/source guard was modified during this task.

Before another Supabase startup, prepare a separately approved explicit-binding
strategy. A future cached-image probe using explicit 127.0.0.1:55441:8080 could
test that alternative, but was NOT run in this task. Supabase must likewise have
an independently reviewed mechanism that requests explicit loopback bindings;
do not assume the present network option alone will enforce them. No further
startup is authorized by this report.

Ignored sanitized evidence:
.next/supabase-b2b1-local/evidence/network-probe-ctgnl30m, including before-start,
running binding samples, after-stop and cleanup result JSON. The ignored test
script is .next/supabase-b2b1-local/network-probe.py. Only this report is added as
a tracked candidate; earlier work is preserved and no commit was created.
