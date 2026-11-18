import { cx } from '../../utils/format'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-14 w-14',
  }
  return (
    <div
      className={cx(
        'animate-spin rounded-full border-2 border-brand-200 border-t-brand-500',
        sizes[size] || sizes.md,
        className
      )}
    />
  )
}
