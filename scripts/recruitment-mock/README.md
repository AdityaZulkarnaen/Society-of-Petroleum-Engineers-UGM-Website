# Recruitment Phase A checks

Run from the checkout with Node 24 and installed dependencies:

```text
node scripts/recruitment-mock/check.mjs
```

Use `--source-only` for the guarded validator/state-gate checks without a build
or browser run. It still creates a credential-free copy and proves the guard.

The harness never launches Next.js from the original project directory. It:

1. Copies explicitly selected source files into a fresh, ignored
   `.next/recruitment-mock-*` directory on the same drive as the dependencies.
   It excludes every `.env` file, Git metadata, scripts/seeds, and old builds.
2. Starts Node children with an allowlisted environment, no backend credentials,
   telemetry disabled, and `block-network.cjs` preloaded. External TCP, TLS,
   HTTP(S), fetch, DNS, and UDP are denied; loopback and local IPC remain available.
3. Proves the guard blocks external transports and is inherited by a worker.
   Failure stops the harness before application build/runtime checks.
4. Uses the already-cached Sora and Plus Jakarta Sans font files through the
   installed Next.js offline-font test hook. Missing fonts stop the run; there
   is no download fallback. Only font assets/CSS are read from the old build.
5. Checks validator boundaries and open/closed/pending UI gates, builds with
   webpack, checks TypeScript, and lints changed frontend files.
6. Starts the sanitized build on loopback. A probe route added **only in the
   isolated copy** verifies the actual server has no backend credentials and
   rejects an external request. No probe or API route is added to application source.
7. Launches a fresh headless Chrome profile with a dead external proxy and DNS
   deny rules. CDP interception permits only the local test origin. HTTP and
   HTTPS block probes must pass before the synthetic form flow starts.
8. Tests required fields, keyboard navigation, file errors/removal, back-state
   preservation, review, memory-only success, reset/reload, storage, mobile
   overflow, and zero submission/API/external requests. It saves synthetic-data
   screenshots and results under the printed `qa-artifacts` directory.

The browser runner uses Node's built-in WebSocket/CDP client and an already
installed Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`
on Windows, `/usr/bin/chromium` on Linux). It never installs tooling or downloads
a browser. The harness stops its server/browser when checks end.

This is an application-level QA isolation harness, not an OS firewall or a
general sandbox for untrusted/native executables. Its evidence covers the
checked Node/browser network paths. Never substitute this for staging isolation
when backend work begins. Do not run the normal root `dev`/`build` commands for
mock QA while production credentials remain in `.env.local`.

No Supabase queries, auth actions, seeds, migrations, uploads, commits, pushes,
or deployments are part of this workflow. All test identities/files are synthetic.
