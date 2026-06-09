'use client'
import { useTranslation } from '../../i18n/LanguageContext'
import { Table, TR, SectionHeader } from '../_lib/ui'
import { TH, TD, TDN, TDL } from '../_lib/ui-styles'
import { TCVN_PARTS, TCVN_CONCRETE, TCVN_REBAR, TCVN_LOAD_FACTORS } from '../_lib/wind-types'

export default function TcvnReference({ section, onNavChange }: { section: string; onNavChange: (key: string, val: string) => void }) {
  const { t } = useTranslation()
  const setSection = (id: string) => onNavChange('section', id)
  const SIDES = [
    { id: 'overview',  label: t('std_vn_nav_overview'), emoji: '📋' },
    { id: 'load',      label: t('std_vn_nav_load'),     emoji: '⚖️' },
    { id: 'concrete',  label: t('std_vn_nav_concrete'), emoji: '🏗️' },
    { id: 'rebar',     label: t('std_vn_nav_rebar'),    emoji: '🔩' },
  ]
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 190, borderRight: '1px solid #e2e8f0', background: '#fff', flexShrink: 0, overflowY: 'auto' }}>
        {SIDES.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', background: section === s.id ? '#fef9c3' : 'transparent', border: 'none', borderLeft: `3px solid ${section === s.id ? '#f59e0b' : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => { if (section !== s.id) e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={e => { if (section !== s.id) e.currentTarget.style.background = 'transparent' }}>
            <span style={{ fontSize: 15 }}>{s.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: section === s.id ? 700 : 500, color: section === s.id ? '#92400e' : '#1e293b' }}>{s.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {section === 'overview' && (
          <>
            <SectionHeader title={t('std_vn_overview_title')} subtitle={t('std_vn_overview_sub')} />
            <Table>
              <thead><tr>
                <th style={TH}>{t('std_vn_col_standard')}</th>
                <th style={{ ...TH, textAlign: 'left' }}>{t('std_vn_col_title')}</th>
                <th style={TH}>{t('std_vn_col_field')}</th>
              </tr></thead>
              <tbody>
                {TCVN_PARTS.map((p, i) => (
                  <TR key={p.code} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>{p.code}</td>
                    <td style={TDL}>{t(p.titleKey)}</td>
                    <td style={{ ...TD, color: '#1e293b' }}>{t(p.catKey)}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {section === 'load' && (
          <>
            <SectionHeader title={t('std_vn_load_title')} subtitle={t('std_vn_load_sub')} />
            <Table>
              <thead><tr>
                <th style={{ ...TH, textAlign: 'left' }}>{t('std_vn_load_col_load')}</th>
                <th style={TH}>{t('std_vn_load_col_factor')}</th>
                <th style={{ ...TH, textAlign: 'left' }}>{t('std_vn_load_col_note')}</th>
              </tr></thead>
              <tbody>
                {TCVN_LOAD_FACTORS.map((r, i) => (
                  <TR key={r.loadKey} stripe={i % 2 !== 0}>
                    <td style={TDL}>{t(r.loadKey)}</td>
                    <td style={{ ...TDN, fontWeight: 700 }}>{r.n}</td>
                    <td style={{ ...TDL, color: '#1e293b' }}>{t(r.noteKey)}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
              <strong>{t('std_vn_load_combo_label')}</strong> {t('std_vn_load_combo_note')}
            </div>
          </>
        )}

        {section === 'concrete' && (
          <>
            <SectionHeader title={t('std_vn_concrete_title')} subtitle={t('std_vn_concrete_sub')} />
            <Table>
              <thead><tr>
                <th style={TH}>{t('std_vn_concrete_col_grade')}</th>
                <th style={TH}>f<sub>ck</sub> (MPa)</th>
                <th style={TH}>R<sub>b</sub> (MPa)</th>
                <th style={TH}>R<sub>bn</sub> (MPa)</th>
                <th style={TH}>R<sub>bt</sub> (MPa)</th>
                <th style={TH}>E<sub>b</sub> (MPa)</th>
              </tr></thead>
              <tbody>
                {TCVN_CONCRETE.map((r, i) => (
                  <TR key={r.grade} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700, color: '#f59e0b' }}>{r.grade}</td>
                    <td style={TDN}>{r.fck}</td>
                    <td style={{ ...TDN, color: '#10b981', fontWeight: 700 }}>{r.Rb}</td>
                    <td style={TDN}>{r.Rbn}</td>
                    <td style={TDN}>{r.Rbt}</td>
                    <td style={TDN}>{r.Eb.toLocaleString()}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
            <div style={{ fontSize: 12, color: '#1e293b' }}>{t('std_vn_concrete_note')}</div>
          </>
        )}

        {section === 'rebar' && (
          <>
            <SectionHeader title={t('std_vn_rebar_title')} subtitle={t('std_vn_rebar_sub')} />
            <Table>
              <thead><tr>
                <th style={TH}>{t('std_vn_rebar_col_grade')}</th>
                <th style={TH}>R<sub>s</sub> (MPa)</th>
                <th style={TH}>R<sub>sc</sub> (MPa)</th>
                <th style={TH}>R<sub>sw</sub> (MPa)</th>
                <th style={TH}>E<sub>s</sub> (MPa)</th>
                <th style={{ ...TH, textAlign: 'left' }}>{t('std_vn_rebar_col_note')}</th>
              </tr></thead>
              <tbody>
                {TCVN_REBAR.map((r, i) => (
                  <TR key={r.grade} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700, color: '#ef4444' }}>{r.grade}</td>
                    <td style={{ ...TDN, color: '#10b981', fontWeight: 700 }}>{r.Rs}</td>
                    <td style={TDN}>{r.Rsc}</td>
                    <td style={TDN}>{r.Rsw}</td>
                    <td style={TDN}>{r.Es.toLocaleString()}</td>
                    <td style={TDL}>{t(r.noteKey)}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
            <div style={{ fontSize: 12, color: '#1e293b' }}>{t('std_vn_rebar_note')}</div>
          </>
        )}
      </div>
    </div>
  )
}

