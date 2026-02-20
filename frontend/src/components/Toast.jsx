import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#00D4AA' }} />,
  error:   <XCircle    className="w-4 h-4 flex-shrink-0" style={{ color: '#FF4D6D' }} />,
  warning: <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FFB547' }} />,
  info:    <Info        className="w-4 h-4 flex-shrink-0" style={{ color: '#60A5FA' }} />,
}

const DURATION = 4500

export function Toast({ id, type = 'info', message, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), DURATION)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  return (
    <div className={`toast ${type}`}>
      {ICONS[type]}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="opacity-40 hover:opacity-90 transition-opacity ml-2 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  )
}