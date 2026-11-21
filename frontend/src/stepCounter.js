// stepCounter.js - made by Eshika
// simple step counter.. same idea as task 3 in sensor data analysis but now LIVE on the phone

/* over thinker again:
in task 3 i had the whole csv so i could use find_peaks on the full signal at the end
but here reading will come one by one live so i cant look into the future!!!!
soooo instead of find_peaks i am doing it reading by reading:
- vector magn of acc without g = how strong the phone is shaking and this is again same as task 3
- moving avg of last 5 values to smooth it again same as task 3 but small wndw bcoz its live
- step = smooth value goes from BELOW the thres to ABOVE it which will be  crossing upwards
- and min gap between 2 steps so 1 step doesnt get counted twice n this is again same as MIN_GAP_SAMPLES in task 3 but in ms..
ref1: https://www.youtube.com/watch?v=7STwpe9Ojic (moving avg, same one i used in task 3)
ref2: https://www.mdpi.com/1424-8220/19/5/1170
*/

// thres in m/s^2, how strong the shake has to be
// in task 3 i used mean of the signal as thres but live we dont have the full signal so fixing a number
// will tune this with the 100 steps test..
export const STEP_LIMIT = 1.2
// ms, in task 3 one step was ~0.525 sec for me so 0.3 sec min gap is safe again same logic as task 3!!!
export const MIN_TIME_BETWEEN_STEPS = 300

export function createStepCounter() {
  return {
    steps: 0,
    lastStepTime: 0,
    // last 5 shake values for smoothing
    recentValues: [],
    // was the last value above the thres? needed to catch the crossing...
    wasAbove: false,
  }
}

// give the counter 1 reading and it will return true when it will coutn a new step
export function addReading(counter, reading) {
  // vec mag = sqrt(x^2+y^2+z^2) same as task 3
  let strength = Math.sqrt(reading.lx * reading.lx + reading.ly * reading.ly + reading.lz * reading.lz)

  // some android phones dont give acc wo g at all so all 0s..
  // so then taking acc WITH g and then i am removing g myself (9.81) so that it is same as the movement calc in task 4
  if (reading.lx === 0 && reading.ly === 0 && reading.lz === 0) {
    const total = Math.sqrt(reading.ax * reading.ax + reading.ay * reading.ay + reading.az * reading.az)
    strength = Math.abs(total - 9.81)
  }

  // smoothing: avg of last 5 values so tiny wobbles dont count
  counter.recentValues.push(strength)
  if (counter.recentValues.length > 5) {
    // removing the oldest one so the wndw slides
    counter.recentValues.shift()
  }
  let total = 0
  for (const value of counter.recentValues) {
    total = total + value
  }
  const smooth = total / counter.recentValues.length

  // a step = smooth value crosses from below the thres to above it
  // AAANNNDDDD enough time will pass since last step..
  const isAbove = smooth > STEP_LIMIT
  let newStep = false
  if (isAbove && !counter.wasAbove && reading.time - counter.lastStepTime > MIN_TIME_BETWEEN_STEPS) {
    counter.steps = counter.steps + 1
    counter.lastStepTime = reading.time
    newStep = true
  }
  counter.wasAbove = isAbove

  return newStep
}