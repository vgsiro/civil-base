'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SubscriptionTier } from '../../../../_types'
import { fetchToolAccess, updateToolTier, updateToolCopy, TOOL_LABELS, type ToolRow } from './data'
import { ToolsTable, ToolsLegend } from './ui'

export default function ToolsTab() {
  const [tools, setTools] = useState<ToolRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  async function refresh() {
    setLoading(true)
    const rows = await fetchToolAccess(supabase)
    setTools(rows)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleChange(toolId: string, field: 'min_tier' | 'details_tier', value: SubscriptionTier) {
    setSaving(toolId)
    try {
      await updateToolTier(supabase, toolId, field, value)
      setTools(prev => prev.map(t => t.tool_id === toolId ? { ...t, [field]: value } : t))
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`)
    }
    setSaving(null)
  }

  async function handleCopyChange(toolId: string, value: SubscriptionTier) {
    setSaving(toolId)
    try {
      await updateToolCopy(supabase, toolId, value)
      setTools(prev => prev.map(t => t.tool_id === toolId ? { ...t, copy_tier: value } : t))
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`)
    }
    setSaving(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Tool Access</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
            Set the minimum tier required to use each tool and to see its full details.
          </div>
        </div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, width: 'fit-content' }}>
        <ToolsLegend />
        <div style={{ position: 'relative' as const }}>
          <Search size={13} color="#475569" style={{ position: 'absolute' as const, left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools…"
            style={{ width: '100%', boxSizing: 'border-box' as const, paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 13, outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          <strong style={{ color: '#94a3b8' }}>Use (Results)</strong> — minimum tier to access the tool and see result summaries.{' '}
          <strong style={{ color: '#94a3b8' }}>Details</strong> — minimum tier to see full calculation breakdowns.{' '}
          <strong style={{ color: '#94a3b8' }}>Copy Details</strong> — minimum tier to select and copy detail text.
          Changes take effect immediately for all users.
        </div>
      </div>

      {loading
        ? <div style={{ padding: '48px', textAlign: 'center' as const, color: '#475569', fontSize: 14 }}>Loading…</div>
        : <ToolsTable
            tools={tools.filter(t => {
              const q = query.trim().toLowerCase()
              if (!q) return true
              return t.tool_id.toLowerCase().includes(q) || (TOOL_LABELS[t.tool_id] ?? '').toLowerCase().includes(q)
            })}
            saving={saving}
            onChangeTier={handleChange}
            onChangeCopy={handleCopyChange}
          />
      }
    </div>
  )
}
