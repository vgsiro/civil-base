'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../../../i18n/LanguageContext'

interface Props {
  pageKey: string
  userId: string | null
  initialCount: number
  initialGiven: boolean
}

export default function ThanksButton({ pageKey, userId, initialCount, initialGiven }: Props) {
  const { t } = useTranslation()
  const [given, setGiven] = useState(initialGiven)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setGiven(initialGiven)
    setCount(initialCount)
  }, [initialCount, initialGiven])

  async function toggle() {
    if (!userId) return
    setLoading(true)
    if (given) {
      setGiven(false)
      setCount(c => c - 1)
      await supabase.from('page_thanks').delete().eq('page_key', pageKey).eq('user_id', userId)
    } else {
      setGiven(true)
      setCount(c => c + 1)
      await supabase.from('page_thanks').insert({ page_key: pageKey, user_id: userId })
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !userId}
      title={!userId ? t('home_discussion_thanks_signin') : given ? t('home_discussion_thanks_remove') : t('home_discussion_thanks_give')}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 20,
        border: `1.5px solid ${given ? '#f59e0b' : '#e2e8f0'}`,
        background: given ? '#fffbeb' : '#fff',
        color: given ? '#b45309' : '#64748b',
        cursor: userId ? 'pointer' : 'default',
        fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (userId) e.currentTarget.style.background = given ? '#fef3c7' : '#f8fafc' }}
      onMouseLeave={e => { e.currentTarget.style.background = given ? '#fffbeb' : '#fff' }}
    >
      <span style={{ fontSize: 15 }}>🙏</span>
      {count > 0 && <span style={{ fontWeight: 700 }}>{count}</span>}
      <span>{t('home_discussion_thanks')}</span>
    </button>
  )
}
