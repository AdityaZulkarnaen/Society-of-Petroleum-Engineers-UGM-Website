-- Management period each pengurus account belongs to, e.g. '2025/2026'.
-- Set by the super admin when creating the account (Manajemen Akun).

alter table public.profiles
  add column period text
    check (period ~ '^\d{4}/\d{4}$');
