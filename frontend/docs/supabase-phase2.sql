-- now i am adding 2 new tables for the user study:
-- 1 row per finished game n 1 row per questionnaire
-- i have added this query to supabase sql editor but for a backup adding it here in docs

-- 1 row per finished game (hand mode or pocket mode)
/*
here we wanna cover these many things:
- S01 like codes will be for study players and P01 like codes will be for us... and no real names!!!
- pocket-hadn modes, phone or button controls, cont or success only feedback, device type, 
- duration, sec for each part, some false triggers, wrongly pressed buttons, steps in case of pocket mode, 
- avg delay for pocket mode for the server to answer, events in order
*/
create table game_sessions (
  id bigint generated always as identity primary key,
  participant_code text not null,
  mode text, 
  controls text,
  feedback text,
  device text,
  total_seconds real,
  part_seconds jsonb,
  false_triggers int,
  wrong_buttons int,
  steps int,
  avg_delay_ms real,
  events jsonb,
  created_at timestamptz default now()
);

-- 1 row per filled questionnaire (SUS + NASA-TLX)
/*
now here we wanna cover these things:
- which style they played with, pocket or hand mode, sus ans 10, 1-5, sus score 0-100 n high means easy to play, 
- tlx ans 6, 0-100, tlx score 0-100 n high means more workload
*/
create table questionnaires (
  id bigint generated always as identity primary key,
  participant_code text not null,
  feedback text,
  mode text,
  sus_answers jsonb,
  sus_score real,
  tlx_answers jsonb,
  tlx_score real,
  comment text,
  created_at timestamptz default now()
);

-- same rules as recordings: the website can only add rows n not read change or delete them..
-- ref: https://supabase.com/docs/guides/database/postgres/row-level-security
alter table game_sessions enable row level security;
alter table questionnaires enable row level security;

create policy "website can add game sessions"
  on game_sessions for insert to anon with check (true);

create policy "website can add questionnaires"
  on questionnaires for insert to anon with check (true);

-- only needed if "grant API access to new tables automatically" was OFF when the project was made
grant insert on game_sessions to anon;
grant insert on questionnaires to anon;
