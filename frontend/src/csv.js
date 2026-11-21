// csv.js - made by Eshika
// now making csv files from the recorded readings n downloading them
// csv = a table saved as text, 1 line per row and commas between values int he same format as phyphox exports!!!
// trying my best to keep the code as clean and less wordy as pos but theres alot in my head!!!!!

// the cols in order.. keeping time first just like phyphox files
export const COLUMNS = ['time', 'ax', 'ay', 'az', 'lx', 'ly', 'lz', 'gx', 'gy', 'gz', 'beta', 'gamma', 'alpha']

// turning the list of readings into csv text
// same idea as writing the clean csv in task 2 (f.write row by row with commas) but in js
export function makeCsv(readings) {
  const lines = []
  // first line = col names (header)
  lines.push(COLUMNS.join(','))

  for (const reading of readings) {
    const values = []
    for (const column of COLUMNS) {
      values.push(reading[column])
    }
    lines.push(values.join(','))
  }

  return lines.join('\n')
}

// now saving the text as a file on the phone or laptop
// browsers dont let us write files directly so the trick is: make a Blob -> make a hidden link -> click it
// ref1: https://developer.mozilla.org/en-US/docs/Web/API/Blob
// ref2: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
// ref3: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download
export function downloadCsv(fileName, csvText) {
  const file = new Blob([csvText], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = fileName
  // the link has to be on the page for the click to work on some browsers (firefox!!) so adding it n removing after
  document.body.appendChild(link)
  link.click()
  link.remove()
}