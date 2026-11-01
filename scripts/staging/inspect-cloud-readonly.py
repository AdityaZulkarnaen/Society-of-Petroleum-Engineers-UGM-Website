"""Reviewed single-transaction inspection runner. No connection without --connect."""
from pathlib import Path
import os,json,hashlib,ssl,configparser,subprocess,time,argparse,sys
from datetime import datetime,timezone


def classify(returncode, stdout, stderr):
    lines=stdout.splitlines()
    failures=[x for x in lines if x.startswith('B2C2C1_FAILURE_')]
    guards=[i for i,x in enumerate(lines) if x=='B2C2C1_GUARD_PASS']
    completions=[i for i,x in enumerate(lines) if x=='B2C2C1_INSPECTION_COMPLETE']
    ok=(returncode==0 and not stderr.strip() and not failures and len(guards)==1
        and len(completions)==1 and guards[0]<completions[0])
    return {'success':ok,'native_exit_code':returncode,'failure_markers':failures,
            'guard_count':len(guards),'completion_count':len(completions),
            'stderr_present':bool(stderr.strip())}


def main():
    if not __debug__:
        raise RuntimeError('Optimized Python disables preflight assertions; refusing execution')
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare-only',action='store_true')
    mode.add_argument('--connect',action='store_true',help='Requires a separate explicit cloud retry approval')
    args=parser.parse_args()
    ROOT=Path(__file__).resolve().parents[2]
    PRIVATE=ROOT/'.env.staging.private'
    OUT=PRIVATE/'inspection-b2c2c1'
    assert not (OUT/'attempt.json').exists(), 'Prior connection attempt exists: no automatic retry'
    assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='feat/oprec-backend-staging'
    target=json.loads((ROOT/'docs/staging/B2C1-staging-target.example.json').read_text())
    assert target['project_reference']=='lavxddhrrwsjcshmnwvu' and target['organization_id']=='abnfnzzearslinsxnjcb'
    assert target['expected_api_origin']=='https://lavxddhrrwsjcshmnwvu.supabase.co'
    assert target['database_transport']=='session_pooler' and target['database_hostname']=='aws-0-ap-south-1.pooler.supabase.com'
    assert target['database_port']==5432 and target['database_username']=='postgres.lavxddhrrwsjcshmnwvu' and target['database_name']=='postgres'
    manifest=json.loads((ROOT/'docs/staging/B2C1-migration-manifest.json').read_text())
    assert len(manifest['migrations'])==17
    assert [p.name for p in sorted((ROOT/'supabase/migrations').glob('*.sql'))]==[Path(x['file']).name for x in manifest['migrations']]
    assert all(hashlib.sha256((ROOT/x['file']).read_bytes()).hexdigest()==x['sha256'] for x in manifest['migrations'])
    client=json.loads((ROOT/'.next/staging-postgres-client/client-verification.json').read_text())
    exe=PRIVATE/'client/postgresql-17.11-5/psql.exe'
    assert Path(client['client_path'])==exe
    assert hashlib.sha256(exe.read_bytes()).hexdigest()==client['psql_sha256']
    assert hashlib.sha256((exe.parent/'libpq.dll').read_bytes()).hexdigest()==client['libpq_sha256']
    ca=PRIVATE/'root-ca-bundle.pem'; raw=ca.read_bytes()
    assert hashlib.sha256(ssl.PEM_cert_to_DER_cert(raw.decode('ascii'))).hexdigest()=='807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa'
    ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT);ctx.load_verify_locations(cafile=str(ca)); cert=ctx.get_ca_certs()[0]
    assert ssl.cert_time_to_seconds(cert['notBefore'])<=time.time()<ssl.cert_time_to_seconds(cert['notAfter'])
    cfg=configparser.ConfigParser(interpolation=None,strict=True);cfg.read(PRIVATE/'pg_service.conf')
    expected={'host':target['database_hostname'],'port':'5432','dbname':'postgres','user':target['database_username'],'sslmode':'verify-full','sslrootcert':ca.as_posix(),'passfile':(PRIVATE/'pgpass.conf').as_posix(),'connect_timeout':'10','application_name':'spe-b2c-readonly','client_encoding':'UTF8'}
    assert cfg.sections()==['spe_ugm_staging_readonly'] and not cfg.defaults() and dict(cfg['spe_ugm_staging_readonly'])==expected
    assert (PRIVATE/'pgpass.conf').is_file() # metadata only: do not open/hash/parse password file
    sql=(ROOT/'docs/staging/B2C2C1-readonly-inspection.sql').read_bytes()
    assert hashlib.sha256(sql).hexdigest()=='fb1e82bd1a39258aea4cead1a7e708388eb8723b752247ea732924d4be8cf85d'
    env={k:v for k,v in os.environ.items() if k.upper() in ('SYSTEMROOT','WINDIR','TEMP','TMP','COMSPEC','PATHEXT')}
    env.update(PATH=str(exe.parent)+';'+os.environ['SYSTEMROOT']+'/System32',PGSERVICEFILE=str(PRIVATE/'pg_service.conf'),PGPASSFILE=str(PRIVATE/'pgpass.conf'),PGSERVICE='spe_ugm_staging_readonly',PGGSSENCMODE='disable')
    assert subprocess.run([str(exe),'--version'],env=env,capture_output=True,timeout=15).stdout.decode().strip()=='psql (PostgreSQL) 17.11'

    acl_env={k:v for k,v in env.items() if k in ('SYSTEMROOT','WINDIR','TEMP','TMP','COMSPEC','PATHEXT')}
    acl_env['SPE_PRIVATE_ROOT']=str(PRIVATE)
    acl_script=r"""
$ErrorActionPreference='Stop'
$uid=([Security.Principal.NTAccount]::new('RIZKI-LAPTOP','Lenovo')).Translate([Security.Principal.SecurityIdentifier])
$system=[Security.Principal.SecurityIdentifier]::new('S-1-5-18')
$root=Get-Item -LiteralPath $env:SPE_PRIVATE_ROOT
if(-not(Get-Acl -LiteralPath $root.FullName).AreAccessRulesProtected){throw 'Unprotected private root'}
foreach($item in @($root)+@(Get-ChildItem -LiteralPath $root.FullName -Recurse -Force)){
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unexpected private link'}
 $acl=Get-Acl -LiteralPath $item.FullName
 $owner=([Security.Principal.NTAccount]::new($acl.Owner)).Translate([Security.Principal.SecurityIdentifier])
 if($owner.Value -ne $uid.Value){throw 'Private owner mismatch'}
 $rules=@($acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]))
 if($rules.Count -eq 0){throw 'Empty ACL'}
 foreach($rule in $rules){if($rule.IdentityReference.Value -notin @($uid.Value,$system.Value) -or $rule.AccessControlType -ne 'Allow'){throw 'Private ACL mismatch'}}
}
"""
    acl=subprocess.run([os.environ['SYSTEMROOT']+'/System32/WindowsPowerShell/v1.0/powershell.exe','-NoProfile','-NonInteractive','-Command',acl_script],env=acl_env,capture_output=True,timeout=30)
    assert acl.returncode==0,'Private owner/ACL gate failed'
    assert all(subprocess.run(['git','check-ignore','--no-index','--',str(p.relative_to(ROOT))],cwd=ROOT,capture_output=True).returncode==0 for p in PRIVATE.rglob('*') if p.is_file()),'Private file not ignored'
    OUT.mkdir(exist_ok=True)
    (OUT/'reviewed-execution.sql').write_bytes(sql)
    (OUT/'prepared.json').write_text(json.dumps({'prepared_utc':datetime.now(timezone.utc).isoformat(),'project_reference':target['project_reference'],'sql_sha256':hashlib.sha256(sql).hexdigest(),'migration_hashes_matched':17,'private_acl':'PASS','no_session_transaction_default_option':True,'connect_authorized_by_this_preparation':False},indent=2))
    if args.prepare_only:
        print('LOCAL PREPARATION PASS; no SQL executed; no connection attempted')
        return 0
    # Explicit connect mode is for a later separately authorized retry only.
    with (OUT/'attempt.json').open('x') as f:
        json.dump({'started_utc':datetime.now(timezone.utc).isoformat(),'sql_sha256':hashlib.sha256(sql).hexdigest()},f)
    try:
        p=subprocess.run([str(exe),'-X','--no-password','--set=ON_ERROR_STOP=1','-qAt','--file=-'],input=sql,env=env,cwd=PRIVATE,capture_output=True,timeout=120)
        stdout=p.stdout;stderr=p.stderr;code=p.returncode
    except subprocess.TimeoutExpired as e:
        stdout=e.stdout or b'';stderr=e.stderr or b'';code='TIMEOUT'
    (OUT/'stdout.txt').write_bytes(stdout);(OUT/'stderr.txt').write_bytes(stderr)
    result=classify(code,stdout.decode(errors='replace'),stderr.decode(errors='replace'))
    result['automatic_retry']=False
    (OUT/'result.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
    return 0 if result['success'] else 1


if __name__=='__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        # Do not echo parser/driver errors that might contain private data.
        print('Inspection/preflight stopped: '+type(exc).__name__,file=sys.stderr)
        sys.exit(1)
