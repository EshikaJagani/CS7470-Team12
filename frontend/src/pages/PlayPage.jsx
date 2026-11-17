import HorseScene from '../components/HorseScene.jsx'
function PlayPage() {
return (
<div>
<h2>Play</h2>
<div className="card">
<HorseScene lean={0} jumping={false} />
</div>
<p>The game controls will go here.</p>
</div>
)
}
export default PlayPage