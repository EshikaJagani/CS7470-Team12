function HomePage({ goTo }) {
  return (
    <div>
      <h2>Welcome to MotionQuest</h2>
      <p>Guide your horse through the hills by tilting your phone.</p>
      <button onClick={() => goTo('play')}>Start playing</button>
    </div>
  )
}

export default HomePage