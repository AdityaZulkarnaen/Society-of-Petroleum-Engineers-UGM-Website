# B2C.2B secure client setup result

2026-11-02, Asia/Jakarta. feat/oprec-backend-staging. Local setup authorized; no database connection authorized or attempted.

**Client/storage/profile ready. NO-GO for first cloud inspection until owner enters the existing staging password, supplies the Dashboard public CA, and offline checks pass.** TLS configuration is enforced, but certificate trust and live TLS have not been tested. The previous read-only connection authorization was superseded by the subsequent setup-only instructions; stop at setup, do not connect automatically after files appear.

## Client installation completed

PostgreSQL's official Windows page links to EDB's binary archives: https://www.postgresql.org/download/windows/ and https://www.enterprisedb.com/download-postgresql-binaries.

Selected pinned Windows x64 archive postgresql-17.11-5-windows-x64-binaries.zip using the actual version link on that vendor page (fileid 1260616). Download followed verified HTTPS to get.enterprisedb.com without certificate bypass. Archive size: 381531864 bytes. SHA-256: `80379b2c04d51c30225532e0ae04509899141e9957ed096fe749d7fd9df8f82f`.

Extracted only psql.exe plus 17 DLL/runtime files, not initdb/postgres/pg_ctl or any other server/installer executable. Installed the client tree under protected staging storage; no Windows service, database, global PATH or server installation. Archive/staging extraction retained in ignored .next/staging-postgres-client for provenance; no unrelated resource deleted.

Verified absolute client path:

```text
D:\SPE UGM SC\spe-ugm-oprec-staging\.env.staging.private\client\postgresql-17.11-5\psql.exe
```

Offline execution: `psql (PostgreSQL) 17.11`; matching libpq reports 170011. Only --version and local library-version inspection were used. psql SHA-256: `c290c7f0a3335f290f8c18011a1e5afa03ee3cdd628697a5f3e767e5f1d3d10d`. libpq SHA-256: `9ed093bb84a0b93603ceb11011442342a4f8789fb1af44d96f6e1923f75b4812`.

Authenticode for psql.exe and libpq.dll reports NotSigned. No signature PASS or independent vendor checksum is claimed. Distribution provenance is the official PostgreSQL -> EDB verified-HTTPS link, with recorded archive/file hashes for reproducibility. No installer was run. The unexecuted installer-signature procedure is not misrepresented as having passed for these archive binaries.

## Private storage and configuration completed

- .env.staging.private owner: RIZKI-LAPTOP/Lenovo. Directory inheritance protected; owner/DACL access restricted to Lenovo and SYSTEM. All files/subdirectories, including client DLLs, recursively checked for those two identities only. No Users/Everyone/Authenticated Users access remains.
- Initial Set-Acl attempts failed on ownership/audit-privilege handling. No credential existed. Owner-context DACL setup followed by native FileInfo/DirectoryInfo.SetAccessControl succeeded for final owner/DACL only; no audit/global privilege change or broader grant. Procedure updated to use native APIs and terminating errors.
- Active .env.staging.private/pg_service.conf created from the password-free template. Target: owner-confirmed Mumbai Session Pooler host aws-0-ap-south-1.pooler.supabase.com, port 5432, database postgres, username postgres.lavxddhrrwsjcshmnwvu. Personal organization abnfnzzearslinsxnjcb; API origin https://lavxddhrrwsjcshmnwvu.supabase.co. No inferred alternate endpoint or implicit CLI link.
- sslmode=verify-full, explicit root-ca-bundle.pem/password-file paths, startup default_transaction_read_only=on, fixed search_path and finite timeouts. No password inside profile and no environment/URL/argv password transport. A missing CA/password must fail, never fall back.
- Protected enter-staging-password.ps1 prepared and parsed but NOT executed. It checks intended execution identity/ACLs, uses Read-Host -AsSecureString, escapes the password-file format and atomically creates an exact-host/user password file without printing secret contents. It refuses overwrite, empty/newline input and does not generate/reset a password or contact a database. Plaintext is necessarily written into libpq's ACL-protected password file and exists briefly in process memory; no claim of total managed-memory zeroing.
- Protected import-ca-offline.py prepared/compiled but NOT executed. It accepts only a public .crt/.cer/.pem supplied from this staging Dashboard, rejects private-key material, parses PEM/DER, requires CA recognition and current validity dates, refuses overwrite, records public certificate provenance/hash, and makes no network/database call. Source Dashboard provenance is owner-attested, not inferred from certificate syntax.
- git check-ignore confirms profile/helpers/client files are ignored by existing .env* rule. No git add -f. No .env.local read/copied/modified. Root filenames found only .env.example and this dedicated private directory. No inherited PG/Supabase variables in setup process. All 17 frozen migration hashes still match.

