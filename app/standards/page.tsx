'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Search, X, FileText, Lock, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../i18n/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────────────────
interface StandardPdf {
  id: string
  name: string
  standard_type: 'eurocode' | 'tcvn'
  category: string
  description?: string
  file_url: string
  created_at: string
}

// ── Shared table styles ───────────────────────────────────────────────────────
const TH: React.CSSProperties = { padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '5px 14px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', textAlign: 'center' }
const TDN: React.CSSProperties = { ...TD, fontFamily: 'ui-monospace, monospace', fontSize: 13 }
const TDL: React.CSSProperties = { ...TD, textAlign: 'left' }

function TR({ children, stripe }: { children: React.ReactNode; stripe?: boolean }) {
  return (
    <tr style={{ background: stripe ? '#fafafa' : '#fff' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = stripe ? '#fafafa' : '#fff')}>
      {children}
    </tr>
  )
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: 'max-content', tableLayout: 'auto' }}>{children}</table>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{subtitle}</p>}
    </div>
  )
}

// ── Eurocode data (keys only, labels come from t()) ───────────────────────────
const EC_PARTS = [
  { code: 'EN 1990', abbr: 'EC0', titleKey: 'std_ec_en1990_title' as const },
  { code: 'EN 1991', abbr: 'EC1', titleKey: 'std_ec_en1991_title' as const },
  { code: 'EN 1992', abbr: 'EC2', titleKey: 'std_ec_en1992_title' as const },
  { code: 'EN 1993', abbr: 'EC3', titleKey: 'std_ec_en1993_title' as const },
  { code: 'EN 1994', abbr: 'EC4', titleKey: 'std_ec_en1994_title' as const },
  { code: 'EN 1995', abbr: 'EC5', titleKey: 'std_ec_en1995_title' as const },
  { code: 'EN 1996', abbr: 'EC6', titleKey: 'std_ec_en1996_title' as const },
  { code: 'EN 1997', abbr: 'EC7', titleKey: 'std_ec_en1997_title' as const },
  { code: 'EN 1998', abbr: 'EC8', titleKey: 'std_ec_en1998_title' as const },
  { code: 'EN 1999', abbr: 'EC9', titleKey: 'std_ec_en1999_title' as const },
]

const EC_PARTIAL_FACTORS = [
  { actionKey: 'std_ec_load_perm_unfav' as const, gG: '1.35', gQ: '—',    note: 'STR/GEO' },
  { actionKey: 'std_ec_load_perm_fav'   as const, gG: '1.00', gQ: '—',    note: 'STR/GEO' },
  { actionKey: 'std_ec_load_var_unfav'  as const, gG: '—',    gQ: '1.50', note: 'STR/GEO' },
  { actionKey: 'std_ec_load_var_fav'   as const, gG: '—',    gQ: '0.00', note: 'STR/GEO' },
]

const EC_PSI_FACTORS = [
  { actionKey: 'std_ec_psi_imposed_a' as const, psi0: '0.7', psi1: '0.5', psi2: '0.3' },
  { actionKey: 'std_ec_psi_imposed_b' as const, psi0: '0.7', psi1: '0.5', psi2: '0.3' },
  { actionKey: 'std_ec_psi_imposed_c' as const, psi0: '0.7', psi1: '0.7', psi2: '0.6' },
  { actionKey: 'std_ec_psi_imposed_d' as const, psi0: '0.7', psi1: '0.7', psi2: '0.6' },
  { actionKey: 'std_ec_psi_imposed_e' as const, psi0: '1.0', psi1: '0.9', psi2: '0.8' },
  { actionKey: 'std_ec_psi_wind'      as const, psi0: '0.6', psi1: '0.2', psi2: '0.0' },
  { actionKey: 'std_ec_psi_snow'      as const, psi0: '0.5', psi1: '0.2', psi2: '0.0' },
  { actionKey: 'std_ec_psi_temp'      as const, psi0: '0.6', psi1: '0.5', psi2: '0.0' },
]

