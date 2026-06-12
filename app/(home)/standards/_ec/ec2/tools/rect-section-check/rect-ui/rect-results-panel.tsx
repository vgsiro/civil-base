'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { RebarRow } from '../rect-engine/rect-types'
import { Ec2SlsInput, Ec2SlsResult, calcEc2Sls } from '../rect-engine/rect-sls-calc'
import { SpacingClickInfo } from '../../../../_shared/section-diagram'
import { n2 } from '../../../../_shared/ui-atoms'
import RectUlsDetails from './uls/rect-uls-details'
import RectStDetails from './st/rect-st-details'
import { RectExportModal } from './rect-export-modal'
import { RectSlsPanel } from './sls/rect-sls-panel'
import { PassFailBar } from './rect-pass-fail-bar'
import { ShearPanel } from './st/rect-st-panel'
import { UlsResults } from './uls/rect-uls-panel'
import { LockedBanner } from '@/app/_components/shared/LockedBanner'
import type { ToolAccess } from '@/lib/useSubscription'
import { DetailsSection } from '@/app/(home)/standards/_lib/ui'
import { useTranslation } from '@/app/i18n/LanguageContext'

type SpacingPopover = SpacingClickInfo & { draft: string }

function SpacingPopoverUI({ pop, onCommit, onReset, onClose }: {
  pop: SpacingPopover
  onCommit: (s: number) => void
  onReset: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
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
        {pop.kind === 'v' ? t('std_ec2rc_row_spacing') : t('std_ec2rc_bar_spacing_cc')}
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
        {t('std_ec2rc_auto')} ({pop.autoS} mm)
      </button>
    </div>
  )
}

const DEFAULT_ACCESS: ToolAccess = { canUse: true, canViewDetails: false, canExport: false, canCopyDetails: false }

