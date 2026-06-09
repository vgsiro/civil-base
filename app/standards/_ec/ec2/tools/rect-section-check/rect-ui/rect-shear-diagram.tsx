'use client'
import { Ec2RectInput } from '../rect-engine/rect-calc'
import { GREEN, BLUE } from '../../../../_shared/ui-atoms'

const ORANGE = '#b45309'
const RED    = '#dc2626'
const DARK   = '#1e293b'

export function ShearSectionDiagram({ inp }: { inp: Ec2RectInput }) {
  const padL = 60, padT = 34, padB = 60
  const MAX_BW = 260, MAX_BH = 320
  const ratio = inp.b / inp.h
  let bw: number, bh: number
  if (ratio >= MAX_BW / MAX_BH) { bw = MAX_BW; bh = Math.max(80, Math.round(bw / ratio)) }
  else { bh = MAX_BH; bw = Math.max(60, Math.round(bh * ratio)) }
  const W = padL + bw + 60
  const H = padT + bh + padB
  const scaleX = bw / inp.b
  const scaleY = bh / inp.h
  const stPhi = inp.stirrup_phi ?? 10
  const stS   = inp.stirrup_s   ?? 200

  const stThick = Math.max(2, Math.min(5, stPhi / 2.5))
  const stirrupPhi = (inp.stirrup_phi ?? 10) / 1000
  const sX = padL + (inp.c1 + stirrupPhi / 2) * scaleX
  const sW = bw - 2 * (inp.c1 + stirrupPhi / 2) * scaleX
  const sY = padT + (inp.c2 + stirrupPhi / 2) * scaleY
  const sH = bh - 2 * (inp.c2 + stirrupPhi / 2) * scaleY

  const r3 = Math.max(3, Math.min(6, (inp.phi3 / 1000) * scaleX * 8))
  const stirrupInnerX = sX + stThick / 2
  const stirrupInnerY = sY + stThick / 2

  function barCxL(r: number) { return stirrupInnerX + r }
  function barCxR(r: number) { return sX + sW - stThick / 2 - r }
  function barCyTop(r: number) { return stirrupInnerY + r }
  function barCyBot(r: number) { return sY + sH - stThick / 2 - r }

  function rowXs(n: number, r: number, sArr?: number[]): number[] {
    if (n <= 0) return []
    const x0 = barCxL(r)
    if (n === 1) return [x0]
    const xN = barCxR(r)
    if (n === 2) return [x0, xN]
    const totalSpanPx = xN - x0
    const placeableCount = n - 2
    let setSum = 0, autoCount = 0
    for (let j = 0; j < placeableCount; j++) {
      const sMm = sArr?.[j]
      if (sMm != null) setSum += (sMm / 1000) * scaleX
      else autoCount++
    }
    const autoSpPx = autoCount > 0 ? (totalSpanPx - setSum) / (autoCount + 1) : 0
    const xs: number[] = [x0]
    for (let j = 0; j < placeableCount; j++) {
      const sMm = sArr?.[j]
      xs.push(xs[j] + (sMm != null ? (sMm / 1000) * scaleX : autoSpPx))
    }
    xs.push(xN)
    return xs
  }

  const bars: { cx: number; cy: number; r: number; fill: string }[] = []

  function drawRow(row: typeof inp.rows1[0], r: number, cy: number, fill: string) {
    rowXs(row.n, r, row.s).forEach(cx => bars.push({ cx, cy, r, fill }))
  }

  const r1Cys: { cy: number; r: number }[] = []
  {
    let cy = barCyBot(Math.max(3, Math.min(8, (inp.rows1[0]?.phi ?? 20) / 1000 * scaleX * 8)))
    for (let i = 0; i < inp.rows1.length; i++) {
      const r = Math.max(3, Math.min(8, (inp.rows1[i].phi / 1000) * scaleX * 8))
      if (i > 0) {
        const prevR = r1Cys[i - 1].r
        const svPrev = inp.rows1[i - 1].sv
        cy -= svPrev != null ? (svPrev / 1000) * scaleY : prevR + r + 4
      }
      r1Cys.push({ cy, r })
    }
  }
  for (let i = 0; i < inp.rows1.length; i++) drawRow(inp.rows1[i], r1Cys[i].r, r1Cys[i].cy, GREEN)

  const r2Cys: { cy: number; r: number }[] = []
  {
    let cy = barCyTop(Math.max(3, Math.min(8, (inp.rows2[0]?.phi ?? 20) / 1000 * scaleX * 8)))
    for (let i = 0; i < inp.rows2.length; i++) {
      const r = Math.max(3, Math.min(8, (inp.rows2[i].phi / 1000) * scaleX * 8))
      if (i > 0) {
        const prevR = r2Cys[i - 1].r
        const svPrev = inp.rows2[i - 1].sv
        cy += svPrev != null ? (svPrev / 1000) * scaleY : prevR + r + 4
      }
      r2Cys.push({ cy, r })
    }
  }
  for (let i = 0; i < inp.rows2.length; i++) drawRow(inp.rows2[i], r2Cys[i].r, r2Cys[i].cy, RED)

  const sideXL = barCxL(r3)
  const sideXR = barCxR(r3)
  if (inp.nbars3 > 0) {
    const sideCyTop = barCyTop(r3)
    const sideCyBot = barCyBot(r3)
    const nb3 = inp.nbars3
    const totalSpanPx = sideCyBot - sideCyTop
    let setSum = 0, autoCount = 0
    for (let j = 0; j < nb3; j++) {
      const sMm = inp.sideSv?.[j]
      if (sMm != null) setSum += (sMm / 1000) * scaleY
      else autoCount++
    }
    const autoSpPx = (totalSpanPx - setSum) / (autoCount + 1)
    let cy = sideCyTop
    for (let i = 0; i < nb3; i++) {
      const sMm = inp.sideSv?.[i]
      cy += sMm != null ? (sMm / 1000) * scaleY : autoSpPx
      bars.push({ cx: sideXL, cy, r: r3, fill: BLUE })
      bars.push({ cx: sideXR, cy, r: r3, fill: BLUE })
    }
  }

  const cyTopRow = r2Cys[0]?.cy ?? barCyTop(Math.max(3, Math.min(8, (inp.rows2[0]?.phi ?? 20) / 1000 * scaleX * 8)))
  const cyBotRow = r1Cys[0]?.cy ?? barCyBot(Math.max(3, Math.min(8, (inp.rows1[0]?.phi ?? 20) / 1000 * scaleX * 8)))

  const rc = Math.min(10, Math.min(sW, sH) * 0.07)
  const hookTail = Math.max(12, stThick * 4)
  const sin45 = Math.SQRT1_2

  const legs = inp.stirrup_legs ?? 2
  const nInner = Math.max(0, Math.floor(legs / 2) - 1)

  interface InnerStirrups { path: string; hookA: string; hookB: string }
  const innerStirrups: InnerStirrups[] = []

  if (nInner > 0) {
    const rTop = Math.max(3, Math.min(8, ((inp.rows2[0]?.phi ?? 20) / 1000) * scaleX * 8))
    const nTop = inp.rows2[0]?.n ?? 2
    const spTop = nTop > 1 ? (sideXR - sideXL) / (nTop - 1) : 0
    for (let i = 0; i < nInner; i++) {
      const lIdx = i + 1
      const rIdx = nTop - 2 - i
      if (lIdx > rIdx) continue
      const iLX = sideXL + spTop * lIdx
      const iRX = sideXL + spTop * rIdx
      const isX = iLX - rTop - stThick / 2
      const isW = (iRX + rTop + stThick / 2) - isX
      const irc = Math.min(8, Math.min(isW, sH) * 0.07)
      const path = [
        `M ${isX + irc} ${sY}`, `L ${isX + isW - irc} ${sY}`,
        `A ${irc} ${irc} 0 0 1 ${isX + isW} ${sY + irc}`,
        `L ${isX + isW} ${sY + sH - irc}`,
        `A ${irc} ${irc} 0 0 1 ${isX + isW - irc} ${sY + sH}`,
        `L ${isX + irc} ${sY + sH}`,
        `A ${irc} ${irc} 0 0 1 ${isX} ${sY + sH - irc}`,
        `L ${isX} ${sY + irc}`,
        `A ${irc} ${irc} 0 0 1 ${isX + irc} ${sY}`,
      ].join(' ')
      const iCorX = iLX, iCorY = cyTopRow
      const iOff = rTop + stThick * 0.6
      const inx = iOff * sin45, iny = iOff * sin45
      const hookA = `M ${iCorX + inx} ${iCorY - iny} L ${iCorX + inx + hookTail * sin45} ${iCorY - iny + hookTail * sin45}`
      const hookB = `M ${iCorX - inx} ${iCorY + iny} L ${iCorX - inx + hookTail * sin45} ${iCorY + iny + hookTail * sin45}`
      innerStirrups.push({ path, hookA, hookB })
    }
  }

  const stirrupPath = [
    `M ${sX + rc} ${sY}`, `L ${sX + sW - rc} ${sY}`,
    `A ${rc} ${rc} 0 0 1 ${sX + sW} ${sY + rc}`,
    `L ${sX + sW} ${sY + sH - rc}`,
    `A ${rc} ${rc} 0 0 1 ${sX + sW - rc} ${sY + sH}`,
    `L ${sX + rc} ${sY + sH}`,
    `A ${rc} ${rc} 0 0 1 ${sX} ${sY + sH - rc}`,
    `L ${sX} ${sY + rc}`,
    `A ${rc} ${rc} 0 0 1 ${sX + rc} ${sY}`,
  ].join(' ')

  const cornerBarR = Math.max(3, Math.min(8, ((inp.rows2[0]?.phi ?? 20) / 1000) * scaleX * 8))
  const corX = sideXL, corY = cyTopRow
  const off = cornerBarR + stThick * 0.6
  const nx = off * sin45, ny = off * sin45
  const hookTop = `M ${corX + nx} ${corY - ny} L ${corX + nx + hookTail * sin45} ${corY - ny + hookTail * sin45}`
  const hookBot = `M ${corX - nx} ${corY + ny} L ${corX - nx + hookTail * sin45} ${corY + ny + hookTail * sin45}`

  const sPx = stS / 1000 * scaleY
  const nSpaces = Math.floor(bh / sPx)

  const tiePhi = inp.tie_phi ?? 0
  const tieN   = inp.tie_n ?? 1
  const tieThick = Math.max(1.5, Math.min(4, tiePhi / 2.5))
  const tieHookLen = Math.max(12, tieThick * 5)
  const cornerR2 = Math.max(3, Math.min(8, ((inp.rows1[0]?.phi ?? inp.rows2[0]?.phi ?? 20) / 1000) * scaleX * 8))
  const tieAnchorXL = inp.nbars3 > 0 ? sideXL - cornerR2 + r3 : sideXL
  const tieAnchorXR = inp.nbars3 > 0 ? sideXR + cornerR2 - r3 : sideXR
  const sideBarYs: number[] = []
  if (inp.nbars3 > 0) {
    const sideCyTop2 = barCyTop(r3)
    const sideCyBot2 = barCyBot(r3)
    const nb3 = inp.nbars3
    let setSum2 = 0, autoCount2 = 0
    for (let j = 0; j < nb3; j++) {
      const sMm = inp.sideSv?.[j]
      if (sMm != null) setSum2 += (sMm / 1000) * scaleY
      else autoCount2++
    }
    const autoSpPx2 = (sideCyBot2 - sideCyTop2 - setSum2) / (autoCount2 + 1)
    let cy2 = sideCyTop2
    for (let i = 0; i < nb3; i++) {
      const sMm = inp.sideSv?.[i]
      cy2 += sMm != null ? (sMm / 1000) * scaleY : autoSpPx2
      sideBarYs.push(cy2)
    }
  }
  const tieYs: number[] = []
  if (tiePhi > 0 && sideBarYs.length > 0) {
    const count = Math.min(tieN, sideBarYs.length)
    if (count === 1) {
      tieYs.push(sideBarYs[Math.floor((sideBarYs.length - 1) / 2)])
    } else {
      for (let i = 0; i < count; i++) {
        tieYs.push(sideBarYs[Math.round(i * (sideBarYs.length - 1) / (count - 1))])
      }
    }
  } else if (tiePhi > 0) {
    for (let i = 0; i < tieN; i++) tieYs.push(sY + sH * (i + 1) / (tieN + 1))
  }

  // suppress unused warning
  void cyBotRow

  return (
    <svg width={W} height={H} style={{ display: 'block', fontFamily: 'inherit', overflow: 'visible' }}>
      <rect x={padL} y={padT} width={bw} height={bh} fill="none" stroke={DARK} strokeWidth={2} />

      {Array.from({ length: nSpaces - 1 }, (_, i) => {
        const y = padT + sPx * (i + 1)
        return y > padT + 4 && y < padT + bh - 4
          ? <line key={i} x1={sX} y1={y} x2={sX + sW} y2={y} stroke={ORANGE} strokeWidth={0.8} strokeDasharray="5 4" opacity={0.5} />
          : null
      })}

      <defs><clipPath id="stirrupClip"><rect x={sX} y={sY} width={sW} height={sH} /></clipPath></defs>

      {innerStirrups.length > 0 && <>
        <defs><clipPath id="innerStirrupClip"><rect x={sX} y={sY} width={sW} height={sH} /></clipPath></defs>
        {innerStirrups.map((is, i) => (
          <path key={i} d={is.path} fill="none" stroke={ORANGE} strokeWidth={stThick} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        <g clipPath="url(#innerStirrupClip)">
          {innerStirrups.map((is, i) => (
            <g key={i}>
              <path d={is.hookA} fill="none" stroke={ORANGE} strokeWidth={stThick} strokeLinecap="round" />
              <path d={is.hookB} fill="none" stroke={ORANGE} strokeWidth={stThick} strokeLinecap="round" />
            </g>
          ))}
        </g>
      </>}

      <path d={stirrupPath} fill="none" stroke={ORANGE} strokeWidth={stThick} strokeLinejoin="round" strokeLinecap="round" />
      <g clipPath="url(#stirrupClip)">
        <path d={hookTop} fill="none" stroke={ORANGE} strokeWidth={stThick} strokeLinecap="round" />
        <path d={hookBot} fill="none" stroke={ORANGE} strokeWidth={stThick} strokeLinecap="round" />
      </g>

      {tieYs.map((y, i) => {
        const yTop = y - r3
        const cosA = Math.cos(Math.PI * 75 / 180), sinA = Math.sin(Math.PI * 75 / 180)
        const lBarEnd = tieAnchorXL - r3, rBarEnd = tieAnchorXR + r3
        const lTailX = lBarEnd + tieHookLen * cosA, lTailY = yTop + tieHookLen * sinA
        const rTailX = rBarEnd - tieHookLen * cosA, rTailY = yTop + tieHookLen * sinA
        return (
          <g key={i}>
            <line x1={lBarEnd} y1={yTop} x2={rBarEnd} y2={yTop} stroke={ORANGE} strokeWidth={tieThick} strokeLinecap="round" />
            <line x1={lBarEnd} y1={yTop} x2={lTailX} y2={lTailY} stroke={ORANGE} strokeWidth={tieThick} strokeLinecap="round" />
            <line x1={rBarEnd} y1={yTop} x2={rTailX} y2={rTailY} stroke={ORANGE} strokeWidth={tieThick} strokeLinecap="round" />
          </g>
        )
      })}

      {bars.map((bar, i) => (
        <circle key={i} cx={bar.cx} cy={bar.cy} r={bar.r} fill={bar.fill} opacity={0.9} />
      ))}

      <text x={padL + bw / 2} y={padT - 18} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
        L2: {inp.rows2.map(r => `${r.n}Φ${r.phi}`).join('+')}
      </text>
      <text x={padL + bw / 2} y={padT + bh + 14} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
        L1: {inp.rows1.map(r => `${r.n}Φ${r.phi}`).join('+')}
      </text>
      <line x1={padL - 38} y1={padT} x2={padL - 38} y2={padT + bh} stroke={DARK} strokeWidth={1} />
      <line x1={padL - 42} y1={padT} x2={padL - 34} y2={padT} stroke={DARK} strokeWidth={1} />
      <line x1={padL - 42} y1={padT + bh} x2={padL - 34} y2={padT + bh} stroke={DARK} strokeWidth={1} />
      <text x={padL - 46} y={padT + bh / 2} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle"
        transform={`rotate(-90,${padL - 46},${padT + bh / 2})`}>h = {(inp.h * 1000).toFixed(0)} mm</text>
      <text x={padL + bw / 2} y={padT + bh + 28} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
        b = {(inp.b * 1000).toFixed(0)} mm
      </text>
      <text x={padL + bw + 8} y={sY + 12} fontSize={10} fill={ORANGE} fontWeight={700}>Φ{stPhi}</text>
      <text x={padL + bw + 8} y={sY + 26} fontSize={10} fill={ORANGE} fontWeight={600}>s={stS} mm</text>
    </svg>
  )
}
