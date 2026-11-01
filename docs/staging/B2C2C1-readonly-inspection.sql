-- B2C2C1: REVIEWED LOCAL ONLY. Connect only after a separate explicit approval.
-- One psql invocation, one explicit transaction; no session-default changes.
\set ON_ERROR_STOP on
\set AUTOCOMMIT on
\conninfo
BEGIN TRANSACTION READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '15s';
SET LOCAL lock_timeout = '2s';
SET LOCAL idle_in_transaction_session_timeout = '30s';
SELECT json_build_object('database',current_database(),'current_user',current_user,
 'session_user',session_user,'server_version',current_setting('server_version'),
 'transaction_read_only',current_setting('transaction_read_only'),
 'default_transaction_read_only',current_setting('default_transaction_read_only'),
 'backend_address',inet_server_addr(),'backend_port',inet_server_port()) AS identity;
-- default_transaction_read_only is informational only; it may legitimately be off.
SELECT (current_database()='postgres' AND current_user='postgres' AND session_user='postgres'
 AND current_setting('transaction_read_only')='on'
 AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname=current_user)) AS guard_ok \gset
\if :guard_ok
\echo B2C2C1_GUARD_PASS
-- All inspection statements below remain in THIS guarded transaction.
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

-- Additional explicitly scoped catalog/data-presence inspection, same transaction.
SELECT e.extname,e.extversion,n.nspname AS extension_schema
FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY e.extname;
SELECT (to_regclass('auth.users') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL
 AND to_regclass('storage.buckets') IS NOT NULL) AS presence_shape_ok \gset
\if :presence_shape_ok
SELECT (has_table_privilege('auth.users','SELECT') AND has_table_privilege('storage.objects','SELECT')
 AND has_table_privilege('storage.buckets','SELECT')) AS presence_access_ok \gset
\if :presence_access_ok
SELECT json_build_object('has_auth_users',EXISTS(SELECT 1 FROM auth.users),
 'has_storage_objects',EXISTS(SELECT 1 FROM storage.objects),'buckets',
 (SELECT coalesce(json_agg(json_build_object('id',id,'public',public,'file_size_limit',file_size_limit,
 'allowed_mime_types',allowed_mime_types) ORDER BY id),'[]') FROM storage.buckets)) AS presence;
\else
\echo B2C2C1_FAILURE_PRESENCE_PERMISSION
ROLLBACK;
\quit
\endif
\else
\echo B2C2C1_FAILURE_PRESENCE_SHAPE
ROLLBACK;
\quit
\endif
SELECT (to_regclass('supabase_migrations.schema_migrations') IS NOT NULL) AS history_exists \gset
\if :history_exists
SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='supabase_migrations'
 AND table_name='schema_migrations' AND column_name='version') AS history_shape_ok \gset
\if :history_shape_ok
SELECT json_build_object('repository_migration_versions',coalesce(json_agg(version ORDER BY version),'[]'))
FROM supabase_migrations.schema_migrations;
\else
\echo B2C2C1_FAILURE_HISTORY_SHAPE
ROLLBACK;
\quit
\endif
\else
\echo B2C2C1_REPOSITORY_HISTORY_ABSENT
\endif
-- Confirm current mode again before ending the single transaction.
SELECT current_setting('transaction_read_only')='on' AS final_readonly_ok \gset
\if :final_readonly_ok
ROLLBACK;
\echo B2C2C1_INSPECTION_COMPLETE
\else
\echo B2C2C1_FAILURE_FINAL_READONLY
ROLLBACK;
\quit
\endif
\else
\echo B2C2C1_FAILURE_IDENTITY_OR_READONLY
ROLLBACK;
\quit
\endif
