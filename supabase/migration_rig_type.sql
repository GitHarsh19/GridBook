-- Add rig platform type column
-- Values: 'pc', 'playstation', 'xbox' (defaults to 'pc')

alter table rigs
  add column if not exists type text not null default 'pc'
    check (type in ('pc', 'playstation', 'xbox', 'vr'));
