import { useState } from 'react'
import LikertScale from '../components/LikertScale.jsx'
import { SUS_QUESTIONS, TLX_QUESTIONS, susScore, tlxScore } from '../questions.js'
import { getParticipant, getFeedbackStyle, saveQuestionnaire } from '../session.js'

export default function QuestionnairePage() {
  const [susAnswers, setSusAnswers] = useState(() => SUS_QUESTIONS.map(() => null))
  const [tlxAnswers, setTlxAnswers] = useState(() => TLX_QUESTIONS.map(() => 50))
  const [mode, setMode] = useState('hand')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [scores, setScores] = useState(null)

  const participant = getParticipant()
  const feedback = getFeedbackStyle()
  const feedbackLabel = feedback === 'success_only' ? 'B – success only' : 'A – continuous'
  const complete = susAnswers.every(answer => answer !== null)

  async function submit(event) {
    event.preventDefault()
    if (!complete || saving) return

    const sus = susScore(susAnswers)
    const tlx = tlxScore(tlxAnswers)

    setSaving(true)
    setError('')

    try {
      const result = await saveQuestionnaire({
        participant_code: participant || 'NONE',
        feedback,
        mode,
        sus_answers: susAnswers,
        sus_score: sus,
        tlx_answers: tlxAnswers,
        tlx_score: tlx,
        comment: comment.trim(),
      })

      if (result === 'ok') {
        setScores({ sus, tlx })
      } else {
        setError(result)
      }
    } catch {
      setError('Saving the answers failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (scores) {
    return (
      <section className="card" role="status">
        <h2>Thank you!</h2>
        <p>Usability (SUS): {scores.sus} out of 100</p>
        <p>Workload (NASA-TLX): {scores.tlx} out of 100</p>
        <p className="success">Your answers were saved.</p>
      </section>
    )
  }

  return (
    <form className="survey-page" onSubmit={submit}>
      <h2>Survey</h2>
      <p>Player: {participant || 'not set (go to Home)'} · Feedback: {feedbackLabel}</p>

      <fieldset className="survey-fields" disabled={saving}>
        <label htmlFor="survey-mode">Which mode did you just play?</label>
        {' '}
        <select id="survey-mode" value={mode} onChange={event => setMode(event.target.value)}>
          <option value="hand">Phone in hand</option>
          <option value="pocket">Phone in pocket</option>
        </select>

        <section className="card">
          <h3>Part 1: How easy was the game?</h3>
          <p>1 = Strongly disagree · 5 = Strongly agree</p>

          {SUS_QUESTIONS.map((question, index) => (
            <fieldset className="question" key={question}>
              <legend>{index + 1}. {question}</legend>
              <LikertScale
                value={susAnswers[index]}
                onChange={value => setSusAnswers(previous => {
                  const answers = [...previous]
                  answers[index] = value
                  return answers
                })}
              />
            </fieldset>
          ))}
        </section>

        <section className="card">
          <h3>Part 2: How much effort was it?</h3>

          {TLX_QUESTIONS.map(({ name, text, low, high }, index) => (
            <div className="question" key={name}>
              <label htmlFor={`tlx-${index}`}><strong>{name}</strong> · {text}</label>
              <input
                className="slider"
                id={`tlx-${index}`}
                type="range"
                min="0"
                max="100"
                step="5"
                value={tlxAnswers[index]}
                aria-describedby={`tlx-${index}-labels`}
                onChange={event => {
                  const value = Number(event.target.value)
                  setTlxAnswers(previous => {
                    const answers = [...previous]
                    answers[index] = value
                    return answers
                  })
                }}
              />
              <div className="slider-labels" id={`tlx-${index}-labels`}>
                <span>{low}</span>
                <output htmlFor={`tlx-${index}`}>{tlxAnswers[index]}</output>
                <span>{high}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="card">
          <label htmlFor="survey-comment"><strong>Anything else? (optional)</strong></label>
          <textarea
            className="comment"
            id="survey-comment"
            rows="3"
            value={comment}
            onChange={event => setComment(event.target.value)}
          />
          <button className="primary" type="submit" disabled={!complete || saving}>
            {saving ? 'Saving…' : 'Submit answers'}
          </button>
          {!complete && <p>Please answer all 10 questions in Part 1.</p>}
          {error && <p role="alert">{error}</p>}
        </section>
      </fieldset>
    </form>
  )
}