'use client'
import { useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DaySeries { date: string; count: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDate(iso: string, totalDays: number) {
  const d = new Date(iso)
  if (totalDays <= 90) return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

// ── Big line chart ────────────────────────────────────────────────────────────

export default function BigLineChart({ data, color, totalDays }: { data: DaySeries[]; color: string; totalDays: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 800, H = 220
  const PAD = { t: 20, r: 20, b: 40, l: 48 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b
  const max = Math.max(...data.map(d => d.count), 1)

  const px = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * iW
  const py = (v: number) => PAD.t + iH - (v / max) * iH

  const linePts = data.map((d, i) => `${px(i)},${py(d.count)}`).join(' ')
  const areaPath =
    `M ${px(0)},${PAD.t + iH} ` +
    data.map((d, i) => `L ${px(i)},${py(d.count)}`).join(' ') +
    ` L ${px(data.length - 1)},${PAD.t + iH} Z`

  const xLabelCount = Math.min(7, data.length)
  const xLabelIdxs = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round(i * (data.length - 1) / Math.max(xLabelCount - 1, 1))
  )

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = (e.clientX - rect.left) / rect.width * W
    const idx = Math.round(((relX - PAD.l) / iW) * (data.length - 1))
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const hovered = hoverIdx !== null ? data[hoverIdx] : null
  const gradId = `grad-${color.replace('#', '')}`

  return (
    <div style={{ position: 'relative' as const }}>
      {hovered && hoverIdx !== null && (
        <div style={{
          position: 'absolute' as const,
          left: `${(px(hoverIdx) / W) * 100}%`,
          top: 0,
          transform: 'translateX(-50%)',
          background: '#0f172a', border: '1px solid #334155',
          borderRadius: 8, padding: '6px 12px',
          fontSize: 12, color: '#f1f5f9', pointerEvents: 'none' as const,
          whiteSpace: 'nowrap' as const, zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 800, color, fontSize: 17 }}>{hovered.count.toLocaleString()}</div>
          <div style={{ color: '#64748b', fontSize: 11 }}>{formatDate(hovered.date, totalDays)}</div>
        </div>
      )}

      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.t + iH - t * iH
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#1e293b" strokeWidth={1} />
              <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#475569">
                {Math.round(t * max)}
              </text>
            </g>
          )
        })}

        <line x1={PAD.l} y1={PAD.t + iH} x2={PAD.l + iW} y2={PAD.t + iH} stroke="#334155" strokeWidth={1} />
        <path d={areaPath} fill={`url(#${gradId})`} />
        <polyline points={linePts} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

        {hoverIdx !== null && (
          <>
            <line x1={px(hoverIdx)} y1={PAD.t} x2={px(hoverIdx)} y2={PAD.t + iH}
              stroke="#475569" strokeWidth={1} strokeDasharray="4 3" />
            <circle cx={px(hoverIdx)} cy={py(data[hoverIdx].count)} r={5}
              fill={color} stroke="#0f172a" strokeWidth={2} />
          </>
        )}

        {xLabelIdxs.map(i => (
          <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#475569">
            {formatDate(data[i]?.date ?? '', totalDays)}
          </text>
        ))}
      </svg>
    </div>
  )
}
