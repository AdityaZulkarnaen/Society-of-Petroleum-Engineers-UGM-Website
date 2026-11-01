# B2B.4A privileged DDL source inventory

Static source inventory, not execution evidence. Includes dynamic SQL and SECURITY DEFINER declarations; multiline statements are represented by their matching source lines. Read complete statements in the referenced migration. All 17 files reviewed in filename order.

## 20260917000000_admin_profiles.sql

SHA-256: `9215103d7c95934e0ca36031132a04ee4c0c8ca18997721ff70f76b2ed244f02`

```sql
12: create type public.admin_role as enum ('super_admin', 'admin');
14: create table public.profiles (
28: create unique index profiles_single_super_admin
32: create function public.touch_updated_at()
43: create trigger profiles_touch_updated_at
49: alter table public.profiles enable row level security;
51: -- security definer so the policy below can read profiles without recursing
53: create function public.is_super_admin()
57: security definer
68: revoke execute on function public.is_super_admin() from public, anon;
69: grant execute on function public.is_super_admin() to authenticated;
71: create policy "Admins can read their own profile"
77: create policy "Super admin can read every profile"
```

## 20260917010000_divisions.sql

SHA-256: `5010ced0b60bbebe4e90caca6616df32905979fba0625cc47858231229f324d5`

```sql
9: drop index if exists public.profiles_single_super_admin;
11: create table public.divisions (
24: alter table public.profiles
27: create index profiles_division_id_idx on public.profiles (division_id);
31: alter table public.divisions enable row level security;
33: create policy "Admins can read divisions"
39: -- security definer so policies on profiles can look up the caller's own
41: create function public.current_division_id()
45: security definer
53: revoke execute on function public.current_division_id() from public, anon;
54: grant execute on function public.current_division_id() to authenticated;
57: drop policy if exists "Super admin can read every profile" on public.profiles;
59: create policy "Super admins can read profiles in their division"
```

## 20260917020000_profile_details.sql

SHA-256: `7a023a83cf3e05c7ff4d07792b9520c40b75aa170babfaaa9bf0e733d850c29c`

```sql
3: alter table public.profiles
14: alter table public.divisions
18: -- and head come from this security definer function, scoped to the caller's
20: create function public.my_division_summary()
24: security definer
46: revoke execute on function public.my_division_summary() from public, anon;
47: grant execute on function public.my_division_summary() to authenticated;
```

## 20260918000000_elections.sql

SHA-256: `fc6a86a09012984b857f0cc17afe0a33bb07464bd46427e8c05b39501f95f267`

```sql
9: create table public.elections (
22: create table public.election_candidates (
37: create table public.election_votes (
45: create index election_votes_candidate_id_idx on public.election_votes (candidate_id);
49: alter table public.elections enable row level security;
50: alter table public.election_candidates enable row level security;
51: alter table public.election_votes enable row level security;
53: create policy "Admins can read elections"
59: create policy "Admins can read candidates"
66: create policy "Admins can read their own vote"
74: create function public.cast_vote(p_candidate_id uuid)
77: security definer
109: revoke execute on function public.cast_vote(uuid) from public, anon;
110: grant execute on function public.cast_vote(uuid) to authenticated;
113: create function public.election_turnout(p_election_id uuid)
117: security definer
125: revoke execute on function public.election_turnout(uuid) from public, anon;
126: grant execute on function public.election_turnout(uuid) to authenticated;
```

## 20260919000000_super_admin_dashboard.sql

SHA-256: `ad07f38d7a6c1a0026cb4f4c0bb457cfabf9c776be945801c09620812508e002`

```sql
8: alter table public.profiles
12: -- (auth.users isn't readable from the client, hence security definer).
13: create function public.super_admin_summary()
21: security definer
35: revoke execute on function public.super_admin_summary() from public, anon;
36: grant execute on function public.super_admin_summary() to authenticated;
40: create or replace function public.cast_vote(p_candidate_id uuid)
43: security definer
81: create or replace function public.election_turnout(p_election_id uuid)
85: security definer
```

## 20260919010000_account_period.sql

SHA-256: `0b0e89cbf7b8a620dfd8fb3ff6e93600fe0eac2d00e33b066f26983992f9f69f`

```sql
4: alter table public.profiles
```

## 20260919020000_rekap.sql

SHA-256: `1dc20a3db61b8fe0ce39452c7b2891d1363137d767f4364844fa608384c43dd7`