const EC3_STEEL = [
  { grade: 'S235', fy_16: 235, fy_40: 225, fy_100: 215, fu: 360 },
  { grade: 'S275', fy_16: 275, fy_40: 265, fy_100: 255, fu: 430 },
  { grade: 'S355', fy_16: 355, fy_40: 345, fy_100: 335, fu: 490 },
  { grade: 'S420', fy_16: 420, fy_40: 400, fy_100: 390, fu: 520 },
  { grade: 'S460', fy_16: 460, fy_40: 440, fy_100: 430, fu: 540 },
]

const EC2_CONCRETE = [
  { grade: 'C12/15', fck: 12, fcd: 8.0,  fctm: 1.6, Ecm: 27 },
  { grade: 'C16/20', fck: 16, fcd: 10.7, fctm: 1.9, Ecm: 29 },
  { grade: 'C20/25', fck: 20, fcd: 13.3, fctm: 2.2, Ecm: 30 },
  { grade: 'C25/30', fck: 25, fcd: 16.7, fctm: 2.6, Ecm: 31 },
  { grade: 'C30/37', fck: 30, fcd: 20.0, fctm: 2.9, Ecm: 33 },
  { grade: 'C35/45', fck: 35, fcd: 23.3, fctm: 3.2, Ecm: 34 },
  { grade: 'C40/50', fck: 40, fcd: 26.7, fctm: 3.5, Ecm: 35 },
  { grade: 'C45/55', fck: 45, fcd: 30.0, fctm: 3.8, Ecm: 36 },
  { grade: 'C50/60', fck: 50, fcd: 33.3, fctm: 4.1, Ecm: 37 },
]

// ── TCVN data (keys only) ─────────────────────────────────────────────────────
const TCVN_PARTS = [
  { code: 'TCVN 2737:1995', titleKey: 'std_vn_2737_title'  as const, catKey: 'std_vn_cat_load'       as const },
  { code: 'TCVN 5574:2018', titleKey: 'std_vn_5574_title'  as const, catKey: 'std_vn_cat_concrete'   as const },
  { code: 'TCVN 5575:2012', titleKey: 'std_vn_5575_title'  as const, catKey: 'std_vn_cat_steel'      as const },
  { code: 'TCVN 9386:2012', titleKey: 'std_vn_9386_title'  as const, catKey: 'std_vn_cat_seismic'    as const },
  { code: 'TCVN 10304:2014',titleKey: 'std_vn_10304_title' as const, catKey: 'std_vn_cat_foundation' as const },
  { code: 'TCVN 9362:2012', titleKey: 'std_vn_9362_title'  as const, catKey: 'std_vn_cat_soil'       as const },
  { code: 'TCVN 5472:1991', titleKey: 'std_vn_5472_title'  as const, catKey: 'std_vn_cat_general'    as const },
  { code: 'TCVN 4453:1995', titleKey: 'std_vn_4453_title'  as const, catKey: 'std_vn_cat_concrete'   as const },
]

const TCVN_CONCRETE = [
  { grade: 'B15', fck: 11.5, Rbn: 8.5,  Rb: 8.5,  Rbt: 0.75, Eb: 24000 },
  { grade: 'B20', fck: 15.0, Rbn: 11.5, Rb: 11.5, Rbt: 0.90, Eb: 27000 },
  { grade: 'B25', fck: 18.5, Rbn: 14.5, Rb: 14.5, Rbt: 1.05, Eb: 30000 },
  { grade: 'B30', fck: 22.0, Rbn: 17.0, Rb: 17.0, Rbt: 1.20, Eb: 32500 },
  { grade: 'B35', fck: 25.5, Rbn: 19.5, Rb: 19.5, Rbt: 1.30, Eb: 34500 },
  { grade: 'B40', fck: 29.0, Rbn: 22.0, Rb: 22.0, Rbt: 1.40, Eb: 36000 },
  { grade: 'B45', fck: 32.5, Rbn: 25.0, Rb: 25.0, Rbt: 1.45, Eb: 37000 },
  { grade: 'B50', fck: 36.0, Rbn: 27.5, Rb: 27.5, Rbt: 1.55, Eb: 38000 },
]

