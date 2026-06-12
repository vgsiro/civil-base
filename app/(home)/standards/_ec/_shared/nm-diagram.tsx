'use client'
import { Ec2RectResult } from '../ec2/tools/rect-section-check/rect-engine/rect-calc'
import { GREEN, BLUE, RED, n2 } from './ui-atoms'

export function NMDiagram({ res, NEd, MEd, mLabel }: { res: Ec2RectResult; NEd: number; MEd: number; mLabel?: string }) {
  const W = 420, H = 340
  const padL = 70, padR = 24, padT = 20, padB = 56
  const gW = W - padL - padR, gH = H - padT - padB

  const allPts = res.nmCurve
  if (allPts.length < 4) return null

  const disp = (p: { N: number; M: number }) => ({ N: -p.N, M: p.M })
  const allDisp = allPts.map(disp)

  const NcompDisp = allDisp[0].N
  const NtensDisp = Math.min(...allDisp.map(p => p.N))
  const MRd0 = res.MRd0

  const adRaw: { N: number; M: number }[] = []
  let peakM = 0
  for (const p of allDisp) {
    if (p.M <= 0) continue
    if (adRaw.length > 5 && p.M < peakM * 0.8) break
    if (Math.abs(p.N) < 20) continue
    peakM = Math.max(peakM, p.M)
    adRaw.push(p)
    if (adRaw.length > 200) break
  }
  const minM = peakM * 0.04
  const adPts = adRaw.filter(p => p.M >= minM)

  const pb = MRd0 > 0 ? { N: 0, M: MRd0 } : null
  let dispPts: { N: number; M: number }[]
  if (pb) {
    const splitIdx = adPts.findIndex(p => p.N <= 0)
    const before = splitIdx === -1 ? adPts : adPts.slice(0, splitIdx)
    const after  = splitIdx === -1 ? []    : adPts.slice(splitIdx)
    dispPts = [{ N: NcompDisp, M: 0 }, ...before, pb, ...after, { N: NtensDisp, M: 0 }]
  } else {
    dispPts = [{ N: NcompDisp, M: 0 }, ...adPts, { N: NtensDisp, M: 0 }]
  }
  const rawMaxM = Math.max(...dispPts.map(p => p.M))

  const pf = 0.06
  const rangeN = (NcompDisp - NtensDisp) || 1
  const yTop = NcompDisp + rangeN * pf
  const yBot = NtensDisp - rangeN * pf
  const xMax = rawMaxM * (1 + pf)

  const toX = (M: number) => padL + (M / xMax) * gW
  const toY = (N: number) => padT + ((yTop - N) / (yTop - yBot)) * gH

  function smoothPath(pts: { N: number; M: number }[]): string {
    if (pts.length < 2) return ''
    const xy = pts.map(p => [toX(p.M), toY(p.N)] as [number, number])
    const n = xy.length

    const t = new Array(n).fill(0)
    for (let i = 1; i < n; i++) {
      const dx = xy[i][0] - xy[i - 1][0], dy = xy[i][1] - xy[i - 1][1]
      t[i] = t[i - 1] + Math.sqrt(dx * dx + dy * dy) || 1e-6
    }

    function solveSpline(vals: number[]): number[] {
      const h = t.slice(1).map((ti, i) => ti - t[i])
      const m = n
      const a = new Array(m).fill(0)
      const b = new Array(m).fill(1)
      const c = new Array(m).fill(0)
      const r = new Array(m).fill(0)
      for (let i = 1; i < m - 1; i++) {
        a[i] = h[i - 1]
        b[i] = 2 * (h[i - 1] + h[i])
        c[i] = h[i]
        r[i] = 3 * ((vals[i + 1] - vals[i]) / h[i] - (vals[i] - vals[i - 1]) / h[i - 1])
      }
      b[0] = 1; c[0] = 0; r[0] = 0
      a[m - 1] = 0; b[m - 1] = 1; r[m - 1] = 0
      for (let i = 1; i < m; i++) {
        const w = a[i] / b[i - 1]
        b[i] -= w * c[i - 1]
        r[i] -= w * r[i - 1]
      }
      const k = new Array(m).fill(0)
      k[m - 1] = r[m - 1] / b[m - 1]
      for (let i = m - 2; i >= 0; i--) k[i] = (r[i] - c[i] * k[i + 1]) / b[i]
      return k
    }

    const kx = solveSpline(xy.map(p => p[0]))
    const ky = solveSpline(xy.map(p => p[1]))

    let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`
    for (let i = 0; i < n - 1; i++) {
      const h = t[i + 1] - t[i]
      const dx1 = (xy[i + 1][0] - xy[i][0]) / h - h * (2 * kx[i] + kx[i + 1]) / 3
      const dy1 = (xy[i + 1][1] - xy[i][1]) / h - h * (2 * ky[i] + ky[i + 1]) / 3
      const dx2 = (xy[i + 1][0] - xy[i][0]) / h + h * (kx[i] + 2 * kx[i + 1]) / 3
      const dy2 = (xy[i + 1][1] - xy[i][1]) / h + h * (ky[i] + 2 * ky[i + 1]) / 3
      const cp1x = xy[i][0]     + dx1 * h / 3
      const cp1y = xy[i][1]     + dy1 * h / 3
      const cp2x = xy[i + 1][0] - dx2 * h / 3
      const cp2y = xy[i + 1][1] - dy2 * h / 3
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${xy[i + 1][0].toFixed(1)},${xy[i + 1][1].toFixed(1)}`
    }
    return d
  }

  const curvePath = smoothPath(dispPts)
  const fillPath  = curvePath + ` L${padL},${toY(NtensDisp).toFixed(1)} L${padL},${toY(NcompDisp).toFixed(1)} Z`

  const NEdDisp = -NEd
  const dx = toX(Math.abs(MEd)), dy = toY(NEdDisp)

  const MRdAtN = (() => {
    const NDisp = NEdDisp
    if (NDisp > NcompDisp || NDisp < NtensDisp) return 0
    const sorted = [...dispPts].sort((a, b) => b.N - a.N)
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].N >= NDisp && sorted[i + 1].N <= NDisp) {
        const t = (NDisp - sorted[i].N) / (sorted[i + 1].N - sorted[i].N)
        return sorted[i].M + t * (sorted[i + 1].M - sorted[i].M)
      }
    }
    return 0
  })()
  const inside   = NEdDisp <= NcompDisp && NEdDisp >= NtensDisp && Math.abs(MEd) <= MRdAtN
  const ptColor  = inside ? GREEN : RED
  const ptMmax   = dispPts.reduce((a, b) => b.M > a.M ? b : a)

  function niceTicks(lo: number, hi: number, n = 6): number[] {
    const raw = (hi - lo) / n
    const mag  = Math.pow(10, Math.floor(Math.log10(Math.abs(raw) || 1)))
    const step = [1, 2, 2.5, 5, 10].map(c => c * mag).find(s => s >= raw) ?? mag
    const ticks: number[] = []
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 0.01; v += step)
      ticks.push(+(v.toFixed(10)))
    return ticks
  }
  const ticksN = niceTicks(yBot, yTop, 6)
  const ticksM = niceTicks(0, xMax, 5)
  const fmt    = (v: number) => v.toFixed(0)
  const y0     = toY(0)

  return (
    <svg width={W} height={H} style={{ display: 'block', fontFamily: 'inherit', overflow: 'visible' }}>
      <text x={padL + gW / 2} y={H - 14} fontSize={11} fill="#1e293b" textAnchor="middle" fontWeight={700}>
        N–M Interaction Diagram
      </text>

      {ticksN.map((N, i) => {
        const y = toY(N)
        if (y < padT - 1 || y > padT + gH + 1) return null
        return <g key={`gn${i}`}>
          <line x1={padL} y1={y} x2={padL + gW} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#94a3b8" strokeWidth={1} />
          <text x={padL - 7} y={y + 3.5} fontSize={10} fill="#64748b" textAnchor="end">{fmt(N)}</text>
        </g>
      })}
      {ticksM.filter(M => M > 0).map((M, i) => {
        const x = toX(M)
        if (x < padL - 1 || x > padL + gW + 1) return null
        return <g key={`gm${i}`}>
          <line x1={x} y1={padT} x2={x} y2={padT + gH} stroke="#f1f5f9" strokeWidth={1} />
          <line x1={x} y1={y0 - 3} x2={x} y2={y0 + 3} stroke="#94a3b8" strokeWidth={1} />
          <text x={x} y={y0 + 14} fontSize={10} fill="#64748b" textAnchor="middle">{fmt(M)}</text>
        </g>
      })}

      <text x={padL - 5} y={y0 + 4} fontSize={9} fill="#64748b" textAnchor="end">0</text>

      <path d={fillPath} fill={`${GREEN}22`} stroke="none" />
      <path d={curvePath} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      <line x1={padL} y1={padT - 8} x2={padL} y2={padT + gH + 6} stroke="#334155" strokeWidth={1.5} />
      <polygon points={`${padL},${padT - 11} ${padL - 4},${padT - 2} ${padL + 4},${padT - 2}`} fill="#334155" />
      <line x1={padL - 4} y1={y0} x2={padL + gW + 4} y2={y0} stroke="#334155" strokeWidth={1.5} />
      <polygon points={`${padL + gW + 7},${y0} ${padL + gW},${y0 - 4} ${padL + gW},${y0 + 4}`} fill="#334155" />

      <text x={padL - 52} y={padT + gH / 2} fontSize={11} fill="#334155" textAnchor="middle"
        transform={`rotate(-90,${padL - 52},${padT + gH / 2})`}>N [kN]</text>
      <text x={padL + gW + 12} y={y0 - 5} fontSize={11} fill="#334155" textAnchor="start">M [kNm]</text>

      {(() => {
        const cy = toY(NcompDisp)
        return <>
          <circle cx={padL} cy={cy} r={4.5} fill={BLUE} stroke="#fff" strokeWidth={1} />
          <text x={padL + 8} y={padT + 10} fontSize={10} fill={BLUE} textAnchor="start" fontWeight={700}>
            N<tspan fontSize={8} dy={2}>Rd,c</tspan><tspan dy={-2}> = {fmt(NcompDisp)} kN</tspan>
          </text>
        </>
      })()}

      {(() => {
        const cy = toY(NtensDisp)
        return <>
          <circle cx={padL} cy={cy} r={4.5} fill={BLUE} stroke="#fff" strokeWidth={1} />
          <text x={padL + 8} y={padT + gH - 4} fontSize={10} fill={BLUE} textAnchor="start" fontWeight={700}>
            N<tspan fontSize={8} dy={2}>Rd,t</tspan><tspan dy={-2}> = {fmt(NtensDisp)} kN</tspan>
          </text>
        </>
      })()}

      {(() => {
        const mx = toX(ptMmax.M), my = toY(ptMmax.N)
        return <>
          <circle cx={mx} cy={my} r={4.5} fill={BLUE} stroke="#fff" strokeWidth={1} />
          <text x={mx + 8} y={my + 4} fontSize={10} fill={BLUE} textAnchor="start" fontWeight={700}>
            M<tspan fontSize={8} dy={2}>Rd</tspan><tspan dy={-2}> = {fmt(ptMmax.M)} kNm</tspan>
          </text>
        </>
      })()}

      {res.MRd0 > 0 && (() => {
        const mx = toX(res.MRd0), my = toY(0)
        const labelY = my + 22
        return <>
          <circle cx={mx} cy={my} r={4.5} fill="#7c3aed" stroke="#fff" strokeWidth={1} />
          <text x={mx} y={labelY} fontSize={10} fill="#7c3aed" textAnchor="middle" fontWeight={700}>
            M<tspan fontSize={8} dy={2}>Rd,0</tspan><tspan dy={-2}> = {fmt(res.MRd0)}</tspan>
          </text>
        </>
      })()}

      {dx >= padL && dx <= padL + gW && dy >= padT && dy <= padT + gH ? (() => {
        const labelAbove = dy > padT + gH / 2
        const labelY1 = labelAbove ? dy - 18 : dy + 14
        const labelY2 = labelAbove ? dy - 5  : dy + 27
        const nearRight = dx > padL + gW * 0.6
        const anchor = nearRight ? 'end' : 'start'
        const lx = nearRight ? dx - 9 : dx + 9
        return <>
          <line x1={padL} y1={dy} x2={dx} y2={dy} stroke={ptColor} strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
          <line x1={dx} y1={y0} x2={dx} y2={dy} stroke={ptColor} strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
          <circle cx={dx} cy={dy} r={5.5} fill={ptColor} stroke="#fff" strokeWidth={1.5} />
          <text x={lx} y={labelY1} fontSize={11} fill={ptColor} fontWeight={700} textAnchor={anchor}>
            N = {fmt(NEdDisp)} kN
          </text>
          <text x={lx} y={labelY2} fontSize={11} fill={ptColor} fontWeight={700} textAnchor={anchor}>
            {mLabel
              ? <>M<tspan fontSize={8} dy={2}>Ed,tot</tspan><tspan dy={-2}> = {fmt(Math.abs(MEd))} kNm</tspan></>
              : <>M = {fmt(Math.abs(MEd))} kNm</>
            }
          </text>
        </>
      })() : (
        <text x={padL + gW / 2} y={padT + gH / 2} fontSize={11} fill={RED} textAnchor="middle">
          ⚠ Design point outside envelope
        </text>
      )}
    </svg>
  )
}

