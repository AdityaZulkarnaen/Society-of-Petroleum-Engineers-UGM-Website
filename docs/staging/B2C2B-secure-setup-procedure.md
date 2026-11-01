# B2C.2B secure local setup procedure

2026-11-02, Asia/Jakarta. Preparation only. The latest user instruction prohibits connections now, including the previously authorized inspection. No password, CA bundle, active profile or PostgreSQL client was installed/configured by this task.

## Verified local preparation

- Branch: feat/oprec-backend-staging.
- Ignored .env.staging.private/pg_service.conf.example contains the exact owner-confirmed session-pooler destination, verify-full TLS, explicit private password/CA paths, startup read-only settings and timeouts. No password or placeholder password.
- Ignored .env.staging.private/SETUP-BOUNDARY.txt requires ACL protection before secret entry. Existing .gitignore covers this directory; no ignore changes needed.
- psql is absent from PATH; standard Program Files/PostgreSQL directory not found. Python 3.13.7, Node 24.21.0 and OpenSSL 3.3.0 are present. winget/choco executables exist but were not invoked.
- Windows ROOT public-certificate enumeration: 65 certificates, 51 X.509 entries trusted for server authentication before CA/expiry filtering. No private keys read, no bundle exported, no endpoint contacted.
- No credential files created/read, software downloaded, database password generated/reset, SQL executed or Docker resources changed. Production .env.local was not read/copied.

All following commands are FUTURE USER SETUP instructions, not executed by the agent. Stop on any error. Steps 1–6 require no database connection.

## 1. Install and verify a client without a server

Use current maintained PostgreSQL 17 command-line tools for Windows. Begin at https://www.postgresql.org/download/windows/ and follow its official Windows distributor link. These reference pages were not fetched in this task; verify current patch/version/publisher when downloading. Do not use an unverified package-manager ID or implicit npx download.

Before running the downloaded installer, verify its Authenticode signature has a valid chain and the publisher matches the official distributor. Compare published checksums where available. Record source URL/version/hash; a self-computed hash alone does not authenticate a download.

Select **Command Line Tools only**. Deselect PostgreSQL Server, pgAdmin and Stack Builder. If the distribution cannot install tools without a server/service/account/new database password, cancel and choose the official documented client/binary alternative. Do not start a local database or use Docker as a workaround. Keep psql.exe, libpq.dll and SSL/runtime DLLs together from the same authenticated package; do not mix Strawberry OpenSSL libraries into it.

Offline validation after user installation, with the actual installed path:

~~~powershell
$psqlExe = 'C:/Program Files/PostgreSQL/17/bin/psql.exe'
if (-not (Test-Path -LiteralPath $psqlExe -PathType Leaf)) { throw 'Verified client missing' }
& $psqlExe --version
if ($LASTEXITCODE -ne 0) { throw 'Client version check failed' }
Get-FileHash -LiteralPath $psqlExe -Algorithm SHA256
Get-FileHash -LiteralPath (Join-Path (Split-Path $psqlExe) 'libpq.dll') -Algorithm SHA256
~~~

Record authenticated package provenance and client/library hashes. Do not invoke bare psql, --list or pg_isready: those can connect. A client version check does not verify remote TLS. Existing OpenSSL on PATH is not evidence of libpq's TLS library version.

## 2. Protect the private directory before storing secrets

Run the following in private PowerShell as the intended future execution account, normally Lenovo. Do not configure secrets under one account then weaken ACLs to let another account read them. This changes only the dedicated private directory/files; failure means stop, not grant Users/Everyone or take broader permissions.

