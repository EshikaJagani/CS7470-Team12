// supabase.js - made by Eshika
// saving the recordings to our supabase db so we dont have to collect csv files from everyone's phones manually

/* now what i did here:
- first created an org named MotionQuest-Team12
- then created a new project named MotionQuest and linked the project repo to it
- then created a bucket named recordings in which i further added a SQL query in SQL Editor
- csv file goes into the recordings storage bucket
- aannddd 1 row goes into the recordings table that has all the  whos n what labels n how longs n where the file is..
- the website uses the PUBLIC key which can only AAADDDDD stuff based on rls rules in docs/supabase-setup.sql
- so no one can read or delete our data with it
ref1: https://supabase.com/docs/reference/javascript/initializing
ref2: https://supabase.com/docs/reference/javascript/storage-from-upload
ref3: https://supabase.com/docs/reference/javascript/insert
ref4: https://supabase.com/docs/guides/database/postgres/row-level-security
*/

import { createClient } from '@supabase/supabase-js'

// these 2 will come from .env.local file which we have individually on our lappys n from repo variables on github never hardcoding them here!!!
// ref: https://vite.dev/guide/env-and-mode
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

// if any of them is missing then supabase will stay null n uploading is just switches off but the site will still work
export const supabase = url && key ? createClient(url, key) : null

// returns 'ok' or an error msg that the page can show
export async function uploadRecording(participant, label, seconds, csvText, rowCount) {
  if (!supabase) {
    return 'The database is not set up (VITE_SUPABASE_URL / VITE_SUPABASE_KEY are missing).'
  }

  // folders by person n label so its easy to find later: P01/tilt_left/1732140000000.csv
  const filePath = participant + '/' + label + '/' + Date.now() + '.csv'
  const file = new Blob([csvText], { type: 'text/csv' })

  // first file into the bucket
  const upload = await supabase.storage.from('recordings').upload(filePath, file)
  if (upload.error) {
    return 'File upload failed: ' + upload.error.message
  }

  // then row into the table saying where the file is
  const insert = await supabase.from('recordings').insert({
    participant_code: participant,
    label: label,
    seconds: seconds,
    row_count: rowCount,
    file_path: filePath,
  })
  if (insert.error) {
    return 'Saving the row failed: ' + insert.error.message
  }

  return 'ok'
}