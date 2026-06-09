'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { RebarRow } from '../rect-engine/rect-types'
import { Ec2SlsInput, Ec2SlsResult, calcEc2Sls } from '../rect-engine/rect-sls-calc'
import { SpacingClickInfo } from '../../../../_shared/section-diagram'
import { n2 } from '../../../../_shared/ui-atoms'
import RectUlsDetails from './uls/rect-uls-details'
import { RectExportModal } from './rect-export-modal'
import { RectSlsPanel } from './sls/rect-sls-panel'
import { PassFailBar } from './rect-pass-fail-bar'
import { ShearPanel } from './st/rect-st-panel'
import { UlsResults } from './uls/rect-uls-panel'

type SpacingPopover = SpacingClickInfo & { draft: string }

function SpacingPopoverUI({ pop, onCommit, onReset, onClose }: {
  pop: SpacingPopover
  onCommit: (s: number) => void
  onReset: () => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(pop.draft)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.select() }, [])

  function commit(val: string) {
    const n = parseInt(val, 10)
    if (n >= 20 && n <= 2000) onCommit(n)
    else onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: pop.svgX - 70, top: pop.svgY + 6,
        zIndex: 9999, background: '#fff',
        border: '1.5px solid #2563eb', borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140,
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {pop.kind === 'v' ? 'Row spacing c-c [mm]' : 'Bar spacing c-c [mm]'}
      </div>
      <input
        ref={inputRef}
        type="number" min={20} max={2000} step={5}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(draft)
          if (e.key === 'Escape') onClose()
        }}
        onBlur={() => commit(draft)}
        style={{
          width: '100%', padding: '5px 8px', fontSize: 13, fontWeight: 700,
          border: '1px solid #93c5fd', borderRadius: 5, outline: 'none',
          color: '#1d4ed8', boxSizing: 'border-box',
        }}
      />
      <button
        onMouseDown={e => { e.preventDefault(); onReset() }}
        style={{ fontSize: 10, fontWeight: 600, padding: '3px 0', borderRadius: 5, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}
      >
        Auto ({pop.autoS} mm)
      </button>
    </div>
  )
}

