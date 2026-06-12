'use client'
import { TheoryBlock, NumInput, Table, TR, LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar } from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, TDL, FORMULA_BOX, WIND_SECTION, WIND_IMG, INPUT_GRID, INPUT_STYLE, LABEL_STYLE } from '../../../../../_lib/ui-styles'
import { TERRAIN_CATS } from '../wind-types'
import { calcPeakPressure } from '../wind-helpers'
import { WindPrimaryInputs, WindSecondaryInputs, PeakPressureResult, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'
import WindPeakDetails from '../WindPeakDetails'

const TERRAIN_IMGS: Record<string, string> = WIND_IMG.terrain

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  z: number; setZ: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
}

export default function WindQp({ vb, setVb, cat, setCat, z, setZ, c0, setC0, rho, setRho }: Props) {
  const { t } = useTranslation()
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>{t('std_ec1w_thy_qp_p1').split(' — ')[0].trim()}</strong> — {t('std_ec1w_thy_qp_p1').split(' — ')[1]}</p>
        <p><strong>{t('std_ec1w_thy_qp_vb').split(':')[0].trim()}:</strong> v<sub>b</sub> = v<sub>b,0</sub> · c<sub>dir</sub> · c<sub>season</sub></p>
        <p><strong>{t('std_ec1w_thy_qp_kr').split(':')[0].trim()}:</strong> k<sub>r</sub> = 0.19 · (z₀ / z₀,II)^0.07 — {t('std_ec1w_thy_qp_kr').split(' — ')[1]}</p>
        <p><strong>{t('std_ec1w_thy_qp_cr').split(':')[0].trim()}:</strong> c<sub>r</sub>(z) = k<sub>r</sub> · ln(max(z, z<sub>min</sub>) / z₀)</p>
        <p><strong>{t('std_ec1w_thy_qp_vm').split(':')[0].trim()}:</strong> v<sub>m</sub>(z) = c<sub>r</sub>(z) · c<sub>0</sub>(z) · v<sub>b</sub> — {t('std_ec1w_thy_qp_vm').split(' — ')[1]}</p>
        <p><strong>{t('std_ec1w_thy_qp_iv').split(':')[0].trim()}:</strong> I<sub>v</sub>(z) = σ<sub>v</sub> / v<sub>m</sub>(z) = k<sub>r</sub> / (c<sub>0</sub> · ln(z / z₀))</p>
        <p><strong>{t('std_ec1w_thy_qp_qp').split(':')[0].trim()}:</strong> q<sub>p</sub>(z) = [1 + 7·I<sub>v</sub>(z)] · ½ · ρ · v<sub>m</sub>²(z)  [kPa]</p>
        <p>{t('std_ec1w_thy_qp_gust')}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        k<sub>r</sub> = 0.19·(z₀/0.05)^0.07 &nbsp;|&nbsp; c<sub>r</sub> = k<sub>r</sub>·ln(z/z₀) &nbsp;|&nbsp; v<sub>m</sub> = c<sub>r</sub>·c₀·v<sub>b</sub><br />
        I<sub>v</sub> = k<sub>r</sub>/(c₀·ln(z/z₀)) &nbsp;|&nbsp; <strong>q<sub>p</sub> = [1+7·I<sub>v</sub>]·½·ρ·v<sub>m</sub>²</strong>
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_qp_ze')}>
            z<sub>e</sub> — {t('std_ec1w_ze_label')}
          </LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={300} step={0.5} value={z} onChange={setZ} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <PeakPressureResult vb={vb} cat={cat} z={z} c0={c0} rho={rho} detailsId="qp-details" />
      <WindPeakDetails vb={vb} cat={cat} z={z} c0={c0} rho={rho} id="qp-details" />
      {/* terrain category images */}
      <div style={{ overflowX: 'auto' }}>
        <Table>
          <thead><tr>
            <th style={TH}>Cat.</th><th style={TH}>z₀ (m)</th><th style={TH}>z<sub>min</sub> (m)</th><th style={{ ...TH, textAlign: 'left' }}>{t('std_ec1w_tbl_description')}</th><th style={TH}>{t('std_ec1w_tbl_illustration')}</th>
          </tr></thead>
          <tbody>{TERRAIN_CATS.map((c, i) => (
            <TR key={c.id} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{c.id}</td>
              <td style={TDN}>{c.z0}</td><td style={TDN}>{c.zmin}</td>
              <td style={TDL}>{t(c.descKey)}</td>
              <td style={{ ...TD, padding: '4px 8px' }}>
                <img src={TERRAIN_IMGS[c.id]} alt={`Terrain category ${c.id}`} style={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
              </td>
            </TR>
          ))}</tbody>
        </Table>
      </div>
    </div>
    </ResultsDetailsProvider>
  )
}
