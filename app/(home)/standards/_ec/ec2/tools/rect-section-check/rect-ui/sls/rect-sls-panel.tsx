'use client'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'
import { Ec2SlsInput, Ec2SlsResult, calcEc2Sls } from '../../rect-engine/rect-sls-calc'
import { RectSlsDetails } from './rect-sls-details'
import { GREEN, BLUE, RED, AMBER, Box, Row } from '../../../../../_shared/ui-atoms'
import { useTranslation } from '@/app/i18n/LanguageContext'
import type { TranslationKey } from '@/app/i18n'

const TEAL   = '#0d9488'
const VIOLET = '#7c3aed'

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      background: ok ? '#f0fdf4' : '#fef2f2',
      border: `1.5px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      borderRadius: 8, padding: '8px 12px', textAlign: 'center', flex: 1,
    }}>
      <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: ok ? '#166534' : '#991b1b' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: ok ? GREEN : RED }}>{ok ? 'PASS' : 'FAIL'}</div>
    </div>
  )
}

function SectionHeader({ children, color = '#1e40af' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${color}14`, borderBottom: `1.5px solid ${color}30`, padding: '4px 8px', marginBottom: 6, marginLeft: -8, marginRight: -8, marginTop: -8, borderRadius: '8px 8px 0 0' }}>
      {children}
    </div>
  )
}


