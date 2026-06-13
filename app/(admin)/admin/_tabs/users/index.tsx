'use client'
import { useState } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { UserRow, Stats, RangeMode } from '../../_lib/types'
import { fetchUsers } from './data'
import { UserTableRow } from './ui'

interface Props {
  users: UserRow[]
  setUsers: React.Dispatch<React.SetStateAction<UserRow[]>>
  setStats: React.Dispatch<React.SetStateAction<Stats | null>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  range: RangeMode
}

type UserTab = 'professionals' | 'nonprofessionals' | 'unverified'

const HEADERS = ['User', 'Email', 'Profession', 'Subscription', 'Joined']

function UserTable({ rows, emptyText }: { rows: UserRow[]; emptyText: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const }}>
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {HEADERS.map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => <UserTableRow key={u.id} u={u} i={i} />)}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>{emptyText}</div>
      )}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #0f172a', fontSize: 11, color: '#334155' }}>
        {rows.length} user{rows.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default function UsersTab({ users, setUsers, setStats, loading, setLoading, range }: Props) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<UserTab>('professionals')

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.username?.toLowerCase().includes(q) ||
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.profession ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    )
  })

  const professionals    = filtered.filter(u => u.is_professional === true)
  const nonprofessionals = filtered.filter(u => u.is_professional === false)
  const unverified       = filtered.filter(u => u.is_professional === null)

  const TABS: { id: UserTab; label: string; count: number; color: string }[] = [
    { id: 'professionals',    label: 'Professionals',    count: professionals.length,    color: '#34d399' },
    { id: 'nonprofessionals', label: 'Non-professionals', count: nonprofessionals.length, color: '#fbbf24' },
    { id: 'unverified',       label: 'Unverified',        count: unverified.length,       color: '#64748b' },
  ]

  async function refresh() {
    setLoading(true)
    const data = await fetchUsers(supabase, range)
    setUsers(data)
    setLoading(false)
  }

  const rows = activeTab === 'professionals' ? professionals
    : activeTab === 'nonprofessionals' ? nonprofessionals
    : unverified

  const emptyText = activeTab === 'professionals' ? 'No verified professionals.'
    : activeTab === 'nonprofessionals' ? 'No verified non-professionals.'
    : 'No unverified users.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Users</div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', maxWidth: 360 }}>
        <Search size={14} color="#64748b" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, username, email, profession…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1e293b' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: '8px 8px 0 0',
            background: activeTab === t.id ? '#1e293b' : 'none',
            color: activeTab === t.id ? t.color : '#475569',
            borderBottom: activeTab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
            transition: 'all 0.12s',
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, background: activeTab === t.id ? t.color + '25' : '#1e293b', color: activeTab === t.id ? t.color : '#475569', borderRadius: 10, padding: '1px 6px' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#64748b', fontSize: 14, padding: '40px 0', textAlign: 'center' as const }}>Loading…</div>
      ) : (
        <UserTable rows={rows} emptyText={emptyText} />
      )}
    </div>
  )
}
