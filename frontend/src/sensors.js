// Everything about reading the phone's motion sensors - Eshika

// step 1: we need to ask for permission
// iphones show a popup for this and it only works if it runs right after a button tap
// it will give back one word: 'granted', 'denied', 'needs-https' or 'not-supported'
export async function askForSensorPermission() {
  // phones only share their sensors with https:// pages
  if (!window.isSecureContext) {
    return 'needs-https'
  }

  // some browsers have no motion sensors at all
  if (typeof DeviceMotionEvent === 'undefined') {
    return 'not-supported'
  }

  // iphones only show the "Allow Motion & Orientation access" popup
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const answers = await Promise.all([
        DeviceMotionEvent.requestPermission(),
        DeviceOrientationEvent.requestPermission(),
      ])
      if (answers[0] !== 'granted' || answers[1] !== 'granted') {
        return 'denied'
      }
    } catch {
      return 'denied'
    }
  }

  // android phones dont ask and sensors work anyways
  return 'granted'
}
// --------------------------------------------
// step 2: start listening to the sensors
// onReading(reading) gets called about 60 times every second
// it will give back a function we call to stop listening
export function startSensors(onReading) {
  // the newest numbers from the sensors
  const reading = {
    time: 0,

    // tilt angles in degrees (orientation sensor)
    // beta for front n back tilting
    // gamma for left n right tilting
    // alpha for turning around like a compass
    beta: 0,
    gamma: 0,
    alpha: 0,

    // accel with g, in m/s^2 (accelerometer)
    ax: 0,
    ay: 0,
    az: 0,

    // accel w/o g = only the phone's own movement, in m/s^2
    lx: 0,
    ly: 0,
    lz: 0,

    // how fast the phone will be rotating, in degrees per second (gyroscope)
    gx: 0,
    gy: 0,
    gz: 0,
  }

  function handleOrientation(event) {
    reading.beta = event.beta || 0
    reading.gamma = event.gamma || 0
    reading.alpha = event.alpha || 0
  }

  function handleMotion(event) {
    const withGravity = event.accelerationIncludingGravity || {}
    const noGravity = event.acceleration || {}
    const rotation = event.rotationRate || {}

    reading.time = event.timeStamp

    reading.ax = withGravity.x || 0
    reading.ay = withGravity.y || 0
    reading.az = withGravity.z || 0

    reading.lx = noGravity.x || 0
    reading.ly = noGravity.y || 0
    reading.lz = noGravity.z || 0

     // rotation around the x,y,z axis
    reading.gx = rotation.beta || 0
    reading.gy = rotation.gamma || 0
    reading.gz = rotation.alpha || 0

    // now sending a copy, so every reading is its own object
    onReading({ ...reading })
  }

  window.addEventListener('deviceorientation', handleOrientation)
  window.addEventListener('devicemotion', handleMotion)

  return function stopSensors() {
    window.removeEventListener('deviceorientation', handleOrientation)
    window.removeEventListener('devicemotion', handleMotion)
  }
}