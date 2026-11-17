// The picture of the hills and the horse - made by Anish
// lean    = how many degrees the horse leans (negative = left, positive = right)
// jumping = true when the horse is in the air
function HorseScene({ lean, jumping }) {
// move the horse up 30 pixels when it jumps
const horseY = jumping ? 120 : 150
return (
<svg viewBox="0 0 400 220" width="100%" className="scene">
{/* sky */}
<rect x="0" y="0" width="400" height="220" fill="#ffd9a0" />
{/* sun */}
<circle cx="320" cy="60" r="30" fill="#ffb347" />
{/* hills far away */}
<path d="M0 150 Q100 100 200 150 T400 150 V220 H0 Z" fill="#8fbf7f" />
{/* ground */}
<rect x="0" y="170" width="400" height="50" fill="#6b8e4e" />
{/* the horse */}
<g transform={`translate(200 ${horseY}) rotate(${lean})`}>
{/* tail */}
<path d="M-40 -5 Q-60 0 -55 25" stroke="#3b2412" strokeWidth="6"
fill="none" />
{/* legs */}
<rect x="-30" y="8" width="6" height="28" fill="#6b4220" />
<rect x="-18" y="8" width="6" height="28" fill="#6b4220" />
<rect x="18" y="8" width="6" height="28" fill="#6b4220" />
<rect x="28" y="8" width="6" height="28" fill="#6b4220" />
{/* body */}
<ellipse cx="0" cy="0" rx="40" ry="18" fill="#8b5a2b" />
{/* neck */}
<polygon points="25,-8 38,-38 50,-32 40,0" fill="#8b5a2b" />
{/* mane */}
<line x1="28" y1="-10" x2="38" y2="-40" stroke="#3b2412"
strokeWidth="5" />
{/* head, ear and eye */}
<ellipse cx="52" cy="-36" rx="14" ry="8" fill="#8b5a2b" />
<polygon points="44,-44 47,-54 50,-43" fill="#8b5a2b" />
<circle cx="55" cy="-38" r="2" fill="black" />
</g>
</svg>
)
}
export default HorseScene