```sql
5: create table public.rekap (
22: create table public.rekap_competencies (
41: alter table public.rekap enable row level security;
42: alter table public.rekap_competencies enable row level security;
44: -- security definer so the policies can check the profile's division without
46: create function public.manages_profile(p_profile_id uuid)
50: security definer
62: revoke execute on function public.manages_profile(uuid) from public, anon;
63: grant execute on function public.manages_profile(uuid) to authenticated;
65: create policy "Pengurus read their own rekap; super admins their division's"
74: create policy "Pengurus read their own competencies; super admins their division's"
90: create function public.save_rekap(
99: security definer
160: revoke execute on function public.save_rekap(uuid, text, jsonb, jsonb, jsonb) from public, anon;
161: grant execute on function public.save_rekap(uuid, text, jsonb, jsonb, jsonb) to authenticated;
```

## 20260919030000_proker.sql

SHA-256: `c270893aed3f25dd62cf99a5d600f9830e29fea565b60f968e4200fce20ef4bd`

```sql
9: create table public.proker (
24: create index proker_division_id_idx on public.proker (division_id);
26: create trigger proker_touch_updated_at
30: create table public.proker_members (
38: create index proker_members_profile_id_idx on public.proker_members (profile_id);
42: alter table public.proker enable row level security;
43: alter table public.proker_members enable row level security;
45: create policy "Admins can read proker"
51: create policy "Pengurus read their own roles; super admins every role"
64: create function public.list_pengurus()
68: security definer
80: revoke execute on function public.list_pengurus() from public, anon;
81: grant execute on function public.list_pengurus() to authenticated;
88: create function public.save_proker(
99: security definer
151: revoke execute on function public.save_proker(uuid, text, text, date, date, text, jsonb) from public, anon;
152: grant execute on function public.save_proker(uuid, text, text, date, date, text, jsonb) to authenticated;
154: create function public.delete_proker(p_id uuid)
157: security definer
171: revoke execute on function public.delete_proker(uuid) from public, anon;
172: grant execute on function public.delete_proker(uuid) to authenticated;
```

## 20260919040000_division_overview.sql

SHA-256: `16273a484d708b12bcad1976bfc6c4b9cf7815968bd0e54ea5205db7a59e2278`

```sql
21: -- their own division's profiles, hence security definer; only these
23: create function public.division_overview()
33: security definer
67: revoke execute on function public.division_overview() from public, anon;
68: grant execute on function public.division_overview() to authenticated;
```

## 20260919050000_election_admin.sql

SHA-256: `6c42bbbd49e8f2a6615948b8e0f2d2e0f44023a3a34988101d9e78bfe54693cd`

```sql
8: alter table public.election_candidates
17: create function public.save_election(
26: security definer
56: revoke execute on function public.save_election(uuid, text, text, date, date) from public, anon;
57: grant execute on function public.save_election(uuid, text, text, date, date) to authenticated;
61: create function public.voting_started(p_election_id uuid)
65: security definer
74: revoke execute on function public.voting_started(uuid) from public, anon;
75: grant execute on function public.voting_started(uuid) to authenticated;
78: create function public.save_candidate(
92: security definer
143: revoke execute on function public.save_candidate(uuid, uuid, text, text, text, text, text, text[], text[], text) from public, anon;
144: grant execute on function public.save_candidate(uuid, uuid, text, text, text, text, text, text[], text[], text) to authenticated;
148: create function public.delete_candidate(p_id uuid)
151: security definer
184: revoke execute on function public.delete_candidate(uuid) from public, anon;
185: grant execute on function public.delete_candidate(uuid) to authenticated;
190: create function public.election_results(p_election_id uuid)
194: security definer
207: revoke execute on function public.election_results(uuid) from public, anon;
208: grant execute on function public.election_results(uuid) to authenticated;
```

## 20260919060000_voting_controls.sql

SHA-256: `d24673afe9bd956cd3b235cf290522ff976c6ffc29fbbcad2817b11834b23c3f`

```sql
6: alter table public.elections
9: create or replace function public.cast_vote(p_candidate_id uuid)
12: security definer
51: create function public.set_election_open(p_id uuid, p_open boolean)
54: security definer
68: revoke execute on function public.set_election_open(uuid, boolean) from public, anon;
69: grant execute on function public.set_election_open(uuid, boolean) to authenticated;
72: create function public.delete_election(p_id uuid)
75: security definer
89: revoke execute on function public.delete_election(uuid) from public, anon;
90: grant execute on function public.delete_election(uuid) to authenticated;
94: create or replace function public.election_results(p_election_id uuid)
98: security definer
```

## 20260919070000_candidate_photos.sql

SHA-256: `8c6d37c9b5238fa20d98952d57e9c78f20aa3f972698636ea280b58df472e623`

```sql
7: insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
17: create policy "Super admins upload candidate photos"
23: create policy "Super admins replace candidate photos"
29: create policy "Super admins remove candidate photos"
```

## 20260922000000_meetings.sql

SHA-256: `f3692f3d71749110078ef0d018d6d55ccc8815942c9f27c94cddc716b220af49`

