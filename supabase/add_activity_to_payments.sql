-- Add activity column to payments table
alter table payments 
add column if not exists activity text;

-- Optional: update existing payments to have a default activity if needed, or leave null
-- update payments set activity = 'unknown' where activity is null;
