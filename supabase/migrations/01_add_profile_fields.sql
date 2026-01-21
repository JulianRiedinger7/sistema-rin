-- Add new columns to profiles table
alter table public.profiles 
add column if not exists dni text,
add column if not exists phone text,
add column if not exists date_of_birth date,
add column if not exists activity_type text check (activity_type in ('gym', 'pilates', 'mixed')),
add column if not exists health_declaration_date timestamp with time zone;

-- Comment on columns
comment on column public.profiles.dni is 'Documento Nacional de Identidad';
comment on column public.profiles.activity_type is 'Type of activity contracted: gym, pilates, or mixed';