```sql
13: -- security definer functions below, which is why neither table has an insert,
16: create table public.meetings (
42: create unique index meetings_division_sequence_idx
46: create unique index meetings_gabungan_sequence_idx
50: create index meetings_scheduled_at_idx on public.meetings (scheduled_at desc);
52: create trigger meetings_touch_updated_at
56: create table public.meeting_attendance (
78: alter table public.meetings enable row level security;
79: alter table public.meeting_attendance enable row level security;
81: create policy "Admins can read the meetings they attend"
90: create policy "Admins can read their own attendance"
97: create policy "Super admins can read attendance of their meetings"
119: create function public.is_meeting_participant(p_meeting_id uuid, p_profile_id uuid)
123: security definer
135: revoke execute on function public.is_meeting_participant(uuid, uuid) from public, anon;
140: create function public.meeting_attendance_list(p_meeting_id uuid)
155: security definer
180: revoke execute on function public.meeting_attendance_list(uuid) from public, anon;
181: grant execute on function public.meeting_attendance_list(uuid) to authenticated;
185: create function public.meeting_overview()
204: security definer
239: revoke execute on function public.meeting_overview() from public, anon;
240: grant execute on function public.meeting_overview() to authenticated;
244: create function public.my_meetings()
261: security definer
288: revoke execute on function public.my_meetings() from public, anon;
289: grant execute on function public.my_meetings() to authenticated;
294: create function public.save_meeting(
306: security definer
350: revoke execute on function public.save_meeting(uuid, text, text, smallint, timestamptz, text, text, smallint) from public, anon;
351: grant execute on function public.save_meeting(uuid, text, text, smallint, timestamptz, text, text, smallint) to authenticated;
355: create function public.set_meeting_open(p_id uuid, p_open boolean)
358: security definer
391: revoke execute on function public.set_meeting_open(uuid, boolean) from public, anon;
392: grant execute on function public.set_meeting_open(uuid, boolean) to authenticated;
394: create function public.delete_meeting(p_id uuid)
397: security definer
411: revoke execute on function public.delete_meeting(uuid) from public, anon;
412: grant execute on function public.delete_meeting(uuid) to authenticated;
418: create function public.record_attendance(
425: security definer
468: revoke execute on function public.record_attendance(uuid, uuid, text) from public, anon, authenticated;
469: grant execute on function public.record_attendance(uuid, uuid, text) to service_role;
473: create function public.set_attendance(
481: security definer
520: revoke execute on function public.set_attendance(uuid, uuid, text, text) from public, anon;
521: grant execute on function public.set_attendance(uuid, uuid, text, text) to authenticated;
530:   alter publication supabase_realtime add table public.meeting_attendance;
```

## 20260922010000_division_overview_service_role.sql

SHA-256: `7a61ed34380c3dd79a2747734cfb14a75a3fabfcaec3433ee08b274f41772eff`

```sql
8: create or replace function public.division_overview()
18: security definer
51: revoke execute on function public.division_overview() from public, anon, authenticated;
52: grant execute on function public.division_overview() to service_role;
```

## 20260930000000_update_competencies.sql

SHA-256: `c204470e0c8d5b3e68d9b13185b1ae30f864f8455d053c5a4edd162814696e84`

```sql
9: alter table public.rekap_competencies
33: alter table public.rekap_competencies
51: alter table public.rekap_competencies
75: alter table public.rekap_competencies
79: alter table public.rekap_competencies
82: alter table public.rekap_competencies
86: alter table public.rekap_competencies
90: alter table public.rekap_competencies
98: alter table public.rekap_competencies
105: create or replace function public.save_rekap(
114: security definer
```

## 20261101000000_recruitment_schema.sql

SHA-256: `132063eae3b54e196753092404ede8bfc6d0f2538956c2c5ca631b949bca287d`

