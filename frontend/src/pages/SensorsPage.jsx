import { useEffect, useRef, useState } from 'react'
import { askForSensorPermission, startSensors } from '../sensors.js'

// this func will show a number with 1 digit after the dot, like 9.8
function show(number) {
  return number.toFixed(1)
}

function SensorsPage() {
  const [isOn, setIsOn] = useState(false)
  const [message, setMessage] = useState('Sensors are off.')
  const [reading, setReading] = useState(null)
  const [readingsPerSecond, setReadingsPerSecond] = useState(0)

  // useRef = a box that will keep a value without redrawing the page
  const stopSensorsRef = useRef(null)
  const countRef = useRef(0)

  async function turnOnSensors() {
    const answer = await askForSensorPermission()

    if (answer === 'needs-https') {
      setMessage('Sensors need an https:// address. Open the GitHub Pages link or the tunnel link.')
      return
    }
    if (answer === 'not-supported') {
      setMessage('This browser has no motion sensors. Try a phone.')
      return
    }
    if (answer === 'denied') {
      setMessage('Permission was denied. On iPhone, clear the website data in Settings and try again.')
      return
    }

    setIsOn(true)
    setMessage('Sensors are on. Move your phone! (If nothing changes, this device has no sensors.)')

    stopSensorsRef.current = startSensors(function (newReading) {
      setReading(newReading)
      countRef.current = countRef.current + 1
    })
  }

  // this will run once when the page will opne
  useEffect(function () {
    // every second it will show how many readings came in, then start counting again
    const timer = setInterval(function () {
      setReadingsPerSecond(countRef.current)
      countRef.current = 0
    }, 1000)

    // this will run when we leave the page: stop the timer and the sensors
    return function () {
      clearInterval(timer)
      if (stopSensorsRef.current) {
        stopSensorsRef.current()
      }
    }
  }, [])

  return (
    <div>
      <h2>Sensors</h2>

      <div className="card">
        <button onClick={turnOnSensors} disabled={isOn}>
          Turn on sensors
        </button>
        <p>{message}</p>
        <p>
          Readings per second: <b>{readingsPerSecond}</b>
        </p>
      </div>

      {reading && (
        <div className="card">
          <h3>Tilt (degrees)</h3>
          <p>
            beta (front-back): {show(reading.beta)} · gamma (left-right): {show(reading.gamma)} · alpha:{' '}
            {show(reading.alpha)}
          </p>

          <h3>Acceleration with gravity (m/s²)</h3>
          <p>
            x: {show(reading.ax)} · y: {show(reading.ay)} · z: {show(reading.az)}
          </p>

          <h3>Acceleration without gravity (m/s²)</h3>
          <p>
            x: {show(reading.lx)} · y: {show(reading.ly)} · z: {show(reading.lz)}
          </p>

          <h3>Rotation speed (degrees per second)</h3>
          <p>
            x: {show(reading.gx)} · y: {show(reading.gy)} · z: {show(reading.gz)}
          </p>

          <p>
            <b>Flat test:</b> put the phone flat on a table, screen up. z with gravity should be about 9.8 (some
            phones show -9.8 - write down which one yours shows).
          </p>
        </div>
      )}
    </div>
  )
}

export default SensorsPage











// commenting out this placeholder code and adding new one

// function SensorsPage() {
//   return (
//     <div>
//       <h2>Sensors</h2>
//       <p>Live sensor numbers will go here.</p>
//     </div>
//   )
// }

// export default SensorsPage