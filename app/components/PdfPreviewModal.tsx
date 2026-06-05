'use client'
import { useState } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { ArrowLeft, MessageCircle, ExternalLink } from 'lucide-react'
import type { Pdf } from '../types'

function PdfFrame({ src, page }: { src: string; page: number }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 12 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading PDF…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      <iframe
        src={`${src}#page=${page}`}
        onLoad={() => setLoaded(true)}
        style={{ flex: 1, border: 'none', width: '100%', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }}
      />
    </div>
  )
}

interface PdfPreviewModalProps {
  file: Pdf
  onClose: () => void
  onOpenPdfChat: (e: React.MouseEvent, p: Pdf) => void
}

export default function PdfPreviewModal({ file, onClose, onOpenPdfChat }: PdfPreviewModalProps) {
  useScrollLock()
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: 'calc(100vw - 48px)', maxWidth: 1100, height: 'calc(100vh - 48px)', background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <ArrowLeft size={14} /> Close
          </button>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
            {file.name}
          </span>
          <button onClick={e => onOpenPdfChat(e, file)} title="Ask AI"
            style={{ background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#8b5cf6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <MessageCircle size={13} /> Ask AI
          </button>
          <button onClick={() => window.open(file.file_url, '_blank')} title="Open in new tab"
            style={{ background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <ExternalLink size={13} /> Open
          </button>
        </div>
        {file.file_type === 'image' ? (
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', justifyContent: 'center', background: '#475569' }}>
            <img src={file.file_url} alt={file.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
          </div>
        ) : (
          <PdfFrame src={file.file_url} page={1} />
        )}
      </div>
    </div>
  )
}
