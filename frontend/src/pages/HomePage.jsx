// adding study setup for phase 2 -Eshika
// now the home page will also have the "study setup" box where we will type the participant code n pick the feedback style
// before every user study session.. this is the OONNNLLLYYY place we will set them so all pages use the same values

import { useState } from 'react'
import { getFeedbackStyle, getParticipant, setFeedbackStyle, setParticipant } from '../session.js'

function HomePage({ goTo }) {
  const [code, setCode] = useState(getParticipant())
  const [feedback, setFeedback] = useState(getFeedbackStyle())
  const [saved, setSaved] = useState(false)

  function saveSetup() {
    setParticipant(code)
    setFeedbackStyle(feedback)
    setSaved(true)
  }

  return (
    <div>
      <div className="card">
        <h2>Welcome to MotionQuest</h2>
        <p>Guide your horse through the hills by tilting your phone, or by walking with it in your pocket.</p>
        <button onClick={() => goTo('play')}>Start playing</button>
      </div>

      <div className="card">
        <h3>Study setup</h3>
        <p>Study players get S01, S02... Team members use their P code. Please do not enter your real name.</p>
        <p>
          Participant code:{' '}
          <input
            value={code}
            placeholder="S01"
            onChange={(e) => {
              setCode(e.target.value)
              setSaved(false)
            }}
          />
        </p>
        <p>
          Feedback style:{' '}
          <select
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value)
              setSaved(false)
            }}
          >
            <option value="continuous">A - continuous (horse follows the phone)</option>
            <option value="success_only">B - success only (feedback after each move)</option>
          </select>
        </p>
        <button onClick={saveSetup} disabled={code.trim() === ''}>
          Save setup
        </button>
        {saved && <p className="success">Saved ✓ Now press Play.</p>}
      </div>

      <div className="card">
        <h3>How to play</h3>
        <p>Hold your phone in front of you, like you are reading a message.</p>
        <p>Tilt it left, right or forward when the game asks you to.</p>
      </div>
    </div>
  )
}

export default HomePage