~~~powershell
$ErrorActionPreference = 'Stop'
$workspaceRoot = 'D:/SPE UGM SC/spe-ugm-oprec-staging'
$privateRoot = Join-Path $workspaceRoot '.env.staging.private'
if ((Resolve-Path -LiteralPath $privateRoot).Path -ne
    (Join-Path (Resolve-Path -LiteralPath $workspaceRoot).Path '.env.staging.private')) {
    throw 'Unexpected private directory'
}
if ((Get-Item -LiteralPath $privateRoot).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw 'Private directory must not be a link'
}
$executionSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$systemSid = [Security.Principal.SecurityIdentifier]::new('S-1-5-18')
$dirAcl = [Security.AccessControl.DirectorySecurity]::new()
$dirAcl.SetOwner($executionSid)
$dirAcl.SetAccessRuleProtection($true, $false)
foreach ($sid in @($executionSid, $systemSid)) {
    $dirAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
        $sid, [Security.AccessControl.FileSystemRights]::FullControl,
        [Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit',
        [Security.AccessControl.PropagationFlags]::None,
        [Security.AccessControl.AccessControlType]::Allow))
}
[IO.DirectoryInfo]::new($privateRoot).SetAccessControl($dirAcl)
foreach ($file in Get-ChildItem -LiteralPath $privateRoot -File) {
    if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unexpected file link' }
    $fileAcl = [Security.AccessControl.FileSecurity]::new()
    $fileAcl.SetOwner($executionSid)
    $fileAcl.SetAccessRuleProtection($true, $false)
    foreach ($sid in @($executionSid, $systemSid)) {
        $fileAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
            $sid, [Security.AccessControl.FileSystemRights]::FullControl,
            [Security.AccessControl.AccessControlType]::Allow))
    }
    [IO.FileInfo]::new($file.FullName).SetAccessControl($fileAcl)
}
# Repeat this rule check after creating any new private file:
foreach ($item in @((Get-Item -LiteralPath $privateRoot)) +
                  @(Get-ChildItem -LiteralPath $privateRoot -File)) {
    $acl = Get-Acl -LiteralPath $item.FullName
    foreach ($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])) {
        if ($rule.IdentityReference.Value -notin @($executionSid.Value,$systemSid.Value) -or
            $rule.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow) {
            throw 'Unexpected private ACL entry'
        }
    }
}
'Private ACL check passed'
~~~

The agent did not apply this ACL. Current templates contain no secrets. Keep secret entry out of recordings, screenshots, editor sync and transcripts. Never print files to check their contents. Stop if there are unexpected files or a credential already exists; do not overwrite it automatically.

## 3. Retrieve the existing staging password privately

Use the password manager entry specifically for project lavxddhrrwsjcshmnwvu, personal organization abnfnzzearslinsxnjcb. Confirm provenance. No production file, local Docker password, shared seed password, API key, JWT secret or CLI token is an acceptable substitute.

If the staging database password is unknown, **stop**. No placeholder/generated password, role creation or cloud password reset is authorized. Resetting the staging password requires separate explicit approval. Do not send a password or connection string to chat.

Only after step 2 succeeds, write the existing password to an exact-host/user password file using masked input below. libpq's password file is plaintext on disk, so the restrictive ACL is mandatory. Conversion is briefly plaintext in process memory; variable cleanup does not guarantee zeroing managed memory.