function SlsDiagram({ inp, res, t }: { inp: Ec2RectInput; res: Ec2SlsResult; t: (k: TranslationKey) => string }) {
  const padL = 60, padR = 12, padT = 34, padB = 60
  const MAX_BW = 340, MAX_BH = 320
  const ratio = inp.b / inp.h
  let bw: number, bh: number
  if (ratio >= MAX_BW / MAX_BH) { bw = MAX_BW; bh = Math.max(80, Math.round(bw / ratio)) }
  else { bh = MAX_BH; bw = Math.max(60, Math.round(bh * ratio)) }
  const H = padT + bh + padB
  const scaleX = bw / inp.b
  const scaleY = bh / inp.h
  const x_cr = res.x_cr
  const naY   = padT + x_cr * scaleY
  const xCrPx = x_cr * scaleY
  const stirrupPhi = (inp.stirrup_phi ?? 10) / 1000  // m
  function barEdgeX(c: number, phi_m: number) { return (c + stirrupPhi / 2 + phi_m / 2) * scaleX }
  const r3 = Math.max(3, Math.min(6, (inp.phi3 / 1000) * scaleX * 8))
  const sidePhi_m = (inp.rows1[0]?.phi ?? inp.phi3) / 1000
  const sideXL = padL + barEdgeX(inp.c1, sidePhi_m)
  const sideXR = padL + bw - barEdgeX(inp.c1, sidePhi_m)
  const DARK = '#1e293b'
  const bars: { cx: number; cy: number; r: number; fill: string; tension: boolean }[] = []
  const strainAtZ = (zM: number) => res.eps_c_top + (res.eps_c_bot - res.eps_c_top) * (zM / inp.h)
  const barFill = (zFrac: number) => (zFrac * inp.h) > x_cr ? GREEN : RED

  function rowXs(n: number, c: number, phi_m: number, sArr?: number[]): number[] {
    if (n <= 0) return []
    const x0 = padL + barEdgeX(c, phi_m)
    if (n === 1) return [x0]
    const xN = padL + bw - barEdgeX(c, phi_m)
    if (n === 2) return [x0, xN]
    const placeableCount = n - 2
    let setSum = 0, autoCount = 0
    for (let j = 0; j < placeableCount; j++) {
      const sMm = sArr?.[j]
      if (sMm != null) setSum += (sMm / 1000) * scaleX
      else autoCount++
    }
    const autoSpPx = autoCount > 0 ? (xN - x0 - setSum) / (autoCount + 1) : 0
    const xs: number[] = [x0]
    for (let j = 0; j < placeableCount; j++) {
      const sMm = sArr?.[j]
      xs.push(xs[j] + (sMm != null ? (sMm / 1000) * scaleX : autoSpPx))
    }
    xs.push(xN)
    return xs
  }

  function drawRow(row: typeof inp.rows1[0], r: number, cy: number, c: number) {
    const xs = rowXs(row.n, c, row.phi / 1000, row.s)
    const fill = barFill((cy - padT) / bh)
    xs.forEach(cx => bars.push({ cx, cy, r, fill, tension: fill === GREEN }))
  }

  // rows1 (bottom) — sv overrides
  const r1Cys: { cy: number; r: number }[] = []
  {
    const phi0_m = (inp.rows1[0]?.phi ?? 0) / 1000
    let cy = padT + (inp.h - inp.c1 - stirrupPhi / 2 - phi0_m / 2) * scaleY
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
  for (let i = 0; i < inp.rows1.length; i++) drawRow(inp.rows1[i], r1Cys[i].r, r1Cys[i].cy, inp.c1)

  // rows2 (top) — sv overrides
  const r2Cys: { cy: number; r: number }[] = []
  {
    const phi0_m = (inp.rows2[0]?.phi ?? 0) / 1000
    let cy = padT + (inp.c2 + stirrupPhi / 2 + phi0_m / 2) * scaleY
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
  for (let i = 0; i < inp.rows2.length; i++) drawRow(inp.rows2[i], r2Cys[i].r, r2Cys[i].cy, inp.c2)

  // side bars — sideSv overrides
  if (inp.nbars3 > 0) {
    const phi3_m = inp.phi3 / 1000
    const sideCyTop = padT + (inp.c2 + stirrupPhi / 2 + phi3_m / 2) * scaleY
    const sideCyBot = padT + (inp.h - inp.c1 - stirrupPhi / 2 - phi3_m / 2) * scaleY
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
      const fill = barFill((cy - padT) / bh)
      bars.push({ cx: sideXL, cy, r: r3, fill, tension: fill === GREEN })
      bars.push({ cx: sideXR, cy, r: r3, fill, tension: fill === GREEN })
    }
  }
  const epsTop = res.eps_c_top
  const epsBot = res.eps_c_bot
  const sDiagMaxW = 50
  const maxEps    = Math.max(Math.abs(epsTop), Math.abs(epsBot), 0.01)
  const sDiagScale = sDiagMaxW / maxEps
  const tensPx = Math.abs(epsBot) * sDiagScale
  const zeroX = padL + bw + 60 + tensPx
  const strainX = (eps: number) => zeroX - eps * sDiagScale
  const sTopX = strainX(epsTop)
  const sBotX = strainX(epsBot)
  const eps0Y = Math.abs(epsBot - epsTop) > 1e-9
    ? padT + (-epsTop / (epsBot - epsTop)) * bh
    : -999
  const botColor = epsBot >= 0 ? GREEN : BLUE
  const sigC  = res.sigma_c
  const sigS1 = res.sigma_s1
  const stressSideW = 50
  const concreteArrowExtra = 20
  const barMaxW = 60
  const Es = 200000
  const stressGap = barMaxW + 60
  const stressOriginX = zeroX + Math.abs(epsTop) * sDiagScale + stressGap
  const totalW = Math.ceil(stressOriginX + stressSideW + concreteArrowExtra + barMaxW + 60)
  const nb3 = inp.nbars3

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg width={totalW} height={H} style={{ display: 'block', fontFamily: 'inherit', overflow: 'visible' }}>
        {xCrPx > 0 && <rect x={padL} y={padT} width={bw} height={Math.min(bh, xCrPx)} fill="#fef9c3" />}
        <rect x={padL} y={padT} width={bw} height={bh} fill="none" stroke={DARK} strokeWidth={2} />
        {naY > padT && naY < padT + bh && (
          <line x1={padL - 6} y1={naY} x2={stressOriginX + stressSideW + 4} y2={naY}
            stroke={AMBER} strokeWidth={1.5} strokeDasharray="6 3" />
        )}
        {naY > padT && naY < padT + bh && (
          <text x={(padL + bw + zeroX) / 2} y={naY - 4} fontSize={10} fill={AMBER} fontWeight={700} textAnchor="middle">
            x = {(res.x_cr * 1000).toFixed(0)} mm
          </text>
        )}
        <line x1={padL - 38} y1={padT} x2={padL - 38} y2={padT + bh} stroke={DARK} strokeWidth={1} />
        <line x1={padL - 42} y1={padT} x2={padL - 34} y2={padT} stroke={DARK} strokeWidth={1} />
        <line x1={padL - 42} y1={padT + bh} x2={padL - 34} y2={padT + bh} stroke={DARK} strokeWidth={1} />
        <text x={padL - 46} y={padT + bh / 2} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle"
          transform={`rotate(-90, ${padL - 46}, ${padT + bh / 2})`}>
          h = {(inp.h * 1000).toFixed(0)} mm
        </text>
        {xCrPx < bh && [0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={padL + bw * f} y1={naY + 6} x2={padL + bw * f} y2={padT + bh}
            stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 5" />
        ))}
        <text x={padL + bw / 2} y={padT + bh + 27} fontSize={10} fill={DARK} fontWeight={600} textAnchor="middle">
          b = {(inp.b * 1000).toFixed(0)} mm
        </text>
        <line x1={padL + bw} y1={padT} x2={zeroX} y2={padT} stroke={BLUE} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <line x1={padL + bw} y1={padT + bh} x2={zeroX} y2={padT + bh} stroke={BLUE} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <line x1={sTopX + 4} y1={padT} x2={stressOriginX} y2={padT} stroke={DARK} strokeWidth={1} strokeDasharray="3 3" opacity={0.3} />
        {eps0Y > padT && eps0Y < padT + bh && (
          <line x1={zeroX} y1={eps0Y} x2={stressOriginX} y2={eps0Y} stroke={DARK} strokeWidth={1} strokeDasharray="3 3" opacity={0.3} />
        )}
        <line x1={Math.max(sTopX, sBotX) + 4} y1={padT + bh} x2={stressOriginX} y2={padT + bh} stroke={DARK} strokeWidth={1} strokeDasharray="3 3" opacity={0.3} />
        <polygon points={`${zeroX},${padT} ${sTopX},${padT} ${sBotX},${padT + bh} ${zeroX},${padT + bh}`}
          fill={`${BLUE}30`} stroke={BLUE} strokeWidth={2} strokeLinejoin="round" />
        {eps0Y > padT && eps0Y < padT + bh && (
          <circle cx={zeroX} cy={eps0Y} r={4} fill={AMBER} stroke="#fff" strokeWidth={1.5} />
        )}
        <text x={sTopX} y={padT - 6} fontSize={11} fill={BLUE} textAnchor="middle" fontWeight={700}>{epsTop.toFixed(2)}‰</text>
        <text x={sBotX} y={padT + bh + 16} fontSize={11} fill={botColor} textAnchor="middle" fontWeight={700}>{epsBot.toFixed(2)}‰</text>
        <text x={zeroX + 4} y={padT - 18} fontSize={11} fill={DARK} fontWeight={700} fontStyle="italic">ε</text>
        <line x1={stressOriginX} y1={padT - 8} x2={stressOriginX} y2={padT + bh + 8} stroke={DARK} strokeWidth={1.5} />
        {xCrPx > 0 && sigC > 0 && (
          <polygon points={`${stressOriginX},${padT} ${stressOriginX + stressSideW},${padT} ${stressOriginX},${naY}`}
            fill="#fef9c3" stroke={DARK} strokeWidth={2} />
        )}
        {sigC > 0 && (
          <text x={stressOriginX + stressSideW} y={padT - 6} fontSize={10} fill={DARK} textAnchor="middle" fontWeight={700}>
            {sigC.toFixed(1)} MPa
          </text>
        )}
        {sigC > 0 && (
          <line x1={stressOriginX + stressSideW} y1={padT - 3} x2={stressOriginX + stressSideW} y2={naY}
            stroke={DARK} strokeWidth={1} strokeDasharray="3 2" opacity={0.4} />
        )}
        {xCrPx > 0 && sigC > 0 && (() => {
          const ay = padT + xCrPx / 3
          const lineStart = stressOriginX + stressSideW + concreteArrowExtra
          const aw = 8, ah = 5
          return (
            <g opacity={0.95}>
              <line x1={lineStart} y1={ay} x2={stressOriginX + aw} y2={ay} stroke={BLUE} strokeWidth={2.5} />
              <polygon points={`${stressOriginX},${ay} ${stressOriginX + aw},${ay - ah} ${stressOriginX + aw},${ay + ah}`} fill={BLUE} />
            </g>
          )
        })()}
        <text x={stressOriginX + stressSideW + concreteArrowExtra + 12} y={padT - 18} fontSize={11} fill={DARK} fontWeight={700} fontStyle="italic">σ</text>
        {(() => {
          const barSigs = bars.map(bar => {
            const zM = (bar.cy - padT) / bh * inp.h
            return strainAtZ(zM) / 1000 * Es
          })
          const sigRef = Math.max(...barSigs.map(Math.abs), 1)
          const seen = new Set<number>()
          return bars.map((bar, i) => {
            const sigBar = barSigs[i]
            const sigPx = Math.min(Math.abs(sigBar) / sigRef * barMaxW, barMaxW)
            const tension = bar.tension
            const color = tension ? GREEN : RED
            const aw = 7, ah = 4.5
            if (sigPx < 1) return null
            const showLabel = !seen.has(bar.cy) && sigPx > 2
            if (showLabel) seen.add(bar.cy)
            const label = `${Math.round(Math.abs(sigBar))} MPa`
            if (tension) {
              const tip = stressOriginX + sigPx
              return (
                <g key={i} opacity={0.9}>
                  <line x1={stressOriginX} y1={bar.cy} x2={tip - aw} y2={bar.cy} stroke={color} strokeWidth={1.5} />
                  <polygon points={`${tip},${bar.cy} ${tip - aw},${bar.cy - ah} ${tip - aw},${bar.cy + ah}`} fill={color} />
                  {showLabel && <text x={tip + 3} y={bar.cy + 4} fontSize={8} fill={color} fontWeight={700} style={{ fontFamily: 'ui-monospace,monospace' }}>{label}</text>}
                </g>
              )
            } else {
              const tip = stressOriginX - sigPx
              return (
                <g key={i} opacity={0.9}>
                  <line x1={stressOriginX} y1={bar.cy} x2={tip + aw} y2={bar.cy} stroke={color} strokeWidth={1.5} />
                  <polygon points={`${tip},${bar.cy} ${tip + aw},${bar.cy - ah} ${tip + aw},${bar.cy + ah}`} fill={color} />
                  {showLabel && <text x={tip - 3} y={bar.cy + 4} fontSize={8} fill={color} fontWeight={700} textAnchor="end" style={{ fontFamily: 'ui-monospace,monospace' }}>{label}</text>}
                </g>
              )
            }
          })
        })()}
        {bars.map((bar, i) => (
          <circle key={i} cx={bar.cx} cy={bar.cy} r={bar.r} fill={bar.fill} stroke="#fff" strokeWidth={1.2} opacity={0.9} />
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
        <circle cx={padL + 6}  cy={padT + bh + 42} r={5} fill={GREEN} />
        <text x={padL + 14} y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_tension')}</text>
        <circle cx={padL + 68} cy={padT + bh + 42} r={5} fill={RED} />
        <text x={padL + 76} y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_compression')}</text>
        <rect x={padL + 155} y={padT + bh + 36} width={11} height={9} fill="#fef9c3" stroke={DARK} strokeWidth={1} />
        <text x={padL + 169} y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>{t('std_ec2rc_comp_zone')}</text>
        <rect x={padL + 240} y={padT + bh + 36} width={11} height={9} fill="#fef9c3" stroke={DARK} strokeWidth={1} />
        <text x={padL + 254} y={padT + bh + 47} fontSize={9} fill={DARK} fontWeight={600}>σ ({t('std_ec2rc_linear')})</text>
      </svg>
    </div>
  )
}

export function RectSlsPanel({
  inp, uls, sls, detailsOnly = false,
}: {
  inp: Ec2RectInput
  uls: Ec2RectResult
  sls: Ec2SlsInput
  detailsOnly?: boolean
}) {
  const { t } = useTranslation()
  const res: Ec2SlsResult = calcEc2Sls(inp, sls, uls.Ecm)

  if (detailsOnly) {
    return <RectSlsDetails inp={inp} uls={uls} sls={sls} />
  }

  const allOk = res.sigma_c_ok && res.As_min_ok && res.wk_ok && res.phi_ok && res.s_ok

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Diagram — full width, centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2rc_cracked_section')}
        </div>
        <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <SlsDiagram inp={inp} res={res} t={t} />
        </div>
      </div>

      {/* All result cards — centered row, each card fixed ~280px wide */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 12 }}>
        <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
          <Box title={t('std_ec2rc_sls_concrete_stress_limit')} accent={AMBER}>
            <Row labelNode={<>σ<sub>c</sub> ({t('std_ec2rc_top')}, {t('std_ec2rc_compression')})</>} value={res.sigma_c.toFixed(2)} unit="MPa"
              tip={t('std_ec2rc_tip_sc_top')} />
            <Row labelNode={<>{t('std_ec2rc_limit')} 0.6·f<sub>ck</sub></>} value={res.sigma_c_lim.toFixed(2)} unit="MPa"
              tip={t('std_ec2rc_tip_sc_limit')} />
            <Row labelNode={<><strong>σ<sub>c</sub> ≤ 0.6·f<sub>ck</sub></strong></>} value={`${res.sigma_c.toFixed(2)} ≤ ${res.sigma_c_lim.toFixed(2)}`} unit="MPa" ok={res.sigma_c_ok}
              tip={t('std_ec2rc_tip_sc_check')} />
            <div style={{ marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 4 }}>
              <Row labelNode={<>σ<sub>s,1</sub> ({t('std_ec2rc_bottom_steel')})</>} value={res.sigma_s1.toFixed(2)} unit="MPa"
                tip={t('std_ec2rc_tip_ss1')} />
              <Row labelNode={<>σ<sub>s,2</sub> ({t('std_ec2rc_top_steel')})</>} value={res.sigma_s2.toFixed(2)} unit="MPa"
                tip={t('std_ec2rc_tip_ss2')} />
            </div>
          </Box>
        </div>

        <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
          <Box title={t('std_ec2rc_sls_min_reinf')} accent={TEAL}>
            <Row labelNode={<>f<sub>ct,eff</sub> = f<sub>ctm</sub></>} value={res.fct_eff.toFixed(3)} unit="MPa"
              tip={t('std_ec2rc_tip_fct_eff')} />
            <Row labelNode={<>k<sub>c</sub> <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 10, fontWeight: 400 }}>{t('std_ec2rc_bending_tension_hint')}</span></>}
              value={sls.kc.toFixed(2)}
              tip={t('std_ec2rc_tip_kc')} />
            <Row labelNode={<>k ({t('std_ec2rc_depth_factor')})</>} value={res.k.toFixed(3)}
              tip={t('std_ec2rc_tip_k_depth')} />
            <Row labelNode={<>A<sub>s,min</sub> = k<sub>c</sub>·k·f<sub>ct,eff</sub>·A<sub>ct</sub>/σ<sub>s</sub></>} value={(res.As_min * 1e6).toFixed(0)} unit="mm²"
              tip={t('std_ec2rc_tip_as_min')} />
            <Row labelNode={<><strong>A<sub>s,prov</sub> ≥ A<sub>s,min</sub></strong></>} value={`${(res.As_prov * 1e6).toFixed(0)} ≥ ${(res.As_min * 1e6).toFixed(0)}`} unit="mm²" ok={res.As_min_ok}
              tip={t('std_ec2rc_tip_as_min_check')} />
          </Box>
        </div>

        <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
          <Box title={t('std_ec2rc_sls_crack_width')} accent={VIOLET}>
            <Row labelNode={<>ρ<sub>p,eff</sub> = A<sub>s,eff</sub>/A<sub>c,eff</sub></>} value={res.rho_p_eff.toFixed(5)}
              tip={t('std_ec2rc_tip_rho_p_eff')} />
            <Row labelNode={<>φ<sub>eff</sub> = ΣΦ<sub>i</sub>²/ΣΦ<sub>i</sub></>} value={res.phi_eff.toFixed(2)} unit="mm"
              tip={t('std_ec2rc_tip_phi_eff')} />
            <Row labelNode={<>s<sub>r,max</sub> ({t('std_ec2rc_formula')})</>} value={res.sr_max_calc.toFixed(1)} unit="mm"
              tip={t('std_ec2rc_tip_sr_max')} />
            <Row labelNode={<>s<sub>r,max</sub> ({t('std_ec2rc_upper_bound')} 1.3(h−x))</>} value={res.sr_max_ub.toFixed(1)} unit="mm"
              tip={t('std_ec2rc_tip_sr_ub')} />
            <Row labelNode={<><strong>s<sub>r,max</sub> ({t('std_ec2rc_adopted')})</strong></>} value={res.sr_max.toFixed(1)} unit="mm"
              tip={t('std_ec2rc_tip_sr_adopted')} />
            <Row labelNode={<>ε<sub>sm</sub>−ε<sub>cm</sub> {t('std_ec2rc_factor')}</>} value={res.factor.toFixed(4)}
              tip={t('std_ec2rc_tip_esm_ecm')} />
            <Row labelNode={<>ε<sub>sm</sub> − ε<sub>cm</sub> ({t('std_ec2rc_adopted')})</>} value={res.eps_sm_cm.toFixed(4)} unit="‰"
              tip={t('std_ec2rc_tip_mean_strain')} />
            <Row labelNode={<><strong>w<sub>k</sub> = s<sub>r,max</sub>·(ε<sub>sm</sub>−ε<sub>cm</sub>)</strong></>}
              value={`${res.wk.toFixed(3)} / ${sls.wk_lim}`} unit="mm" ok={res.wk_ok}
              tip={`${t('std_ec2rc_tip_wk')} ${sls.wk_lim} ${t('std_ec2rc_tip_wk_dyn2')}`} />
          </Box>
        </div>

        <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
          <Box title={t('std_ec2rc_sls_bar_spacing')} accent={BLUE}>
            <Row labelNode={<>σ<sub>s,1</sub> ({t('std_ec2rc_service_stress')})</>} value={res.sigma_s1.toFixed(2)} unit="MPa"
              tip={t('std_ec2rc_tip_ss1_bar')} />
            <Row labelNode={<>w<sub>k</sub> {t('std_ec2rc_limit').toLowerCase()}</>} value={`${sls.wk_lim}`} unit="mm"
              tip={t('std_ec2rc_tip_wk_lim')} />
            <div style={{ marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 4 }}>
              <Row labelNode={<><strong>{t('std_ec2rc_phi_prov_max')}</strong></>} value={`${res.phi_prov.toFixed(0)} ≤ ${res.phi_max.toFixed(0)}`} unit="mm" ok={res.phi_ok}
                tip={`${t('std_ec2rc_tip_phi_max')} ${sls.wk_lim} mm, σ_s = ${res.sigma_s1.toFixed(0)} MPa.`} />
              <Row labelNode={<><strong>{t('std_ec2rc_s_prov_max')}</strong></>} value={`${res.s_prov.toFixed(0)} ≤ ${res.s_max.toFixed(0)}`} unit="mm" ok={res.s_ok}
                tip={`${t('std_ec2rc_tip_s_max')} ${sls.wk_lim} mm, σ_s = ${res.sigma_s1.toFixed(0)} MPa.`} />
            </div>
            <div style={{ marginTop: 6, fontSize: 9, color: '#94a3b8', lineHeight: 1.5 }}>
              {t('std_ec2rc_table_73n_note')} {sls.wk_lim} mm · {t('std_ec2rc_high_bond_bending')}
            </div>
          </Box>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 10, color: '#64748b', lineHeight: 1.7 }}>
        <strong style={{ color: '#374151' }}>{t('std_ec2rc_sls_assumptions')} </strong>
        {t('std_ec2rc_sls_assumptions_text')}
      </div>
    </div>
  )
}
