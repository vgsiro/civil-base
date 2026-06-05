'use client'
import { useEffect, useRef, useState } from 'react'
import { Users, BadgeCheck, FileText, Eye, TrendingUp, ChevronDown, Check, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import BigLineChart, { type DaySeries } from './BigLineChart'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props { simple?: boolean }

type RangeMode =
  | { type: 'preset'; days: number; label: string }
  | { type: 'custom'; from: string; to: string }
  | { type: 'all' }

// ── Metrics ───────────────────────────────────────────────────────────────────

const METRICS = [
  { id: 'views',    label: 'Total access',           color: '#3b82f6', icon: Eye },
  { id: 'members',  label: 'Total users',           color: '#10b981', icon: Users },
  { id: 'posts',    label: 'New posts',             color: '#f59e0b', icon: FileText },
  { id: 'verified', label: 'Verified Professionals', color: '#8b5cf6', icon: BadgeCheck },
] as const

type MetricId = typeof METRICS[number]['id']

const PRESETS = [
  { days: 7,   label: 'Last 7 days' },
  { days: 14,  label: 'Last 14 days' },
  { days: 28,  label: 'Last 28 days' },
  { days: 90,  label: 'Last 90 days' },
  { days: 180, label: 'Last 180 days' },
  { days: 365, label: 'Last 365 days' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function toDayCountsFromRange(
  rows: { created_at: string }[] | null,
  fromIso: string,
  toIso: string,
): DaySeries[] {
  const map: Record<string, number> = {}
  const cur = new Date(fromIso)
  const end = new Date(toIso)
  while (cur <= end) {
    map[cur.toISOString().slice(0, 10)] = 0
    cur.setDate(cur.getDate() + 1)
  }
  for (const r of rows ?? []) {
    const key = r.created_at.slice(0, 10)
    if (key in map) map[key]++
  }
  const all = Object.entries(map).map(([date, count]) => ({ date, count }))
  // Trim leading zero days so chart starts from first day with data
  const firstNonZero = all.findIndex(d => d.count > 0)
  return firstNonZero > 0 ? all.slice(firstNonZero) : all
}

function rangeToFromTo(mode: RangeMode): { from: string; to: string } {
  const today = isoToday()
  if (mode.type === 'all') return { from: '2026-06-01', to: today }
  if (mode.type === 'custom') return { from: mode.from, to: mode.to }
  const d = new Date()
  d.setDate(d.getDate() - mode.days)
  return { from: d.toISOString().slice(0, 10), to: today }
}

function rangeDayCount(mode: RangeMode): number {
  const { from, to } = rangeToFromTo(mode)
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1)
}

function rangeLabel(mode: RangeMode): string {
  if (mode.type === 'all') return 'All time'
  if (mode.type === 'preset') return mode.label
  return `${mode.from} → ${mode.to}`
}

// ── Metric dropdown ───────────────────────────────────────────────────────────

function MetricDropdown({ value, onChange }: { value: MetricId; onChange: (v: MetricId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = METRICS.find(m => m.id === value)!

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' as const }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
        borderRadius: 8, border: '1px solid #334155', background: '#0f172a',
        color: '#e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
      }}>
        <active.icon size={13} color={active.color} />
        {active.label}
        <ChevronDown size={14} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, zIndex: 60,
          background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 170, overflow: 'hidden',
        }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '9px 14px', border: 'none',
              background: m.id === value ? '#3b82f610' : 'none',
              color: m.id === value ? '#60a5fa' : '#e2e8f0',
              fontSize: 13, cursor: 'pointer', textAlign: 'left' as const,
            }}
              onMouseEnter={e => { if (m.id !== value) e.currentTarget.style.background = '#ffffff08' }}
              onMouseLeave={e => { if (m.id !== value) e.currentTarget.style.background = 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <m.icon size={13} color={m.color} /> {m.label}
              </span>
              {m.id === value && <Check size={13} color="#60a5fa" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Date range picker dropdown ────────────────────────────────────────────────

function DateRangeDropdown({ value, onChange }: { value: RangeMode; onChange: (v: RangeMode) => void }) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(isoToday)
  const [customTo, setCustomTo] = useState(isoToday)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function applyCustom() {
    if (!customFrom || !customTo || customFrom > customTo) return
    onChange({ type: 'custom', from: customFrom, to: customTo })
    setOpen(false)
  }

  const isCustomActive = value.type === 'custom'

  return (
    <div ref={ref} style={{ position: 'relative' as const }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
        borderRadius: 8, border: '1px solid #334155', background: '#0f172a',
        color: '#e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
      }}>
        <Calendar size={13} color="#64748b" />
        {rangeLabel(value)}
        <ChevronDown size={14} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0, zIndex: 60,
          background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 260, overflow: 'hidden',
        }}>
          {/* Presets */}
          <div style={{ padding: '6px 0' }}>
            {/* All time */}
            <button onClick={() => { onChange({ type: 'all' }); setOpen(false) }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '9px 14px', border: 'none',
              background: value.type === 'all' ? '#3b82f610' : 'none',
              color: value.type === 'all' ? '#60a5fa' : '#e2e8f0',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const,
            }}
              onMouseEnter={e => { if (value.type !== 'all') e.currentTarget.style.background = '#ffffff08' }}
              onMouseLeave={e => { if (value.type !== 'all') e.currentTarget.style.background = 'none' }}>
              All time
              {value.type === 'all' && <Check size={13} color="#60a5fa" />}
            </button>

            <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />

            {PRESETS.map(p => {
              const active = value.type === 'preset' && value.days === p.days
              return (
                <button key={p.days} onClick={() => { onChange({ type: 'preset', days: p.days, label: p.label }); setOpen(false) }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 14px', border: 'none',
                  background: active ? '#3b82f610' : 'none',
                  color: active ? '#60a5fa' : '#e2e8f0',
                  fontSize: 13, cursor: 'pointer', textAlign: 'left' as const,
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ffffff08' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}>
                  {p.label}
                  {active && <Check size={13} color="#60a5fa" />}
                </button>
              )
            })}
          </div>

          {/* Custom date range */}
          <div style={{ borderTop: '1px solid #334155', padding: '12px 14px', background: isCustomActive ? '#3b82f608' : 'transparent' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 10 }}>
              Custom range
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>From</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || isoToday()}
                  onChange={e => setCustomFrom(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    border: '1px solid #334155', background: '#0f172a',
                    color: '#e2e8f0', fontSize: 13, outline: 'none',
                    colorScheme: 'dark',
                    boxSizing: 'border-box' as const,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>To</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={isoToday()}
                  onChange={e => setCustomTo(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: 6,
                    border: '1px solid #334155', background: '#0f172a',
                    color: '#e2e8f0', fontSize: 13, outline: 'none',
                    colorScheme: 'dark',
                    boxSizing: 'border-box' as const,
                  }}
                />
              </div>
              <button
                onClick={applyCustom}
                disabled={!customFrom || !customTo || customFrom > customTo}
                style={{
                  padding: '7px 0', borderRadius: 7, border: 'none',
                  background: customFrom && customTo && customFrom <= customTo ? '#3b82f6' : '#334155',
                  color: customFrom && customTo && customFrom <= customTo ? '#fff' : '#64748b',
                  fontSize: 13, fontWeight: 700, cursor: customFrom && customTo && customFrom <= customTo ? 'pointer' : 'default',
                  marginTop: 2,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommunityStats({ simple = false }: Props) {
  const [metric, setMetric] = useState<MetricId>('views')
  const [rangeMode, setRangeMode] = useState<RangeMode>({ type: 'all' })
  const [allTime, setAllTime] = useState<Record<MetricId, number> | null>(null)
  const [series, setSeries] = useState<DaySeries[] | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const [{ count: views }, { count: members }, { count: verified }, { count: posts }] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
      ])
      setAllTime({ views: views ?? 0, members: members ?? 0, verified: verified ?? 0, posts: posts ?? 0 })
    }
    load()
  }, [])

  useEffect(() => {
    if (simple) return
    async function load() {
      setSeries(null)
      const { from, to } = rangeToFromTo(rangeMode)
      const fromIso = new Date(from); fromIso.setHours(0, 0, 0, 0)
      const toIso = new Date(to); toIso.setHours(23, 59, 59, 999)

      let rows: { created_at: string }[] | null = null
      const q = (table: string, extra?: (q: any) => any) => {
        let base = supabase.from(table).select('created_at')
          .gte('created_at', fromIso.toISOString())
          .lte('created_at', toIso.toISOString())
        if (extra) base = extra(base)
        return base
      }

      if (metric === 'views')    { const { data } = await q('page_views'); rows = data }
      else if (metric === 'members') { const { data } = await q('profiles'); rows = data }
      else if (metric === 'posts')   { const { data } = await q('posts'); rows = data }
      else if (metric === 'verified'){ const { data } = await q('profiles', b => b.eq('is_verified', true)); rows = data }

      setSeries(toDayCountsFromRange(rows, from, to))
      setTotal(rows?.length ?? 0)
    }
    load()
  }, [metric, rangeMode, simple])

  // ── Simple sidebar ───────────────────────────────────────────────────────────
  if (simple) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#050505', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={15} color="#3b82f6" /> Community
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {METRICS.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#65676b' }}>
                <m.icon size={14} color={m.color} /> {m.label}
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: m.color }}>
                {allTime?.[m.id] != null ? allTime[m.id].toLocaleString() : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Admin analytics ──────────────────────────────────────────────────────────
  const activeMeta = METRICS.find(m => m.id === metric)!
  const totalDays = rangeDayCount(rangeMode)

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 30, fontWeight: 900, color: activeMeta.color, lineHeight: 1 }}>
            {total != null ? total.toLocaleString() : '—'}
          </span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{activeMeta.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <MetricDropdown value={metric} onChange={setMetric} />
          <DateRangeDropdown value={rangeMode} onChange={setRangeMode} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ minHeight: 220 }}>
        {series ? (
          <BigLineChart data={series} color={activeMeta.color} totalDays={totalDays} />
        ) : (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
            Loading…
          </div>
        )}
      </div>

      {/* All-time summary strip */}
      {allTime && (
        <div style={{ display: 'flex', borderTop: '1px solid #334155', marginTop: 20, paddingTop: 16 }}>
          {METRICS.map((m, i) => (
            <button key={m.id} onClick={() => setMetric(m.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
              padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
              borderRight: i < METRICS.length - 1 ? '1px solid #334155' : 'none',
              borderBottom: metric === m.id ? `2px solid ${m.color}` : '2px solid transparent',
              transition: 'border-color 0.15s',
            }}>
              <span style={{ fontSize: 11, color: metric === m.id ? m.color : '#64748b', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {m.label}
              </span>
              <span style={{ fontSize: 20, fontWeight: 900, color: metric === m.id ? m.color : '#94a3b8' }}>
                {allTime[m.id].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
