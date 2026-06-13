'use client'
import React, { useState, useMemo } from 'react'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import PageDiscussion from '../../../_components/home/discussion/PageDiscussion'
import { Tooltip } from '../../standards/_lib/ui'
import { useTranslation } from '../../../i18n/LanguageContext'
import { UB_UC_SECTION_TYPES as ALL_SECTION_TYPES } from './ub-uc/data/index'
import { VISIBLE_COLS, COLUMN_GROUPS, COLUMN_UNITS, COL_LABEL, COL_TIP_KEY, COL_TIP_SYMBOL } from './_shared/column-meta'
import type { SectionRow } from './_shared/types'
import type { SectionType } from './_shared/types'
import CapacityPanel from './ub-uc/CapacityPanel'
import { useCurrentUser, useToolAccess } from '@/lib/useSubscription'

const ACCENT = '#0369a1'
const STORAGE_KEY = 'bb_active_section'

type TFn = (k: Parameters<ReturnType<typeof useTranslation>['t']>[0]) => string

// Build translated tooltip text from column-meta mappings
function makeColTips(t: TFn): Partial<Record<keyof SectionRow, string>> {
  const tips: Partial<Record<keyof SectionRow, string>> = {}
  const cols = Object.keys(COL_TIP_KEY) as (keyof SectionRow)[]
  for (const col of cols) {
    const key = COL_TIP_KEY[col]
    const sym = COL_TIP_SYMBOL[col]
    const unit = COLUMN_UNITS[col]
    if (!key) continue
    const desc = t(key as Parameters<ReturnType<typeof useTranslation>['t']>[0])
    tips[col] = `${sym ?? ''}${desc}${unit ? ` (${unit})` : ''}`
  }
  return tips
}

type MainTab = 'properties' | 'capacity'

function fmt(v: number, col: keyof SectionRow): string {
  if (col === 'designation') return String(v)
  const abs = Math.abs(v)
  if (abs === 0) return '0'
  if (abs >= 10000) return v.toLocaleString('en-GB', { maximumFractionDigits: 0 })
  if (abs >= 100)   return v.toLocaleString('en-GB', { maximumFractionDigits: 1 })
  if (abs >= 10)    return v.toLocaleString('en-GB', { maximumFractionDigits: 2 })
  return v.toLocaleString('en-GB', { maximumFractionDigits: 3 })
}

