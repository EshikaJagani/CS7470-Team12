// SensorsPage - made by Eshika
// uploading the original unclean version with refs
// shows live nos from all the sensors plus how many reading will come every sec just like sampling rate like task 1
import { useEffect, useRef, useState } from 'react'
import { askForSensorPermission, startSensors } from '../sensors.js'

// just to show numbers with 1 digit after dot like 9.8 else its too long to read on phone..
function show(num) {
  return num.toFixed(1)
}

function SensorsPage() {
  const [isOn, setIsOn] = useState(false)
  const [message, setMessage] = useState('Sensors are off.')
  const [reading, setReading] = useState(null)
  const [readingsPerSecond, setReadingsPerSecond] = useState(0)

  // useRef is like a box that keeps the value but doesnt redraw the page when it changes..
  // ref: https://react.dev/reference/react/useRef
  // using it for the stop fn and for counting readings bcoz counting 60 times a sec with useState will redraw 60 times for no reason
  const stopSensorsRef = useRef(null)
  const countRef = useRef(0)

  async function turnOnSensors() {
    // this has to be called directly from the button click ((iphone rule from sensors.js)
    const answer = await askForSensorPermission()

    // showing a diff msg for each case so the user knows what to do..
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

    // every new reading -> show it + add 1 to the counter
    stopSensorsRef.current = startSensors(function (newReading) {
      setReading(newReading)
      countRef.current = countRef.current + 1
    })
  }

  // this will run only once when page will open; empty [] at the end
  // ref: https://react.dev/reference/react/useEffect
  useEffect(function () {
    // every 1 sec: whatever the counter reached is the readings per sec thats Hz then reset to 0 n count again...
    // same idea as avg sampling rate in task 1 but live
    const timer = setInterval(function () {
      setReadingsPerSecond(countRef.current)
      countRef.current = 0
    }, 1000)

    // this returned fn will run when we leave the page
    // stopping the timer and sensors else they will keep running in background and eat up a lot of battery :()
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
            beta (front-back): {show(reading.beta)}, gamma (left-right): {show(reading.gamma)}, alpha:{' '}
            {show(reading.alpha)}
          </p>

          <h3>Acceleration with gravity (m/s²)</h3>
          <p>
            x: {show(reading.ax)}, y: {show(reading.ay)}, z: {show(reading.az)}
          </p>

          <h3>Acceleration without gravity (m/s²)</h3>
          <p>
            x: {show(reading.lx)}, y: {show(reading.ly)}, z: {show(reading.lz)}
          </p>

          <h3>Rotation speed (degrees per second)</h3>
          <p>
            x: {show(reading.gx)}, y: {show(reading.gy)}, z: {show(reading.gz)}
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