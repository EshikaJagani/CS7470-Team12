// The six parts of the ride (same story as the prototype) - made by Anish
// move = what the player has to do
export const MOVE_NAMES = {
left: 'Tilt left and hold',
right: 'Tilt right and hold',
jump: 'Tip the top of the phone forward and hold',
steady: 'Keep the phone still',
momentum: 'Tip forward and back 3 times',
}

export const STORY = [
    { place: 'Whispering woods', text: 'A fallen rock blocks the trail. Guide your horse left.', move: 'left', reward: 'You passed the rock!' },
    { place: 'Whispering woods', text: 'Another obstacle ahead. Guide your horse right.', move: 'right', reward: 'You found the open trail!' },
    { place: 'Shifting ridge', text: 'The ground moves under the horse. Stay steady.', move: 'steady', reward: 'Your horse found its footing!' },
    { place: 'Shifting ridge', text: 'A narrow gap opens ahead. Lean forward to jump.', move: 'jump', reward: 'You cleared the gap!' },
    { place: 'Mountain pass', text: 'The trail climbs sharply. Build momentum.', move: 'momentum', reward: 'You made the climb!' },
    { place: 'Mountain pass', text: 'The last stretch is shaky. Stay steady to reach the top.', move: 'steady', reward: 'You reached the overlook!' },
]