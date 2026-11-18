import { Star } from 'lucide-react'

export default function StarRating({
  rating = 0,
  max = 5,
  size = 16,
  showValue = true,
  className = '',
}) {
  const rounded = Math.round(Number(rating) * 2) / 2

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < rounded
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 fill-gray-100'
          }
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {Number(rating || 0).toFixed(1)}
        </span>
      )}
    </div>
  )
}
