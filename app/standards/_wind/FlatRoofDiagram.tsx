'use client'

interface Props {
  d: number; b: number; h: number; hp: number; e: number
}

const ZONE_FILL:   Record<string,string> = { F:'#bfdbfe', G:'#a5f3fc', H:'#bbf7d0', I:'#fef9c3' }
const ZONE_BORDER: Record<string,string> = { F:'#3b82f6', G:'#06b6d4', H:'#16a34a', I:'#ca8a04' }
const FONT  = 'ui-sans-serif,system-ui,sans-serif'
const DARK  = '#1e293b'
const MUTED = '#1e293b'
const BLUE  = '#1d4ed8'

// Diagonal slash tick centred on (x,y)
function Tick({ x, y }: { x: number; y: number }) {
  return <line x1={x-6} y1={y+6} x2={x+6} y2={y-6} stroke={MUTED} strokeWidth={1.4}/>
}

// Horizontal dim: extension lines from object top/bottom edge, dim line at dimY, label above
function HDimExt({ x1, x2, objY, dimY, label, fs = 11 }: {
  x1: number; x2: number; objY: number; dimY: number; label: string; fs?: number
}) {
  const above = dimY < objY
  const extEnd = above ? dimY - 4 : dimY + 4
  return (
    <g>
      <line x1={x1} y1={above ? objY-2 : objY+2} x2={x1} y2={extEnd} stroke={MUTED} strokeWidth={0.8}/>
      <line x1={x2} y1={above ? objY-2 : objY+2} x2={x2} y2={extEnd} stroke={MUTED} strokeWidth={0.8}/>
      <line x1={x1} y1={dimY} x2={x2} y2={dimY} stroke={MUTED} strokeWidth={0.9}/>
      <Tick x={x1} y={dimY}/><Tick x={x2} y={dimY}/>
      <text x={(x1+x2)/2} y={above ? dimY-8 : dimY+14}
        textAnchor="middle" dominantBaseline={above ? 'auto' : 'hanging'}
        style={{ fontSize:fs, fontFamily:FONT, fill:DARK }}>{label}</text>
    </g>
  )
}

// Vertical dim: extension lines from object left/right edge, dim line at dimX, label to side
function VDimExt({ y1, y2, objX, dimX, label, labelSide='right', fs=11 }: {
  y1: number; y2: number; objX: number; dimX: number; label: string
  labelSide?: 'right'|'left'; fs?: number
}) {
  const isLeft = dimX < objX
  const mid = (y1+y2)/2
  return (
    <g>
      {/* Extension lines run from object edge all the way to the dim line */}
      <line x1={isLeft ? objX-2 : objX+2} y1={y1} x2={dimX} y2={y1} stroke={MUTED} strokeWidth={0.8}/>
      <line x1={isLeft ? objX-2 : objX+2} y1={y2} x2={dimX} y2={y2} stroke={MUTED} strokeWidth={0.8}/>
      <line x1={dimX} y1={y1} x2={dimX} y2={y2} stroke={MUTED} strokeWidth={0.9}/>
      <Tick x={dimX} y={y1}/><Tick x={dimX} y={y2}/>
      {labelSide==='right'
        ? <text x={dimX+8} y={mid} textAnchor="start" dominantBaseline="middle"
            style={{ fontSize:fs, fontFamily:FONT, fill:DARK }}>{label}</text>
        : <text x={dimX-8} y={mid} textAnchor="end" dominantBaseline="middle"
            style={{ fontSize:fs, fontFamily:FONT, fill:DARK }}>{label}</text>
      }
    </g>
  )
}