const TCVN_REBAR = [
  { grade: 'CB240-T', Rs: 210, Rsc: 210, Rsw: 170, Es: 210000, noteKey: 'std_vn_rebar_note_plain'   as const },
  { grade: 'CB300-V', Rs: 260, Rsc: 260, Rsw: 210, Es: 210000, noteKey: 'std_vn_rebar_note_deformed' as const },
  { grade: 'CB400-V', Rs: 350, Rsc: 350, Rsw: 280, Es: 200000, noteKey: 'std_vn_rebar_note_high'    as const },
  { grade: 'CB500-V', Rs: 435, Rsc: 435, Rsw: 300, Es: 200000, noteKey: 'std_vn_rebar_note_vhigh'   as const },
]

const TCVN_LOAD_FACTORS = [
  { loadKey: 'std_vn_load_perm_unfav'   as const, n: '1.1 – 1.3', noteKey: 'std_vn_load_note_mat'  as const },
  { loadKey: 'std_vn_load_perm_fav'    as const, n: '0.9',        noteKey: 'std_vn_load_note_stab' as const },
  { loadKey: 'std_vn_load_imposed_res' as const, n: '1.2',        noteKey: 'std_vn_load_note_q2'   as const },
  { loadKey: 'std_vn_load_imposed_off' as const, n: '1.2',        noteKey: 'std_vn_load_note_q2'   as const },
  { loadKey: 'std_vn_load_imposed_conc'as const, n: '1.2',        noteKey: 'std_vn_load_note_p1'   as const },
  { loadKey: 'std_vn_load_wind'        as const, n: '1.2',        noteKey: 'std_vn_load_note_2737' as const },
  { loadKey: 'std_vn_load_seismic'     as const, n: '1.0',        noteKey: 'std_vn_load_note_9386' as const },
]

