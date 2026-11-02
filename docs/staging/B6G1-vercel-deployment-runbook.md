# B6G.1 — Dedicated Vercel Staging Deployment Runbook

**Target Branch**: `feat/oprec-backend-staging`
**Staging Database**: Supabase `lavxddhrrwsjcshmnwvu` (`spe-ugm-staging`)
**Rate Limiter**: Upstash Redis (Staging REST instance)
**Production Site (Must Remain Untouched)**: `https://www.speugmsc.org/` (Vercel Project on `main`)
**Intended Operator**: Collaborator (Adit)

---

## 1. Pre-Deployment Checklist

Before creating the Vercel project, confirm:
- [ ] GitHub App authorization is granted for repository `spe-ugm-oprec-staging`.
- [ ] Collaborator has access to `.env.staging.private/recruitment-backend.env` for staging Supabase and Upstash Redis credentials.
- [ ] **NO production credentials** will be entered into this project.
- [ ] Branch `feat/oprec-backend-staging` is up to date.

---

## 2. Safe Vercel Project Creation (Avoiding `main`)

To ensure the staging deployment NEVER touches or deploys `main`:

1. **Log in to Vercel**: Navigate to the Vercel Dashboard.
2. **Add New Project**:
   - Click **"Add New..."** -> **"Project"**.
   - Select the repository `spe-ugm-oprec-staging`.
3. **Configure Project Details (DO NOT DEPLOY YET)**:
   - **Project Name**: Set a distinct staging name, e.g., `spe-ugm-recruitment-staging` (never use `spe-website`).
   - **Framework Preset**: `Next.js` (automatically detected).
   - **Root Directory**: `./` (leave default).
   - **Build & Development Settings**: Leave at default (`pnpm build`, `pnpm install`, output `.next`).
4. **Pin Production Branch to Feature Branch**:
   - Expand the **"Environment Variables"** or **"Git"** section before deploying, OR if Vercel starts an initial deployment upon import, click **"Cancel Deployment"** immediately to prevent an unconfigured run.
   - Navigate to: **Settings** -> **Git**.
   - Under **Production Branch**, change from `main` to:
     ```text
     feat/oprec-backend-staging
     ```
   - Save changes. This guarantees that all pushes to `feat/oprec-backend-staging` build the staging site, while `main` is completely ignored by this project.

---

## 3. Environment Variable Configuration Order

All configuration must be completed before triggering a live build.

### Step 3.1: Enable System Environment Variables
1. Go to **Settings** -> **Environment Variables**.
2. Find the checkbox **"Automatically expose System Environment Variables"** (under General or Environment Variables).
3. **Check this box and save**.
   *(This injects `VERCEL_PROJECT_ID` into serverless runtimes. Without this, the B6F guard will fail closed with HTTP 503).*

### Step 3.2: Retrieve the Staging Project ID
1. Go to **Settings** -> **General**.
2. Copy the **Project ID** (format: `prj_...`).

### Step 3.3: Enter Required Environment Variables
In **Settings** -> **Environment Variables**, add the following variables for scopes **[Production, Preview]**:

| Variable Name | Value / Placeholder | Scope | Notes |
| :--- | :--- | :--- | :--- |
| `RECRUITMENT_ENABLED` | `true` | Production, Preview | Master feature toggle |
| `VERCEL_STAGING_PROJECT_ID` | `<prj_... from Step 3.2>` | Production, Preview | Must match `VERCEL_PROJECT_ID` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lavxddhrrwsjcshmnwvu.supabase.co` | Production, Preview | Staging Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `<staging_anon_key>` | Production, Preview | Staging anon key for client & middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<staging_anon_key>` | Production, Preview | Same staging anon key |
| `SUPABASE_SECRET_KEY` | `<staging_service_role_key>` | Production, Preview | Server-only staging service role key |
| `RECRUITMENT_ORIGIN` | `https://<staging-project-name>.vercel.app` | Production, Preview | Canonical staging HTTPS domain (no trailing slash) |
| `RECRUITMENT_PERIOD_ID` | `87e7c760-1fb2-4e61-a803-b82a41b7847c` | Production, Preview | Staging recruitment period UUID |
| `RECRUITMENT_SESSION_SECRET` | `<random_32_chars_secret>` | Production, Preview | Server-only HMAC secret |
| `RECRUITMENT_DISTRIBUTED_LIMITER` | `upstash` | Production, Preview | Serverless multi-instance requirement |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Production, Preview | Staging Upstash Redis HTTPS endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | `<staging_upstash_token>` | Production, Preview | Server-only Upstash Redis token |
| `NEXT_PUBLIC_SITE_URL` | `https://<staging-project-name>.vercel.app` | Production, Preview | Canonical site URL for metadata |

> [!CAUTION]
> **PROHIBITED VARIABLE**: Do NOT set `RECRUITMENT_SINGLE_INSTANCE=true` on Vercel. Doing so immediately triggers an intentional HTTP 503 fail-closed exception.

---

