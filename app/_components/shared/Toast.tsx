'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, Trash2, Share2, X } from 'lucide-react'

type ToastType = 'success' | 'delete' | 'share'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let _push: ((message: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  _push?.(message, type)
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} color="#16a34a" />,
  delete:  <Trash2     size={16} color="#dc2626" />,
  share:   <Share2     size={16} color="#3b82f6" />,
}

const ACCENT: Record<ToastType, string> = {
  success: '#16a34a',
  delete:  '#dc2626',
  share:   '#3b82f6',
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    _push = (message, type) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { _push = null }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', borderRadius: 10, padding: '10px 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.14)', border: `1.5px solid ${ACCENT[t.type]}22`,
          fontSize: 14, fontWeight: 600, color: '#0f172a',
          pointerEvents: 'auto', minWidth: 180, maxWidth: 340,
          animation: 'toast-in 0.2s ease',
        }}>
          {ICONS[t.type]}
          {t.message}
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#94a3b8' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}
