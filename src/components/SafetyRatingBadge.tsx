interface SafetyRatingBadgeProps {
  rating: number
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function SafetyRatingBadge({
  rating,
  confidence = 1,
  size = 'md',
  showLabel = true
}: SafetyRatingBadgeProps) {
  const getRatingColor = (score: number) => {
    if (score >= 8.5) return 'bg-green-500 text-white'
    if (score >= 7.5) return 'bg-green-400 text-white'
    if (score >= 6.5) return 'bg-yellow-500 text-white'
    if (score >= 5.5) return 'bg-orange-400 text-white'
    if (score >= 4.5) return 'bg-orange-500 text-white'
    return 'bg-red-500 text-white'
  }

  const getRatingLabel = (score: number) => {
    if (score >= 8.5) return 'Excellent'
    if (score >= 7.5) return 'Very Good'
    if (score >= 6.5) return 'Good'
    if (score >= 5.5) return 'Fair'
    if (score >= 4.5) return 'Poor'
    return 'Very Poor'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const confidenceOpacity = confidence < 0.7 ? 'opacity-75' : 'opacity-100'

  return (
    <div className={`inline-flex items-center gap-2 ${confidenceOpacity}`}>
      <div className={`${getRatingColor(rating)} ${sizeClasses[size]} rounded-full font-semibold flex items-center gap-1`}>
        <span>{rating.toFixed(1)}</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground font-medium">
          {getRatingLabel(rating)}
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