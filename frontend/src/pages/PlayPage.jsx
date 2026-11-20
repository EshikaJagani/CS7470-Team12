import { useState } from 'react'
import HorseScene from '../components/HorseScene.jsx'
import { MOVE_NAMES, STORY } from '../story.js'
function PlayPage() {
// which part of the story we are on: -1 = not started, 6 = finished
const [partNumber, setPartNumber] = useState(-1)
const [message, setMessage] = useState('Press Start to begin the ride.')
const [lean, setLean] = useState(0)
const [jumping, setJumping] = useState(false)
const isPlaying = partNumber >= 0 && partNumber < STORY.length
const isFinished = partNumber === STORY.length
const part = isPlaying ? STORY[partNumber] : null
function startGame() {
setPartNumber(0)
setMessage('Go!')
}
// makes the horse lean or jump for a short time
function animateHorse(move) {
if (move === 'left') setLean(-15)
if (move === 'right') setLean(15)
if (move === 'jump' || move === 'momentum') setJumping(true)
// after 0.6 seconds, put the horse back to normal
setTimeout(function () {
setLean(0)
setJumping(false)
}, 600)
}
// called when the player does a move (with a button now, with the phone later)
function doMove(move) {
if (!isPlaying) return
animateHorse(move)
if (move === part.move) {
setMessage(part.reward)
setPartNumber(partNumber + 1)
} else {
setMessage('Not quite - try: ' + MOVE_NAMES[part.move])
}
}
return (
    <div>
        <h2>Play</h2>

            <div className="card">
                <HorseScene lean={lean} jumping={jumping} />

                    {part && (
                    <div>
                        <p>
                            <b>
                                Part {partNumber + 1} of {STORY.length} · {part.place}
                            </b>
                        </p>
                        <p>{part.text}</p>
                        <p>
                        Do this: <b>{MOVE_NAMES[part.move]}</b>
                        </p>
                    </div>
                )}
                {isFinished && <p className="success">You finished the ride! </p>}
                <p>{message}</p>
                {!isPlaying && <button onClick={startGame}>{isFinished ? 'Play again': 'Start'}</button>}
            </div>
    <div className="card">
        <h3>Desktop controls</h3>
        <p>No phone? Use these buttons instead.</p>
        <button onClick={() => doMove('left')} disabled={!isPlaying}>
        ← Left
        </button>
        <button onClick={() => doMove('right')} disabled={!isPlaying}>
        Right →
        </button>
        <button onClick={() => doMove('jump')} disabled={!isPlaying}>
        ↑ Jump
        </button>
        <button onClick={() => doMove('steady')} disabled={!isPlaying}>
        Stay steady
        </button>
        <button onClick={() => doMove('momentum')} disabled={!isPlaying}>
        Build momentum
        </button>
    </div>
</div>
)
}
export default PlayPage