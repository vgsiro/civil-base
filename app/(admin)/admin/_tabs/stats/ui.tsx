'use client'
import type { DayCount } from '../../_lib/types'

export function LineChart({ title, data, color }: { title: string; data: DayCount[]; color: string }) {
  const W = 460, H = 120, PAD = { t: 10, r: 10, b: 28, l: 32 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b
  const max = Math.max(...data.map(d => d.count), 1)
  const pts = data.map((d, i) => {
    const x = PAD.l + (i / (data.length - 1)) * iW
    const y = PAD.t + iH - (d.count / max) * iH
    return `${x},${y}`
  }).join(' ')
  const area = `M ${PAD.l},${PAD.t + iH} ` +
    data.map((d, i) => `L ${PAD.l + (i / (data.length - 1)) * iW},${PAD.t + iH - (d.count / max) * iH}`).join(' ') +
    ` L ${PAD.l + iW},${PAD.t + iH} Z`
  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1]
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.t + iH - t * iH
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#334155" strokeWidth={0.5} />
              <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#475569">{Math.round(t * max)}</text>
            </g>
          )
        })}
        <path d={area} fill={color} fillOpacity={0.12} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {data.map((d, i) => d.count > 0 && (
          <circle key={i} cx={PAD.l + (i / (data.length - 1)) * iW} cy={PAD.t + iH - (d.count / max) * iH} r={3} fill={color} />
        ))}
        {labelIdxs.map(i => (
          <text key={i} x={PAD.l + (i / (data.length - 1)) * iW} y={H - 4} textAnchor="middle" fontSize={9} fill="#475569">
            {data[i]?.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function BarChart({ title, data, color }: { title: string; data: DayCount[]; color: string }) {
  const W = 460, H = 120, PAD = { t: 10, r: 10, b: 28, l: 32 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b
  const max = Math.max(...data.map(d => d.count), 1)
  const barW = Math.max(2, iW / data.length - 2)
  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1]
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[0, 0.5, 1].map(t => {
          const y = PAD.t + iH - t * iH
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#334155" strokeWidth={0.5} />
              <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#475569">{Math.round(t * max)}</text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const x = PAD.l + (i / data.length) * iW + 1
          const barH = (d.count / max) * iH
          return <rect key={i} x={x} y={PAD.t + iH - barH} width={barW} height={Math.max(barH, 0)} fill={color} fillOpacity={0.75} rx={2} />
        })}
        {labelIdxs.map(i => (
          <text key={i} x={PAD.l + (i / data.length) * iW + barW / 2 + 1} y={H - 4} textAnchor="middle" fontSize={9} fill="#475569">
            {data[i]?.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 44, cx = 64, cy = 64, strokeW = 18
  let cumAngle = -Math.PI / 2
  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(cumAngle)
    const y1 = cy + R * Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx + R * Math.cos(cumAngle)
    const y2 = cy + R * Math.sin(cumAngle)
    const large = angle > Math.PI ? 1 : 0
    return { ...seg, path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`, angle }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={128} height={128} viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path key={i} d={arc.path} fill="none" stroke={arc.color} strokeWidth={strokeW} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cx - 7} textAnchor="middle" fontSize={16} fontWeight={800} fill="#f1f5f9">{total}</text>
        <text x={cx} y={cx + 8} textAnchor="middle" fontSize={8} fill="#64748b">users</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((seg, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{seg.label}</span>
            </div>
            <div style={{ paddingLeft: 14, fontSize: 20, fontWeight: 800, color: seg.color }}>
              {seg.value} <span style={{ fontSize: 11, fontWeight: 400, color: '#475569' }}>({Math.round(seg.value / total * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
