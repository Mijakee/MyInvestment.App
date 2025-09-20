interface CrimeScoreBadgeProps {
  score: number        // 1-10 scale (higher = worse crime)
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function CrimeScoreBadge({
  score,
  confidence = 1,
  size = 'md',
  showLabel = true
}: CrimeScoreBadgeProps) {
  // Crime score: Higher = worse = red colors
  const getScoreColor = (crimeScore: number) => {
    if (crimeScore <= 2) return 'bg-green-500 text-white'      // Very low crime
    if (crimeScore <= 3.5) return 'bg-green-400 text-white'    // Low crime
    if (crimeScore <= 5) return 'bg-yellow-500 text-white'     // Moderate crime
    if (crimeScore <= 6.5) return 'bg-orange-400 text-white'   // Higher crime
    if (crimeScore <= 8) return 'bg-orange-500 text-white'     // High crime
    return 'bg-red-500 text-white'                             // Very high crime
  }

  const getScoreLabel = (crimeScore: number) => {
    if (crimeScore <= 2) return 'Very Low Crime'
    if (crimeScore <= 3.5) return 'Low Crime'
    if (crimeScore <= 5) return 'Moderate Crime'
    if (crimeScore <= 6.5) return 'Higher Crime'
    if (crimeScore <= 8) return 'High Crime'
    return 'Very High Crime'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const confidenceOpacity = confidence < 0.7 ? 'opacity-75' : 'opacity-100'

  return (
    <div className={`
      inline-flex items-center rounded-md font-medium
      ${getScoreColor(score)}
      ${sizeClasses[size]}
      ${confidenceOpacity}
    `}>
      <span className="font-bold">{score.toFixed(1)}</span>
      {showLabel && (
        <span className="ml-1.5">{getScoreLabel(score)}</span>
      )}
      {confidence < 0.9 && showLabel && (
        <span className="ml-1 text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </div>
  )
}