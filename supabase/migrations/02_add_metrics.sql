-- Add weight and height to health_sheets
alter table public.health_sheets
add column if not exists weight numeric,
add column if not exists height numeric;

comment on column public.health_sheets.weight is 'Weight in kg';
comment on column public.health_sheets.height is 'Height in cm';
