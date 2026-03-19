-- Add new columns to profiles table
alter table public.profiles 
add column if not exists dni text,
add column if not exists phone text,
add column if not exists date_of_birth date,
add column if not exists activity_type text check (activity_type in ('gym', 'pilates', 'mixed', 'trial')),
add column if not exists pilates_weekly_classes integer check (pilates_weekly_classes in (1, 2, 3)),
add column if not exists health_declaration_date timestamp with time zone;

comment on column public.profiles.dni is 'Documento Nacional de Identidad';
comment on column public.profiles.activity_type is 'Base activity type: gym, pilates, mixed, or trial';
comment on column public.profiles.pilates_weekly_classes is 'Weekly pilates classes (1, 2, or 3). Only used for pilates and mixed types.';
