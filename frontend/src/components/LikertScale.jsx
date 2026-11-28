const choices = [1, 2, 3, 4, 5]

// Reference: Passing the selected value and change handler as props — https://react.dev/learn/passing-props-to-a-component
// Reference: Rendering the five response buttons from an array — https://react.dev/learn/rendering-lists
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