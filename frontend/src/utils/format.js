export function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function mediaUrl(url) {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}${url}`
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => (typeof item === 'string' ? item : item.msg)).filter(Boolean).join(' ')
  }
  return fallback
}
