'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Lock, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../../../i18n/LanguageContext'
import PageDiscussion from '../../../_components/home/discussion/PageDiscussion'

interface StandardPdf {
  id: string
  name: string
  standard_type: 'eurocode' | 'tcvn'
  category: string
  description?: string
  file_url: string
  created_at: string
}

// ── Secure PDF Viewer ─────────────────────────────────────────────────────────
function SecurePdfViewer({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Shield size={16} color="#1e293b" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(239,68,68,0.15)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)' }}>
          <Lock size={11} color="#f87171" />
          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>{t('std_viewer_badge')}</span>
        </div>
        <button onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={name}
          sandbox="allow-same-origin allow-scripts"
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'transparent', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

// ── PDF Card ──────────────────────────────────────────────────────────────────
function PdfCard({ pdf, accentColor, isAdmin, onOpen, onDelete }: {
  pdf: StandardPdf; accentColor: string; isAdmin: boolean; onOpen: () => void; onDelete: () => void
}) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 10, border: `1px solid ${hovered ? accentColor : '#e2e8f0'}`, background: '#fff', overflow: 'hidden', transition: 'box-shadow 0.15s, border-color 0.15s', boxShadow: hovered ? `0 4px 16px ${accentColor}22` : '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}
      onClick={onOpen}>
      <div style={{ height: 6, background: accentColor }} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={18} color={accentColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{pdf.name}</div>
            {pdf.description && <div style={{ fontSize: 11, color: '#1e293b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdf.description}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: accentColor, padding: '2px 8px', borderRadius: 8 }}>{pdf.category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={10} color="#1e293b" />
            <span style={{ fontSize: 10, color: '#1e293b' }}>{t('std_view_only')}</span>
          </div>
        </div>
        {isAdmin && (
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ marginTop: 8, width: '100%', padding: '4px', borderRadius: 6, background: 'none', border: '1px solid #fca5a5', color: '#ef4444', fontSize: 11, cursor: 'pointer', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
            {t('std_delete_confirm')}
          </button>
        )}
      </div>
    </div>
  )
}

// ── PDF Library ───────────────────────────────────────────────────────────────
export default function PdfLibrary({ type, accentColor, isAdmin, pageKey }: {
  type: 'eurocode' | 'tcvn'; accentColor: string; isAdmin: boolean; pageKey?: string
}) {
  const { t } = useTranslation()
  const [pdfs, setPdfs] = useState<StandardPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPdf, setPreviewPdf] = useState<StandardPdf | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('__all__')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadPdfs() }, [type]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPdfs() {
    setLoading(true)
    const { data } = await supabase
      .from('standard_pdfs').select('*')
      .eq('standard_type', type).order('category').order('name')
    if (data) {
      setPdfs(data)
      setCategories([...new Set(data.map((p: StandardPdf) => p.category).filter(Boolean))])
    }
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const path = `standards/${type}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('pdfs').upload(path, file, { upsert: false })
      if (upErr) { console.error(upErr); continue }
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path)
      await supabase.from('standard_pdfs').insert({
        name: file.name.replace(/\.pdf$/i, ''),
        standard_type: type,
        category: type === 'eurocode' ? t('std_viewer_default_cat_ec') : t('std_viewer_default_cat_tcvn'),
        file_url: publicUrl,
      })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    loadPdfs()
  }

  async function handleDelete(pdf: StandardPdf) {
    if (!confirm(`${t('std_delete_confirm')} "${pdf.name}"?`)) return
    const pathMatch = pdf.file_url.match(/\/pdfs\/(.+)$/)
    if (pathMatch) await supabase.storage.from('pdfs').remove([decodeURIComponent(pathMatch[1])])
    await supabase.from('standard_pdfs').delete().eq('id', pdf.id)
    loadPdfs()
  }

  const allLabel = t('std_category_all')
  const q = searchQuery.toLowerCase().trim()
  const filtered = pdfs.filter(p => {
    const matchCat = selectedCategory === '__all__' || p.category === selectedCategory
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  if (previewPdf) {
    return <SecurePdfViewer url={previewPdf.file_url} name={previewPdf.name} onClose={() => setPreviewPdf(null)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#1e293b' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t(type === 'eurocode' ? 'std_search_ec' : 'std_search_tcvn')}
            style={{ width: '100%', padding: '7px 28px 7px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ key: '__all__', label: allLabel }, ...categories.map(c => ({ key: c, label: c }))].map(item => (
            <button key={item.key} onClick={() => setSelectedCategory(item.key)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: selectedCategory === item.key ? 700 : 400, border: `1px solid ${selectedCategory === item.key ? accentColor : '#e2e8f0'}`, background: selectedCategory === item.key ? accentColor : 'transparent', color: selectedCategory === item.key ? '#fff' : '#1e293b', cursor: 'pointer' }}>
              {item.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handleUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              style={{ padding: '7px 14px', borderRadius: 8, background: accentColor, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: uploading ? 0.6 : 1 }}>
              {uploading ? t('std_uploading') : t('std_upload_btn')}
            </button>
          </>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#1e293b', fontSize: 13 }}>{t('std_loading')}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#1e293b' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{pdfs.length === 0 ? t('std_empty_pdfs') : t('std_empty_results')}</p>
            {isAdmin && pdfs.length === 0 && <p style={{ fontSize: 12, marginTop: 4 }}>{t('std_empty_hint')}</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {filtered.map(pdf => (
              <PdfCard key={pdf.id} pdf={pdf} accentColor={accentColor} isAdmin={isAdmin}
                onOpen={() => setPreviewPdf(pdf)}
                onDelete={() => handleDelete(pdf)}
              />
            ))}
          </div>
        )}
        {pageKey && <PageDiscussion pageKey={pageKey} />}
      </div>
    </div>
  )
}

