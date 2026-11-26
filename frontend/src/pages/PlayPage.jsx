// PlayPage - game buttons made by Anish, phone controls added by Eshika
// cleaning Anish's code by adding proper indentations, comments and refs and adding controls for buttons after it.. - Eshika
// now the game can be played by tilting the phone OR with desktop buttons and both end up in the same doMove fn

// phase 2: added the 2 feedback styles (A/B for the user study), false trigger counting n saving every game to supabase

import { useEffect, useRef, useState } from 'react'
import HorseScene from '../components/HorseScene.jsx'
import { askForSensorPermission, startSensors } from '../sensors.js'
import { MOVE_NAMES, STORY } from '../story.js'
import { HOLD_TIME, STEADY_TIME, calibrate, getTilt, isStill } from '../tilt.js'
import { getDeviceType, getFeedbackStyle, getParticipant, saveGameSession } from '../session.js'

/* main idea on how i am connecting the phone to the game:
- sensors.js gives almost 60 readings every sec and tilt.js tells which way the phone is tilted..
- but 1 reading is not enough to say "player tilted left".. what if it was just a wobble????
- so for left/right/jump the tilt has to stay for HOLD_TIME (0.5 sec) and only then it counts..
- steady = no tilt + gyro almost 0 for STEADY_TIME (1.5 sec).. 
- momentum = tip forward 3 times.. so counting every time it goes from not forward -> forward
- after every success ignoring the phone for 1 sec else the same tilt will get counted again for the next part lol
- and the desktop buttons and phone both call doMove so the game logic is written only once!!

phase 2 changes:
- any held tilt now "fires" once.. if its the move the game wanted then success n if not then false trigger
- this is the Midas Touch nos.. when our game captures moves that the player didnt mean r all false triggers
- feedback style A 'continuous' = horse leans live + hold bar fills up while holding a tilt
- feedback style B 'success_only' = nothing moves untill the move is recognized, then only the success msg
- will b timing every part n logging every event so the dashboard n the python analysis can have real nos

this page was super complex from the very beginning, so here i used help from AI for organizing my thoughts, 
troubleshooting eahc n every err i got and help with testing each n every part of it.. 
this code might contain some unused or junk code too bcoz i did a lot of trial n err and added new stuff removed few stuff etc etc
*/

// rounding to 1 digit after dot so the db doesnt get 4.199999999
function round1(num) {
  return Math.round(num * 10) / 10
}