```sql
5: create table public.recruitment_periods (
23: create table public.recruitment_options (
42: create table public.recruitment_document_requirements (
53: create table public.recruitment_applications (
82: create index recruitment_applications_queue_idx
85: create table public.recruitment_preferences (
99: create index recruitment_preferences_option_idx
102: create table public.recruitment_documents (
120: create index recruitment_documents_period_idx on public.recruitment_documents(period_id, application_id);
123: create table public.recruitment_audit (
138: create index recruitment_audit_period_idx on public.recruitment_audit(period_id, occurred_at);
141: create function public.recruitment_config_guard()
142: returns trigger language plpgsql security definer set search_path = '' as $$
155: create trigger recruitment_options_guard before insert or update or delete on public.recruitment_options
157: create trigger recruitment_requirements_guard before insert or update or delete on public.recruitment_document_requirements
160: create function public.recruitment_period_guard()
161: returns trigger language plpgsql security definer set search_path = '' as $$
189: create trigger recruitment_period_guard before insert or update or delete on public.recruitment_periods
193: create function public.recruitment_child_guard()
194: returns trigger language plpgsql security definer set search_path = '' as $$
207: create trigger recruitment_preferences_guard before insert or update or delete on public.recruitment_preferences
209: create trigger recruitment_documents_guard before insert or update or delete on public.recruitment_documents
212: create function public.recruitment_application_guard()
213: returns trigger language plpgsql security definer set search_path = '' as $$
277: create trigger recruitment_application_guard before insert or update on public.recruitment_applications
280: -- Close default-grant exposure before this file commits, even if the next
288:     execute format('alter table public.%I enable row level security', t);
289:     execute format('revoke all on table public.%I from public, anon, authenticated', t);
293: revoke all on function public.recruitment_config_guard() from public, anon, authenticated;
294: revoke all on function public.recruitment_period_guard() from public, anon, authenticated;
295: revoke all on function public.recruitment_child_guard() from public, anon, authenticated;
296: revoke all on function public.recruitment_application_guard() from public, anon, authenticated;
```

## 20261101010000_recruitment_security.sql

SHA-256: `f4ac72d19c1e8de12a6c7382f57ee0b35a77f43cb2056e0b8c060c0cbe503765`

```sql
5: create function public.recruitment_allowed(p_period uuid, p_permission text)
6: returns boolean language sql stable security definer set search_path = '' as $$
12: revoke all on function public.recruitment_allowed(uuid, text) from public, anon, authenticated;
13: grant execute on function public.recruitment_allowed(uuid, text) to authenticated;
22:     execute format('alter table public.%I enable row level security', t);
23:     execute format('revoke all on table public.%I from public, anon, authenticated', t);
25:       execute format('grant select, insert, update, delete on table public.%I to service_role', t);
27:       execute format('revoke all on table public.%I from service_role', t);
34: grant select (id, code, label, config_version, approved_at, is_open, opens_at, closes_at, batches)
36: grant select on public.recruitment_options, public.recruitment_document_requirements to anon, authenticated;
37: create policy recruitment_periods_published on public.recruitment_periods
39: create policy recruitment_options_published on public.recruitment_options
42: create policy recruitment_requirements_published on public.recruitment_document_requirements
47: grant select (id, period_id, full_name, nim, birth_place, birth_date, email,
50: grant select on public.recruitment_preferences, public.recruitment_documents to authenticated;
51: create policy recruitment_applications_review on public.recruitment_applications
53: create policy recruitment_preferences_review on public.recruitment_preferences
56: create policy recruitment_documents_review on public.recruitment_documents
60: create function public.recruitment_review(p_application uuid, p_status text, p_note text default null)
61: returns void language plpgsql security definer set search_path = '' as $$
80: revoke all on function public.recruitment_review(uuid, text, text) from public, anon, authenticated;
81: grant execute on function public.recruitment_review(uuid, text, text) to authenticated;
85: create function public.recruitment_export(p_period uuid, p_after uuid default null, p_limit integer default 100)
86: returns table (application jsonb) language plpgsql security definer set search_path = '' as $$
105: revoke all on function public.recruitment_export(uuid, uuid, integer) from public, anon, authenticated;
106: grant execute on function public.recruitment_export(uuid, uuid, integer) to authenticated;
110: create function public.recruitment_finalize(p_application uuid, p_key uuid, p_hash text)
111: returns uuid language plpgsql security definer set search_path = '' as $$
129: revoke all on function public.recruitment_finalize(uuid, uuid, text) from public, anon, authenticated;
130: grant execute on function public.recruitment_finalize(uuid, uuid, text) to service_role;
132: create function public.recruitment_write_audit()
133: returns trigger language plpgsql security definer set search_path = '' as $$
146: revoke all on function public.recruitment_write_audit() from public, anon, authenticated;
147: create trigger recruitment_write_audit after update on public.recruitment_applications
152: create function public.recruitment_document_access(p_document uuid)
154: language plpgsql security definer set search_path = '' as $$
166: revoke all on function public.recruitment_document_access(uuid) from public, anon, authenticated;
167: grant execute on function public.recruitment_document_access(uuid) to authenticated;
170: revoke all on function public.recruitment_config_guard() from public, anon, authenticated;
171: revoke all on function public.recruitment_period_guard() from public, anon, authenticated;
172: revoke all on function public.recruitment_child_guard() from public, anon, authenticated;
173: revoke all on function public.recruitment_application_guard() from public, anon, authenticated;
176: insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
183: create policy recruitment_no_direct_objects on storage.objects as restrictive
187: create policy recruitment_no_direct_bucket on storage.buckets as restrictive
```

