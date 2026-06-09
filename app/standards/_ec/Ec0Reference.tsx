'use client'
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import type { TranslationKey } from '../../i18n/index'
import { Table, TR, SectionHeader } from '../_lib/ui'
import { TH, TD, TDN, TDL } from '../_lib/ui-styles'
import { EC_PARTIAL_FACTORS, EC_PSI_FACTORS } from '../_lib/wind-types'
import LoadComboGenerator from './ec0/tools/load-combo/LoadComboGenerator'

const TOOL_GROUPS = [
  {
    part: 'EN 1990',
    desc: 'Basis of design — load combinations',
    cards: [
      {
        id: 'load',
        label: 'Load Combinations',
        desc: 'Partial factors γ, combination factors ψ · EN 1990 Table A1',
        emoji: '⚖️',
        accent: '#6366f1',
        gradient: 'linear-gradient(135deg, #3730a3, #6366f1)',
      },
      {
        id: 'combo_gen',
        label: 'Combination Generator',
        desc: 'Generate EN 1990 ULS/SLS combinations · STAAD output',
        emoji: '⚙️',
        accent: '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
      },
    ],
  },
]

const LOAD_NAV = [
  { id: 'load',      label: 'Load Combinations',      emoji: '⚖️' },
  { id: 'combo_gen', label: 'Combination Generator',  emoji: '⚙️' },
]

const SIDENAV_MIN = 48
const SIDENAV_MAX = 320
const SIDENAV_DEFAULT = 190

function SideNav({ items, active, onSelect }: {
  items: { id: string; label: string; emoji: string }[]
  active: string
  onSelect: (id: string) => void
}) {
  const [width, setWidth] = useState(SIDENAV_DEFAULT)
  const [collapsed, setCollapsed] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = collapsed ? 0 : width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const next = startW.current + ev.clientX - startX.current
      if (next > SIDENAV_MIN) {
        setCollapsed(false)
        setWidth(Math.min(SIDENAV_MAX, next))
      } else {
        setCollapsed(true)
      }
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [collapsed, width])

  const panelW = collapsed ? SIDENAV_MIN : width

  return (
    <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      <div style={{ width: panelW, background: '#fff', overflowY: collapsed ? 'hidden' : 'auto', overflowX: 'hidden', transition: collapsed ? 'width 0.18s' : 'none', display: 'flex', flexDirection: 'column' }}>
        {collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {items.map(s => (
                <button key={s.id} onClick={() => onSelect(s.id)} title={s.label}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active === s.id ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>
                  {s.emoji}
                </button>
              ))}
            </div>
          )
          : items.map(s => (
            <button key={s.id} onClick={() => onSelect(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '11px 14px', background: active === s.id ? '#eff6ff' : 'transparent',
                border: 'none', borderLeft: `3px solid ${active === s.id ? '#6366f1' : 'transparent'}`,
                borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0,
              }}
              onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 15 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: active === s.id ? 700 : 500, color: active === s.id ? '#4338ca' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
            </button>
          ))
        }
      </div>
      <div
        onMouseDown={onMouseDown}
        style={{ width: 4, flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        onMouseEnter={e => { if (!collapsed) e.currentTarget.style.background = '#a5b4fc' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 24, background: '#cbd5e1', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1e293b', padding: 0, zIndex: 1 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginBottom: -8 }}>
      ‹ Back to Reference Tools
    </button>
  )
}

function LoadCombinationsContent({ t }: { t: (k: TranslationKey) => string }) {
  return (
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
              <td style={{ ...TD, color: '#1e293b' }}>{r.note}</td>
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
  )
}

export default function Ec0Reference({ section, onNavChange }: {
  section: string; onNavChange: (key: string, val: string) => void
}) {
  const { t } = useTranslation()
  const activeSection = section || 'tools'
  const setSection = (id: string) => onNavChange('section', id)

  const isTools     = activeSection === 'tools'
  const isLoad      = activeSection === 'load'
  const isComboGen  = activeSection === 'combo_gen'

  // ── Card grid ─────────────────────────────────────────────────────────────
  if (isTools) {
    return (
      <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>EC0 Reference Tools</div>
          <div style={{ fontSize: 12, color: '#1e293b' }}>Load combinations and partial factors · EN 1990</div>
        </div>
        {TOOL_GROUPS.map(group => (
          <div key={group.part}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>{group.part}</span>
              <span style={{ fontSize: 12, color: '#1e293b' }}>{group.desc}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, maxWidth: 740 }}>
              {group.cards.map(card => (
                <button key={card.id} onClick={() => setSection(card.id)}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                    overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${card.accent}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
                  <div style={{ height: 68, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                    <span style={{ fontSize: 24 }}>{card.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{group.part}</span>
                  </div>
                  <div style={{ padding: '11px 14px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: card.accent, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.5 }}>{card.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Load Combinations / Combo Generator ──────────────────────────────────
  if (isLoad || isComboGen) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <SideNav items={LOAD_NAV} active={activeSection} onSelect={setSection} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <BackButton onClick={() => setSection('tools')} />
          {isLoad     && <LoadCombinationsContent t={t} />}
          {isComboGen && <LoadComboGenerator />}
        </div>
      </div>
    )
  }

  return null
}