function SectionSidebar({
  active,
  onChange,
}: {
  active: string
  onChange: (id: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className="bb-sidebar"
      style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        background: '#f8fafc',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '16px 18px 10px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
        {t('bb_section_type').toUpperCase()}
      </div>
      {ALL_SECTION_TYPES.map(st => (
        <button
          key={st.id}
          onClick={() => onChange(st.id)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '11px 18px',
            border: 'none',
            background: active === st.id ? '#fff' : 'none',
            borderLeft: active === st.id ? `3px solid ${ACCENT}` : '3px solid transparent',
            color: active === st.id ? ACCENT : '#475569',
            fontWeight: active === st.id ? 700 : 400,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => { if (active !== st.id) e.currentTarget.style.background = '#f1f5f9' }}
          onMouseLeave={e => { if (active !== st.id) e.currentTarget.style.background = 'none' }}
        >
          <div>{st.shortLabel}</div>
          <div style={{ fontSize: 11, color: active === st.id ? '#0ea5e9' : '#94a3b8', fontWeight: 400, marginTop: 1 }}>
            {st.rows.length} {t('bb_sections_count')}
          </div>
        </button>
      ))}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      title={t('bb_copy_title')}
      style={{
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '2px 4px',
        color: copied ? '#16a34a' : '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.2s',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

function DetailCard({ row }: { row: SectionRow }) {
  const { t } = useTranslation()
  const COL_TIPS = makeColTips(t)
  return (
    <tr>
      <td colSpan={100} style={{ padding: 0, background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px 20px' }}>
          {COLUMN_GROUPS.map(grp => (
            <div key={grp.labelKey}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: '0.06em', marginBottom: 4 }}>
                {t(grp.labelKey as Parameters<ReturnType<typeof useTranslation>['t']>[0]).toUpperCase()}
              </div>
              {grp.cols.map(col => (
                <div key={col} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: '#334155', gap: 8 }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span>{COL_LABEL[col] ?? col}</span>
                    {COLUMN_UNITS[col] ? <span style={{ color: '#94a3b8', fontSize: 10 }}>({COLUMN_UNITS[col]})</span> : null}
                    {COL_TIPS[col] && <Tooltip text={COL_TIPS[col]!} />}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {fmt(row[col] as number, col)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '6px 20px 10px', fontSize: 11, color: '#94a3b8' }}>
          {t('bb_ref_label')}: BS EN 10365:2017
        </div>
      </td>
    </tr>
  )
}

function SectionTable({
  sectionType,
  selectedRow,
  onSelectRow,
  onHighlightRow,
}: {
  sectionType: SectionType
  selectedRow: SectionRow | null
  onSelectRow: (row: SectionRow) => void
  onHighlightRow: (row: SectionRow) => void
}) {
  const { t } = useTranslation()
  const COL_TIPS = makeColTips(t)
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const lq = q.toLowerCase()
    return lq
      ? sectionType.rows.filter(r => r.designation.toLowerCase().includes(lq))
      : sectionType.rows
  }, [q, sectionType.rows])

  function toggleRow(row: SectionRow) {
    setExpanded(prev => (prev === row.designation ? null : row.designation))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Panel header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: ACCENT }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{sectionType.label}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sectionType.ref}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
          {filtered.length} / {sectionType.rows.length} {t('bb_sections_count')}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <input
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setExpanded(null) }}
          placeholder={t('bb_search_label')}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            color: '#1e293b',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        />
      </div>

      {/* Table */}
      <div className="bb-table-wrap" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            {t('bb_no_results')}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={thStyle}></th>
                <th style={{ ...thStyle, textAlign: 'left', minWidth: 140 }}>Designation</th>
                {VISIBLE_COLS.map(col => (
                  <th key={col} style={thStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <span>{COL_LABEL[col] ?? col}</span>
                      {COL_TIPS[col] && <Tooltip text={COL_TIPS[col]!} />}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>{COLUMN_UNITS[col]}</div>
                  </th>
                ))}
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const isExpanded = expanded === row.designation
                const isSelected = selectedRow?.designation === row.designation
                return (
                  <React.Fragment key={row.designation}>
                    <tr
                      onClick={() => { toggleRow(row); onHighlightRow(row) }}
                      style={{
                        background: isSelected
                          ? '#dbeafe'
                          : isExpanded
                          ? '#e0f2fe'
                          : i % 2 === 0 ? '#fff' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        outline: isSelected ? `2px solid ${ACCENT}` : 'none',
                        outlineOffset: -2,
                      }}
                      onMouseEnter={e => { if (!isExpanded && !isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff' }}
                      onMouseLeave={e => { if (!isExpanded && !isSelected) (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#f8fafc' }}
                    >
                      <td style={{ ...tdStyle, width: 24, paddingRight: 0, color: '#94a3b8' }}>
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {row.designation}
                      </td>
                      {VISIBLE_COLS.map(col => (
                        <td key={col} style={{ ...tdStyle, fontFamily: 'monospace', color: '#334155' }}>
                          {fmt(row[col] as number, col)}
                        </td>
                      ))}
                      <td style={{ ...tdStyle, padding: '0 8px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CopyButton text={row.designation} />
                          <button
                            title={t('bb_tab_capacity')}
                            onClick={e => { e.stopPropagation(); onSelectRow(row) }}
                            style={{
                              border: `1.5px solid ${isSelected ? ACCENT : '#e2e8f0'}`,
                              background: isSelected ? ACCENT : '#fff',
                              color: isSelected ? '#fff' : '#64748b',
                              cursor: 'pointer',
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s',
                            }}
                          >
                            {t('bb_capacity_btn')}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && <DetailCard row={row} />}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Discussion */}
        <div style={{ padding: '0 20px 40px', marginTop: 8 }}>
          <PageDiscussion pageKey="tools_steel_sections" />
        </div>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 11,
  color: '#475569',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  textAlign: 'center',
  borderBottom: '1px solid #f1f5f9',
}

export default function SteelSections() {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState(() => {
    if (typeof window === 'undefined') return ALL_SECTION_TYPES[0].id
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && ALL_SECTION_TYPES.find(s => s.id === saved) ? saved : ALL_SECTION_TYPES[0].id
  })
  const [activeTab, setActiveTab] = useState<MainTab>('properties')
  const [selectedRow, setSelectedRow] = useState<SectionRow | null>(null)

  const { userId, userEmail } = useCurrentUser()
  const toolAccess = useToolAccess('steel_sections', userId, userEmail)

  const sectionType = ALL_SECTION_TYPES.find(s => s.id === activeId)!

  function handleTypeChange(id: string) {
    setActiveId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  function handleSelectRow(row: SectionRow) {
    setSelectedRow(row)
    setActiveTab('capacity')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Mobile select — hidden on desktop, shown by .bb-mobile-cat CSS rule */}
      <div className="bb-mobile-cat" style={{ display: 'none' }}>
        <select
          value={activeId}
          onChange={e => handleTypeChange(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#1e293b', outline: 'none' }}
        >
          {ALL_SECTION_TYPES.map(st => (
            <option key={st.id} value={st.id}>{st.label}</option>
          ))}
        </select>
      </div>

      {/* Main content row: sidebar + right panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <SectionSidebar active={activeId} onChange={handleTypeChange} />

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
          {([
            { id: 'properties' as MainTab, labelKey: 'bb_tab_properties' },
            { id: 'capacity'   as MainTab, labelKey: 'bb_tab_capacity' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '11px 20px',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                marginBottom: -2,
                background: 'none',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? ACCENT : '#64748b',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {t(tab.labelKey as Parameters<ReturnType<typeof useTranslation>['t']>[0])}
              {tab.id === 'capacity' && selectedRow && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#fff', background: ACCENT, borderRadius: 10, padding: '1px 6px' }}>
                  {selectedRow.designation.split(' ')[1]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'properties' ? (
          <SectionTable
            sectionType={sectionType}
            selectedRow={selectedRow}
            onSelectRow={handleSelectRow}
            onHighlightRow={row => setSelectedRow(row)}
          />
        ) : (
          <CapacityPanel row={selectedRow} toolAccess={toolAccess} />
        )}
      </div>
      </div>
    </div>
  )
}
