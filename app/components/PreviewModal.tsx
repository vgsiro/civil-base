'use client'
import { useState } from 'react'
import type { SearchResult } from '../types'

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

interface Props {
  result: SearchResult
  onClose: () => void
}

export default function PreviewModal({ result, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '12px', width: '860px', maxWidth: '95vw', height: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
              {result.pdfs?.sections?.subjects?.name} → {result.pdfs?.sections?.name} → Page {result.page_number}
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{result.pdfs?.name}</p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1, padding: '0 0 0 12px' }}>✕</button>
        </div>
        {result.pdfs?.file_url ? (
          <PdfFrame src={result.pdfs.file_url} page={result.page_number} />
        ) : (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.7' }}>{result.content}</p>
          </div>
        )}
      </div>
    </div>
  )
}
