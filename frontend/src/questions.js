// Reference: Brooke, J. (1996). SUS: A quick and dirty usability scale. In Usability Evaluation in Industry.
// Free full text with the questionnaire and scoring: https://hci-studies.org/methods-and-measures/downloads/SUS_Brooke1996.pdf
export const SUS_QUESTIONS = [
  'I think that I would like to play this game frequently.',
  'I found the game unnecessarily complex.',
  'I thought the game was easy to use.',
  'I think that I would need the support of a technical person to be able to play this game.',
  'I found the various functions in this game were well integrated.',
  'I thought there was too much inconsistency in this game.',
  'I would imagine that most people would learn to play this game very quickly.',
  'I found the game very cumbersome to use.',
  'I felt very confident playing the game.',
  'I needed to learn a lot of things before I could get going with this game.',
]

// Reference: Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX (Task Load Index): Results of empirical and theoretical research.
// NASA's overview of the six workload dimensions and free publication download: https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/
export const TLX_QUESTIONS = [
  {
    name: 'Mental demand',
    text: 'How mentally demanding was the game?',
    low: 'Very low',
    high: 'Very high',
  },
  {
    name: 'Physical demand',
    text: 'How physically demanding was the game?',
    low: 'Very low',
    high: 'Very high',
  },
  {
    name: 'Temporal demand',
    text: 'How hurried or rushed was the pace of the game?',
    low: 'Very low',
    high: 'Very high',
  },
  {
    name: 'Performance',
    text: 'How successful were you in doing what the game asked?',
    low: 'Perfect',
    high: 'Failure',
  },
  {
    name: 'Effort',
    text: 'How hard did you have to work to reach your level of performance?',
    low: 'Very low',
    high: 'Very high',
  },
  {
    name: 'Frustration',
    text: 'How insecure, discouraged, irritated, stressed or annoyed were you?',
    low: 'Very low',
    high: 'Very high',
  },
]

export function susScore(answers) {
  const total = answers.reduce((sum, answer, index) => {
    const points = index % 2 === 0 ? answer - 1 : 5 - answer
    return sum + points
  }, 0)

  return total * 2.5
}

export function tlxScore(answers) {
  const total = answers.reduce((sum, answer) => sum + answer, 0)
  const average = total / answers.length
  return Math.round(average * 10) / 10
}