'use client'
import { useState } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { Globe, Users, Lock, X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PostWithProfile, PostVisibility } from '../types'
import { useTranslation } from '../i18n/LanguageContext'

export default function EditPostModal({ post, onClose, onSaved }: {
  post: PostWithProfile
  onClose: () => void
  onSaved: (body: string, visibility: PostVisibility) => void
}) {
  useScrollLock()
  const { t } = useTranslation()
  const VISIBILITY: Record<PostVisibility, { icon: React.ReactNode; label: string }> = {
    public:  { icon: <Globe size={11} />,  label: t('visibility_public') },
    friends: { icon: <Users size={11} />,  label: t('visibility_friends') },
    private:      { icon: <Lock size={11} />,   label: t('visibility_private') },
    admin_hidden:  { icon: <Lock size={11} color="#ef4444" />,         label: 'Admin hidden' },
    warn_limited:  { icon: <AlertTriangle size={11} color="#f59e0b" />, label: 'Limited' },
  }
  const [body, setBody] = useState(post.body ?? '')
  const [vis, setVis] = useState<PostVisibility>((post.visibility as PostVisibility) ?? 'public')
  const [saving, setSaving] = useState(false)
  const isHiddenByAdmin = (post.visibility as string) === 'admin_hidden' || !!(post as any).is_hidden_by_admin

  async function save() {
    setSaving(true)
    // If hidden by admin, only allow body edits — visibility stays private
    const newVis = isHiddenByAdmin ? 'private' : vis
    await supabase.from('posts').update({ body: body.trim(), visibility: newVis }).eq('id', post.id)
    setSaving(false)
    onSaved(body.trim(), newVis as PostVisibility)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1201, background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '90vw', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #e4e6eb' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{t('modal_edit_post')}</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0f2f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#050505" />
          </button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={5}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e4e6eb', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const, lineHeight: 1.6 }}
            onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e4e6eb')} />
          {isHiddenByAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
              <Lock size={13} color="#dc2626" />
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Visibility locked by admin — this post is only visible to you</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {(['public', 'friends', 'private'] as PostVisibility[]).map(v => (
                <button key={v} onClick={() => setVis(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${vis === v ? '#3b82f6' : '#e2e8f0'}`, background: vis === v ? '#eff6ff' : '#f8fafc', color: vis === v ? '#3b82f6' : '#64748b', fontSize: 12, fontWeight: vis === v ? 700 : 400, cursor: 'pointer' }}>
                  {VISIBILITY[v].icon} {VISIBILITY[v].label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #e4e6eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('btn_cancel')}</button>
          <button onClick={save} disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? t('btn_saving') : t('btn_save')}
          </button>
        </div>
      </div>
    </>
  )
}