export function RectResultsPanel({
  inp, res, activeTab, onTabChange, sls, setRow1, setRow2, setInp,
  toolAccess = DEFAULT_ACCESS,
}: {
  inp: Ec2RectInput
  res: Ec2RectResult
  activeTab: 'uls' | 'sls' | 'shear-torsion'
  onTabChange: (t: 'uls' | 'sls' | 'shear-torsion') => void
  sls: Ec2SlsInput
  setRow1: (i: number, patch: Partial<RebarRow>) => void
  setRow2: (i: number, patch: Partial<RebarRow>) => void
  setInp: (patch: (prev: Ec2RectInput) => Ec2RectInput) => void
  toolAccess?: ToolAccess
}) {
  const { t } = useTranslation()
  const anyEffect = !!(inp.firstOrder || inp.secondOrder)
  const [showExport, setShowExport] = useState(false)
  const [ulsDetails, setUlsDetails] = useState(false)
  const [slsDetails, setSlsDetails] = useState(false)
  const [stDetails, setStDetails] = useState(false)
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
    <div className="rect-results-panel" style={{ flex: 1, minWidth: 0, overflowY: 'visible', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}
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
          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '2px 10px' }}>{t('std_ec2rc_converged')}</span>
          : <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 99, padding: '2px 10px' }}>{t('std_ec2rc_not_converged')}</span>
        )}

        {toolAccess.canExport ? (
          <button onClick={() => setShowExport(true)} style={{
            fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#fff',
            background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', border: 'none',
            borderRadius: 99, padding: '3px 13px', marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 1px 4px rgba(37,99,235,0.3)', transition: 'all 0.15s',
          }}>
            {t('std_ec2rc_export_report')}
          </button>
        ) : (
          <span title={t('std_ec2rc_premium_feature')} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#8b5cf6', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 99, padding: '3px 10px', cursor: 'default' }}>
            {t('std_ec2rc_export_premium')}
          </span>
        )}
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
                  {t(sub === 'results' ? 'std_ec2rc_results' : 'std_ec2rc_details')}
                </button>
              ))}
            </div>
            {slsRes && (() => {
              const allOk = slsRes.sigma_c_ok && slsRes.As_min_ok && slsRes.wk_ok && slsRes.phi_ok && slsRes.s_ok
              return <>
                <PassFailBar items={[
                  { label: `${t('std_ec2rc_concrete_stress')} §7.2`, ok: slsRes.sigma_c_ok },
                  { label: `${t('std_ec2rc_min_reinf')} §7.3.2`, ok: slsRes.As_min_ok },
                  { label: `${t('std_ec2rc_crack_width')} wk ≤ ${sls.wk_lim} mm`, ok: slsRes.wk_ok },
                  { label: `${t('std_ec2rc_bar_spacing')} §7.3N`, ok: slsRes.phi_ok && slsRes.s_ok },
                ]} />
                <div style={{
                  background: allOk ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${allOk ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 6, padding: '6px 12px', fontSize: 10,
                  color: allOk ? '#166534' : '#991b1b', fontWeight: 600,
                }}>
                  {allOk ? t('std_ec2rc_all_sls_pass') : t('std_ec2rc_sls_fail')}
                  {' '}σc = <strong>{n2(slsRes.sigma_c, 1)} MPa</strong>
                  {' '}· wk = <strong>{slsRes.wk.toFixed(3)} mm</strong>
                </div>
              </>
            })()}
          </div>
          {slsSubTab === 'details'
            ? toolAccess.canViewDetails
              ? <DetailsSection><RectSlsPanel inp={inp} uls={res} sls={sls} detailsOnly /></DetailsSection>
              : <LockedBanner requiredTier="pro" message={t('std_ec2rc_upgrade_sls')} />
            : <RectSlsPanel inp={inp} uls={res} sls={sls} />}
        </div>
      )}

      {/* ── S&T Tab ── */}
      {activeTab === 'shear-torsion' && (() => {
        const VEd = inp.VEd ?? 0
        const TEd = inp.TEd ?? 0
        const At_prov  = res.Asw_prov
        const Asl_prov = res.Astot * 100
        const at_ok    = TEd <= res.TRd_c || At_prov  >= res.At_req_s
        const asl_ok   = TEd <= res.TRd_c || Asl_prov >= res.Asl_req
        const allOk    = res.shear_ok && res.Asw_prov_ok && res.Asw_min_ok && at_ok && asl_ok && res.torsion_interaction_ok
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'flex-start' }}>
                {(['results', 'details'] as const).map(sub => (
                  <button key={sub} onClick={() => setStDetails(sub === 'details')} style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', border: 'none',
                    background: (stDetails ? sub === 'details' : sub === 'results') ? '#f1f5f9' : '#f8fafc',
                    color: (stDetails ? sub === 'details' : sub === 'results') ? '#1e293b' : '#94a3b8',
                    borderRight: sub === 'results' ? '1px solid #e2e8f0' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {t(sub === 'results' ? 'std_ec2rc_results' : 'std_ec2rc_details')}
                  </button>
                ))}
              </div>
              <PassFailBar items={[
                { label: `VEd ${res.shear_ok ? '≤' : '>'} VRd`, ok: res.shear_ok },
                { label: 'Asw/s prov ≥ req', ok: res.Asw_prov_ok },
                { label: 'Asw/s min §9.2.2', ok: res.Asw_min_ok },
                ...(TEd > 0 ? (
                  TEd <= res.TRd_c
                    ? [{ label: `TEd ≤ TRd,c (${t('std_ec2rc_no_reinf')})`, ok: true }]
                    : [
                      { label: 'At/s prov ≥ req', ok: at_ok },
                      { label: 'Asl prov ≥ req', ok: asl_ok },
                      { label: `${t('std_ec2rc_vt_interaction')} §6.3`, ok: res.torsion_interaction_ok },
                    ]
                ) : []),
              ]} />
              <div style={{
                background: allOk ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${allOk ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 6, padding: '6px 12px', fontSize: 10,
                color: allOk ? '#166534' : '#991b1b', fontWeight: 600,
              }}>
                {allOk ? t('std_ec2rc_all_st_pass') : t('std_ec2rc_st_fail')}
                {' '}θ = <strong>{res.theta_deg.toFixed(1)}°</strong>
                {' '}· z = <strong>{(res.z_shear * 1000).toFixed(0)} mm</strong>
                {' '}· VRd,c = <strong>{res.VRd_c.toFixed(1)} kN</strong>
              </div>
            </div>
            {!stDetails && <ShearPanel inp={inp} res={res} />}
            {stDetails && (toolAccess.canViewDetails
              ? <DetailsSection><RectStDetails inp={inp} res={res} /></DetailsSection>
              : <LockedBanner requiredTier="pro" message={t('std_ec2rc_upgrade_st')} />
            )}
          </div>
        )
      })()}

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
                  {t(sub === 'results' ? 'std_ec2rc_results' : 'std_ec2rc_details')}
                </button>
              ))}
            </div>
            <PassFailBar items={[
              { label: `${t('std_ec2rc_check_moment')} MRd ${ok_M ? '≥' : '<'} MEd`, ok: ok_M },
              { label: `${t('std_ec2rc_check_axial')} NEd ${ok_N ? t('std_ec2rc_in_range') : t('std_ec2rc_out_of_range')}`, ok: ok_N },
              { label: `${t('std_ec2rc_check_shear')} VRd ${res.shear_ok ? '≥' : '<'} VEd`, ok: res.shear_ok },
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
                  {allOk ? t('std_ec2rc_all_uls_pass') : t('std_ec2rc_uls_fail')}
                  {' '}MRd = <strong>{n2(res.MRd_plus)} kNm</strong>
                  {' '}· NRd,c = <strong>{n2(res.NRd_c, 0)} kN</strong>
                  {' '}· VRd = <strong>{n2(res.VRd)} kN</strong>
                </div>
              )
            })()}
          </div>

          {ulsSubTab === 'details' && (toolAccess.canViewDetails
            ? <DetailsSection><RectUlsDetails inp={inp} res={res} /></DetailsSection>
            : <LockedBanner requiredTier="pro" message={t('std_ec2rc_upgrade_uls')} />
          )}
          {ulsSubTab === 'results' && (
            <UlsResults inp={inp} res={res} anyEffect={anyEffect} onSpacingClick={handleSpacingClick} />
          )}
        </div>
      )}
    </div>
  )
}
