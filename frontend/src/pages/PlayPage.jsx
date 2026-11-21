// PlayPage - game buttons made by Anish, phone controls added by Eshika
// cleaning Anish's code by adding proper indentations, comments and refs and adding controls for buttons after it.. - Eshika
// now the game can be played by tilting the phone OR with desktop buttons and both end up in the same doMove fn
import { useEffect, useRef, useState } from 'react'
import HorseScene from '../components/HorseScene.jsx'
import { askForSensorPermission, startSensors } from '../sensors.js'
import { MOVE_NAMES, STORY } from '../story.js'
import { HOLD_TIME, STEADY_TIME, calibrate, getTilt, isStill } from '../tilt.js'

/* main idea on how i am connecting the phone to the game:
- sensors.js gives almost 60 readings every sec and tilt.js tells which way the phone is tilted..
- but 1 reading is not enough to say "player tilted left".. what if it was just a wobble????
- so for left/right/jump the tilt has to stay for HOLD_TIME (0.5 sec) and only then it counts..
- steady = no tilt + gyro almost 0 for STEADY_TIME (1.5 sec).. 
- momentum = tip forward 3 times.. so counting every time it goes from not forward -> forward
- after every success ignoring the phone for 1 sec else the same tilt will get counted again for the next part lol
- and the desktop buttons and phone both call doMove so the game logic is written only once!!
*/

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

  // again useRef bcoz these change 60 times a sec n we dont want to redraw for each of them...
  // ref: https://react.dev/reference/react/useRef
  const stopSensorsRef = useRef(null)
  const calibrationReadingsRef = useRef([])
  // when the current tilt started (0 = not tilting rn)
  const tiltStartRef = useRef(0)
  // when the phone became still
  const stillStartRef = useRef(0)
  // the tilt in the prev reading (needed for counting momentum)
  const lastTiltRef = useRef('none')
  // how many forward tips so far
  const momentumCountRef = useRef(0)
  // short break after each success
  const pauseUntilRef = useRef(0)

  const isPlaying = partNumber >= 0 && partNumber < STORY.length
  const isFinished = partNumber === STORY.length
  const part = isPlaying ? STORY[partNumber] : null

  function startGame() {
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

  // called when the player does a move, with a button or with the phone (same fn for both!!)
  function doMove(move) {
    if (!isPlaying) return

    animateHorse(move)

    if (move === part.move) {
      setMessage(part.reward)
      setPartNumber(partNumber + 1)
    } else {
      setMessage('Not quite - try: ' + MOVE_NAMES[part.move])
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
    tiltStartRef.current = 0
    stillStartRef.current = 0
    momentumCountRef.current = 0
    // ignore the phone for 1 sec
    pauseUntilRef.current = time + 1000
    doMove(move)
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

      // the horse leans with the phone but not more than 20 deg else it looks like it will fall over looollll XDXDXDXD
      const sideways = reading.gamma - neutral.gamma
      setLean(Math.max(-20, Math.min(20, sideways)))

      if (!isPlaying) return
      if (reading.time < pauseUntilRef.current) return

      const wanted = part.move

      // left, right and jump: tilt the right way and HOLLLDDD it
      if (wanted === 'left' || wanted === 'right' || wanted === 'jump') {
        // jump is just tipping forward so mapping it to 'forward'
        const neededTilt = wanted === 'jump' ? 'forward' : wanted
        if (tilt === neededTilt) {
          // first reading of this tilt -> remember when it started
          if (tiltStartRef.current === 0) tiltStartRef.current = reading.time
          // held long enough -> it counts!!
          if (reading.time - tiltStartRef.current >= HOLD_TIME) {
            phoneMoveDone(wanted, reading.time)
          }
        } else {
          // tilt broke in between so start again from 0
          tiltStartRef.current = 0
        }
      }

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
          setMessage('Momentum ' + momentumCountRef.current + ' of 3')
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

  // stop the sensors when we leave this page (else battery drain again.....)
  useEffect(function () {
    return function () {
      if (stopSensorsRef.current) stopSensorsRef.current()
    }
  }, [])

  return (
    <div>
      <h2>Play</h2>

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

        {isFinished && <p className="success">You finished the ride! </p>}

        <p>{message}</p>

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
        <button onClick={() => doMove('left')} disabled={!isPlaying}>
          ← Left
        </button>
        <button onClick={() => doMove('right')} disabled={!isPlaying}>
          Right →
        </button>
        <button onClick={() => doMove('jump')} disabled={!isPlaying}>
          ↑ Jump
        </button>
        <button onClick={() => doMove('steady')} disabled={!isPlaying}>
          Stay steady
        </button>
        <button onClick={() => doMove('momentum')} disabled={!isPlaying}>
          Build momentum
        </button>
      </div>
    </div>
  )
}

export default PlayPage
