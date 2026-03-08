-- Allow public read access (anon key)
alter table venues enable row level security;
alter table rigs enable row level security;

create policy "Public read venues" on venues for select using (true);
create policy "Public read rigs" on rigs for select using (true);
