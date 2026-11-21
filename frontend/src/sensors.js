// sensors.js - made by Eshika

// uploading the original unclean version with refs as per the ed stem post
// this file is the only place where we talk to the phones sensors
// from here the SensorsPage, PlayPage and RecordPage will call these 2 functions

/* here is the main idea on how i am approaching this...
what is needed: get acc, gyro and tilt angles from the phone inside the browser (no app!)
how browser gives it: 2 events -> 'deviceorientation' (tilt angles) and 'devicemotion' (acc + gyro)
ref1: https://www.w3.org/TR/orientation-event/
ref2: https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
ref3: https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation

problems i found while reading the docs:
- iphones dont give any data untill the user says yes on a popup.. and that popup only shows up if its called right after a button tap
- phones only share sensors with https pages.. so localhost on laptop works but the Network: address on phone does not
- android just works, no popup at all lol

so the flow is -> step 1 ask permission on button click -> step 2 start listening -> then give each reading to whoever called us
*/


// STEP 1: asking permission
// this will return just 1 word: 'granted', 'denied', 'needs-https' or 'not-supported'
// so the page can show the right msg to the user..
export async function askForSensorPermission() {
  // first checking https bcoz without it nothing below will work anyway..
  // ref: https://developer.mozilla.org/en-US/docs/Web/API/Window/isSecureContext
  if (!window.isSecureContext) {
    return 'needs-https'
  }

  // some browsers which are old ones or desktopones dont even have this event type
  if (typeof DeviceMotionEvent === 'undefined') {
    return 'not-supported'
  }

  // now for iphone: requestPermission only exists on safari/ ios so checking if its a fn first
  // ref: https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static
  // ref2: https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static
  // the doc says it needs "transient activation" which basically means a button click
  // and asking both one after other with await was risky bcoz the 2nd one might loose the click
  // sooooooo asking both together with Promise.all so both will start in the same click..
  // ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const answers = await Promise.all([
        DeviceMotionEvent.requestPermission(),
        DeviceOrientationEvent.requestPermission(),
      ])
      // both have to say granted else we cant use it
      if (answers[0] !== 'granted' || answers[1] !== 'granted') {
        return 'denied'
      }
    } catch {
      // if user taps dont allow or its not called from a click then it will throw error so treating it as denied
      return 'denied'
    }
  }

  // android will reach here directly bcoz no popup needed
  return 'granted'
}


// STEP 2: start listening to the sensors
// onReading(reading) gets called almost 60 times every sec (iphone) and android varies
// this returns a func to stop listening.. so when we leave the page we can call it n stop
export function startSensors(onReading) {
  // keeping one object with the newest nos from both the events...
  // bcoz ori and motion will come as 2 sep events and that too at slightly diff times
  // so i am storing ori values here and sending everything together when motion will come
  const reading = {
    // time will b in ms since the page opened (ref: https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp)
    time: 0,

    // tilt angles will b in degrees ori sensor
    // ref: https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Orientation_and_motion_data_explained
    // now for front n back tilting beta, left n right tilt gamma, for turning around like comp alpha
    beta: 0,
    gamma: 0,
    alpha: 0,

    // acc WITH gravity in m/s^2 same as phyphox "with g"
    ax: 0,
    ay: 0,
    az: 0,

    // acc WITHOUT gravity = only the phone's own movement in m/s^2
    // this is what we need for steps like task 3 in sensor data analysis..
    lx: 0,
    ly: 0,
    lz: 0,

    // gyro = how fast the phone rotates in deg/s
    // 1 thing to note her e is that phyphox was giving rad/s but browser is giving deg/s!!!! so lets not mix them up!!!
    gx: 0,
    gy: 0,
    gz: 0,
  }

  function handleOrientation(event) {
    // sometimes the values come as null in case of laptop or when sensor is not ready so using || 0
    reading.beta = event.beta || 0
    reading.gamma = event.gamma || 0
    reading.alpha = event.alpha || 0
  }

  function handleMotion(event) {
    // same null issue here, some android phones are not giving acc wo g at all..
    // so if its missing it will become {} and then all values are becoming 0
    const withG = event.accelerationIncludingGravity || {}
    const noG = event.acceleration || {}
    const rot = event.rotationRate || {}

    reading.time = event.timeStamp

    reading.ax = withG.x || 0
    reading.ay = withG.y || 0
    reading.az = withG.z || 0

    reading.lx = noG.x || 0
    reading.ly = noG.y || 0
    reading.lz = noG.z || 0

    // this one confused me a lot!! rotationRate names are alpha/beta/gamma and not x/y/z
    // as per the spec beta is around x axis, gamma around y and alpha around z
    reading.gx = rot.beta || 0
    reading.gy = rot.gamma || 0
    reading.gz = rot.alpha || 0

    // sending a COPY and not the same object..
    // else every saved reading will point to the same object and all rows in csv will be same values 
    // aarrgghhh!!! found this the hard way!!!!
    onReading({ ...reading })
  }

  window.addEventListener('deviceorientation', handleOrientation)
  window.addEventListener('devicemotion', handleMotion)

  // returning the stop fn so the page can remove both listeners..
  return function stopSensors() {
    window.removeEventListener('deviceorientation', handleOrientation)
    window.removeEventListener('devicemotion', handleMotion)
  }
}
