// session.js - Eshika is making
// keeps track of WHO is playing like participant code and which feedback style they get like A or B for user study
// and then will save every finished game and questionnaire to db so we can analyse it later in python..

/* now what is the plan here:
- the participant code n feedback style are typed once on the Home page and then every page will use them
- will be saving them in localStorage so they dont get lost when we switch pages or refresh
ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- 1 row per finished game in the game_sessions table which has summary nos and all events as json
- 1 row per filled questionnaire in the questionnaires table
- both tables are made by supabase-phase2 query
*/

import { supabase } from './supabase.js'

// first who is playing
export function getParticipant() {
    return localStorage.getItem('mq_participant') || ''
}

export function setParticipant(code) {
    // P01 n p01 should be the same person so always uppercase n no spaces
    localStorage.setItem('mq_participant', code.trim().toUpperCase())
}

// no will do feedback style which is our A/B condition
// continuous means horse will lean live with the phone adn holding bar will fill up while we hold a tilt..
// now success_only means nothing will move untill the game recognizes our move and  then n only then success msg..
export function getFeedbackStyle() {
    return localStorage.getItem('mq_feedback') || 'continuous'
}
export function setFeedbackStyle(style) {
    localStorage.setItem('mq_feedback', style)
}

// now which kind of phone.. only the type, NO names or ids (again, we want to give privacy!!!)
// ref: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent
export function getDeviceType() {
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
    if (/Android/.test(ua)) return 'Android'
    return 'Desktop'
}

// now saving it all to supabase
// both will return ok or an err msg same as uploadRecording in supabase.js..
export async function saveGameSession(summary) {
    if (!supabase) {
        return 'The database is not set up, so this game was not saved.'
    }
    const result = await supabase.from('game_sessions').insert(summary)
    if (result.error) {
        return 'Saving the game failed: ' + result.error.message
    }
    return 'ok'
}
export async function saveQuestionnaire(answers) {
    if (!supabase) {
        return 'The database is not set up, so the answers were not saved.'
    }
    const result = await supabase.from('questionnaires').insert(answers)
    if (result.error) {
        return 'Saving the answers failed: ' + result.error.message
    }
    return 'ok'
}
