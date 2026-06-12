'use client'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Warning, RangeMode } from '../../_lib/types'
import { fetchWarnings, expireWarning } from './data'
import { UserWarningCard } from './ui'

interface Props {
  warnings: Warning[]
  setWarnings: React.Dispatch<React.SetStateAction<Warning[]>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  range: RangeMode
}

export default function WarningsTab({ warnings, setWarnings, loading, setLoading, range }: Props) {
  const now = new Date()
  const activeWarnings = warnings.filter(w => new Date(w.expires_at) > now)
  const expiredWarnings = warnings.filter(w => new Date(w.expires_at) <= now)
  const byUser: Record<string, Warning[]> = {}
  activeWarnings.forEach(w => { if (!byUser[w.user_id]) byUser[w.user_id] = []; byUser[w.user_id].push(w) })
  const bannedCount = Object.values(byUser).filter(ws => ws.length >= 3).length

  async function refresh() {
    setLoading(true)
    setWarnings(await fetchWarnings(supabase, range))
    setLoading(false)
  }

  async function handleUnwarn(warningId: string, userId: string) {
    const now = await expireWarning(supabase, warningId, userId, warnings)
    setWarnings(prev => prev.map(w => w.id === warningId ? { ...w, expires_at: now } : w))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Warnings</div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Active warnings', value: activeWarnings.length, color: '#fbbf24' },
          { label: 'Banned users (3+)', value: bannedCount, color: '#f87171' },
          { label: 'Expired (cleared)', value: expiredWarnings.length, color: '#475569' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>{c.label} </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: c.color }}>{c.value}</span>
          </div>
        ))}
      </div>

      {loading && <div style={{ color: '#64748b', fontSize: 14 }}>Loading…</div>}
      {!loading && warnings.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>No warnings issued yet.</div>
      )}

      {Object.entries(byUser).map(([userId, userWarnings]) => (
        <UserWarningCard key={userId} userId={userId} warnings={userWarnings} now={now} onUnwarn={handleUnwarn} />
      ))}

      {expiredWarnings.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden', opacity: 0.5 }}>
          <div style={{ padding: '10px 16px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
            {expiredWarnings.length} expired warning{expiredWarnings.length > 1 ? 's' : ''} (auto-cleared after 14 days)
          </div>
        </div>
      )}
    </div>
  )
}
