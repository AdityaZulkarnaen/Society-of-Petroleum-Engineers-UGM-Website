# B6F — Dedicated Vercel Staging Deployment Readiness Report

**Project**: SPE UGM SC Recruitment Backend
**Branch**: `feat/oprec-backend-staging`
**Target Staging Supabase**: `lavxddhrrwsjcshmnwvu` (`spe-ugm-staging`)
**Production Website (Untouched)**: `https://www.speugmsc.org/` (Vercel Project on `main`)
**Status**: Ready for Isolated Deployment Configuration

---

## 1. Executive Summary

This report establishes the deployment readiness and fail-closed safety posture for deploying the recruitment backend from `feat/oprec-backend-staging` to a dedicated Vercel staging project managed by collaborator Adit.

The codebase now enforces strict project identity, origin restrictions, and database isolation at runtime. If any environment variable is missing, if a non-staging Supabase database is connected, or if an unauthorized Vercel project attempts to run staging configuration, the system aborts immediately with HTTP 503.

---

## 2. Security Design & Rationale

### A. Vercel Project Identity Verification
When deploying a dedicated staging project from a Git branch (`feat/oprec-backend-staging`), Vercel assigns `VERCEL_ENV=production` if that branch is designated as the project's production branch. To safely distinguish this dedicated staging project from the live website (`www.speugmsc.org`), we cannot rely solely on `VERCEL_ENV` or user-defined flags like `STAGING=true`.

- **Mechanism**: We introduce `VERCEL_STAGING_PROJECT_ID`. At runtime, the application compares this explicitly configured value against `VERCEL_PROJECT_ID`, an immutable system environment variable injected into the serverless runtime by Vercel when "Automatically expose System Environment Variables" is checked.
- **Fail-Closed Behavior**:
  - If `VERCEL_PROJECT_ID` is missing: HTTP 503 (`VERCEL_PROJECT_ID is missing`).
  - If `VERCEL_STAGING_PROJECT_ID` is missing: HTTP 503 (`requires VERCEL_STAGING_PROJECT_ID`).
  - If `VERCEL_PROJECT_ID !== VERCEL_STAGING_PROJECT_ID`: HTTP 503 (`Vercel project identity mismatch`).
- **Isolation Scope**: If an operator accidentally imports staging environment variables into the real production Vercel project, the production project ID will mismatch `VERCEL_STAGING_PROJECT_ID`, preventing accidental staging operations or crosstalk.

### B. Database & Origin Isolation
- **Database Pinning**: Staging deployments are cryptographically pinned to the staging Supabase project reference `lavxddhrrwsjcshmnwvu`. If any URL or service-role JWT refers to another Supabase project, the request is rejected with HTTP 503 (`dilarang menggunakan database non-staging`).
- **Origin Pinning**: Staging deployments strictly forbid the production origins `https://www.speugmsc.org` and `https://speugmsc.org`. CSRF protections enforce exact matching against the staging canonical HTTPS domain.
- **Distributed Concurrency & Rate Limiting**: On Vercel serverless environments (`VERCEL=1`), `RECRUITMENT_SINGLE_INSTANCE=true` is rejected. The serverless functions are required to use `RECRUITMENT_DISTRIBUTED_LIMITER=upstash` with validated Upstash Redis credentials.

---

## 3. Verified Locally

The following safety controls and workflows have been implemented and verified locally via automated test suites:

