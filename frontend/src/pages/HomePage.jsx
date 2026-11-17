function HomePage({ goTo }) {
  return (
    <div>
      <div className="card">
        <h2>Welcome to MotionQuest</h2>
        <p>Guide your horse through the hills by tilting your phone.</p>
        <button onClick={() => goTo('play')}>Start playing</button>
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