export default function FlatRoofDiagram({ d, b, h, hp, e }: Props) {

  // ── PLAN rect ─────────────────────────────────────────────────────────────
  // Both plan and elevation share the SAME PT (top) and PB (bottom) so they
  // are perfectly level. The elevation rect height scales h proportionally
  // to fit inside [PT, PB].

  const PL = 130   // plan left — room for e/4 dim + wind arrows
  const PT = 80    // plan top  — room for title + d dim label + d dim line
  const PW = 240   // plan width
  const PH = 240   // plan height
  const PR = PL + PW
  const PB = PT + PH

  const sx = PW / (d > 0 ? d : 1)
  const sy = PH / (b > 0 ? b : 1)
  const E10 = Math.min((e/10)*sx, PW)
  const E2  = Math.min((e/2) *sx, PW)
  const E4  = Math.min((e/4) *sy, PH/2)
  const showI = E2 < PW - 2

  // Plan dim offsets
  // Below plan: each row = dim line + label below (14px) + gap
  // Row 1 (e/10): line at PB+28, label at PB+42  → row ends at ~PB+54
  // Row 2 (e/2):  line at PB+62, label at PB+76  → row ends at ~PB+88
  // Legend:       starts at PB+100
  const D_DIM_Y   = PT - 26
  const E4_DIM_X  = PL - 28
  const B_DIM_X   = PR + 28
  const E10_DIM_Y = PB + 28
  const E2_DIM_Y  = PB + 62
  const LEGEND_Y  = PB + 100

  // ── ELEVATION ─────────────────────────────────────────────────────────────
  // Gap between plan right and elevation left: large enough to avoid all clashes
  // b label at PR+28 is ~60px wide → elevation starts at PR+130 minimum
  const EL_GAP = 150
  const EL_X   = PR + EL_GAP
  const EL_W   = PW               // same width as plan

  // Elevation top and bottom align with plan top and bottom (PT, PB)
  // Inside that band, the building height h maps to EL_H = PH (same pixels as plan height)
  // so the elevation rect also goes PT → PB, exactly like the plan rect.
  const EL_TOP = PT               // roof y = plan top y  ← same level
  const EL_B   = PB               // ground y = plan bottom y ← same level
  const EL_H   = PH               // same height band

  // roofY = EL_TOP (roof slab at plan top, same level)
  // Parapet is a fixed 20px visual height regardless of hp value — just indicates presence
  const PARAP_PX = hp > 0 ? 20 : 0
  const roofY  = EL_TOP
  const parapY = roofY - PARAP_PX

  // Right-side dim cols for elevation
  const H_DIM_X  = EL_X + EL_W + 26
  const ZE_DIM_X = EL_X + EL_W + 72   // ze bracket — well clear of h label

  // Canvas — height must fit legend at LEGEND_Y + 20px for text
  const SVG_W = ZE_DIM_X + 70
  const SVG_H = LEGEND_Y + 30

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ width:'100%', maxWidth:SVG_W, display:'block',
               background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
      <defs>
        <marker id="blueArr" markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={BLUE}/>
        </marker>
      </defs>

      {/* ══ PLAN ═════════════════════════════════════════════════════════════ */}

      {/* Title at y=10, d dim label at ~y=46, d dim line at PT-26=54 — no overlap */}
      <text x={PL+PW/2} y={10} textAnchor="middle" dominantBaseline="hanging"
        style={{ fontSize:13, fontFamily:FONT, fill:DARK, fontWeight:700, textDecoration:'underline' }}>Plan</text>

      {/* d dim above plan */}
      <HDimExt x1={PL} x2={PR} objY={PT} dimY={D_DIM_Y} label={`d = ${d} m`} fs={11}/>

      {/* Zone rects */}
      {showI && <rect x={PL+E2} y={PT} width={PW-E2} height={PH} fill={ZONE_FILL.I} stroke={ZONE_BORDER.I} strokeWidth={1}/>}
      <rect x={PL+E10} y={PT} width={Math.max(0,E2-E10)} height={PH} fill={ZONE_FILL.H} stroke={ZONE_BORDER.H} strokeWidth={1}/>
      <rect x={PL} y={PT+E4} width={E10} height={Math.max(0,PH-2*E4)} fill={ZONE_FILL.G} stroke={ZONE_BORDER.G} strokeWidth={1}/>
      <rect x={PL} y={PT} width={E10} height={E4} fill={ZONE_FILL.F} stroke={ZONE_BORDER.F} strokeWidth={1}/>
      <rect x={PL} y={PB-E4} width={E10} height={E4} fill={ZONE_FILL.F} stroke={ZONE_BORDER.F} strokeWidth={1}/>
      <rect x={PL} y={PT} width={PW} height={PH} fill="none" stroke={DARK} strokeWidth={1.6}/>

      {/* Zone labels */}
      {[
        { lbl:'F', x:PL+E10/2,      y:PT+E4/2,   c:ZONE_BORDER.F },
        { lbl:'F', x:PL+E10/2,      y:PB-E4/2,   c:ZONE_BORDER.F },
        { lbl:'G', x:PL+E10/2,      y:PT+PH/2,   c:ZONE_BORDER.G },
        { lbl:'H', x:PL+(E10+E2)/2, y:PT+PH/2,   c:ZONE_BORDER.H },
      ].map(({ lbl,x,y,c }, i) => (
        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize:13, fontFamily:FONT, fontWeight:700, fill:c }}>{lbl}</text>
      ))}
      {showI && <text x={PL+(E2+PW)/2} y={PT+PH/2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize:13, fontFamily:FONT, fontWeight:700, fill:ZONE_BORDER.I }}>I</text>}

      {/* e/4 dims — left of plan, top zone F and bottom zone F */}
      {E4 > 16 && (() => {
        const x   = E4_DIM_X
        // Top: PT → PT+E4
        const t1  = PT;       const t2 = PT + E4
        // Bottom: PB-E4 → PB
        const b1  = PB - E4;  const b2 = PB
        return (
          <g>
            {/* Top e/4 — extension lines + dim line + ticks + label */}
            <line x1={PL} y1={t1} x2={x} y2={t1} stroke={MUTED} strokeWidth={0.8}/>
            <line x1={PL} y1={t2} x2={x} y2={t2} stroke={MUTED} strokeWidth={0.8}/>
            <line x1={x}  y1={t1} x2={x} y2={t2} stroke={MUTED} strokeWidth={0.9}/>
            <Tick x={x} y={t1}/><Tick x={x} y={t2}/>
            <text x={x-10} y={(t1+t2)/2} textAnchor="end" dominantBaseline="middle"
              style={{ fontSize:10, fontFamily:FONT, fill:DARK }}>
              {`e/4 = ${(e/4).toFixed(1)} m`}
            </text>
            {/* Bottom e/4 — extension lines + dim line + ticks + label */}
            <line x1={PL} y1={b1} x2={x} y2={b1} stroke={MUTED} strokeWidth={0.8}/>
            <line x1={PL} y1={b2} x2={x} y2={b2} stroke={MUTED} strokeWidth={0.8}/>
            <line x1={x}  y1={b1} x2={x} y2={b2} stroke={MUTED} strokeWidth={0.9}/>
            <Tick x={x} y={b1}/><Tick x={x} y={b2}/>
            <text x={x-10} y={(b1+b2)/2} textAnchor="end" dominantBaseline="middle"
              style={{ fontSize:10, fontFamily:FONT, fill:DARK }}>
              {`e/4 = ${(e/4).toFixed(1)} m`}
            </text>
          </g>
        )
      })()}

      {/* Wind arrows */}
      <text x={PL-6} y={PT+PH/2-36} textAnchor="end"
        style={{ fontSize:10, fontFamily:FONT, fill:BLUE }}>wind</text>
      {[-13,0,13].map(dy => (
        <line key={dy} x1={PL-64} y1={PT+PH/2+dy} x2={PL-4} y2={PT+PH/2+dy}
          stroke={BLUE} strokeWidth={1.4} markerEnd="url(#blueArr)"/>
      ))}
      <text x={PL-36} y={PT+PH/2+28} textAnchor="middle"
        style={{ fontSize:9, fontFamily:FONT, fill:MUTED }}>upwind</text>
      <text x={PL-36} y={PT+PH/2+40} textAnchor="middle"
        style={{ fontSize:9, fontFamily:FONT, fill:MUTED }}>face</text>

      {/* b dim — right of plan */}
      <VDimExt y1={PT} y2={PB} objX={PR} dimX={B_DIM_X} label={`b = ${b} m`} labelSide="right" fs={11}/>

      {/* e/10 below plan */}
      <HDimExt x1={PL} x2={PL+E10} objY={PB} dimY={E10_DIM_Y} label={`e/10 = ${(e/10).toFixed(1)} m`} fs={10}/>

      {/* e/2 below plan */}
      <HDimExt x1={PL} x2={PL+E2} objY={PB} dimY={E2_DIM_Y} label={`e/2 = ${(e/2).toFixed(1)} m`} fs={10}/>

      {/* Legend — below e/2 dim, at LEGEND_Y */}
      {(['F','G','H','I'] as const).map((z,i) => (
        <g key={z} transform={`translate(${PL+i*70},${LEGEND_Y})`}>
          <rect width={13} height={13} rx={2} fill={ZONE_FILL[z]} stroke={ZONE_BORDER[z]} strokeWidth={0.9}/>
          <text x={17} y={11} style={{ fontSize:11, fontFamily:FONT, fill:DARK }}>Zone {z}</text>
        </g>
      ))}

      {/* ══ SIDE ELEVATION ═══════════════════════════════════════════════════ */}

      <text x={EL_X+EL_W/2} y={10} textAnchor="middle" dominantBaseline="hanging"
        style={{ fontSize:13, fontFamily:FONT, fill:DARK, fontWeight:700, textDecoration:'underline' }}>Side Elevation 1-1′</text>

      {/* upwind / downwind labels — just above the roof line, below any parapet */}
      <text x={EL_X} y={parapY - 6} textAnchor="middle" dominantBaseline="auto"
        style={{ fontSize:9, fontFamily:FONT, fill:MUTED }}>upwind face</text>
      <text x={EL_X+EL_W} y={parapY - 6} textAnchor="middle" dominantBaseline="auto"
        style={{ fontSize:9, fontFamily:FONT, fill:MUTED }}>downwind face</text>

      {/* Ground line + hatch */}
      <line x1={EL_X-10} y1={EL_B} x2={EL_X+EL_W+10} y2={EL_B} stroke={MUTED} strokeWidth={1.2}/>
      {Array.from({ length:12 }).map((_,i) => (
        <line key={i}
          x1={EL_X-6+i*(EL_W+14)/11} y1={EL_B+1}
          x2={EL_X-16+i*(EL_W+14)/11} y2={EL_B+11}
          stroke="#1e293b" strokeWidth={1.1}/>
      ))}

      {/* Building: full-height walls + roof */}
      <line x1={EL_X}      y1={EL_B} x2={EL_X}      y2={roofY} stroke={DARK} strokeWidth={2}/>
      <line x1={EL_X+EL_W} y1={EL_B} x2={EL_X+EL_W} y2={roofY} stroke={DARK} strokeWidth={2}/>
      <line x1={EL_X} y1={roofY} x2={EL_X+EL_W} y2={roofY} stroke={DARK} strokeWidth={2.5}/>

      {/* Parapet — both left and right walls only, no cap line */}
      {hp > 0 && <>
        <line x1={EL_X}      y1={roofY} x2={EL_X}      y2={parapY} stroke={DARK} strokeWidth={2}/>
        <line x1={EL_X+EL_W} y1={roofY} x2={EL_X+EL_W} y2={parapY} stroke={DARK} strokeWidth={2}/>
      </>}

      {/* Wind arrow */}
      <text x={EL_X-8} y={EL_TOP+EL_H/2-22} textAnchor="end"
        style={{ fontSize:10, fontFamily:FONT, fill:BLUE }}>wind</text>
      <line x1={EL_X-44} y1={EL_TOP+EL_H/2-8} x2={EL_X-3} y2={EL_TOP+EL_H/2-8}
        stroke={BLUE} strokeWidth={1.6} markerEnd="url(#blueArr)"/>

      {/* h dim */}
      <VDimExt y1={roofY} y2={EL_B} objX={EL_X+EL_W} dimX={H_DIM_X} label={`h = ${h} m`} labelSide="right" fs={11}/>

      {/* hp dim */}
      {hp > 0 && (
        <VDimExt y1={parapY} y2={roofY} objX={EL_X+EL_W} dimX={H_DIM_X} label={`hp = ${hp} m`} labelSide="right" fs={11}/>
      )}

      {/* ze dashed bracket — separate column, well right of h label */}
      {(() => {
        const zeTop = hp > 0 ? parapY : roofY
        const zeMid = (EL_B + zeTop) / 2
        return <>
          <line x1={EL_X+EL_W+2} y1={EL_B}  x2={ZE_DIM_X-4} y2={EL_B}  stroke="#1e293b" strokeWidth={0.7}/>
          <line x1={EL_X+EL_W+2} y1={zeTop} x2={ZE_DIM_X-4} y2={zeTop} stroke="#1e293b" strokeWidth={0.7}/>
          <line x1={ZE_DIM_X} y1={EL_B} x2={ZE_DIM_X} y2={zeTop}
            stroke="#1e293b" strokeWidth={1} strokeDasharray="5,3"/>
          <Tick x={ZE_DIM_X} y={EL_B}/><Tick x={ZE_DIM_X} y={zeTop}/>
          <text x={ZE_DIM_X+8} y={zeMid} textAnchor="start" dominantBaseline="middle"
            style={{ fontSize:10, fontFamily:FONT, fill:MUTED }}>ze = {h} m</text>
        </>
      })()}

      {/* d dim below elevation — same y as e/10 dim on plan side */}
      <HDimExt x1={EL_X} x2={EL_X+EL_W} objY={EL_B} dimY={E10_DIM_Y} label={`d = ${d} m`} fs={11}/>

      {/* e = min(b,2h) — aligned with legend row */}
      <text x={EL_X+EL_W/2} y={LEGEND_Y} textAnchor="middle" dominantBaseline="hanging"
        style={{ fontSize:11, fontFamily:FONT, fill:DARK, fontWeight:600 }}>
        {`e = min(${b}, ${2*h}) = ${e.toFixed(1)} m`}
      </text>
    </svg>
  )
}
