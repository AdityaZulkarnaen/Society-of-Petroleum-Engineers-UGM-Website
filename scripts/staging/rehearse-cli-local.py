"""B2C3B: operate ONLY on a new local project; never load cloud credentials."""
from pathlib import Path
import os,json,subprocess,secrets,base64,hmac,hashlib,time,shutil,argparse,socket

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'.env.staging.private/b2c3b-rehearsal'
PROJECT='spe-ugm-recruitment-b2c3b-rehearsal'
PORT=55472
BIN=Path('C:/Users/Lenovo/AppData/Local/Programs/DockerDesktop/resources')
ENV={k:v for k,v in os.environ.items() if k.upper() in ('SYSTEMROOT','WINDIR','PATH','TEMP','TMP','COMSPEC','PATHEXT','USERPROFILE','LOCALAPPDATA','APPDATA')}
ENV.update(DOCKER_HOST='npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONFIG=str(WORK/'docker-config'))
DOCKER=[str(BIN/'bin/docker.exe'),'--config',ENV['DOCKER_CONFIG'],'--host',ENV['DOCKER_HOST']]
COMPOSE=[str(BIN/'cli-plugins/docker-compose.exe'),'--project-name',PROJECT,'--project-directory',str(WORK),'--env-file',str(WORK/'local-only.env'),'--file',str(WORK/'compose.local.json')]
CLI=Path(json.loads((ROOT/'.next/b2c3a-source-review/cli-toolchain.json').read_text())['exe_path'])
MANIFEST=json.loads((ROOT/'docs/staging/B2C1-migration-manifest.json').read_text())

def run(cmd,data=None,timeout=60):
    p=subprocess.run(cmd,input=data,env=ENV,cwd=ROOT,capture_output=True,timeout=timeout)
    if p.returncode: raise RuntimeError('local command failed; diagnostics retained privately where applicable')
    return p.stdout

def docker(*args):return run(DOCKER+list(args))

def inventory():
    ids=docker('ps','-aq').decode().split()
    fmt='{"id":{{json .Id}},"name":{{json .Name}},"state":{{json .State.Status}},"started":{{json .State.StartedAt}},"image_id":{{json .Image}},"ports":{{json .NetworkSettings.Ports}},"networks":{{json .NetworkSettings.Networks}},"labels":{{json .Config.Labels}},"health":{{json .State.Health.Status}}}'
    # Health is absent on unrelated containers: a template conditional is required.
    fmt=fmt.replace('{{json .State.Health.Status}}','{{with (index .State "Health")}}{{json .Status}}{{else}}null{{end}}')
    return [json.loads(s) for s in docker('inspect','--format',fmt,*ids).decode().splitlines()]

def target_rows():
    rows=[r for r in inventory() if (r['labels'] or {}).get('com.docker.compose.project')==PROJECT]
    assert len(rows)==4
    for r in rows:
        assert set(r['networks'])=={PROJECT+'_isolated'}
        for bindings in r['ports'].values():
            for b in bindings or []:
                assert b['HostIp']=='127.0.0.1' and b['HostPort']==str(PORT),'Unsafe publication'
    return rows

def dbid():
    return next(r['id'] for r in target_rows() if r['labels']['com.docker.compose.service']=='db')

def psql(sql,db='postgres',role='postgres',check=True):
    assert db in ('postgres','template1','gap01','gap15','gap16','gap17')
    p=subprocess.run(DOCKER+['exec','-i','--user','postgres',dbid(),'psql','-X','--no-password','-v','ON_ERROR_STOP=1','-qAt','-U',role,'-d',db,'-f','-'],input=sql.encode() if isinstance(sql,str) else sql,env=ENV,capture_output=True,timeout=120)
    if check and p.returncode:
        (WORK/'last-local-sql-error.txt').write_bytes(p.stderr)
        raise RuntimeError('Local rehearsal SQL failed; see private diagnostic')
    return p

def credentials():return dict(line.split('=',1) for line in (WORK/'local-only.env').read_text().splitlines() if line and not line.startswith('#'))

def packet(name,files):
    p=WORK/name;assert not p.exists();(p/'supabase/migrations').mkdir(parents=True)
    (p/'supabase/config.toml').write_text('project_id = "spe-b2c3b-local"\n[db.migrations]\nenabled = true\n[db.seed]\nenabled = false\n')
    for x in files:
        data=(ROOT/x['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==x['sha256']
        (p/'supabase/migrations'/Path(x['file']).name).write_bytes(data)
    return p

def cli(name,packet_path,db='postgres',dry=False):
    assert db in ('postgres','gap01','gap15','gap16','gap17')
    rows=target_rows();d=next(x for x in rows if x['labels']['com.docker.compose.service']=='db')
    assert d['state']=='running' and d['ports'].get('5432/tcp')==[{'HostIp':'127.0.0.1','HostPort':str(PORT)}]
    svc=WORK/(name+'.service');svc.write_text('[local_rehearsal]\nhost=127.0.0.1\nport='+str(PORT)+'\ndbname='+db+'\nuser=postgres\nsslmode=disable\npassfile='+(WORK/'local.pgpass').as_posix()+'\nconnect_timeout=10\n')
    env=dict(ENV);env.update(PGSERVICEFILE=str(svc),PGPASSFILE=str(WORK/'local.pgpass'),PGSERVICE='local_rehearsal',SUPABASE_HOME=str(WORK/'cli-home'),SUPABASE_NO_KEYRING='true',SUPABASE_TELEMETRY_DISABLED='true',DO_NOT_TRACK='1',OTEL_SDK_DISABLED='true',SUPABASE_API_URL='http://127.0.0.1:9',HTTP_PROXY='http://127.0.0.1:9',HTTPS_PROXY='http://127.0.0.1:9',ALL_PROXY='http://127.0.0.1:9',NO_PROXY='localhost,127.0.0.1')
    cmd=[str(CLI),'--workdir',str(packet_path),'db','push','--db-url','service=local_rehearsal','--skip-vault']
    if dry:cmd+=['--dry-run']
    # Confirmation is restricted to this preverified brand-new localhost target.
    p=subprocess.run(cmd,input=b'y\n',env=env,capture_output=True,timeout=240)
    (WORK/(name+'.stdout')).write_bytes(p.stdout);(WORK/(name+'.stderr')).write_bytes(p.stderr)
    print(name,'CLI exit',p.returncode,flush=True)
    return p

def prepare():
    assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='feat/oprec-backend-staging'
    assert not (WORK/'compose.local.json').exists()
    assert all(hashlib.sha256((ROOT/x['file']).read_bytes()).hexdigest()==x['sha256'] for x in MANIFEST['migrations'])
    assert hashlib.sha256(CLI.read_bytes()).hexdigest()==json.loads((ROOT/'.next/b2c3a-source-review/cli-toolchain.json').read_text())['sha256']
    before=inventory();assert not any((x['labels'] or {}).get('com.docker.compose.project')==PROJECT for x in before)
    assert PROJECT not in docker('network','ls','--format','{{.Name}}').decode()
    assert PROJECT not in docker('volume','ls','--format','{{.Name}}').decode()
    (WORK/'docker-before.json').write_text(json.dumps(before,indent=2))
    for k in ('C:/','D:/'):assert shutil.disk_usage(k).free>10*2**30
    (WORK/'docker-config').mkdir(exist_ok=True)
    password=secrets.token_hex(32);jwt_secret=secrets.token_hex(32)
    def token(role):
        def b64(b):return base64.urlsafe_b64encode(b).rstrip(b'=')
        data=b'.'.join(b64(json.dumps(v,separators=(',',':')).encode()) for v in [{'alg':'HS256','typ':'JWT'},{'role':role,'iss':'local-rehearsal','iat':int(time.time()),'exp':int(time.time())+86400}])
        return (data+b'.'+b64(hmac.new(jwt_secret.encode(),data,hashlib.sha256).digest())).decode()
    vals={'POSTGRES_PASSWORD':password,'JWT_SECRET':jwt_secret,'ANON_KEY':token('anon'),'SERVICE_ROLE_KEY':token('service_role'),'LOCAL_S3_ACCESS_KEY':secrets.token_hex(16),'LOCAL_S3_SECRET_KEY':secrets.token_hex(32)}
    (WORK/'local-only.env').write_text('\n'.join(k+'='+v for k,v in vals.items())+'\n')
    (WORK/'local.pgpass').write_text('\n'.join('127.0.0.1:'+str(PORT)+':'+db+':postgres:'+password for db in ['postgres','gap15','gap16','gap17'])+'\n')
    old=ROOT/'.next/supabase-b2b3-compose';cfg=json.loads((old/'compose.local.yaml').read_text());cfg['name']=PROJECT
    cfg['networks']['isolated']={'driver':'bridge','internal':False,'enable_ipv6':False,'driver_opts':{'com.docker.network.bridge.host_binding_ipv4':'127.0.0.1'}}
    for name,s in cfg['services'].items():
        assert not s.get('privileged') and 'network_mode' not in s
        assert s['pull_policy']=='never'
        image_id=docker('image','inspect','--format','{{.Id}}',s['image']).decode().strip();assert image_id.startswith('sha256:')
        s['labels']={'spe.scope':'b2c3b-disposable-local-rehearsal'}
    cfg['services']['db']['ports']=[{'target':5432,'published':str(PORT),'host_ip':'127.0.0.1','protocol':'tcp'}]
    for name in ['auth','rest','storage']:assert not cfg['services'][name].get('ports')
    shutil.copytree(old/'bootstrap',WORK/'bootstrap')
    (WORK/'compose.local.json').write_text(json.dumps(cfg,indent=2))
    effective=json.loads(run(COMPOSE+['config','--format','json']))
    assert set(effective['services'])=={'db','auth','rest','storage'}
    for name,s in effective['services'].items():
        assert not s.get('privileged') and s.get('network_mode') is None
        for p in s.get('ports',[]):assert name=='db' and p['host_ip']=='127.0.0.1' and str(p['published'])==str(PORT)
    packet('all17',MANIFEST['migrations'])
    print('Local packet/config/images/unique-resource gates PASS. Newly generated LOCAL-only secrets not printed.',flush=True)

def start():
    assert not (WORK/'started.json').exists()
    run(COMPOSE+['create','--pull','never'],timeout=120)
    rows=target_rows();assert all(r['state']=='created' for r in rows)
    p=subprocess.Popen(COMPOSE+['start','--wait','--wait-timeout','240'],env=ENV,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        while p.poll() is None:
            assert shutil.disk_usage('C:/').free>10*2**30
            target_rows() # immediately reject unexpected published addresses
            time.sleep(1)
        stdout,stderr=p.communicate()
        (WORK/'startup.stdout').write_bytes(stdout);(WORK/'startup.stderr').write_bytes(stderr)
        assert p.returncode==0
        rows=target_rows();assert all(x['state']=='running' and x['health']=='healthy' for x in rows)
        db=next(x for x in rows if x['labels']['com.docker.compose.service']=='db')
        assert db['ports'].get('5432/tcp')==[{'HostIp':'127.0.0.1','HostPort':str(PORT)}]
        (WORK/'started.json').write_text(json.dumps(rows,indent=2))
        print('Four NEW services healthy; effective DB port exactly 127.0.0.1:'+str(PORT),flush=True)
    except BaseException:
        # Only newly created rehearsal project may be stopped on safety failure.
        run(COMPOSE+['stop'],timeout=60)
        raise

def success():
    assert not (WORK/'positive-result.json').exists()
    fresh=json.loads(psql("begin read only;select json_build_object('db',current_database(),'public_tables',(select count(*) from pg_tables where schemaname='public'),'history',to_regclass('supabase_migrations.schema_migrations'),'users',(select count(*) from auth.users),'objects',(select count(*) from storage.objects));rollback;").stdout)
    assert fresh['db']=='postgres' and fresh['public_tables']==fresh['users']==fresh['objects']==0 and fresh['history'] is None
    # Preserve fresh LOCAL platform baseline for additional NEW databases only.
    dump=run(DOCKER+['exec','--user','postgres',dbid(),'pg_dump','-U','supabase_admin','-d','postgres'],timeout=120)
    (WORK/'platform-baseline.sql').write_bytes(dump)
    dry=cli('dry-run',WORK/'all17',dry=True);assert dry.returncode==0
    noledger=psql("begin read only;select to_regclass('supabase_migrations.schema_migrations') is null;rollback;").stdout.strip();assert noledger==b't'
    positive=cli('all17-apply',WORK/'all17');assert positive.returncode==0
    observed=json.loads(psql("begin read only;select json_build_object('versions',(select json_agg(version order by version) from supabase_migrations.schema_migrations),'recruitment_tables',(select count(*) from pg_tables where schemaname='public' and tablename like 'recruitment_%'),'private_bucket',(select not public from storage.buckets where id='recruitment-documents'));rollback;").stdout)
    assert observed['versions']==[Path(x['file']).name.split('_',1)[0] for x in MANIFEST['migrations']]
    assert observed['recruitment_tables']==7 and observed['private_bucket'] is True
    observed['dry_run_left_ledger_absent']=True
    (WORK/'positive-result.json').write_text(json.dumps(observed,indent=2))
    print('LOCAL CLI 17/17 versions recorded; seven recruitment tables; private bucket; dry-run did not create ledger.',flush=True)

def gap(n):
    assert n in (1,15,16,17);db='gap01' if n==1 else 'gap'+str(n);assert not (WORK/(db+'-result.json')).exists()
    # This is a brand-new database on the NEW rehearsal container only.
    psql('CREATE DATABASE '+db+' OWNER postgres TEMPLATE template0;',db='template1')
    dump=(WORK/'platform-baseline.sql').read_bytes()
    # pg_dump expects to manage the public schema; a fresh DB's empty default public is removed only here.
    if b'CREATE SCHEMA public;' in dump:psql('DROP SCHEMA public;',db=db,role='supabase_admin')
    psql(dump,db=db,role='supabase_admin')
    version=Path(MANIFEST['migrations'][n-1]['file']).name.split('_',1)[0]
    fault="CREATE SCHEMA supabase_migrations;CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY,name text,statements text[]);CREATE FUNCTION supabase_migrations.fail_selected_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.version='"+version+"' THEN RAISE EXCEPTION 'local_rehearsal_injected_history_failure'; END IF; RETURN NEW; END $$;CREATE TRIGGER injected_history_failure BEFORE INSERT ON supabase_migrations.schema_migrations FOR EACH ROW EXECUTE FUNCTION supabase_migrations.fail_selected_history();"
    psql(fault,db=db)
    result=cli(db,WORK/'all17',db=db);assert result.returncode!=0
    after=json.loads(psql("begin read only;select json_build_object('versions',(select coalesce(json_agg(version order by version),'[]') from supabase_migrations.schema_migrations),'rating_column_exists',exists(select 1 from information_schema.columns where table_schema='public' and table_name='rekap_competencies' and column_name='rating'),'recruitment_table',to_regclass('public.recruitment_applications'),'private_bucket',exists(select 1 from storage.buckets where id='recruitment-documents'),'enum_type',to_regtype('public.admin_role'),'profile_table',to_regclass('public.profiles'));rollback;",db=db).stdout)
    expected=[Path(x['file']).name.split('_',1)[0] for x in MANIFEST['migrations'][:n-1]]
    assert after['versions']==expected
    assert not after['rating_column_exists']
    if n>=16:assert after['recruitment_table'] is not None
    if n==17:assert after['private_bucket']
    assert b'local_rehearsal_injected_history_failure' in result.stderr+result.stdout
    if n==1:assert after['enum_type'] is None and after['profile_table'] is None
    after.update(injected_failure_version=version,native_cli_exit=result.returncode,committed_body_missing_history=n>=15,body_rolled_back=n==1,automatic_retry=False)
    (WORK/(db+'-result.json')).write_text(json.dumps(after,indent=2))
    print(db,'EXPECTED failure: '+('body AND ledger rolled back' if n==1 else 'body committed; history missing')+'; no repair/retry.',flush=True)

def preserve():
    before=json.loads((WORK/'docker-before.json').read_text());after=inventory()
    ids={x['id'] for x in before};old=[x for x in after if x['id'] in ids]
    assert sorted(old,key=lambda x:x['id'])==sorted(before,key=lambda x:x['id'])
    (WORK/'preservation.json').write_text(json.dumps({'existing_containers_unchanged':True,'existing_container_count':len(ids),'C_free_GiB':round(shutil.disk_usage('C:/').free/2**30,2),'D_free_GiB':round(shutil.disk_usage('D:/').free/2**30,2)},indent=2))
    print('All existing container metadata unchanged; no existing services reset/stopped/modified.',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['prepare','start','success','gap01','gap15','gap16','gap17','preserve','stop-new']);a=parser.parse_args()
    try:
        if a.stage=='prepare':prepare()
        elif a.stage=='start':start()
        elif a.stage=='success':success()
        elif a.stage.startswith('gap'):gap(int(a.stage[3:]))
        elif a.stage=='preserve':preserve()
        elif a.stage=='stop-new':run(COMPOSE+['stop'],timeout=60);preserve()
    except Exception as e:
        import traceback
        (WORK/'stage-error.txt').write_text(traceback.format_exc())
        print('LOCAL rehearsal stopped:',type(e).__name__,flush=True)
        raise SystemExit(1)
