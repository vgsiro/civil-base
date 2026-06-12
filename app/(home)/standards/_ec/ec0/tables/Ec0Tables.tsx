'use client'
import { useTranslation } from '../../../../../i18n/LanguageContext'
import { Table, TR, SectionHeader } from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, TDL } from '../../../_lib/ui-styles'
import { EC_PARTIAL_FACTORS, EC_PSI_FACTORS } from '../../../_lib/ec-data'

export function PartialFactorsTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title={t('std_ec_load_title')} subtitle={t('std_ec_load_sub')} />
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec_load_col_action')}</th>
          <th style={TH}>γ<sub>G</sub></th>
          <th style={TH}>γ<sub>Q</sub></th>
          <th style={TH}>{t('std_ec_load_col_note')}</th>
        </tr></thead>
        <tbody>
          {EC_PARTIAL_FACTORS.map((r, i) => (
            <TR key={r.actionKey} stripe={i % 2 !== 0}>
              <td style={TDL}>{t(r.actionKey)}</td>
              <td style={TDN}>{r.gG}</td>
              <td style={TDN}>{r.gQ}</td>
              <td style={{ ...TD, color: '#1e293b' }}>{r.note}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function PsiFactorsTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title={t('std_ec_psi_title')} subtitle={t('std_ec_psi_sub')} />
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec_psi_col_action')}</th>
          <th style={TH}>ψ<sub>0</sub></th>
          <th style={TH}>ψ<sub>1</sub></th>
          <th style={TH}>ψ<sub>2</sub></th>
        </tr></thead>
        <tbody>
          {EC_PSI_FACTORS.map((r, i) => (
            <TR key={r.actionKey} stripe={i % 2 !== 0}>
              <td style={TDL}>{t(r.actionKey)}</td>
              <td style={TDN}>{r.psi0}</td>
              <td style={TDN}>{r.psi1}</td>
              <td style={TDN}>{r.psi2}</td>
            </TR>
          ))}
        </tbody>
      </Table>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
        <strong>{t('std_ec_load_combo_note')}</strong> Σ γ<sub>G,j</sub>·G<sub>k,j</sub> + γ<sub>Q,1</sub>·Q<sub>k,1</sub> + Σ γ<sub>Q,i</sub>·ψ<sub>0,i</sub>·Q<sub>k,i</sub>
      </div>
    </div>
  )
}