## Trusted CA source and pending certificate

Supabase's official psql guide explicitly instructs obtaining the public SSL certificate from Database Settings, then using verify-full with the Session Pooler: https://supabase.com/docs/guides/database/psql. Additional verification semantics: https://supabase.com/docs/guides/platform/ssl-enforcement.

The owner should download that public CA from project lavxddhrrwsjcshmnwvu's Database Settings -> SSL Configuration. Do not toggle SSL enforcement or change/reset anything in the Dashboard. No certificate invented, fetched from the unverified DB endpoint, leaf-pinned or copied from production. The earlier Windows-root option was NOT exported/selected: it may not contain the Supabase private CA. Configuration points to a currently absent certificate file intentionally, so it cannot silently use OS defaults.

No client-to-pooler connection was attempted. A later verify-full run must validate the actual chain AND exact hostname; parsing a CA offline proves neither. pg_stat_ssl through a pooler can describe the backend leg and is not by itself proof of client-side hostname/CA verification. No weaker TLS mode or alternate host is allowed on failure.

## Two remaining user actions

Use a private PowerShell session as the Lenovo account. Do not paste secrets into chat, commands, editor sync or transcripts. If execution policy blocks a helper, stop and report; do not automatically bypass/change policy.

1. Retrieve the EXISTING staging DB password from its staging-specific password-manager entry, then run this masked helper. If unknown, cancel: a password reset/new role is not authorized.

```powershell
& 'D:/SPE UGM SC/spe-ugm-oprec-staging/.env.staging.private/enter-staging-password.ps1'
```

2. Download the public CA from the verified staging Dashboard and provide only its local file path, or import it offline with the helper. Replace only the example input PATH with the real downloaded public certificate path; do not manufacture a file or certificate:

```powershell
& 'C:/Python313/python.exe' 'D:/SPE UGM SC/spe-ugm-oprec-staging/.env.staging.private/import-ca-offline.py' 'C:/actual/download/path/public-ca.crt' --dashboard-project lavxddhrrwsjcshmnwvu
```

A local certificate path was requested asynchronously; no certificate/password was provided during this run. No placeholder password file or certificate was created. Do not send the password/password file contents. Owner may supply only completion confirmation, paths and public CA fingerprint/provenance.

After these actions, recheck new-file ACLs using the procedure's rule checker, validate active profile and CA parsing offline, confirm password-file existence WITHOUT reading/printing its contents, and record source/hash/client path. Profile read-only startup options and pooler support remain untested. Do not relax read-only/TLS settings if a future connection rejects them.

## Readiness and stop

| Prerequisite | Actual status |
| --- | --- |
| Client-only install/runtime | PASS: psql 17.11/libpq 170011, protected absolute path |
| Directory/client/config permissions and Git ignore | PASS |
| Password-free active target/TLS/read-only profile | PASS, local configuration only |
| Masked password-entry and offline CA import helpers | Ready; not executed |
| Existing staging password | User action; pgpass.conf absent |
| Official Dashboard CA | User action; root-ca-bundle.pem absent |
| Live TLS/hostname/database identity/schema | NOT ATTEMPTED |
| Cloud migration readiness | NO-GO; no managed metadata inspection yet |

The existing B2C2A query file SHA-256 remains `a29e8ee9045054773ab87a60c2c2240f3a79f2324bdc4fc5cd9ef01497706a02`; it was not executed. Evidence: ignored .next/staging-postgres-client/download-provenance.json, installed-files.json, client-verification.json, private-storage-verification.json and setup-status.json. Do not treat these local checks as live target/TLS proof. Local Docker/UTS were not contacted or modified; their current health was not rechecked. Only public documentation/vendor-download HTTPS requests occurred, no database/project API traffic, SQL, migrations, seeds, fixtures, production credentials, push or deployment.

Repository change: updated B2C2B-secure-setup-procedure.md and added this report. Created protected ignored client/config/helpers and ignored acquisition/verification artifacts. Prior reports/frozen manifest/migrations/tests/application files preserved. Stop after setup; do not auto-resume a cloud connection.

## Follow-up: owner-provided CA validated offline, 2026-11-02

Owner supplied D:/SPE UGM SC/staging-certs/prod-ca-2021.crt. The public CA passed structure/constraints/validity/self-signature checks and was imported byte-for-byte into the protected configured CA path. See B2C2B-certificate-validation.md/json for fingerprint and evidence. This supersedes the earlier pending-CA row only; the password file remains absent, live TLS/chain/hostname and DB state remain unverified, and no connection is authorized by this update.
