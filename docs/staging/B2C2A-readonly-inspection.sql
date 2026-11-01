-- PREPARED ONLY. DO NOT EXECUTE until target and cloud READ-ONLY approval gates pass.
-- psql -X, ON_ERROR_STOP=1; reviewed private service profile, verified TLS.
-- No arbitrary function invocation, fixtures, DDL, migration bookkeeping or writes.
begin read only;
set local statement_timeout = '15s';
set local lock_timeout = '2s';
select session_user, current_user, current_database(), current_setting('server_version') as server_version,
       current_setting('transaction_read_only') as transaction_read_only,
       current_setting('default_transaction_read_only') as default_transaction_read_only,
       inet_server_addr() as server_address, inet_server_port() as server_port;
select ssl, version, cipher from pg_stat_ssl where pid = pg_backend_pid();
select rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls
from pg_roles where rolname in (session_user, current_user, 'postgres', 'anon', 'authenticated',
 'service_role', 'authenticator', 'supabase_admin', 'supabase_auth_admin', 'supabase_storage_admin') order by rolname;
select member.rolname as member, granted.rolname as granted_role, m.admin_option
from pg_auth_members m join pg_roles member on member.oid=m.member
join pg_roles granted on granted.oid=m.roleid
where member.rolname in (session_user, current_user, 'postgres', 'authenticator',
 'supabase_auth_admin', 'supabase_storage_admin') order by 1,2;
select nspname, pg_get_userbyid(nspowner) as owner, nspacl
from pg_namespace where nspname in ('public','auth','storage','extensions','supabase_migrations','supabase_functions') order by nspname;
select n.nspname as schema_name, c.relname, c.relkind, pg_get_userbyid(c.relowner) as owner,
 c.relrowsecurity, c.relforcerowsecurity, c.relacl
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' or (n.nspname='auth' and c.relname='users')
 or (n.nspname='storage' and c.relname in ('buckets','objects','migrations'))
 or n.nspname='supabase_migrations'
 or (n.nspname='supabase_functions' and c.relname='migrations')
order by n.nspname,c.relname;
select table_schema, table_name, column_name, data_type
from information_schema.columns
where table_schema='supabase_migrations' or (table_schema in ('auth','storage','supabase_functions')
 and table_name in ('schema_migrations','migrations')) order by 1,2,ordinal_position;
select pg_get_userbyid(d.defaclrole) as creator, n.nspname, d.defaclobjtype, d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace
where n.nspname='public' or d.defaclnamespace=0 order by 1,2,3;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','storage') order by 1,2,3;
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
 pg_get_userbyid(p.proowner) as owner, p.prosecdef, p.proconfig, p.proacl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' order by p.proname;
select to_regclass('auth.users') as auth_users, to_regprocedure('auth.uid()') as auth_uid,
 to_regprocedure('auth.jwt()') as auth_jwt, to_regprocedure('auth.role()') as auth_role,
 to_regprocedure('gen_random_uuid()') as uuid_function,
 to_regclass('storage.buckets') as buckets, to_regclass('storage.objects') as objects,
 to_regclass('supabase_migrations.schema_migrations') as repository_history;
select current_setting('session_preload_libraries',true) as session_preload,
 current_setting('supautils.policy_grants',true) as policy_grants,
 current_setting('supautils.privileged_role',true) as privileged_role;
select pubname, pg_get_userbyid(pubowner) as owner, puballtables from pg_publication order by pubname;
select pubname,schemaname,tablename from pg_publication_tables where pubname='supabase_realtime' order by 2,3;
rollback;
-- STOP to review metadata. No table data or history records are read by this file.
-- If unexpected application objects/history exist, do not advance to migration.
-- Scoped count/history queries listed in report need subsequent review and same read-only guards.
