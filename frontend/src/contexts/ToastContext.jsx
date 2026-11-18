import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    classes: 'bg-green-50 border-green-200 text-green-800',
    iconClass: 'text-green-500',
  },
  error: {
    icon: XCircle,
    classes: 'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
  },
  info: {
    icon: Info,
    classes: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClass: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClass: 'text-yellow-500',
  },
}

function Toast({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    // Trigger entrance animation on next frame
    const frame = requestAnimationFrame(() => setVisible(true))

    timerRef.current = setTimeout(() => {
      handleClose()
    }, 4000)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timerRef.current)
    }
  }, []) // eslint-disable-line

  const handleClose = () => {
    setLeaving(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info
  const Icon = config.icon

  return (
    <div
      style={{
        transition: 'all 0.3s ease',
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
        opacity: visible && !leaving ? 1 : 0,
      }}
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border min-w-[300px] max-w-sm ${config.classes}`}
      role="alert"
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${config.iconClass}`} />
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded-lg hover:bg-black/10 transition-colors"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => [...prev, { id, message, type }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const portalNode = typeof document !== 'undefined' ? document.body : null

  const toastList = portalNode
    ? ReactDOM.createPortal(
        <div
          aria-live="polite"
          aria-atomic="false"
          className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </div>,
        portalNode
      )
    : null

  return (
    <ToastContext.Provider value={{ addToast, showToast: addToast, toast: addToast, removeToast }}>
      {children}
      {toastList}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
