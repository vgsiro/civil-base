'use client'
import { useRef, useState } from 'react'
import { Ec2RectInput, Ec2RectResult } from '../ec2/tools/rect-section-check/rect-engine/rect-calc'
import { GREEN, BLUE, RED, AMBER, n2 } from './ui-atoms'
import { useTranslation } from '../../../../i18n/LanguageContext'

const ORANGE = '#ea580c'

// EC2 §3.1.7 equivalent rectangular block factors
function rectBlockFactors(fck: number): { lambda: number; eta: number } {
  if (fck <= 50) return { lambda: 0.8, eta: 1.0 }
  return { lambda: 0.8 - (fck - 50) / 400, eta: 1.0 - (fck - 50) / 200 }
}

export type SpacingClickInfo =
  | { kind: 'h'; layer: 'rows1' | 'rows2'; rowIdx: number; gapIdx: number; currentS: number; autoS: number; svgX: number; svgY: number }
  | { kind: 'v'; layer: 'rows1' | 'rows2'; rowIdx: number; currentS: number; autoS: number; svgX: number; svgY: number }
  | { kind: 'side'; gapIdx: number; currentS: number; autoS: number; svgX: number; svgY: number }

export function SectionDiagram({ inp, res, onSpacingClick }: {
  inp: Ec2RectInput
  res: Ec2RectResult
  onSpacingClick?: (info: SpacingClickInfo) => void
}) {
  const { t } = useTranslation()
  const padL = 60, padR = 12, padT = 34, padB = 60

  const MAX_BW = 340, MAX_BH = 320
  const ratio = inp.b / inp.h
  let bw: number, bh: number
  if (ratio >= MAX_BW / MAX_BH) {
    bw = MAX_BW; bh = Math.max(80, Math.round(bw / ratio))
  } else {
    bh = MAX_BH; bw = Math.max(60, Math.round(bh * ratio))
  }

  const H = padT + bh + padB

  const scaleX = bw / inp.b
  const scaleY = bh / inp.h

  const x_top = Math.max(0, res.x)
  const naY   = padT + x_top * scaleY
  const comprZ = Math.min(bh, x_top * scaleY)

  const stirrupPhi = (inp.stirrup_phi ?? 8) / 1000  // m
  const r3 = Math.max(3, Math.min(6, (inp.phi3 / 1000) * scaleX * 8))

  // Bar centre X: c (cover to stirrup outer face) + stirrup_phi (full stirrup) + phi/2 → touches stirrup inner edge
  function barEdgeX(c: number, phi_m: number): number {
    return (c + stirrupPhi + phi_m / 2) * scaleX
  }

  const bars: { cx: number; cy: number; r: number; fill: string }[] = []
  type HSpacingLine = { kind: 'h'; cy: number; xs: number[]; label: string; below: boolean; layer: 'rows1' | 'rows2'; rowIdx: number; autoS: number; gapIdx: number; overrideS?: number; isLast: boolean; isCover?: boolean }
  type VSpacingLine = { kind: 'v'; cy0: number; cy1: number; x: number; label: string; layer: 'rows1' | 'rows2'; rowIdx: number; autoS: number; overrideS?: number; clickable?: boolean; sideGapIdx?: number; isReadOnly?: boolean }
  const hLines: HSpacingLine[] = []
  const vLines: VSpacingLine[] = []

  // Side bars: centre at c1 + stirrup_phi/2 + phi3/2 from face (touches the stirrup inner edge)
  const sideXL = padL + barEdgeX(inp.c1, inp.phi3 / 1000)
  const sideXR = padL + bw - barEdgeX(inp.c1, inp.phi3 / 1000)

  const barFill = (zFrac: number) => {
    const eps = res.eps_c_top + (res.eps_c_bot - res.eps_c_top) * zFrac
    return eps >= 0 ? GREEN : RED
  }

  // Compute bar X positions.
  // First bar fixed at c + stirrup/2 + phi/2 from left face.
  // Last bar fixed at same from right face.
  // Gaps 0..n-3 are placeable (set or auto). Last gap (n-2) is always remainder.
  // Auto gap size = (totalSpan - sum_of_set_gaps_in_0..n-3) / count_of_auto_gaps_in_0..n-3
  function rowXs(n: number, c: number, phi_m: number, sArr?: number[]): number[] {
    if (n <= 0) return []
    const x0 = padL + barEdgeX(c, phi_m)
    if (n === 1) return [x0]
    const xN = padL + bw - barEdgeX(c, phi_m)
    const totalSpanPx = xN - x0
    if (n === 2) return [x0, xN]
    // gaps 0..n-3 are independently placeable; gap n-2 is the remainder
    const placeableCount = n - 2  // number of placeable gaps (excludes last)
    let setSum = 0, autoCount = 0
    for (let j = 0; j < placeableCount; j++) {
      const sMm = sArr?.[j]
      if (sMm != null) setSum += (sMm / 1000) * scaleX
      else autoCount++
    }
    const autoSpPx = autoCount > 0 ? (totalSpanPx - setSum) / (autoCount + 1) : 0
    // +1 because the last gap (remainder) also gets the same auto width when nothing is set
    const xs: number[] = [x0]
    for (let j = 0; j < placeableCount; j++) {
      const sMm = sArr?.[j]
      const spPx = sMm != null ? (sMm / 1000) * scaleX : autoSpPx
      xs.push(xs[j] + spPx)
    }
    xs.push(xN)  // last bar always fixed at right cover
    return xs
  }

  // Row cy positions — bar centre = c + stirrup_phi/2 + phi/2 from face
  const r1Cys: { cy: number; r: number }[] = []
  {
    const phi0_m = (inp.rows1[0]?.phi ?? 0) / 1000
    let cy = padT + (inp.h - inp.c1 - stirrupPhi - phi0_m / 2) * scaleY
    for (let i = 0; i < inp.rows1.length; i++) {
      const r = Math.max(3, Math.min(8, (inp.rows1[i].phi / 1000) * scaleX * 8))
      if (i > 0) {
        const prevR = r1Cys[i - 1].r
        const svPrev = inp.rows1[i - 1].sv
        const autoSvPx = prevR + r + 4
        cy -= svPrev != null ? (svPrev / 1000) * scaleY : autoSvPx
      }
      r1Cys.push({ cy, r })
    }
  }
  const r2Cys: { cy: number; r: number }[] = []
  {
    const phi0_m = (inp.rows2[0]?.phi ?? 0) / 1000
    let cy = padT + (inp.c2 + stirrupPhi + phi0_m / 2) * scaleY
    for (let i = 0; i < inp.rows2.length; i++) {
      const r = Math.max(3, Math.min(8, (inp.rows2[i].phi / 1000) * scaleX * 8))
      if (i > 0) {
        const prevR = r2Cys[i - 1].r
        const svPrev = inp.rows2[i - 1].sv
        const autoSvPx = prevR + r + 4
        cy += svPrev != null ? (svPrev / 1000) * scaleY : autoSvPx
      }
      r2Cys.push({ cy, r })
    }
  }

  // Draw bars + collect spacing lines
  function drawRow(row: typeof inp.rows1[0], r: number, cy: number, layer: 'rows1' | 'rows2', rowIdx: number) {
    const { n, s } = row
    if (n <= 0) return
    const c = layer === 'rows1' ? inp.c1 : inp.c2
    const phi_m = row.phi / 1000
    const fill = barFill((cy - padT) / bh)
    const xs = rowXs(n, c, phi_m, s)
    xs.forEach(cx => bars.push({ cx, cy, r, fill }))
    const below = layer === 'rows1'
    // cover segments: section face → first bar, last bar → section face (read-only)
    const coverMm = Math.round((c + stirrupPhi + phi_m / 2) * 1000)
    hLines.push({ kind: 'h', cy, xs: [padL, xs[0]], label: String(coverMm), below, layer, rowIdx, autoS: coverMm, gapIdx: -1, isLast: false, isCover: true })
    hLines.push({ kind: 'h', cy, xs: [xs[xs.length - 1], padL + bw], label: String(coverMm), below, layer, rowIdx, autoS: coverMm, gapIdx: -1, isLast: false, isCover: true })
    if (n >= 2) {
      // autoS = (b - 2c - 2*stirrup_phi - phi) / (n-1)  in mm
      const autoS = Math.round((inp.b - 2 * c - 2 * stirrupPhi - phi_m) * 1000 / (n - 1))
      // one hLine per gap; last gap is read-only (computed remainder)
      for (let j = 0; j < n - 1; j++) {
        const x0 = xs[j], x1 = xs[j + 1]
        const isLast = j === n - 2
        const overrideS = s?.[j]
        hLines.push({ kind: 'h', cy, xs: [x0, x1], label: '', below, layer, rowIdx, autoS, gapIdx: j, overrideS, isLast })
      }
    }
  }

  for (let i = 0; i < inp.rows1.length; i++) drawRow(inp.rows1[i], r1Cys[i].r, r1Cys[i].cy, 'rows1', i)
  for (let i = 0; i < inp.rows2.length; i++) drawRow(inp.rows2[i], r2Cys[i].r, r2Cys[i].cy, 'rows2', i)

  const nb3 = inp.nbars3
  const phi3_m = inp.phi3 / 1000
  const sideBarCys: number[] = []
  const sideCyTop = padT + (inp.c2 + stirrupPhi + phi3_m / 2) * scaleY
  const sideCyBot = padT + (inp.h - inp.c1 - stirrupPhi - phi3_m / 2) * scaleY
  if (nb3 > 0) {
    // nb3+1 gaps: sideCyTop → bar[0] → ... → bar[nb3-1] → sideCyBot
    // sideSv[j] = c-c override for gap j (j=0..nb3-1, all editable)
    // Last gap (bar[nb3-1] → sideCyBot) is remainder read-only
    const totalSpanPx = sideCyBot - sideCyTop
    // Auto: distribute all nb3+1 gaps equally; set gaps reduce the pool for auto gaps
    let setSum = 0, autoCount = 0
    for (let j = 0; j < nb3; j++) {   // nb3 editable gaps (0..nb3-1)
      const sMm = inp.sideSv?.[j]
      if (sMm != null) setSum += (sMm / 1000) * scaleY
      else autoCount++
    }
    // autoCount auto gaps + 1 remainder gap share the remaining span
    const autoSpPx = (totalSpanPx - setSum) / (autoCount + 1)
    let cy = sideCyTop
    for (let j = 0; j < nb3; j++) {
      const sMm = inp.sideSv?.[j]
      const spPx = sMm != null ? (sMm / 1000) * scaleY : autoSpPx
      cy += spPx
      sideBarCys.push(cy)
    }
    for (let i = 0; i < nb3; i++) {
      const fill = barFill((sideBarCys[i] - padT) / bh)
      bars.push({ cx: sideXL, cy: sideBarCys[i], r: r3, fill })
      bars.push({ cx: sideXR, cy: sideBarCys[i], r: r3, fill })
    }
  }

  // Full vertical dimension chain: section top → r2 rows → side bars → r1 rows → section bottom
  {
    type VChainNode =
      | { cy: number; kind: 'edge' }
      | { kind: 'row'; cy: number; layer: 'rows1' | 'rows2'; rowIdx: number }
      | { kind: 'side'; cy: number; sideIdx: number }

    const nodes: VChainNode[] = []
    nodes.push({ cy: padT, kind: 'edge' })
    for (let i = 0; i < r2Cys.length; i++) nodes.push({ kind: 'row', cy: r2Cys[i].cy, layer: 'rows2', rowIdx: i })
    for (let i = 0; i < sideBarCys.length; i++) nodes.push({ kind: 'side', cy: sideBarCys[i], sideIdx: i })
    for (let i = r1Cys.length - 1; i >= 0; i--) nodes.push({ kind: 'row', cy: r1Cys[i].cy, layer: 'rows1', rowIdx: i })
    nodes.push({ cy: padT + bh, kind: 'edge' })

    // autoS = (h - 2c - 2*stirrup_phi - phi3) / (nb3+1)  in mm
    const sideAutoMm = nb3 > 0 ? Math.round((inp.h - inp.c2 - inp.c1 - 2 * stirrupPhi - phi3_m) * 1000 / (nb3 + 1)) : 0

    for (let i = 0; i < nodes.length - 1; i++) {
      const top = nodes[i], bot = nodes[i + 1]
      const cy0 = top.cy, cy1 = bot.cy
      // For cover segments (edge→row or row→edge), use formula value not pixel-derived
      const isCoverTopSeg = top.kind === 'edge' && bot.kind === 'row'
      const isCoverBotSeg = top.kind === 'row' && bot.kind === 'edge'
      const svMm = isCoverTopSeg
        ? Math.round((inp.c2 + stirrupPhi + (inp.rows2[bot.rowIdx]?.phi ?? inp.rows2[0].phi) / 2000) * 1000)
        : isCoverBotSeg
        ? Math.round((inp.c1 + stirrupPhi + (inp.rows1[top.rowIdx]?.phi ?? inp.rows1[0].phi) / 2000) * 1000)
        : Math.round((cy1 - cy0) / scaleY * 1000)

      let clickMeta: { layer: 'rows1' | 'rows2'; rowIdx: number; autoS: number; overrideS?: number; sideGapIdx?: number } | null = null

      if (top.kind === 'row' && bot.kind === 'row' && top.layer === bot.layer) {
        const layer = top.layer
        const svRowIdx = layer === 'rows2' ? top.rowIdx : bot.rowIdx
        const overrideSv = layer === 'rows2' ? inp.rows2[svRowIdx].sv : inp.rows1[svRowIdx].sv
        const r0 = layer === 'rows2' ? r2Cys[top.rowIdx].r : r1Cys[top.rowIdx].r
        const r1b = layer === 'rows2' ? r2Cys[bot.rowIdx].r : r1Cys[bot.rowIdx].r
        const autoSvMm = Math.round((r0 + r1b) / scaleY * 1000 + 25)
        clickMeta = { layer, rowIdx: svRowIdx, autoS: autoSvMm, overrideS: overrideSv }
      } else if (top.kind === 'row' && bot.kind === 'side' && bot.sideIdx === 0) {
        // L2_innermost → side[0]: gap index 0, editable
        const overrideSv = inp.sideSv?.[0]
        clickMeta = { layer: 'rows1', rowIdx: 0, autoS: sideAutoMm, overrideS: overrideSv, sideGapIdx: 0 }
      } else if (top.kind === 'side' && bot.kind === 'side') {
        // side[i] → side[i+1]: gap index = top.sideIdx + 1, all editable
        const gapIdx = top.sideIdx + 1
        const overrideSv = inp.sideSv?.[gapIdx]
        clickMeta = { layer: 'rows1', rowIdx: 0, autoS: sideAutoMm, overrideS: overrideSv, sideGapIdx: gapIdx }
      }

      // last gap = side[nb3-1] → L1_row (read-only remainder)
      const isLastSideGap = top.kind === 'side' && top.sideIdx === nb3 - 1 && bot.kind === 'row'

      vLines.push({
        kind: 'v', cy0, cy1, x: padL - 22,
        label: String(clickMeta?.overrideS ?? svMm),
        layer: clickMeta?.layer ?? 'rows1',
        rowIdx: clickMeta?.rowIdx ?? 0,
        autoS: clickMeta?.autoS ?? svMm,
        overrideS: clickMeta?.overrideS,
        clickable: clickMeta != null && !isLastSideGap,
        sideGapIdx: clickMeta?.sideGapIdx,
        isReadOnly: isLastSideGap,
      })
    }
  }

  const sDiagMaxW  = 50
  const maxEps     = Math.max(Math.abs(res.eps_c_top), Math.abs(res.eps_c_bot), 3.5)
  const sDiagScale = sDiagMaxW / maxEps
  const tensPx     = Math.abs(res.eps_c_bot) * sDiagScale
  const compPx     = Math.abs(res.eps_c_top) * sDiagScale
  const zeroX      = padL + bw + 60 + tensPx
  const strainX    = (eps: number) => zeroX - eps * sDiagScale

  const sTopX = strainX(res.eps_c_top)
  const sBotX = strainX(res.eps_c_bot)

  const eps0Y = Math.abs(res.eps_c_bot - res.eps_c_top) > 1e-9
    ? padT + (-res.eps_c_top / (res.eps_c_bot - res.eps_c_top)) * bh
    : -999

  // ── Stress diagram (EC2 equivalent rectangular block) ────────────
  const barMaxW = 60            // max px for bar stress arrows (independent scale: fyd → 60px)
  const blockMaxW = 50          // px width for concrete block (ηfcd)
  const concreteArrowExtra = 20 // how far concrete arrow extends past block right edge
  // push stress origin far enough right so tension arrows (barMaxW left of origin) don't clash
  const stressGap = barMaxW + 60
  const stressOriginX = zeroX + compPx + stressGap

  const comprPx = Math.min(bh, x_top * scaleY)  // neutral-axis depth in px
  const { lambda, eta } = rectBlockFactors(inp.fck)
  const blockDepthPx = Math.min(comprPx, lambda * x_top * scaleY)  // λx in px
  const etaFcd = eta * res.fcd

  // Concrete resultant arrow: at mid-height of block, pointing left (←) into the section
  const blockMidY = blockDepthPx > 0 ? padT + blockDepthPx / 2 : -999

  // Bar stress markers — each rebar gets an arrow scaled independently to fyd
  const barStressMarkers: { cy: number; sig: number }[] = []
  bars.forEach(bar => {
    const zFrac = (bar.cy - padT) / bh
    const eps = res.eps_c_top + (res.eps_c_bot - res.eps_c_top) * zFrac
    const sig = Math.max(-res.fyd, Math.min(res.fyd, 200000 * 1e-3 * Math.max(-67.5, Math.min(67.5, eps))))
    barStressMarkers.push({ cy: bar.cy, sig })
  })

  const totalW = Math.ceil(stressOriginX + blockMaxW + concreteArrowExtra + 60)

  const DARK = '#1e293b'
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimVisible, setDimVisible] = useState(false)

  function handleHClick(e: React.MouseEvent, sl: HSpacingLine) {
    if (!onSpacingClick || sl.isLast) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const gapMm = Math.round((sl.xs[1] - sl.xs[0]) / scaleX * 1000)
    onSpacingClick({
      kind: 'h',
      layer: sl.layer, rowIdx: sl.rowIdx, gapIdx: sl.gapIdx,
      currentS: sl.overrideS ?? gapMm, autoS: sl.autoS,
      svgX: rect.left + (sl.xs[0] + sl.xs[1]) / 2,
      svgY: rect.top + sl.cy + (sl.below ? 14 : -14),
    })
    e.stopPropagation()
  }

  function handleVClick(e: React.MouseEvent, vl: VSpacingLine) {
    if (!onSpacingClick) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const svgX = rect.left + vl.x
    const svgY = rect.top + (vl.cy0 + vl.cy1) / 2
    if (vl.sideGapIdx != null) {
      onSpacingClick({ kind: 'side', gapIdx: vl.sideGapIdx, currentS: vl.overrideS ?? vl.autoS, autoS: vl.autoS, svgX, svgY })
    } else {
      onSpacingClick({ kind: 'v', layer: vl.layer, rowIdx: vl.rowIdx, currentS: vl.overrideS ?? vl.autoS, autoS: vl.autoS, svgX, svgY })
    }
    e.stopPropagation()
  }

  return (
    <div style={{ position: 'relative', userSelect: 'none', overflow: 'visible' }}
      onMouseEnter={() => setDimVisible(true)}
      onMouseLeave={() => setDimVisible(false)}
    >
      <svg ref={svgRef} width={totalW} height={H} style={{ display: 'block', fontFamily: 'inherit', overflow: 'visible' }}>
        {comprZ > 0 && <rect x={padL} y={padT} width={bw} height={comprZ} fill="#fef9c3" />}
        <rect x={padL} y={padT} width={bw} height={bh} fill="none" stroke={DARK} strokeWidth={2} />

        {naY > padT && naY < padT + bh && <>
          <line x1={padL - 6} y1={naY} x2={stressOriginX + 8} y2={naY}
            stroke={AMBER} strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={(padL + bw + zeroX) / 2} y={naY - 4} fontSize={10} fill={AMBER} fontWeight={700} textAnchor="middle">
            x = {n2(res.x * 1000, 0)} mm
          </text>
        </>}

        <line x1={padL - 38} y1={padT} x2={padL - 38} y2={padT + bh} stroke={DARK} strokeWidth={1} />
        <line x1={padL - 42} y1={padT}      x2={padL - 34} y2={padT}      stroke={DARK} strokeWidth={1} />
        <line x1={padL - 42} y1={padT + bh} x2={padL - 34} y2={padT + bh} stroke={DARK} strokeWidth={1} />
        <text x={padL - 46} y={padT + bh / 2} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle"
          transform={`rotate(-90, ${padL - 46}, ${padT + bh / 2})`}>
          h = {n2(inp.h * 1000, 0)} mm
        </text>

        <text x={padL + bw / 2} y={padT + bh + 27} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
          b = {n2(inp.b * 1000, 0)} mm
        </text>

        <line x1={padL + bw} y1={padT}      x2={zeroX} y2={padT}      stroke={BLUE} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <line x1={padL + bw} y1={padT + bh} x2={zeroX} y2={padT + bh} stroke={BLUE} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        {/* dashed connectors from strain diagram right edge to stress origin */}
        <line x1={zeroX + compPx + 4} y1={padT} x2={stressOriginX} y2={padT} stroke={DARK} strokeWidth={1} strokeDasharray="3 3" opacity={0.3} />
        {blockDepthPx > 0 && (
          <line x1={zeroX + compPx + 4} y1={padT + blockDepthPx} x2={stressOriginX} y2={padT + blockDepthPx} stroke={DARK} strokeWidth={1} strokeDasharray="3 3" opacity={0.3} />
        )}

        <polygon
          points={`${zeroX},${padT} ${sTopX},${padT} ${sBotX},${padT + bh} ${zeroX},${padT + bh}`}
          fill={`${BLUE}30`} stroke={BLUE} strokeWidth={2} strokeLinejoin="round"
        />

        {eps0Y > padT && eps0Y < padT + bh && (
          <circle cx={zeroX} cy={eps0Y} r={4} fill={AMBER} stroke="#fff" strokeWidth={1.5} />
        )}

        <text x={sTopX} y={padT - 6} fontSize={11} fill={BLUE} textAnchor="middle" fontWeight={700}>
          {n2(res.eps_c_top, 2)}‰
        </text>
        <text x={sBotX} y={padT + bh + 16} fontSize={11}
          fill={res.eps_c_bot >= 0 ? GREEN : BLUE} textAnchor="middle" fontWeight={700}>
          {n2(res.eps_c_bot, 2)}‰
        </text>
        <text x={zeroX + 4} y={padT - 18} fontSize={11} fill={DARK} fontWeight={700} fontStyle="italic">ε</text>

        {/* ── Stress diagram (equivalent rectangular block) ─── */}
        {/* zero vertical axis */}
        <line x1={stressOriginX} y1={padT - 8} x2={stressOriginX} y2={padT + bh + 8} stroke={DARK} strokeWidth={1.5} />
        {/* rectangular concrete stress block — same dark color as section */}
        {blockDepthPx > 0 && (
          <rect x={stressOriginX} y={padT} width={blockMaxW} height={blockDepthPx}
            fill="#fef9c3" stroke={DARK} strokeWidth={2} />
        )}
        {/* ηfcd label at block right edge */}
        {blockDepthPx > 0 && (
          <>
            <text x={stressOriginX + blockMaxW} y={padT - 6} fontSize={10} fill={DARK} textAnchor="middle" fontWeight={700}>
              {n2(etaFcd, 1)} MPa
            </text>
            <line x1={stressOriginX + blockMaxW} y1={padT - 3} x2={stressOriginX + blockMaxW} y2={padT + blockDepthPx} stroke={DARK} strokeWidth={1} strokeDasharray="3 2" opacity={0.4} />
          </>
        )}
        {/* concrete resultant arrow — blue, from block right edge + extra, pointing ← into section */}
        {blockDepthPx > 0 && (() => {
          const ay = blockMidY
          const lineStart = stressOriginX + blockMaxW + concreteArrowExtra
          const tip = stressOriginX
          const aw = 8, ah = 5
          return (
            <g opacity={0.95}>
              <line x1={lineStart} y1={ay} x2={tip + aw} y2={ay} stroke={BLUE} strokeWidth={2.5} />
              <polygon points={`${tip},${ay} ${tip + aw},${ay - ah} ${tip + aw},${ay + ah}`} fill={BLUE} />
            </g>
          )
        })()}
        {/* σ axis label */}
        <text x={stressOriginX + blockMaxW + concreteArrowExtra + 12} y={padT - 18} fontSize={11} fill={DARK} fontWeight={700} fontStyle="italic">σ</text>
        {/* bar stress markers:
              tension (sig>0)    → arrow points → (right), starts at zero axis, tip to the right
              compression (sig<0) → arrow points ← (left), starts at zero axis, tip to the left  */}
        {(() => {
          const seen = new Set<number>()
          return barStressMarkers.map((m, i) => {
            const sigPx = Math.min((Math.abs(m.sig) / res.fyd) * barMaxW, barMaxW)
            const tension = m.sig >= 0
            const color = tension ? GREEN : RED
            const aw = 7, ah = 4.5
            const showLabel = !seen.has(m.cy) && sigPx > 2
            if (showLabel) seen.add(m.cy)
            const label = `${Math.round(Math.abs(m.sig))} MPa`
            if (tension) {
              const tip = stressOriginX + sigPx
              return (
                <g key={i} opacity={0.9}>
                  <line x1={stressOriginX} y1={m.cy} x2={tip - aw} y2={m.cy} stroke={color} strokeWidth={1.5} />
                  <polygon points={`${tip},${m.cy} ${tip - aw},${m.cy - ah} ${tip - aw},${m.cy + ah}`} fill={color} />
                  {showLabel && <text x={tip + 3} y={m.cy + 4} fontSize={8} fill={color} fontWeight={700} style={{ fontFamily: 'ui-monospace,monospace' }}>{label}</text>}
                </g>
              )
            } else {
              const tip = stressOriginX - sigPx
              return (
                <g key={i} opacity={0.9}>
                  <line x1={stressOriginX} y1={m.cy} x2={tip + aw} y2={m.cy} stroke={color} strokeWidth={1.5} />
                  <polygon points={`${tip},${m.cy} ${tip + aw},${m.cy - ah} ${tip + aw},${m.cy + ah}`} fill={color} />
                  {showLabel && <text x={tip - 3} y={m.cy + 4} fontSize={8} fill={color} fontWeight={700} textAnchor="end" style={{ fontFamily: 'ui-monospace,monospace' }}>{label}</text>}
                </g>
              )
            }
          })
        })()}

        {/* horizontal + vertical dimension lines — visible only on hover */}
        <g style={{ opacity: dimVisible ? 1 : 0, transition: 'opacity 0.15s' }} pointerEvents={dimVisible ? undefined : 'none'}>
        {hLines.map((sl, si) => {
          const off = sl.below ? 14 : -14
          const dimY = sl.cy + off
          const tickH = 5
          const isOverride = sl.overrideS != null
          const isReadOnly = sl.isLast || !!sl.isCover
          const dimColor = '#94a3b8'
          const labelColor = isReadOnly ? '#94a3b8' : isOverride ? '#2563eb' : '#64748b'
          const clickable = !!onSpacingClick && !isReadOnly
          const x0 = sl.xs[0], x1 = sl.xs[1]
          const mx = (x0 + x1) / 2
          const labelY = dimY + (sl.below ? -3 : 9)
          const gapMm = sl.isCover ? sl.label : String(Math.round((x1 - x0) / scaleX * 1000))
          return (
            <g key={`h${si}`} opacity={isReadOnly ? 0.5 : 0.85}
              onClick={clickable ? e => handleHClick(e, sl) : undefined}
              style={clickable ? { cursor: 'pointer' } : undefined}
            >
              <line x1={x0} y1={dimY - tickH} x2={x0} y2={dimY + tickH} stroke={dimColor} strokeWidth={1} />
              <line x1={x1} y1={dimY - tickH} x2={x1} y2={dimY + tickH} stroke={dimColor} strokeWidth={1} />
              <line x1={x0} y1={dimY} x2={x1} y2={dimY} stroke={dimColor} strokeWidth={1} />
              {clickable && <rect x={x0} y={Math.min(dimY - tickH, labelY - 8)} width={x1 - x0} height={Math.abs(labelY - dimY + tickH) + 12} fill="transparent" />}
              <text x={mx} y={labelY} fontSize={8} fill={labelColor} textAnchor="middle" fontWeight={isOverride && !isReadOnly ? 700 : 600}>
                {isOverride && !isReadOnly ? sl.overrideS : gapMm}
              </text>
            </g>
          )
        })}

        {/* vertical dimension chain: continuous spine with per-segment labels */}
        {vLines.length > 0 && (() => {
          const dimX = vLines[0].x
          const tickW = 4
          const allYs = Array.from(new Set(vLines.flatMap(vl => [vl.cy0, vl.cy1]))).sort((a, b) => a - b)
          return (
            <g opacity={0.9}>
              <line x1={dimX} y1={allYs[0]} x2={dimX} y2={allYs[allYs.length - 1]} stroke="#94a3b8" strokeWidth={1} />
              {allYs.map((y, i) => (
                <line key={i} x1={dimX - tickW} y1={y} x2={dimX + tickW} y2={y} stroke="#94a3b8" strokeWidth={1} />
              ))}
              {vLines.map((vl, vi) => {
                const isOverride = vl.overrideS != null
                const isClickable = !!vl.clickable && !!onSpacingClick
                const isReadOnly = !!vl.isReadOnly
                const labelColor = isReadOnly ? '#94a3b8' : isOverride ? '#2563eb' : '#64748b'
                const my = (vl.cy0 + vl.cy1) / 2
                const segH = vl.cy1 - vl.cy0
                return (
                  <g key={vi} opacity={isReadOnly ? 0.5 : 1}
                    onClick={isClickable ? e => handleVClick(e, vl) : undefined}
                    style={isClickable ? { cursor: 'pointer' } : undefined}
                  >
                    {isClickable && <rect x={dimX - tickW} y={vl.cy0} width={tickW + 28} height={segH} fill="transparent" />}
                    <text x={dimX + tickW + 2} y={my + 3} fontSize={8} fill={labelColor} textAnchor="start" fontWeight={isOverride ? 700 : 600}>
                      {vl.label}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })()}
        </g>

        {bars.map((bar, i) => (
          <circle key={i} cx={bar.cx} cy={bar.cy} r={bar.r}
            fill={bar.fill} opacity={0.9} />
        ))}

        <text x={padL + bw / 2} y={padT - 18} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
          L2: {inp.rows2.map(r => `${r.n}Φ${r.phi}`).join('+')}
        </text>
        <text x={padL + bw / 2} y={padT + bh + 13} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
          L1: {inp.rows1.map(r => `${r.n}Φ${r.phi}`).join('+')}
        </text>
        {nb3 > 0 && (
          <text x={padL + bw / 2} y={padT + bh / 2 + 4} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
            L3 ({inp.nbars3}×2)
          </text>
        )}

        <circle cx={padL + 6}   cy={padT + bh + 42} r={5} fill={GREEN} />
        <text x={padL + 14}  y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_tension')}</text>
        <circle cx={padL + 68}  cy={padT + bh + 42} r={5} fill={RED} />
        <text x={padL + 76}  y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_compression')}</text>
        <rect x={padL + 155} y={padT + bh + 36} width={11} height={9} fill="#fef9c3" stroke={DARK} strokeWidth={1} />
        <text x={padL + 169} y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_comp_zone')}</text>
        <rect x={padL + 240} y={padT + bh + 36} width={11} height={9} fill="#fef9c3" stroke={DARK} strokeWidth={1} />
        <text x={padL + 254} y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_sigma_nfcd')}</text>
      </svg>
      {onSpacingClick && (
        <div style={{
          marginTop: 4, textAlign: 'center', fontSize: 9, color: '#94a3b8',
          transition: 'opacity 0.15s', opacity: dimVisible ? 0 : 1,
          pointerEvents: 'none',
        }}>
          {t('std_ec2rc_diagram_hint')}
        </div>
      )}
    </div>
  )
}
