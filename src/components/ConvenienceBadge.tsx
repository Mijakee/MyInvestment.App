interface ConvenienceBadgeProps {
  score: number
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ConvenienceBadge({
  score,
  confidence = 1,
  size = 'md',
  showLabel = true
}: ConvenienceBadgeProps) {
  const getScoreColor = (rating: number) => {
    if (rating >= 8.5) return 'bg-emerald-500 text-white'
    if (rating >= 7.5) return 'bg-emerald-400 text-white'
    if (rating >= 6.5) return 'bg-blue-500 text-white'
    if (rating >= 5.5) return 'bg-blue-400 text-white'
    if (rating >= 4.5) return 'bg-amber-500 text-white'
    return 'bg-orange-500 text-white'
  }

  const getScoreLabel = (rating: number) => {
    if (rating >= 8.5) return 'Excellent'
    if (rating >= 7.5) return 'Very Good'
    if (rating >= 6.5) return 'Good'
    if (rating >= 5.5) return 'Fair'
    if (rating >= 4.5) return 'Limited'
    return 'Poor'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const confidenceOpacity = confidence < 0.7 ? 'opacity-75' : 'opacity-100'

  return (
    <div className={`inline-flex items-center gap-2 ${confidenceOpacity}`}>
      <div className={`${getScoreColor(score)} ${sizeClasses[size]} rounded-full font-semibold flex items-center gap-1`}>
        <span>{score.toFixed(1)}</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2L3 7v11a2 2 0 002 2h4v-6h2v6h4a2 2 0 002-2V7l-7-5z" />
        </svg>
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground font-medium">
          {getScoreLabel(score)}
        </span>
      )}
      {confidence < 0.7 && (
        <span className="text-xs text-muted-foreground">
          (~{Math.round(confidence * 100)}% confidence)
        </span>
      )}
    </div>
  )
}