// ── Eurocode Reference Tools ──────────────────────────────────────────────────
function EurocodeRefTools() {
  const { t } = useTranslation()
  const [section, setSection] = useState('overview')
  const SIDES = [
    { id: 'overview',  label: t('std_ec_nav_overview'), emoji: '📋' },
    { id: 'load',      label: t('std_ec_nav_load'),     emoji: '⚖️' },
    { id: 'steel',     label: t('std_ec_nav_steel'),    emoji: '🔩' },
    { id: 'concrete',  label: t('std_ec_nav_concrete'), emoji: '🏗️' },
  ]
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 190, borderRight: '1px solid #e2e8f0', background: '#fff', flexShrink: 0, overflowY: 'auto' }}>
        {SIDES.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', background: section === s.id ? '#eff6ff' : 'transparent', border: 'none', borderLeft: `3px solid ${section === s.id ? '#3b82f6' : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => { if (section !== s.id) e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={e => { if (section !== s.id) e.currentTarget.style.background = 'transparent' }}>
            <span style={{ fontSize: 15 }}>{s.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: section === s.id ? 700 : 500, color: section === s.id ? '#1d4ed8' : '#475569' }}>{s.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {section === 'overview' && (
          <>
            <SectionHeader title={t('std_ec_overview_title')} subtitle={t('std_ec_overview_sub')} />
            <Table>
              <thead><tr>
                <th style={TH}>{t('std_ec_col_standard')}</th>
                <th style={{ ...TH, textAlign: 'center' }}>{t('std_ec_col_abbr')}</th>
                <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec_col_title')}</th>
              </tr></thead>
              <tbody>
                {EC_PARTS.map((p, i) => (
                  <TR key={p.code} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{p.code}</td>
                    <td style={{ ...TD, fontWeight: 600, color: '#8b5cf6' }}>{p.abbr}</td>
                    <td style={TDL}>{t(p.titleKey)}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
          </>
        )}

        {section === 'load' && (
          <>
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
                    <td style={{ ...TD, color: '#64748b' }}>{r.note}</td>
                  </TR>
                ))}
              </tbody>
            </Table>

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
          </>
        )}

        {section === 'steel' && (
          <>
            <SectionHeader title={t('std_ec_steel_title')} subtitle={t('std_ec_steel_sub')} />
            <Table>
              <thead><tr>
                <th style={TH}>{t('std_ec_steel_col_grade')}</th>
                <th style={TH}>f<sub>y</sub> t≤16mm (MPa)</th>
                <th style={TH}>f<sub>y</sub> t≤40mm (MPa)</th>
                <th style={TH}>f<sub>y</sub> t≤100mm (MPa)</th>
                <th style={TH}>f<sub>u</sub> (MPa)</th>
              </tr></thead>
              <tbody>
                {EC3_STEEL.map((r, i) => (
                  <TR key={r.grade} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{r.grade}</td>
                    <td style={TDN}>{r.fy_16}</td>
                    <td style={TDN}>{r.fy_40}</td>
                    <td style={TDN}>{r.fy_100}</td>
                    <td style={{ ...TDN, color: '#ef4444' }}>{r.fu}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
            <div style={{ fontSize: 12, color: '#64748b' }}>{t('std_ec_steel_note')}</div>
          </>
        )}

        {section === 'concrete' && (
          <>
            <SectionHeader title={t('std_ec_concrete_title')} subtitle={t('std_ec_concrete_sub')} />
            <Table>
              <thead><tr>
                <th style={TH}>{t('std_ec_concrete_col_class')}</th>
                <th style={TH}>f<sub>ck</sub> (MPa)</th>
                <th style={TH}>f<sub>cd</sub> (MPa)</th>
                <th style={TH}>f<sub>ctm</sub> (MPa)</th>
                <th style={TH}>E<sub>cm</sub> (GPa)</th>
              </tr></thead>
              <tbody>
                {EC2_CONCRETE.map((r, i) => (
                  <TR key={r.grade} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{r.grade}</td>
                    <td style={TDN}>{r.fck}</td>
                    <td style={{ ...TDN, color: '#10b981' }}>{r.fcd.toFixed(1)}</td>
                    <td style={TDN}>{r.fctm.toFixed(1)}</td>
                    <td style={TDN}>{r.Ecm}</td>
                  </TR>
                ))}
              </tbody>
            </Table>
            <div style={{ fontSize: 12, color: '#64748b' }}>{t('std_ec_concrete_note')}</div>
          </>
        )}
      </div>
    </div>
  )
}

// ── TCVN Reference Tools ──────────────────────────────────────────────────────
function TCVNRefTools() {
  const { t } = useTranslation()
  const [section, setSection] = useState('overview')
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
            <span style={{ fontSize: 12, fontWeight: section === s.id ? 700 : 500, color: section === s.id ? '#92400e' : '#475569' }}>{s.label}</span>
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
                    <td style={{ ...TD, color: '#64748b' }}>{t(p.catKey)}</td>
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
                    <td style={{ ...TDL, color: '#64748b' }}>{t(r.noteKey)}</td>
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
            <div style={{ fontSize: 12, color: '#64748b' }}>{t('std_vn_concrete_note')}</div>
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
            <div style={{ fontSize: 12, color: '#64748b' }}>{t('std_vn_rebar_note')}</div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Secure PDF Viewer ─────────────────────────────────────────────────────────
function SecurePdfViewer({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Shield size={16} color="#94a3b8" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(239,68,68,0.15)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)' }}>
          <Lock size={11} color="#f87171" />
          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>{t('std_viewer_badge')}</span>
        </div>
        <button onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={name}
          sandbox="allow-same-origin allow-scripts"
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'transparent', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

// ── PDF Library ───────────────────────────────────────────────────────────────
function PdfLibrary({ type, accentColor, isAdmin }: {
  type: 'eurocode' | 'tcvn'; accentColor: string; isAdmin: boolean
}) {
  const { t } = useTranslation()
  const [pdfs, setPdfs] = useState<StandardPdf[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPdf, setPreviewPdf] = useState<StandardPdf | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('__all__')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadPdfs() }, [type]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPdfs() {
    setLoading(true)
    const { data } = await supabase
      .from('standard_pdfs').select('*')
      .eq('standard_type', type).order('category').order('name')
    if (data) {
      setPdfs(data)
      setCategories([...new Set(data.map((p: StandardPdf) => p.category).filter(Boolean))])
    }
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const path = `standards/${type}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('pdfs').upload(path, file, { upsert: false })
      if (upErr) { console.error(upErr); continue }
      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path)
      await supabase.from('standard_pdfs').insert({
        name: file.name.replace(/\.pdf$/i, ''),
        standard_type: type,
        category: type === 'eurocode' ? t('std_viewer_default_cat_ec') : t('std_viewer_default_cat_tcvn'),
        file_url: publicUrl,
      })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    loadPdfs()
  }

  async function handleDelete(pdf: StandardPdf) {
    if (!confirm(`${t('std_delete_confirm')} "${pdf.name}"?`)) return
    const pathMatch = pdf.file_url.match(/\/pdfs\/(.+)$/)
    if (pathMatch) await supabase.storage.from('pdfs').remove([decodeURIComponent(pathMatch[1])])
    await supabase.from('standard_pdfs').delete().eq('id', pdf.id)
    loadPdfs()
  }

  const allLabel = t('std_category_all')
  const q = searchQuery.toLowerCase().trim()
  const filtered = pdfs.filter(p => {
    const matchCat = selectedCategory === '__all__' || p.category === selectedCategory
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  if (previewPdf) {
    return <SecurePdfViewer url={previewPdf.file_url} name={previewPdf.name} onClose={() => setPreviewPdf(null)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t(type === 'eurocode' ? 'std_search_ec' : 'std_search_tcvn')}
            style={{ width: '100%', padding: '7px 28px 7px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ key: '__all__', label: allLabel }, ...categories.map(c => ({ key: c, label: c }))].map(item => (
            <button key={item.key} onClick={() => setSelectedCategory(item.key)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: selectedCategory === item.key ? 700 : 400, border: `1px solid ${selectedCategory === item.key ? accentColor : '#e2e8f0'}`, background: selectedCategory === item.key ? accentColor : 'transparent', color: selectedCategory === item.key ? '#fff' : '#475569', cursor: 'pointer' }}>
              {item.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={handleUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              style={{ padding: '7px 14px', borderRadius: 8, background: accentColor, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, opacity: uploading ? 0.6 : 1 }}>
              {uploading ? t('std_uploading') : t('std_upload_btn')}
            </button>
          </>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>{t('std_loading')}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{pdfs.length === 0 ? t('std_empty_pdfs') : t('std_empty_results')}</p>
            {isAdmin && pdfs.length === 0 && <p style={{ fontSize: 12, marginTop: 4 }}>{t('std_empty_hint')}</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {filtered.map(pdf => (
              <PdfCard key={pdf.id} pdf={pdf} accentColor={accentColor} isAdmin={isAdmin}
                onOpen={() => setPreviewPdf(pdf)}
                onDelete={() => handleDelete(pdf)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PdfCard({ pdf, accentColor, isAdmin, onOpen, onDelete }: {
  pdf: StandardPdf; accentColor: string; isAdmin: boolean; onOpen: () => void; onDelete: () => void
}) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 10, border: `1px solid ${hovered ? accentColor : '#e2e8f0'}`, background: '#fff', overflow: 'hidden', transition: 'box-shadow 0.15s, border-color 0.15s', boxShadow: hovered ? `0 4px 16px ${accentColor}22` : '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}
      onClick={onOpen}>
      <div style={{ height: 6, background: accentColor }} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={18} color={accentColor} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{pdf.name}</div>
            {pdf.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdf.description}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: accentColor, padding: '2px 8px', borderRadius: 8 }}>{pdf.category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={10} color="#94a3b8" />
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{t('std_view_only')}</span>
          </div>
        </div>
        {isAdmin && (
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            style={{ marginTop: 8, width: '100%', padding: '4px', borderRadius: 6, background: 'none', border: '1px solid #fca5a5', color: '#ef4444', fontSize: 11, cursor: 'pointer', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
            {t('std_delete_confirm')}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Tab content ───────────────────────────────────────────────────────────────
function TabContent({ type, accentColor, isAdmin }: {
  type: 'eurocode' | 'tcvn'; accentColor: string; isAdmin: boolean
}) {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<'standards' | 'reference'>('standards')

  const tabs = [
    { id: 'standards' as const, label: t(type === 'eurocode' ? 'std_subtab_pdfs_ec' : 'std_subtab_pdfs_tcvn'), emoji: '📄' },
    { id: 'reference' as const, label: t(type === 'eurocode' ? 'std_subtab_ref_ec' : 'std_subtab_ref_tcvn'),   emoji: '🔧' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', fontSize: 13, fontWeight: subTab === tab.id ? 700 : 500, color: subTab === tab.id ? accentColor : '#64748b', background: 'none', border: 'none', borderBottom: `2px solid ${subTab === tab.id ? accentColor : 'transparent'}`, cursor: 'pointer', marginBottom: -1 }}
            onMouseEnter={e => { if (subTab !== tab.id) e.currentTarget.style.color = '#1e293b' }}
            onMouseLeave={e => { if (subTab !== tab.id) e.currentTarget.style.color = '#64748b' }}>
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {subTab === 'standards' && <PdfLibrary type={type} accentColor={accentColor} isAdmin={isAdmin} />}
        {subTab === 'reference' && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            {type === 'eurocode' ? <EurocodeRefTools /> : <TCVNRefTools />}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
type TabId = 'eurocode' | 'tcvn'

export default function StandardsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('eurocode')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'eurocode' || tab === 'tcvn') setActiveTab(tab)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      setIsLoggedIn(!!user)
      setIsAdmin(user?.email === 'tranvuong2832@gmail.com')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const user = session?.user
      setIsLoggedIn(!!user)
      setIsAdmin(user?.email === 'tranvuong2832@gmail.com')
    })
    return () => subscription.unsubscribe()
  }, [])

  const TABS: { id: TabId; label: string; subtitle: string; accentColor: string; badge: string }[] = [
    { id: 'eurocode', label: 'Eurocode', subtitle: t('std_tab_eurocode_subtitle'), accentColor: '#3b82f6', badge: 'EC' },
    { id: 'tcvn',     label: 'TCVN',    subtitle: t('std_tab_tcvn_subtitle'),     accentColor: '#f59e0b', badge: 'VN' },
  ]
  const tab = TABS.find(t => t.id === activeTab)!

  void isLoggedIn

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button onClick={() => router.push('/')} title={t('std_back')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.85, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
          <span style={{ fontSize: 20 }}>📚</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{t('std_back')}</span>
        </button>
        <span style={{ color: '#334155', fontSize: 16 }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>{t('std_page_label')}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{t('std_page_title')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => setActiveTab(tb.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: `2px solid ${activeTab === tb.id ? tb.accentColor : 'transparent'}`, background: activeTab === tb.id ? `${tb.accentColor}22` : 'rgba(255,255,255,0.08)', color: activeTab === tb.id ? '#fff' : '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activeTab !== tb.id) e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={e => { if (activeTab !== tb.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: activeTab === tb.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>{tb.badge}</span>
              {tb.label}
              <span style={{ fontSize: 10, color: activeTab === tb.id ? `${tb.accentColor}cc` : '#475569' }}>{tb.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TabContent key={activeTab} type={activeTab} accentColor={tab.accentColor} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
