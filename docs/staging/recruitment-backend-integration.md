# Recruitment applicant integration

Implemented locally; no Cloud requests, records, objects, fixtures, migrations, users or deployment were performed during integration work. Existing SQL and RLS are unchanged.

## Activation (existing staging only)

The route is pinned to https://lavxddhrrwsjcshmnwvu.supabase.co and does not import legacy Supabase environment/client helpers. Do not use production keys. Provision these six variables only in the already protected, Git-ignored `.env.staging.private/recruitment-backend.env`; the adjacent `recruitment-backend.env.example` contains names and empty values, never credentials:

- RECRUITMENT_STAGING_ENABLED=true
- RECRUITMENT_SINGLE_INSTANCE=true (explicit acknowledgement: one Node process only)
- RECRUITMENT_ORIGIN=http://127.0.0.1:3000
- RECRUITMENT_PERIOD_ID=<existing approved staging period UUID>
- RECRUITMENT_SESSION_SECRET=<independent cryptographically random secret of at least 32 characters>
- RECRUITMENT_STAGING_SECRET_KEY=<staging Dashboard secret/service-role API key>

Use masked local entry for the API key and write directly to the protected file; do not put it in commands, Git, reports, NEXT_PUBLIC variables or browser storage. Generate the independent session secret directly into protected storage, without printing it. Preserve Lenovo/SYSTEM-only inherited ACLs. The database passfile is NOT an API key and is never read by this application.

Start with `node scripts/recruitment-backend/run-staging.mjs`. This launcher refuses any legacy .env/.env.local/development environment file by existence only, filters inherited environment variables, and binds Next to 127.0.0.1:3000. It does not read production credentials. Do not run it until API credentials and an approved period are supplied. No configuration secret has been invented or provisioned by this implementation. Supabase URLs are pinned in server code; legacy JWT credentials must also carry the exact staging ref/service_role claim. Modern secret keys require owner-confirmed staging provenance; actual authorization is verified by Supabase, not by an offline key-prefix check.

The migration created no recruitment catalogue/period. Committee-approved catalogue, five document requirements and period approval/opening must be explicitly authorized before any corresponding Cloud writes. Draft/demo assignments must never be promoted automatically. An empty/unapproved/closed configuration returns an unavailable message, not a mock success.

## Flow and safety

GET /api/recruitment returns only the selected approved configuration and a signed 24-hour session, plus a host-only HttpOnly/SameSite=Strict cookie (Secure over HTTPS). POST requires exact configured origin, matching session header/cookie, valid HMAC/expiry and a bounded multipart body (22 MiB, 30-second read deadline). No applicant Auth/staff account or email recovery exists. The existing four-step UI is retained; live mode hides draft/demo selection, shows loading/errors, disables review controls while sending and clears PII/files only after a confirmed receipt.

Server validation checks every personal field, batch and both ranked options; different sub-divisions in one parent are allowed. Approved database document rules determine required/optional uploads. Required/optional/none/unconfirmed assignment handling is checked again by existing database finalization. Accepted MIME/extension/content combinations are PDF and PNG, capped at each database limit and 3 MiB. PNG chunks/checksums/dimensions and PDF header/EOF/obvious interactive content are checked. PPT/PPTX are deliberately unsupported by this PDF/image slice: if an approved choice requires them, submission cannot complete without a separately reviewed parser/scanner implementation. No schema change is needed for that extension.

The server derives opaque period/application/document UUID paths. No path, bucket, application ID or owner is accepted from the applicant. Raw document bytes, PII, passwords and session tokens are not logged. Existing private Storage policies deny direct anonymous/authenticated access. This slice does not introduce a download endpoint or public/signed URLs. File prechecks are NOT antivirus or complete PDF parsing; malware scanning and any future reviewer download/attachment handling need separate implementation/testing before broad intake.

One server-generated session key is bound to the normalized payload and document SHA-256 hashes. Existing unique(period_id,nim) prevents alternate-email duplicates for all statuses. Partial attempts freeze their payload; exact retries insert only missing children, never overwrite objects, verify previously uploaded bytes if metadata is missing, then call recruitment_finalize. Submitted retries return the same receipt; different payloads conflict, including rejected/withdrawn applications. Submission audit is emitted atomically by the existing finalization trigger. Network uncertainty never yields UI success. Expired/lost sessions and changed partial payloads require committee assistance; no insecure recovery/edit mechanism was added.

DB + Storage are not one transaction: interrupted uploads may leave private pending applications/objects. They remain invisible to ordinary applicants/reviewers and are resumable only by the same session/payload. Retention/cleanup is a separately authorized operational task, never automatic destructive rollback here. Concurrent same-session requests are rejected while in flight; database uniqueness remains the durable duplicate guard.

Per-process limits: 60 configuration requests/minute, 20 submissions/minute globally and 5/minute per signed session, bounded counter map and upload body/deadline limits. Caller-supplied IP headers are not trusted. The route stays disabled unless single-instance mode is explicitly acknowledged. Multiple workers/serverless replicas require a shared rate limiter before enablement; a generic public/serverless deployment is not approved or claimed. This combined multipart request can exceed platform-specific serverless body limits; the provided launcher targets a single local Node staging process.

## Verification

- `node --test scripts/recruitment-backend/submission.test.cjs`: offline tests, global network forbidden, synthetic data in memory only. Actual GET/POST handlers, normalization/duplicate/hash conflicts, session/origin denial, all assignment states, deadline rules, file validation, private paths, upload/metadata/finalization failures and retry behavior.
- `node scripts/recruitment-mock/check.mjs`: copies source without any environment files, blocks external fetch/TCP/TLS/DNS including workers, builds/types/lints, then runs desktop/mobile mock regression and a separately intercepted backend-mode wizard fixture. Mock HTTP is not Cloud integration evidence.
- Root standalone tsc initially lacked generated Next PageProps/LayoutProps. Isolated production build generates the real route types and performs TypeScript verification; no legacy type declarations were weakened.

Live staging end-to-end tests remain unauthorized/unrun: one explicitly approved synthetic submission and exact retry; alternate-email NIM duplicate; close-during-upload deadline; concurrent finalization; anonymous/ordinary/inactive-super-admin Storage/API denial; authorized reviewer/download and audit; file retention and scanner behavior. Never run disposable-local recruitment_design.sql against Cloud. No real applicants should be used to prove integration.

### Actual verification result (2026-11-02)

24/24 offline tests passed. Targeted lint passed with no warnings. Credential-free source assertions, isolated production build and generated-route TypeScript check passed. The broader harness lint has one pre-existing unused SPONSORS warning in the home hero. Actual Next server isolation proof passed (no backend credentials; external requests blocked). Browser checks did NOT complete: Chrome CDP Page.enable timed out on one run and its debugging endpoint was unavailable on the subsequent run. Desktop/mobile and added backend-mode HTTP-mock browser interactions remain unverified; they are not counted as passed. No repeated Cloud audits/rehearsals were run.

Changed files: app/api/recruitment/route.ts; src/modules/recruitment/server/{backend,configuration,payload,security}.ts; existing wizard, validation, types, assignment, landing and two Join page files; scripts/recruitment-backend/{submission.test.cjs,run-staging.mjs}; existing scripts/recruitment-mock/{assert-source.cjs,browser.mjs,check.mjs}; this document and recruitment-backend.env.example. No dependencies or migration SQL changed.
