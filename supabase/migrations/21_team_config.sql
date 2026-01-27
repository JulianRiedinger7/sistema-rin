-- Add config column to teams table
alter table teams 
add column if not exists config jsonb default '{"cmj": {"regular": 10, "bad": 15}}'::jsonb;

-- Update existing teams to have the default config
update teams set config = '{"cmj": {"regular": 10, "bad": 15}}'::jsonb where config is null;