function PlayPage() {
  // which part of the story we are on: -1 = not started, 6 = finished
  const [partNumber, setPartNumber] = useState(-1)
  const [message, setMessage] = useState('Press Start to begin the ride.')
  const [lean, setLean] = useState(0)
  const [jumping, setJumping] = useState(false)

  // phone sensor things
  const [sensorsOn, setSensorsOn] = useState(false)
  // newest sensor reading
  const [reading, setReading] = useState(null)
  // result of calibration (player's own neutral angles)
  const [neutral, setNeutral] = useState(null)
  const [calibrating, setCalibrating] = useState(false)
  // 0 to 1, how full the hold bar is n this will be shown in feedback A only
  const [holdProgress, setHoldProgress] = useState(0)

  // the finished game summary this will be shown at the end n saved to supabase
  const [result, setResult] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')

  // these were set on the Home page
  const feedback = getFeedbackStyle()
  const participant = getParticipant()



  // again useRef bcoz these change 60 times a sec n we dont want to redraw for each of them...
  // ref: https://react.dev/reference/react/useRef
  const stopSensorsRef = useRef(null)
  const calibrationReadingsRef = useRef([])
  // the tilt we are holding rn, since when, n did it already fire once
  const heldTiltRef = useRef('none')
  const heldSinceRef = useRef(0)
  const firedRef = useRef(false)
  // when the phone became still
  const stillStartRef = useRef(0)
  // the tilt in the prev reading (needed for counting momentum)
  const lastTiltRef = useRef('none')
  // how many forward tips so far
  const momentumCountRef = useRef(0)
  // short break after each success
  const pauseUntilRef = useRef(0)

  // phase 2: things we measure for the dashboard n user study
  const gameStartRef = useRef(0)
  const partStartRef = useRef(0)
  const partTimesRef = useRef([])
  const falseTriggersRef = useRef(0)
  const wrongButtonsRef = useRef(0)
  const eventsRef = useRef([])
  const usedPhoneRef = useRef(false)


  const isPlaying = partNumber >= 0 && partNumber < STORY.length
  const isFinished = partNumber === STORY.length
  const part = isPlaying ? STORY[partNumber] : null

  // writing down everything that happens with the time since starts like a game log
  // ref: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
  function logEvent(type, details) {
    const seconds = round1((performance.now() - gameStartRef.current) / 1000)
    eventsRef.current.push({ t: seconds, type: type, ...details })
  }


  function startGame() {
    // resetting all the counters for a fresh game
    gameStartRef.current = performance.now()
    partStartRef.current = performance.now()
    partTimesRef.current = []
    falseTriggersRef.current = 0
    wrongButtonsRef.current = 0
    eventsRef.current = []
    usedPhoneRef.current = false
    setResult(null)
    setSaveMessage('')
    logEvent('start', { feedback: feedback })
    setPartNumber(0)
    setMessage('Go!')
  }

  // makes the horse lean or jump for a short time
  function animateHorse(move) {
    if (move === 'left') setLean(-15)
    if (move === 'right') setLean(15)
    if (move === 'jump' || move === 'momentum') setJumping(true)

    // after 0.6 sec put the horse back to normal
    setTimeout(function () {
      setLean(0)
      setJumping(false)
    }, 600)
  }

  // for game over making the summary, showing it n saving it
  function finishGame() {
    const summary = {
      participant_code: participant || 'NONE',
      mode: 'hand',
      controls: usedPhoneRef.current ? 'phone' : 'buttons',
      feedback: feedback,
      device: getDeviceType(),
      total_seconds: round1((performance.now() - gameStartRef.current) / 1000),
      part_seconds: partTimesRef.current,
      false_triggers: falseTriggersRef.current,
      wrong_buttons: wrongButtonsRef.current,
      steps: null,
      avg_delay_ms: null,
      events: eventsRef.current,
    }
    setResult(summary)
    setSaveMessage('Saving...')
    saveGameSession(summary).then(function (answer) {
      setSaveMessage(answer === 'ok' ? 'Saved to the database' : answer)
    })
  }


  // called when the player does a move, with a button or with the phone (same fn for both!!)
  // adding source which can be phone or button
  function doMove(move, source) {
    if (!isPlaying) return
    if (source === 'phone') usedPhoneRef.current = true

    if (move === part.move) {
      animateHorse(move)
      // how long this part took
      const seconds = round1((performance.now() - partStartRef.current) / 1000)
      partTimesRef.current.push(seconds)
      partStartRef.current = performance.now()
      logEvent('success', { part: partNumber + 1, move: move, source: source, seconds: seconds })

      setMessage(part.reward)
      const next = partNumber + 1
      setPartNumber(next)
      if (next === STORY.length) finishGame()
      return
    }

    // wrong move..
    logEvent('wrong', { part: partNumber + 1, move: move, source: source })
    if (source === 'button') {
      wrongButtonsRef.current = wrongButtonsRef.current + 1
      animateHorse(move)
      setMessage('Not quite - try: ' + MOVE_NAMES[part.move])
    } else {
      // the phone saw a move the player didnt mean = false trigger
      falseTriggersRef.current = falseTriggersRef.current + 1
      // in feedback B we stay quiet n only success gets feedback
      if (feedback === 'continuous') {
        animateHorse(move)
        setMessage('Not quite - try: ' + MOVE_NAMES[part.move])
      }
    }
  }


  // phone sensors

  async function turnOnSensors() {
    // same as sensors page it has to be from the button click for iphone..
    const answer = await askForSensorPermission()
    if (answer !== 'granted') {
      setMessage('Could not turn on sensors: ' + answer + '. Open the Sensors page for help.')
      return
    }
    setSensorsOn(true)
    setMessage('Sensors on. Now hold the phone normally and press Calibrate.')
    stopSensorsRef.current = startSensors(function (newReading) {
      setReading(newReading)
    })
  }

  function startCalibration() {
    calibrationReadingsRef.current = []
    setCalibrating(true)
    setMessage('Hold the phone still in front of you...')

    // collecting readings for 2 sec and then taking the avg in calibrate()
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
    setTimeout(function () {
      setCalibrating(false)
      const readings = calibrationReadingsRef.current
      // at 60 Hz 2 sec should give almost 120 readings.. if less than 10 then sensors are not really working lets say on laptop..
      if (readings.length < 10) {
        setMessage('No sensor data came in. Is this a phone?')
        return
      }
      setNeutral(calibrate(readings))
      setMessage('Calibrated! Press Start.')
    }, 2000)
  }

  // a phone move was finished so resetting all the counters and telling the game
  function phoneMoveDone(move, time) {
    stillStartRef.current = 0
    momentumCountRef.current = 0
    // ignore the phone for 1 sec
    pauseUntilRef.current = time + 1000
    doMove(move, 'phone')
  }

  // a tilt was held for HOLD_TIME.. is it the right one?
  function handleHeldTilt(tilt, time) {
    const wanted = part.move
    // during momentum the player tips forward on purpose so held tilts dont count there
    if (wanted === 'momentum') return
    // tipping forward = jump in our game
    const move = tilt === 'forward' ? 'jump' : tilt
    if (move === wanted) {
      phoneMoveDone(move, time)
    } else {
      doMove(move, 'phone')
    }
  }


  // this willl run every time a new sensor reading arrives..
  // ref: https://react.dev/reference/react/useEffect
  useEffect(
    function () {
      if (!reading) return

      // while calibrating just collecting the readings, nothing else..
      if (calibrating) {
        calibrationReadingsRef.current.push(reading)
        return
      }

      if (!neutral) return

      const tilt = getTilt(reading, neutral)

      // feedback A: the horse leans with the phone but not more than 20 deg
      if (feedback === 'continuous') {
        const sideways = reading.gamma - neutral.gamma
        setLean(Math.max(-20, Math.min(20, sideways)))
      }

      if (!isPlaying) return
      if (reading.time < pauseUntilRef.current) {
        // during the break whatever tilt is held is marked as "already fired"
        // so the player has to come back to neutral first.. else the tilt from the last move fires again after the break
        heldTiltRef.current = tilt
        firedRef.current = true
        setHoldProgress(0)
        return
      }

      // keeping track of the tilt we are holding
      if (tilt !== heldTiltRef.current) {
        heldTiltRef.current = tilt
        heldSinceRef.current = reading.time
        firedRef.current = false
      }
      const heldFor = reading.time - heldSinceRef.current

      // hold bar for feedback A
      if (tilt !== 'none' && !firedRef.current) {
        setHoldProgress(Math.min(1, heldFor / HOLD_TIME))
      } else {
        setHoldProgress(0)
      }

      // held long enough -> it fires ONCE (it wont fire again untill the tilt changes)
      if (tilt !== 'none' && !firedRef.current && heldFor >= HOLD_TIME) {
        firedRef.current = true
        handleHeldTilt(tilt, reading.time)
      }
      const wanted = part.move

      // steady: no tilt n no rotation for a while (same holding idea as above)
      if (wanted === 'steady') {
        if (tilt === 'none' && isStill(reading)) {
          if (stillStartRef.current === 0) stillStartRef.current = reading.time
          if (reading.time - stillStartRef.current >= STEADY_TIME) {
            phoneMoveDone('steady', reading.time)
          }
        } else {
          stillStartRef.current = 0
        }
      }

      // momentum: counting every NEW tip forward, 3 tips = done
      // "new" means last reading was not forward n this one is.. else holding forward will count 60 times a sec
      if (wanted === 'momentum') {
        if (tilt === 'forward' && lastTiltRef.current !== 'forward') {
          momentumCountRef.current = momentumCountRef.current + 1
          if (feedback === 'continuous') {
            setMessage('Momentum ' + momentumCountRef.current + ' of 3')
          }
          if (momentumCountRef.current >= 3) {
            phoneMoveDone('momentum', reading.time)
          }
        }
      }

      lastTiltRef.current = tilt
    },
    // only want this to run when a new reading arrives (on purpose) so the line below turns off that lint warning
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [reading],
  )

  // stop the sensors when we leave this page (else battery drain again..)
  useEffect(function () {
    return function () {
      if (stopSensorsRef.current) stopSensorsRef.current()
    }
  }, [])

return (
    <div>
      <h2>Play</h2>
      <p>
        Player: <b>{participant || 'not set (go to Home)'}</b> · Feedback:{' '}
        <b>{feedback === 'continuous' ? 'A - continuous' : 'B - success only'}</b>
      </p>

      <div className="card">
        <HorseScene lean={lean} jumping={jumping} />
        {part && (
          <div>
            <p>
              <b>
                Part {partNumber + 1} of {STORY.length} · {part.place}
              </b>
            </p>
            <p>{part.text}</p>
            <p>
              Do this: <b>{MOVE_NAMES[part.move]}</b>
            </p>
          </div>
        )}

        {feedback === 'continuous' && isPlaying && neutral && (
          <div className="hold-bar">
            <div className="hold-fill" style={{ width: holdProgress * 100 + '%' }}></div>
          </div>
        )}

        <p>{message}</p>

        {isFinished && result && (
          <div>
            <p className="success">You finished the ride in {result.total_seconds} seconds!</p>
            <p>
              False triggers: {result.false_triggers}; Wrong buttons: {result.wrong_buttons}
            </p>
            <p>{saveMessage}</p>
          </div>
        )}

        {!isPlaying && <button onClick={startGame}>{isFinished ? 'Play again' : 'Start'}</button>}
      </div>

      <div className="card">
        <h3>Play with your phone</h3>
        <button onClick={turnOnSensors} disabled={sensorsOn}>
          Turn on sensors
        </button>
        <button onClick={startCalibration} disabled={!sensorsOn || calibrating}>
          Calibrate
        </button>
        {neutral && <p className="success">Calibrated ✓</p>}
      </div>

      <div className="card">
        <h3>Desktop controls</h3>
        <p>No phone? Use these buttons instead.</p>
        <button onClick={() => doMove('left', 'button')} disabled={!isPlaying}>
          ← Left
        </button>
        <button onClick={() => doMove('right', 'button')} disabled={!isPlaying}>
          Right →
        </button>
        <button onClick={() => doMove('jump', 'button')} disabled={!isPlaying}>
          ↑ Jump
        </button>
        <button onClick={() => doMove('steady', 'button')} disabled={!isPlaying}>
          Stay steady
        </button>
        <button onClick={() => doMove('momentum', 'button')} disabled={!isPlaying}>
          Build momentum
        </button>
      </div>
    </div>
  )
}

export default PlayPage
