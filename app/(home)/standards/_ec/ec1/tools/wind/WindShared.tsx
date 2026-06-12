'use client'
import { NumInput, ResultRow, ResultsBox , LabelTip } from '@/app/(home)/standards/_lib/ui'
import { INPUT_STYLE, LABEL_STYLE, SELECT_STYLE, INPUT_GRID, INPUT_DIVIDER } from '../../../../_lib/ui-styles'
import { TERRAIN_CATS } from './wind-types'
import { calcPeakPressure } from './wind-helpers'
import { useTranslation } from '@/app/i18n/LanguageContext'

// Group 1 — terrain + vb (top of every calculator)
export function WindPrimaryInputs({ vb, setVb, cat, setCat }: {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div style={INPUT_GRID}>
      <div>
        <LabelTip tip={t('std_ec1w_tip_terrain')}>{t('std_ec1w_terrain_category')}</LabelTip>
        <select style={SELECT_STYLE} value={cat} onChange={e => setCat(e.target.value)}>
          {TERRAIN_CATS.map(c => <option key={c.id} value={c.id}>Cat. {c.id} — {t(c.descKey)}</option>)}
        </select>
      </div>
      <div>
        <LabelTip tip={t('std_ec1w_tip_vb')}>v<sub>b</sub> — {t('std_ec1w_vb_label')}</LabelTip>
        <NumInput style={INPUT_STYLE} min={0} max={100} step={0.5} value={vb} onChange={setVb} />
      </div>
    </div>
  )
}

// Group 2 — c0 + rho (after geometry, separated by a divider)
export function WindSecondaryInputs({ c0, setC0, rho, setRho }: {
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div style={INPUT_GRID}>
      <div>
        <LabelTip tip={t('std_ec1w_tip_c0')}>c<sub>0</sub> — {t('std_ec1w_c0_label')}</LabelTip>
        <NumInput style={INPUT_STYLE} min={1} max={2} step={0.05} value={c0} onChange={setC0} />
      </div>
      <div>
        <LabelTip tip={t('std_ec1w_tip_rho')}>ρ — {t('std_ec1w_rho_label')}</LabelTip>
        <NumInput style={INPUT_STYLE} min={1.0} max={1.35} step={0.005} value={rho} onChange={setRho} />
      </div>
    </div>
  )
}

// Legacy combined component — kept so WindQp still works unchanged
export function WindSharedInputs({ vb, setVb, cat, setCat, c0, setC0, rho, setRho }: {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
}) {
  return (
    <>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
    </>
  )
}

// Peak pressure result box — used by the qp calculator only
export function PeakPressureResult({ vb, cat, z, c0, rho, detailsId }: {
  vb: number; cat: string; z: number; c0: number; rho: number; detailsId?: string
}) {
  const { t } = useTranslation()
  const r = calcPeakPressure(vb, z, cat, c0, rho)
  const scrollTo = detailsId ? () => document.getElementById(detailsId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : undefined
  return (
    <ResultsBox title={t('std_ui_tab_results')}>
      <ResultRow label={<>k<sub>r</sub> — {t('std_ec1w_res_kr')}</>} value={r.kr.toFixed(4)} />
      <ResultRow label={<>z<sub>e</sub> — {t('std_ec1w_res_ze')}</>} value={r.ze.toFixed(2)} unit="m" />
      <ResultRow label={<>c<sub>r</sub>(z<sub>e</sub>) — {t('std_ec1w_res_cr')}</>} value={r.cr.toFixed(3)} />
      <ResultRow label={<>v<sub>m</sub>(z<sub>e</sub>) — {t('std_ec1w_res_vm')}</>} value={r.vm.toFixed(2)} unit="m/s" />
      <ResultRow label={<>I<sub>v</sub>(z<sub>e</sub>) — {t('std_ec1w_res_iv')}</>} value={r.Iv.toFixed(4)} />
      <ResultRow label={<>q<sub>p</sub>(z<sub>e</sub>) — {t('std_ec1w_res_qp')}</>} value={r.qp.toFixed(3)} unit="kPa" onClick={scrollTo} />
    </ResultsBox>
  )
}

export { INPUT_DIVIDER }
