-- Drop the restrictive foreign key
alter table progress_logs
drop constraint progress_logs_workout_item_id_fkey;

-- Re-add with ON DELETE SET NULL
alter table progress_logs
add constraint progress_logs_workout_item_id_fkey
foreign key (workout_item_id)
references workout_items(id)
on delete set null;