| Category | Control / Test Case | Status |
| :--- | :--- | :--- |
| **Project Identity** | Dedicated staging project with `VERCEL_ENV=production` and matching `VERCEL_PROJECT_ID` | **PASS** |
| **Project Identity** | Mismatched `VERCEL_PROJECT_ID` fails closed (HTTP 503) | **PASS** |
| **Project Identity** | Missing `VERCEL_PROJECT_ID` (unexposed system vars) fails closed (HTTP 503) | **PASS** |
| **Project Identity** | Missing `VERCEL_STAGING_PROJECT_ID` fails closed (HTTP 503) | **PASS** |
| **Database Guard** | Staging deployment attempting to connect to non-staging Supabase fails closed (HTTP 503) | **PASS** |
| **Origin Guard** | Staging deployment configured with production origin (`speugmsc.org`) fails closed (HTTP 503) | **PASS** |
| **Multi-Instance** | In-memory single-instance limiter (`RECRUITMENT_SINGLE_INSTANCE=true`) rejected on Vercel | **PASS** |
| **Distributed Limiter** | Upstash Redis distributed rate limiting and atomic locking verified (11/11 tests pass) | **PASS** |
| **Live Upstash** | Live Upstash Redis REST operations verified against staging Redis instance (7/7 checks pass) | **PASS** |
| **Backward Compatibility** | Single-instance local staging launcher (`scripts/recruitment-backend/run-staging.mjs`) preserved | **PASS** |
| **Screening Workflow** | Super-admin screening state transitions and audit logging verified (17/17 tests pass) | **PASS** |
| **Submission Workflow** | Applicant multi-step submission, CSRF, idempotency, and document integrity verified (60/60 tests pass) | **PASS** |

---

## 4. Requires Adit's Vercel Project Information

Before deploying the dedicated staging project, Adit must provide the following project-specific identifiers and ensure project settings are configured:

1. **Vercel Staging Project ID**:
   - Location: Vercel Dashboard -> Project -> *Settings* -> *General* -> **Project ID** (format: `prj_...`).
   - Value needed: Must be copied into `VERCEL_STAGING_PROJECT_ID` in the project's Environment Variables.
2. **System Environment Variables Enabled**:
   - Location: Vercel Dashboard -> Project -> *Settings* -> *Environment Variables* -> Check box: **"Automatically expose System Environment Variables"**.
   - Purpose: Injects `VERCEL_PROJECT_ID` into runtime serverless environments so the isolation check can execute.
3. **Canonical Staging Origin URL**:
   - The primary domain assigned to the Vercel staging project (e.g., `https://spe-recruitment-staging.vercel.app`).
   - Value needed: Must be set as `RECRUITMENT_ORIGIN`.
4. **Git Branch Binding**:
   - Verify that the Vercel staging project is linked to repository `spe-ugm-oprec-staging` and targets branch `feat/oprec-backend-staging` (NOT `main`).

---

## 5. Requires Live Deployment Verification

Once deployed to Vercel staging, the following end-to-end verifications must be performed on the live staging URL:

1. **Health / Preflight Verification**:
   - Query `/api/recruitment/session` using the staging origin; verify HTTP 200 with active period and options metadata.
   - Verify HTTP response headers include `X-Content-Type-Options: nosniff` and strict cookie attributes (`SameSite=Lax; Secure; HttpOnly`).
2. **Rate Limiting & Redis Connectivity**:
   - Issue test requests to confirm distributed rate limiting tracks hits in Upstash Redis without connection timeout.
3. **Submission & Screening End-to-End**:
   - Execute an end-to-end synthetic applicant submission on the live staging domain.
   - Verify private document upload to Supabase Storage bucket `recruitment-documents`.
   - Perform super-admin screening state transition (`submitted` -> `under_review` -> `accepted`) and verify audit log generation.

---

## 6. Remaining Risks or Blockers

1. **Risk of Accidental Git Merge to `main`**:
   - *Mitigation*: The feature branch `feat/oprec-backend-staging` must remain independent until production release B7. All deployment activity must stay on the staging project and branch.
2. **Vercel System Environment Variable Exposure**:
   - *Mitigation*: If Adit forgets to enable "Automatically expose System Environment Variables", the backend fails closed on startup with a descriptive error message directing him to enable it, avoiding silent misconfiguration.
3. **Serverless Cold Start Redis Latency**:
   - *Mitigation*: Upstash Redis REST calls use HTTP Keep-Alive and 5-second timeouts. Live testing confirmed round-trip latency of 80–120ms.
