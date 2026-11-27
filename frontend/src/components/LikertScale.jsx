const choices = [1, 2, 3, 4, 5]

export default function LikertScale({ value, onChange }) {
  return (
    <div className="likert">
      {choices.map(choice => (
        <button
          key={choice}
          type="button"
          className={value === choice ? 'likert-button chosen' : 'likert-button'}
          aria-pressed={value === choice}
          onClick={() => onChange(choice)}
        >
          {choice}
        </button>
      ))}
    </div>
  )
}