## 4. Deployment Trigger & Initial Verification

1. Go to the **Deployments** tab.
2. Click **"Redeploy"** on the latest commit from `feat/oprec-backend-staging` (or trigger via Git).
3. Wait for the build to finish. Verify:
   - Next.js Turbopack compilation succeeds.
   - All 25 routes are generated (including `/api/recruitment`, `/join/apply`, `/super-admin/recruitment`).
   - Deployment status turns green (Ready).

---

## 5. Smoke Testing on Staging (Synthetic Data)

Execute the following smoke tests using the canonical staging URL `https://<staging-app>.vercel.app`:

### A. Health & Session Check
1. Open developer tools in your browser.
2. Navigate to `https://<staging-app>.vercel.app/join/apply`.
3. Verify:
   - Network request to `/api/recruitment` returns **HTTP 200**.
   - Response payload contains `{ period: { label: "...", ... }, token: "..." }`.
   - Response cookie `spe-recruitment-session` is set with `HttpOnly; SameSite=Strict; Secure`.
   - Wizard Step 1 loads division catalog from database.

### B. Synthetic Submission Test
1. Fill in synthetic test data:
   - Full Name: `Synthetic Tester B6G`
   - NIM: `999999` (or random test NIM)
   - UGM Email: `synthetictest@mail.ugm.ac.id`
   - Valid synthetic PDF / PNG supporting documents.
2. Advance through all 4 steps to Review.
3. Submit application.
4. Verify:
   - Request to `POST /api/recruitment` returns **HTTP 200**.
   - Screen displays confirmation receipt with application UUID.

### C. Super-Admin Screening & Audit Verification
1. Navigate to `https://<staging-app>.vercel.app/admin/login`.
2. Authenticate as staging super-admin (`spestaging`).
3. Open `https://<staging-app>.vercel.app/super-admin/recruitment`.
4. Locate the synthetic submission.
5. Verify document streaming preview (byte-for-byte exact stored bytes).
6. Transition status: `submitted` -> `under_review` -> `accepted`.
7. Verify state transition succeeds and audit log record is created.

---

## 6. Verification of Production Website Isolation

Verify that the production website has not been impacted in any way:

1. **Inspect Production Site**:
   - Open `https://www.speugmsc.org/`.
   - Confirm the live website is responsive and displays the production homepage.
   - Check `https://www.speugmsc.org/join/apply` -> confirm recruitment remains closed/unaffected.
2. **Inspect Production Vercel Dashboard**:
   - Open the production Vercel project (`spe-website`).
   - Confirm **NO** new deployments were triggered.
   - Confirm Git branch remains `main`.
3. **Inspect Production Supabase**:
   - Confirm no new tables, rows, or connections were made to the production database.

---

## 7. Emergency Rollback & Kill-Switch Procedure

If any anomaly occurs:

1. **Instant Application Kill-Switch**:
   - In Vercel Project Settings -> Environment Variables, change `RECRUITMENT_ENABLED` to `false`.
   - Redeploy or trigger fast refresh.
   - All recruitment endpoints instantly return HTTP 503 (`Pendaftaran belum tersedia. Silakan hubungi panitia.`).
2. **Project Pause**:
   - If entire staging site needs to be taken offline immediately:
   - Go to Project Settings -> **Pause Project**.
3. **Rollback Deployment**:
   - In Deployments tab, click `...` on the prior working deployment and select **"Assign to Production"**.

---

## 8. Hard STOP Conditions

Abort the deployment immediately and investigate if any of the following occur:

| Condition | Cause | Action |
| :--- | :--- | :--- |
| **HTTP 503: "Vercel system project identity (VERCEL_PROJECT_ID) is missing"** | "Automatically expose System Environment Variables" was not enabled in Vercel settings. | Enable the setting in Project Settings -> Environment Variables, then redeploy. |
| **HTTP 503: "Vercel project identity mismatch"** | `VERCEL_STAGING_PROJECT_ID` does not match the project's actual `VERCEL_PROJECT_ID`. | Verify and copy the exact Project ID from Settings -> General. |
| **HTTP 503: "Staging deployment dilarang menggunakan database non-staging"** | Database URL points to production or a non-staging Supabase project. | **STOP IMMEDIATELY**. Correct `NEXT_PUBLIC_SUPABASE_URL` to staging (`lavxddhrrwsjcshmnwvu`). |
| **HTTP 503: "Staging deployment dilarang menggunakan origin produksi"** | `RECRUITMENT_ORIGIN` was set to `speugmsc.org`. | **STOP IMMEDIATELY**. Change `RECRUITMENT_ORIGIN` to the staging domain. |
| **HTTP 503: "Konfigurasi distributed rate limiter belum lengkap"** | Upstash Redis URL or Token is missing or invalid. | Verify Upstash REST credentials from `.env.staging.private`. |
| **Production Vercel deployment triggered** | Staging project was connected to `main` branch or production project settings modified. | **STOP IMMEDIATELY**. Cancel the build in the production project. |
