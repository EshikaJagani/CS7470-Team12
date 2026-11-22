-- supabase setup - made by Eshika

-- what i did in Supabase:
-- first created an org named MotionQuest-Team12
-- then created a new project named MotionQuest and linked the project repo to it
-- then created a bucket in which i further added a SQL query in SQL Editor
-- and below is the query just for backup purpose
-- for setting up database, i took help of youtube videos and AI

-- 1 row per recording.. the csv file itself sits in the storage bucket n this row just says where
create table recordings (
  id bigint generated always as identity primary key,
  participant_code text not null, 
  label text not null, 
  seconds int,
  row_count int,
  file_path text not null, 
  created_at timestamptz default now()
);

-- rls = row level security.. the website can only ADD rows n files, not read/change/delete them
-- ref: https://supabase.com/docs/guides/database/postgres/row-level-security
alter table recordings enable row level security;

create policy "website can add recordings"
  on recordings for insert to anon with check (true);

-- ref: https://supabase.com/docs/guides/storage/security/access-control
create policy "website can upload recording files"
  on storage.objects for insert to anon with check (bucket_id = 'recordings');