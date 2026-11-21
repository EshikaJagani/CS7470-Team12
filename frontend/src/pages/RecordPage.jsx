// RecordPage - made by Eshika
// now recording sensor data for our OOOWWWNNNN dataset which we will getin colelecting from ourselves as well as our friends and family
// this is basically phyphox but inside our website so every recording comes in the exact same format

/* now here how i am thinking to do this:
- pick a participant code (P01, P02... NEEVVVEERRRR real names, privacy!!!), a label n how long
- press start -> collect every reading into a list for that many seconds
- then download it as csv and thennn upload to supabase..
- time starts from 0 for every recording so all files look the same and phyphox also does this..
labels are from our data collection plan in the proposal
*/
import { useEffect, useRef, useState } from 'react'
import { downloadCsv, makeCsv } from '../csv.js'
import { askForSensorPermission, startSensors } from '../sensors.js'

// what we can record.. 7 gestures, none, pocket activities, placements
const LABELS = [
  'tilt_left',
  'tilt_right',
  'tip_forward',
  'tip_back',
  'shake',
  'flick',
  'twist',
  'jump',
  'none',
  'walk',
  'jog',
  'upstairs',
  'downstairs',
  'still_stand',
  'still_sit',
  'placement_hand',
  'placement_pocket',
  'placement_table',
]

function RecordPage() {
  const [participant, setParticipant] = useState('P01')
  const [label, setLabel] = useState('tilt_left')
  const [seconds, setSeconds] = useState(30)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [rowCount, setRowCount] = useState(0)
  const [message, setMessage] = useState('Choose a label and press Start.')

  // all readings of this recording.. ref bcoz pushing 60 times a sec into state would redraw like crazy
  const readingsRef = useRef([])
  const stopSensorsRef = useRef(null)
  const timerRef = useRef(null)

  async function startRecording() {
    // no empty code allowed
    if (participant.trim() === '') {
      setMessage('Please type a participant code like P01 (not your real name).')
      return
    }

    const answer = await askForSensorPermission()
    if (answer !== 'granted') {
      setMessage('Could not turn on sensors: ' + answer)
      return
    }

    readingsRef.current = []
    setRowCount(0)
    setIsRecording(true)
    setSecondsLeft(seconds)
    setMessage('Recording ' + label + '...')

    // making time start at 0 for every recording
    // first reading's time will become the start n every reading's time = its time - start again same as phyphox relative time
    let startTime = null
    stopSensorsRef.current = startSensors(function (reading) {
      if (startTime === null) startTime = reading.time
      reading.time = Math.round(reading.time - startTime)
      readingsRef.current.push(reading)
    })

    // aanndd countdown once every sec so the person knows how much is left
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
    let left = seconds
    timerRef.current = setInterval(function () {
      left = left - 1
      setSecondsLeft(left)
      if (left <= 0) {
        stopRecording()
      }
    }, 1000)
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    if (stopSensorsRef.current) stopSensorsRef.current()
    setIsRecording(false)
    setRowCount(readingsRef.current.length)
    // 30 sec at ~60 Hz should be ~1800 rows.. if it will be way too less then sampling rate will low on that phone (write it down!!!)
    setMessage('Done! Recorded ' + readingsRef.current.length + ' readings.')
  }

  function download() {
    const csvText = makeCsv(readingsRef.current)
    // Date.now() at the end so 3 sets of the same label dont overwrite each other
    const fileName = participant + '_' + label + '_' + Date.now() + '.csv'
    downloadCsv(fileName, csvText)
  }

  // if we leave the page while recording, stopping everything
  useEffect(function () {
    return function () {
      clearInterval(timerRef.current)
      if (stopSensorsRef.current) stopSensorsRef.current()
    }
  }, [])

  return (
    <div>
      <h2>Record</h2>

      <div className="card">
        <p>
          Participant code:{' '}
          <input value={participant} onChange={(e) => setParticipant(e.target.value)} disabled={isRecording} />
        </p>

        <p>
          What are you recording?{' '}
          <select value={label} onChange={(e) => setLabel(e.target.value)} disabled={isRecording}>
            {LABELS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </p>

        <p>
          How long?{' '}
          <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={isRecording}>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={120}>120 seconds</option>
          </select>
        </p>

        {!isRecording && <button onClick={startRecording}>Start</button>}
        {isRecording && <button onClick={stopRecording}>Stop early</button>}

        {isRecording && <p className="big-number">{secondsLeft}</p>}
        <p>{message}</p>
      </div>

      {!isRecording && rowCount > 0 && (
        <div className="card">
          <h3>Save this recording</h3>
          <button onClick={download}>Download CSV</button>
        </div>
      )}
    </div>
  )
}

export default RecordPage