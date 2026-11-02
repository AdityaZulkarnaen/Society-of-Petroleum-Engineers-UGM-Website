# B6G.10 — Temporary Vercel Runtime Identity Diagnostic Guide

**Target Branch**: `feat/oprec-backend-staging`  
**Endpoint Path**: `/api/internal/staging-health`  
**Runtime**: Node.js (`force-dynamic`, `no-store`)  
**Recruitment Status**: Disabled (`RECRUITMENT_ENABLED` remains false/unset)  

---

## 1. Overview & Security Guarantees

This diagnostic endpoint is a temporary, read-only mechanism to verify that:
1. The dedicated Vercel staging project (`spe-ugm-oprec-staging`) has correctly exposed system environment variables (`VERCEL_PROJECT_ID`).
2. The runtime `VERCEL_PROJECT_ID` strictly matches the expected `VERCEL_STAGING_PROJECT_ID` (`prj_Hj8Qjg7x5yWZvUnO8PxYG9wYJKgs`).
3. `NEXT_PUBLIC_SUPABASE_URL` explicitly points to the authorized staging Supabase instance (`lavxddhrrwsjcshmnwvu`).

### Critical Safeguards:
- **Zero Information Leakage**: Returns ONLY three boolean flags. Never logs or outputs environment values, IDs, URLs, tokens, or credentials.
- **Fail-Closed 404**: Any missing, mismatched, or unauthorized access returns HTTP 404 (Not Found) rather than 401 or 403, preventing endpoint enumeration.
- **Independent from Recruitment**: Does not invoke `settings()`, Supabase client, Upstash, or any external network API. Recruitment remains completely disabled.
- **Constant-Time Comparison**: Protects `DIAGNOSTIC_TOKEN` against timing attacks via `timingSafeEqual`.

---

## 2. Environment Configuration

To use this diagnostic endpoint on the dedicated Vercel staging project, ensure the following environment variables are set in the Vercel staging project settings:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `VERCEL_STAGING_PROJECT_ID` | Production, Preview | `prj_Hj8Qjg7x5yWZvUnO8PxYG9wYJKgs` |
| `DIAGNOSTIC_TOKEN` | Production, Preview | A temporary, high-entropy secret string (min. 16 characters). Never use session secrets. |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | `https://lavxddhrrwsjcshmnwvu.supabase.co` |

*(Note: "Automatically expose System Environment Variables" must be checked in Project Settings so Vercel supplies `VERCEL_PROJECT_ID`).*

---

## 3. Usage & Verification

Once deployed to Vercel staging, execute a GET request supplying the token in the `x-diagnostic-token` header:

```bash
curl -s -H "x-diagnostic-token: <DIAGNOSTIC_TOKEN>" \
  https://spe-ugm-oprec-staging.vercel.app/api/internal/staging-health
```

### Expected 200 Response:
```json
{
  "vercelProjectIdPresent": true,
  "vercelProjectIdMatches": true,
  "stagingSupabaseMatches": true
}
```

### Failure Modes (All Return HTTP 404):
- Header missing or wrong token -> `404 Not Found`
- System environment variables unexposed (`VERCEL_PROJECT_ID` missing) -> `404 Not Found`
- Project ID mismatch (e.g. running on wrong project) -> `404 Not Found`
- Called outside Vercel runtime (e.g. local dev) -> `404 Not Found`

---

## 4. Decommissioning & Removal Steps

Once staging deployment identity and Supabase reference are confirmed, remove this diagnostic endpoint completely:

1. **Delete Route**:
   ```bash
   rm app/api/internal/staging-health/route.ts
   rmdir app/api/internal/staging-health
   ```
2. **Delete Tests**:
   ```bash
   rm scripts/recruitment-backend/staging-health.test.cjs
   ```
3. **Delete Documentation**:
   ```bash
   rm docs/staging/B6G10-diagnostic-guide.md
   ```
4. **Remove Environment Variable**:
   In Vercel staging dashboard (*Project Settings* -> *Environment Variables*), delete `DIAGNOSTIC_TOKEN`.

