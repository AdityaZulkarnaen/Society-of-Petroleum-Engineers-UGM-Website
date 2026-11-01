# B2C.2B offline staging CA validation

2026-11-02, Asia/Jakarta. **Offline CA validation PASS. Live Session Pooler certificate chain/hostname verification NOT PERFORMED.** No database or network connection was made in this task.

## Source and certificate findings

Owner supplied D:/SPE UGM SC/staging-certs/prod-ca-2021.crt and explicitly attested download from project lavxddhrrwsjcshmnwvu's Supabase Dashboard. Source file is a regular 1367-byte public certificate file; one PEM X.509 certificate, no private-key material. Original file left unchanged. Source provenance is the owner's Dashboard attestation; self-signature alone does not establish external trust or project identity.

| Check | Result |
| --- | --- |
| Subject / issuer | Both Supabase Root 2021 CA, Supabase Inc (self-signed root) |
| Basic Constraints | Critical CA:TRUE |
| Key Usage | Certificate Sign, CRL Sign |
| Key / signature | RSA 2048 bits / SHA-256 with RSA |
| Valid from | 2021-04-28 10:56:53 UTC |
| Valid until | 2031-04-26 10:56:53 UTC |
| Validity on 2026-11-02 | PASS |
| Self-signature verification | PASS: local OpenSSL verify -check_ss_sig with this root explicitly trusted |
| Python/OpenSSL trust-store parsing | PASS: one recognized CA |
| DER certificate SHA-256 fingerprint | 80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA |
| PEM file SHA-256 | 700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7 |

The certificate fingerprint hashes DER certificate bytes; the file hash hashes the PEM text. Different values are expected. No arbitrary certificate was generated, substituted or fetched from an endpoint.

## Prepared configuration

Imported this exact public certificate through the existing offline helper into .env.staging.private/root-ca-bundle.pem. Source and imported bytes match. Import refused overwrite and recognized current CA validity. Protected file ownership/ACL checks passed for intended Lenovo account and SYSTEM only. It is ignored by Git. Recorded provenance in private ca-provenance.json; no secret contents logged.

The password-free service profile uses this exact CA file and sslmode=verify-full with the owner-confirmed Session Pooler host aws-0-ap-south-1.pooler.supabase.com, port 5432, database postgres and username postgres.lavxddhrrwsjcshmnwvu. Target/profile/path comparison PASS. No weaker TLS mode or alternate destination selected. Existing startup READ ONLY settings remain configured; actual pooler acceptance is untested.

This is appropriate public CA trust material for the documented Supabase verify-full workflow based on the confirmed Dashboard source. **It is not proof of the selected endpoint's current chain or hostname.** A root CA need not contain the endpoint hostname and cannot itself be hostname-matched as though it were the server leaf. Only a later authorized verify-full handshake can demonstrate that the endpoint presents a valid matching leaf/chain under this root. Client-to-pooler versus backend TLS must be distinguished; backend pg_stat_ssl alone is insufficient. No s_client, psql connection, SQL or online certificate test was run.

## Remaining prerequisites and stop

- Client-only psql 17.11 and matching libpq were prepared previously; this certificate task did not reinstall them or revalidate their binaries.
- Credential-file existence check only: pgpass.conf is still absent. No password file read, created or password invented/reset. Enter only the existing staging DB password using the protected enter-staging-password.ps1 helper in a private PowerShell session as Lenovo. Never paste passwords/keys/connection strings into chat. If unknown, stop rather than reset it without separate authorization.
- After entry, check new-file ACLs without reading its contents and perform the existing offline profile/CA readiness checks. Secure allowlisted client invocation and first live read-only identity/metadata inspection remain future work; do not auto-connect after password entry.
- A new explicit instruction to resume the read-only cloud inspection is needed after the latest no-connection stopping instruction. No migration, seed or fixture is authorized.

NO-GO for cloud inspection execution now; CA preparation prerequisite is complete. No live DB identity/schema/history/permission claim is made. Production credentials and Docker/UTS untouched. No SQL, migrations, seeds, pushes or deployment.

## Artifacts

Added this report and B2C2B-certificate-validation.json with public certificate metadata and validation evidence. Created protected ignored root-ca-bundle.pem and ca-provenance.json using the existing helper; source certificate unchanged. Existing migrations, inspection SQL, credentials and environment targets unchanged. Git ignore/whitespace checks performed locally. All operations were local file parsing, crypto verification and protected configuration writes.
