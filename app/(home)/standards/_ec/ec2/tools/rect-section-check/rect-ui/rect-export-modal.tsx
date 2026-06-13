'use client'
import { useRef } from 'react'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { Ec2SlsInput } from '../rect-engine/rect-sls-calc'
import { RectReport } from './rect-report'
import RectUlsDetails from './uls/rect-uls-details'
import RectStDetails from './st/rect-st-details'
import { RectSlsPanel } from './sls/rect-sls-panel'
import { ShearSectionDiagram } from './st/rect-st-diagram'
import { ExportModal, SectionGroup } from '@/app/(home)/standards/_lib/print-engine'
import { useTranslation } from '@/app/i18n/LanguageContext'

export type { ReportMeta } from '@/app/(home)/standards/_lib/print-engine'

export function RectExportModal({
  inp, res, sls, onClose,
}: {
  inp: Ec2RectInput
  res: Ec2RectResult
  sls: Ec2SlsInput
  onClose: () => void
}) {
  const { t } = useTranslation()
  const ulsRef      = useRef<HTMLDivElement>(null)
  const ulsDetRef   = useRef<HTMLDivElement>(null)
  const slsRef      = useRef<HTMLDivElement>(null)
  const slsDetRef   = useRef<HTMLDivElement>(null)
  const shearRef    = useRef<HTMLDivElement>(null)
  const shearDetRef = useRef<HTMLDivElement>(null)

  const groups: SectionGroup[] = [
    {
      color: '#1d4ed8', label: 'ULS', defaultOn: true,
      desc: t('std_ec2rc_exp_uls_desc'),
      detDesc: t('std_ec2rc_exp_uls_detdesc'),
      refs: [ulsRef, ulsDetRef], firstIsRef: true,
    },
    {
      color: '#0d9488', label: 'SLS', defaultOn: true,
      desc: t('std_ec2rc_exp_sls_desc'),
      detDesc: t('std_ec2rc_exp_sls_detdesc'),
      refs: [slsRef, slsDetRef],
    },
    {
      color: '#b45309', label: t('std_ec2rc_exp_st_label'), defaultOn: true,
      desc: t('std_ec2rc_exp_st_desc'),
      detDesc: t('std_ec2rc_exp_st_detdesc'),
      refs: [shearRef, shearDetRef],
    },
  ]

  return (
    <ExportModal
      title={t('std_ec2rc_exp_title')}
      defaultReport={t('std_ec2rc_exp_default_report')}
      groups={groups}
      onClose={onClose}
    >
      {() => (<>
      <div ref={ulsRef}>
        <RectReport inp={inp} res={res} />
      </div>
      <div ref={ulsDetRef}>
        <div><RectUlsDetails inp={inp} res={res} /></div>
      </div>
      <div ref={slsRef}>
        <RectSlsPanel inp={inp} uls={res} sls={sls} />
      </div>
      <div ref={slsDetRef}>
        <div><RectSlsPanel inp={inp} uls={res} sls={sls} detailsOnly /></div>
      </div>
      <div ref={shearRef}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#fafafa', display: 'inline-block' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                {t('std_ec2rc_cross_section_stirrups')}
              </div>
              <ShearSectionDiagram inp={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', background: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{t('std_ec2rc_exp_shear_box')}</div>
              {([
                ['VEd',                             `${(inp.VEd ?? 0).toFixed(1)} kN`],
                [t('std_ec2rc_exp_stirrup_legs'),   `Φ${inp.stirrup_phi ?? 10} / ${inp.stirrup_s ?? 200} mm / ${inp.stirrup_legs ?? 2}`],
                [t('std_ec2rc_exp_strut_angle'),    `${res.theta_deg.toFixed(1)}°${res.theta_is_override ? ` (${t('std_ec2rc_assumed')})` : ` (${t('std_ec2rc_exp_ec2_optimal')})`}`],
                ['z = 0.9d',                        `${(res.z_shear * 1000).toFixed(0)} mm`],
                [t('std_ec2rc_exp_asw_req'),        `${res.Asw_req.toFixed(0)} mm²/m`],
                [t('std_ec2rc_exp_asw_prov'),       `${res.Asw_prov.toFixed(0)} mm²/m — ${res.Asw_prov_ok ? 'OK ✓' : 'FAIL ✗'}`],
                [t('std_ec2rc_exp_asw_min'),        `${res.Asw_min.toFixed(0)} mm²/m — ${res.Asw_min_ok ? 'OK ✓' : 'FAIL ✗'}`],
                ['VRd,c (§6.2.2)',                  `${res.VRd_c.toFixed(2)} kN`],
                ['VRd,s (§6.2.3)',                  `${res.VRd_s.toFixed(2)} kN`],
                ['VRd,max (§6.2.3)',                `${res.VRd_max.toFixed(2)} kN`],
                ['VRd = min(VRd,s, VRd,max)',       `${res.VRd.toFixed(2)} kN`],
                ['VEd ≤ VRd',                       `${(inp.VEd ?? 0).toFixed(2)} ≤ ${res.VRd.toFixed(2)} kN — ${res.shear_ok ? 'PASS ✓' : 'FAIL ✗'}`],
              ] as [string, string][]).map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9', fontSize: 10.5 }}>
                  <span style={{ color: '#374151' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', background: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{t('std_ec2rc_exp_torsion_box')}</div>
              {res.TEd <= 0 ? (
                <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic' }}>
                  {t('std_ec2rc_exp_no_torsion')} TRd,c = {res.TRd_c.toFixed(2)} kNm / TRd,max = {res.TRd_max.toFixed(2)} kNm
                </div>
              ) : (([
                ['TEd',                             `${res.TEd.toFixed(1)} kNm`],
                [t('std_ec2rc_exp_tef'),            `${(res.tef * 1000).toFixed(0)} mm`],
                [t('std_ec2rc_exp_ak'),             `${(res.Ak * 1e6).toFixed(0)} mm²`],
                [t('std_ec2rc_exp_uk'),             `${(res.uk * 1000).toFixed(0)} mm`],
                [t('std_ec2rc_exp_trd_c'),          `${res.TRd_c.toFixed(2)} kNm`],
                [t('std_ec2rc_exp_trd_max'),        `${res.TRd_max.toFixed(2)} kNm`],
                ...(res.TEd > res.TRd_c ? [
                  [t('std_ec2rc_exp_at_req'),       `${res.At_req_s.toFixed(0)} mm²/m`],
                  [t('std_ec2rc_exp_asl_req'),      `${res.Asl_req.toFixed(0)} mm²`],
                  ['T/Tmax + V/Vmax ≤ 1.0',        `${(res.TEd / res.TRd_max + (inp.VEd ?? 0) / res.VRd_max).toFixed(3)} — ${res.torsion_interaction_ok ? 'PASS ✓' : 'FAIL ✗'}`],
                ] : [
                  ['TEd ≤ TRd,c',                  t('std_ec2rc_exp_no_torsion_reinf')],
                ]),
              ] as [string, string][]).map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9', fontSize: 10.5 }}>
                  <span style={{ color: '#374151' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
                </div>
              )))}
            </div>
          </div>
        </div>
      </div>
      <div ref={shearDetRef}>
        <div><RectStDetails inp={inp} res={res} /></div>
      </div>
      </>)}
    </ExportModal>
  )
}
