import { cx } from '../../utils/format'

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  brand: 'bg-brand-100 text-brand-600',
  purple: 'bg-purple-100 text-purple-700',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  )
}