export function RectResultsPanel({
  inp, res, activeTab, onTabChange, sls, setRow1, setRow2, setInp,
}: {
  inp: Ec2RectInput
  res: Ec2RectResult
  activeTab: 'uls' | 'sls' | 'shear-torsion'
  onTabChange: (t: 'uls' | 'sls' | 'shear-torsion') => void
  sls: Ec2SlsInput
  setRow1: (i: number, patch: Partial<RebarRow>) => void
  setRow2: (i: number, patch: Partial<RebarRow>) => void
  setInp: (patch: (prev: Ec2RectInput) => Ec2RectInput) => void
}) {
  const anyEffect = !!(inp.firstOrder || inp.secondOrder)
  const [showExport, setShowExport] = useState(false)
  const [ulsDetails, setUlsDetails] = useState(false)
  const [slsDetails, setSlsDetails] = useState(false)
  const [spacingPop, setSpacingPop] = useState<SpacingPopover | null>(null)

  function handleSpacingClick(info: SpacingClickInfo) {
    setSpacingPop({ ...info, draft: String(info.currentS) })
  }
  function commitSpacing(sMm: number) {
    if (!spacingPop) return
    if (spacingPop.kind === 'side') {
      const newS = [...(inp.sideSv ?? [])]
      newS[spacingPop.gapIdx] = sMm
      setInp(prev => ({ ...prev, sideSv: newS }))
    } else if (spacingPop.kind === 'v') {
      const setter = spacingPop.layer === 'rows1' ? setRow1 : setRow2
      setter(spacingPop.rowIdx, { sv: sMm })
    } else {
      const rows = spacingPop.layer === 'rows1' ? inp.rows1 : inp.rows2
      const setter = spacingPop.layer === 'rows1' ? setRow1 : setRow2
      const row = rows[spacingPop.rowIdx]
      const newS = [...(row.s ?? [])]
      newS[spacingPop.gapIdx] = sMm
      setter(spacingPop.rowIdx, { s: newS })
    }
    setSpacingPop(null)
  }
  function resetSpacing() {
    if (!spacingPop) return
    if (spacingPop.kind === 'side') {
      const newS = [...(inp.sideSv ?? [])]
      newS[spacingPop.gapIdx] = undefined as unknown as number
      const allAuto = newS.every(v => v == null)
      setInp(prev => ({ ...prev, sideSv: allAuto ? undefined : newS }))
    } else if (spacingPop.kind === 'v') {
      const setter = spacingPop.layer === 'rows1' ? setRow1 : setRow2
      setter(spacingPop.rowIdx, { sv: undefined })
    } else {
      const rows = spacingPop.layer === 'rows1' ? inp.rows1 : inp.rows2
      const setter = spacingPop.layer === 'rows1' ? setRow1 : setRow2
      const row = rows[spacingPop.rowIdx]
      const newS = [...(row.s ?? [])]
      newS[spacingPop.gapIdx] = undefined as unknown as number
      const allAuto = newS.every(v => v == null)
      setter(spacingPop.rowIdx, { s: allAuto ? undefined : newS })
    }
    setSpacingPop(null)
  }

  const ulsSubTab: 'results' | 'details' = ulsDetails ? 'details' : 'results'
  const slsSubTab: 'results' | 'details' = slsDetails ? 'details' : 'results'

  const slsRes = useMemo<Ec2SlsResult | null>(() => {
    try { return calcEc2Sls(inp, sls, res.Ecm) } catch { return null }
  }, [inp, sls, res.Ecm])

  const MEd_check = anyEffect ? res.MEd_tot : Math.abs(inp.MEd)
  const ok_M = res.MRd_plus >= MEd_check
  const ok_N = inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t

  return (
    <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}
      onClick={() => spacingPop && setSpacingPop(null)}
    >
      {spacingPop && (
        <SpacingPopoverUI
          pop={spacingPop}
          onCommit={commitSpacing}
          onReset={resetSpacing}
          onClose={() => setSpacingPop(null)}
        />
      )}

      {/* Tab bar + Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
          {(['uls', 'sls', 'shear-torsion'] as const).map(tab => (
            <button key={tab} onClick={() => onTabChange(tab)} style={{
              fontSize: 11, fontWeight: 700, padding: '4px 16px', cursor: 'pointer', border: 'none',
              background: activeTab === tab ? (tab === 'uls' ? '#1d4ed8' : tab === 'sls' ? '#0d9488' : '#b45309') : '#f8fafc',
              color: activeTab === tab ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}>
              {tab === 'shear-torsion' ? 'S&T' : tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === 'uls' && (res.converged
          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '2px 10px' }}>Converged ✓</span>
          : <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 99, padding: '2px 10px' }}>Not converged</span>
        )}

        <button onClick={() => setShowExport(true)} style={{
          fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#fff',
          background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', border: 'none',
          borderRadius: 99, padding: '3px 13px', marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: 5,
          boxShadow: '0 1px 4px rgba(37,99,235,0.3)', transition: 'all 0.15s',
        }}>
          Export Report
        </button>
      </div>

      {showExport && <RectExportModal inp={inp} res={res} sls={sls} onClose={() => setShowExport(false)} />}

      {/* ── SLS Tab ── */}
      {activeTab === 'sls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'flex-start' }}>
              {(['results', 'details'] as const).map(sub => (
                <button key={sub} onClick={() => setSlsDetails(sub === 'details')} style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', border: 'none',
                  background: (slsSubTab === sub) ? '#f1f5f9' : '#f8fafc',
                  color: (slsSubTab === sub) ? '#1e293b' : '#94a3b8',
                  borderRight: sub === 'results' ? '1px solid #e2e8f0' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </button>
              ))}
            </div>
            {slsRes && (() => {
              const allOk = slsRes.sigma_c_ok && slsRes.As_min_ok && slsRes.wk_ok && slsRes.phi_ok && slsRes.s_ok
              return <>
                <PassFailBar items={[
                  { label: 'Concrete stress §7.2', ok: slsRes.sigma_c_ok },
                  { label: 'Min reinf §7.3.2', ok: slsRes.As_min_ok },
                  { label: `Crack width wk ≤ ${sls.wk_lim} mm`, ok: slsRes.wk_ok },
                  { label: 'Bar Ø / spacing §7.3N', ok: slsRes.phi_ok && slsRes.s_ok },
                ]} />
                <div style={{
                  background: allOk ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${allOk ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 6, padding: '6px 12px', fontSize: 10,
                  color: allOk ? '#166534' : '#991b1b', fontWeight: 600,
                }}>
                  {allOk ? '✓ All SLS checks pass.' : '✗ One or more SLS checks fail — see details below.'}
                  {' '}σc = <strong>{n2(slsRes.sigma_c, 1)} MPa</strong>
                  {' '}· wk = <strong>{slsRes.wk.toFixed(3)} mm</strong>
                </div>
              </>
            })()}
          </div>
          {slsSubTab === 'details'
            ? <RectSlsPanel inp={inp} uls={res} sls={sls} detailsOnly />
            : <RectSlsPanel inp={inp} uls={res} sls={sls} />}
        </div>
      )}

      {/* ── S&T Tab ── */}
      {activeTab === 'shear-torsion' && <ShearPanel inp={inp} res={res} />}

      {/* ── ULS Tab ── */}
      {activeTab === 'uls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'flex-start' }}>
              {(['results', 'details'] as const).map(sub => (
                <button key={sub} onClick={() => setUlsDetails(sub === 'details')} style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', border: 'none',
                  background: (ulsSubTab === sub) ? '#f1f5f9' : '#f8fafc',
                  color: (ulsSubTab === sub) ? '#1e293b' : '#94a3b8',
                  borderRight: sub === 'results' ? '1px solid #e2e8f0' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </button>
              ))}
            </div>
            <PassFailBar items={[
              { label: `Moment MRd ${ok_M ? '≥' : '<'} MEd`, ok: ok_M },
              { label: `Axial NEd ${ok_N ? 'in range' : 'out of range'}`, ok: ok_N },
              { label: `Shear VRd ${res.shear_ok ? '≥' : '<'} VEd`, ok: res.shear_ok },
            ]} />
            {(() => {
              const allOk = ok_M && ok_N && res.shear_ok
              return (
                <div style={{
                  background: allOk ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${allOk ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 6, padding: '6px 12px', fontSize: 10,
                  color: allOk ? '#166534' : '#991b1b', fontWeight: 600,
                }}>
                  {allOk ? '✓ All ULS checks pass.' : '✗ One or more ULS checks fail — see details below.'}
                  {' '}MRd = <strong>{n2(res.MRd_plus)} kNm</strong>
                  {' '}· NRd,c = <strong>{n2(res.NRd_c, 0)} kN</strong>
                  {' '}· VRd = <strong>{n2(res.VRd)} kN</strong>
                </div>
              )
            })()}
          </div>

          {ulsSubTab === 'details' && <RectUlsDetails inp={inp} res={res} />}
          {ulsSubTab === 'results' && (
            <UlsResults inp={inp} res={res} anyEffect={anyEffect} onSpacingClick={handleSpacingClick} />
          )}
        </div>
      )}
    </div>
  )
}
