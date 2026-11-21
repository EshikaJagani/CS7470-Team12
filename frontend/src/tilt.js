// tilt.js - made by Eshika
// for this not creating cleaned file, only keeping the unclean one..
// turning the sensor nos into game moves left, right, forward, back, none..
// this will b our rule based recognizer and later the ML models will be compared against this

/* main idea on how i am approaching this:
what is needed: know if the player tilted left/right/forward/back or is holding still
problem: everyone holds the phone differently!! some hold it almost flat, some almost straight up
so i cant just say "gamma > 20 means right" bcoz for someone who holds it a bit tilted already it will always say right

so the plan:
- calibration -> player holds the phone normally for 2 sec and i will take the avg of beta and gamma = their "neutral"
- then every tilt will measured from THEIRRR neutral and not from 0
- tilt has to be more than 20 deg from neutral to count (threshhh)
- and they have to HOLLLDDDD it for 0.5 sec (the holding part is done in PlayPage) so small wobbles dont get counted
  this is the Midas Touch thing from the lec, we dont want the horse to jump every time the player just adjusts their grip
- for "steady" i use gyro bcoz gyro tells how fast its rotating, if almost 0 then phone is still

angles explained here: https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Orientation_and_motion_data_explained
beta = front n back around x axis, gamma = left n right around y axis
*/

// my settings (tried a few values while testing but these felt the best!!)
// 20 deg felt natural, 10 was triggering by mistake n 30 was too hard to reach..
export const TILT_ANGLE = 20
// ms to hold the tilt
export const HOLD_TIME = 500
// ms to stay still for the steady move
export const STEADY_TIME = 1500
// deg/s of total rotation below which i consider the phone "still"
export const STILL_LIMIT = 15


// calibration: avg of all the readings collected while the player holds still for 2 sec
// same as taking the mean like in task 1, nothing fancy..
export function calibrate(readings) {
  let betaSum = 0
  let gammaSum = 0

  for (const r of readings) {
    betaSum = betaSum + r.beta
    gammaSum = gammaSum + r.gamma
  }

  return {
    beta: betaSum / readings.length,
    gamma: gammaSum / readings.length,
  }
}


// which way is the phone tilted right now compared to neutral?
// and return 'left', 'right', 'forward', 'back' or 'none'
export function getTilt(reading, neutral) {
  // how far from neutral in each direction
  const sideways = reading.gamma - neutral.gamma
  const frontBack = reading.beta - neutral.beta

  // checking sideways first bcoz left/right are the main moves in the game
  // gamma goes negative when tilted left and positive when tilted right
  if (sideways < -TILT_ANGLE) return 'left'
  if (sideways > TILT_ANGLE) return 'right'

  // beta goes down when the top of the phone tips away from you phone becomes flatter
  // n goes up when the top tips towards you
  if (frontBack < -TILT_ANGLE) return 'forward'
  if (frontBack > TILT_ANGLE) return 'back'

  return 'none'
}


// is the phone almost not rotating?
// adding abs of all 3 gyro axis bcoz rotation can be +ve or -ve and i only care how much n not which way..
// similar to how vector magnitude ignores direction in task 3, just simpler without sqrt..
export function isStill(reading) {
  const spin = Math.abs(reading.gx) + Math.abs(reading.gy) + Math.abs(reading.gz)
  return spin < STILL_LIMIT
}