~~~powershell
$passPath = Join-Path $privateRoot 'pgpass.conf'
if (Test-Path -LiteralPath $passPath) { throw 'Existing password file; do not overwrite' }
$secret = Read-Host 'Existing staging DB password for lavxddhrrwsjcshmnwvu only' -AsSecureString
$buffer = [IntPtr]::Zero
try {
    $buffer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($buffer)
    if ([string]::IsNullOrWhiteSpace($plain) -or $plain.Contains("`r") -or $plain.Contains("`n")) {
        throw 'Missing or unsupported password input'
    }
    $escaped = $plain.Replace('\','\\').Replace(':','\:')
    $entry = 'aws-0-ap-south-1.pooler.supabase.com:5432:postgres:postgres.lavxddhrrwsjcshmnwvu:' + $escaped
    [IO.File]::WriteAllText($passPath, $entry + "`n", [Text.UTF8Encoding]::new($false))
} finally {
    if ($buffer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($buffer) }
    $plain = $null; $escaped = $null; $entry = $null
    if ($secret) { $secret.Dispose() }; $secret = $null
}
# Repeat step 2's ACL rule check, including the new file.
~~~

No wildcard password entries, password-bearing URLs/argv or PGPASSWORD. Record only the protected file path and staging-only provenance attestation. Password correctness remains untested until a later authorized connection.

## 4. Prepare CA trust offline

The shared session pooler may use a different chain from the direct project's database certificate. Do not assume a Dashboard direct-DB CA matches the pooler. Do not trust an endpoint's downloaded leaf as a CA. No openssl s_client, curl or TLS probe now.

Concrete offline option: export a PEM bundle from the Windows ROOT store already trusted by the intended execution account, filtering server-auth X.509 CAs and validity dates. This adds no trust and downloads nothing. The owner must accept this OS trust baseline, including administratively installed roots. If that baseline is not trusted/current, stop and obtain trust material through independently authenticated official CA/Supabase/distribution guidance in a separately permitted step. Never disable verification.

After the directory ACL check, run as the same account:

~~~powershell
@'
from pathlib import Path
import ssl, time, hashlib
out = Path('D:/SPE UGM SC/spe-ugm-oprec-staging/.env.staging.private/root-ca-bundle.pem')
assert not out.exists(), 'Bundle exists; review instead of overwriting'
certs = set()
now = time.time()
for der, encoding, trust in ssl.enum_certificates('ROOT'):
    if encoding != 'x509_asn' or not (trust is True or '1.3.6.1.5.5.7.3.1' in trust):
        continue
    pem = ssl.DER_cert_to_PEM_cert(der)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.load_verify_locations(cadata=pem)
    decoded = ctx.get_ca_certs()
    if not decoded:
        continue
    cert = decoded[0]
    if ssl.cert_time_to_seconds(cert['notBefore']) <= now < ssl.cert_time_to_seconds(cert['notAfter']):
        certs.add(pem)
assert certs, 'No valid server-auth roots available'
content = ''.join(sorted(certs)).encode('ascii')
with out.open('xb') as f:
    f.write(content)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.load_verify_locations(cafile=str(out))
assert ctx.check_hostname and ctx.verify_mode == ssl.CERT_REQUIRED and ctx.get_ca_certs()
print('Offline CA parsing PASS; roots:',len(certs),'SHA256:',hashlib.sha256(content).hexdigest())
'@ | & 'C:/Python313/python.exe' -
~~~

Recheck file ACL. Record trust-store source/account/export date/count/hash. The hash identifies selected trust material, not proof of its authenticity or a matching server chain. This export was not run by the agent. CA parsing is not a live TLS test.

A future sslmode=verify-full connection must validate chain AND exact approved pooler hostname. If chain trust fails, stop and diagnose via independently trusted guidance. Never replace with require/prefer/allow/disable, bypass hostname checks, accept a leaf pin, or switch endpoints.

## 5. Activate and validate the profile offline

Only after the preceding steps succeed:

~~~powershell
$servicePath = Join-Path $privateRoot 'pg_service.conf'
if (Test-Path -LiteralPath $servicePath) { throw 'Active profile exists; do not overwrite' }
Copy-Item -LiteralPath (Join-Path $privateRoot 'pg_service.conf.example') -Destination $servicePath
# Repeat step 2 ACL check on directory and every file.
git check-ignore --no-index .env.staging.private/pg_service.conf .env.staging.private/pgpass.conf .env.staging.private/root-ca-bundle.pem
if ($LASTEXITCODE -ne 0) { throw 'Private file not ignored' }
~~~

Offline verification below reads only the password-free profile, not the password file:

~~~powershell
@'
from pathlib import Path
import configparser, ssl
base = Path('D:/SPE UGM SC/spe-ugm-oprec-staging/.env.staging.private')
p = configparser.ConfigParser(interpolation=None, strict=True)
with (base/'pg_service.conf').open() as f: p.read_file(f)
assert p.sections() == ['spe_ugm_staging_readonly'] and not p.defaults()
expected = {
 'host':'aws-0-ap-south-1.pooler.supabase.com','port':'5432','dbname':'postgres',
 'user':'postgres.lavxddhrrwsjcshmnwvu','sslmode':'verify-full',
 'sslrootcert':(base/'root-ca-bundle.pem').as_posix(),
 'passfile':(base/'pgpass.conf').as_posix(),
 'connect_timeout':'10','application_name':'spe-b2c-readonly','client_encoding':'UTF8',
}
assert dict(p['spe_ugm_staging_readonly']) == expected, 'Unexpected profile option or target'
assert (base/'pgpass.conf').is_file(), 'Missing private password file'
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.load_verify_locations(cafile=str(base/'root-ca-bundle.pem'))
assert ctx.check_hostname and ctx.verify_mode == ssl.CERT_REQUIRED
print('Offline profile/CA checks PASS; password contents not read; no connection')
'@ | & 'C:/Python313/python.exe' -
~~~

No password=, hostaddr, alternate hosts, TLS downgrade, extra profile/service aliases or unexpected options. Pooler support for startup settings remains unverified; a later refusal requires stopping, not silently dropping READ ONLY settings. The profile cannot prove password provenance.

## 6. Verification packet and stopping point

Provide only client absolute path/version/hash and authenticated package source; protected profile/password/CA paths; ACL identity/check result; CA provenance/hash/count; and confirmation password belongs to the staging project. No secret contents or full connection strings. Recheck the frozen 17 hashes and unchanged inspection SQL before future execution.

Future inspection must use a reviewed allowlisted child environment, explicit PGSERVICEFILE/PGPASSFILE/PGSERVICE and no inherited DB/Supabase/preload variables. Pin the absolute psql executable, profile and CA paths. Use -X, --no-password and ON_ERROR_STOP=1, startup READ ONLY and explicit BEGIN READ ONLY/ROLLBACK. Do not launch that inspection as part of setup. Existing postgres is potentially write-capable; client READ ONLY does not turn it into a least-privilege account.

Live TLS verification is pending. Through a pooler, pg_stat_ssl may describe the pooler-to-database leg; it alone does not prove client-to-pooler certificate/hostname validation. Later collect libpq's client-side connection/TLS information with verify-full actually enforced, then session identity/read-only state before reviewed metadata queries. Any mismatch/permission/TLS failure means stop, no retries, weaker fallback or migration.

**Current decision:** GO for reviewing/performing these local setup steps. NO-GO for connection now. The agent created only this report and ignored non-secret templates, checked local tooling/public root-store availability and git ignore behavior. No credential creation/reset, production access, CA export, software installation, database/cloud connection, SQL, Docker changes, push or deployment. Offline template parsing and git diff --check are preparation checks, not evidence of TLS or managed DB readiness.

## Execution update: Secure Client Setup, 2026-11-02

The later Secure Client Setup request authorized installation/configuration without database access. See B2C2B-secure-client-setup-result.md for actual results. Client-only binaries, protected storage, password-free active profile and offline helpers now exist. Password and Dashboard CA remain user actions; no database connection is authorized in this setup turn.

Verified primary sources: PostgreSQL's Windows page links to EDB binary archives (https://www.postgresql.org/download/windows/). Official archive version selected: EDB 17.11-5 Windows x64. Supabase's psql guide specifically instructs downloading the public SSL CA from the project's Database Settings and using it with verify-full on the Session Pooler (https://supabase.com/docs/guides/database/psql). Prefer that Dashboard CA for this selected configuration; no Windows trust bundle was exported by the agent. The earlier offline OS-root option is not a claim that it contains Supabase's required CA.

PowerShell Set-Acl failed with audit-privilege requirements during setup. Native FileInfo/DirectoryInfo.SetAccessControl owner/DACL-only APIs succeeded. The instructions above now use those APIs and terminating error handling. Do not relax permissions or enable audit/global privileges to work around this.

B2C2C1 correction: startup options were removed from active/template profiles. Do not re-add default_transaction_read_only or issue SET SESSION/ALTER ROLE/ALTER DATABASE defaults on pooled connections. Use the reviewed B2C2C1 single explicit READ ONLY transaction with SET LOCAL timeouts/search_path and its in-transaction guard. Earlier startup-default/session-default suggestions are superseded. No cloud retry was executed during this correction.
