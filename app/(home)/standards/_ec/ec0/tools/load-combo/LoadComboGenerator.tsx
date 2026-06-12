'use client'
import { useState, useCallback } from 'react'
import {
  DEFAULT_PARTIAL_FACTORS, DEFAULT_COMBO_FACTORS,
  generateAll, formatStaad, formatReport, sectionHeader,
  type LoadInstance, type ComboTypes, type MaterialType, type ComboMode,
} from './combo-engine'

// ── Project types ─────────────────────────────────────────────────────────────

type ProjectType = 'building' | 'marine'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT   = '#6366f1'
const HDR_BG   = '#3730a3'
const HDR_FG   = '#fff'
const SEC_BG   = '#eef2ff'
const SEC_FG   = '#3730a3'
const ROW_NORM = '#fff'
const ROW_ALT  = '#f8fafc'
const MODIFIED = '#fffbeb'
const MOD_FG   = '#d97706'

const S: Record<string, React.CSSProperties> = {
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 },
  btn: { padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  mono: { fontFamily: 'Consolas, monospace', fontSize: 11, whiteSpace: 'pre', overflowX: 'auto' as const, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, lineHeight: 1.7 },
}

function tabBtn(active: boolean): React.CSSProperties {
  return { padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500, background: active ? ACCENT : '#f1f5f9', color: active ? '#fff' : '#475569' }
}

// ── Project-type config ───────────────────────────────────────────────────────

const BUILDING_LOAD_TYPES: { code: string; name: string; category: 'permanent' | 'variable' }[] = [
  { code: 'DL',   name: 'Dead Load',      category: 'permanent' },
  { code: 'SDL',  name: 'Super Dead',     category: 'permanent' },
  { code: 'LL',   name: 'Live Load',      category: 'variable'  },
  { code: 'WX',   name: 'Wind X',         category: 'variable'  },
  { code: 'WZ',   name: 'Wind Z',         category: 'variable'  },
  { code: 'SN',   name: 'Snow',           category: 'variable'  },
  { code: 'TE+',  name: 'Temperature +',  category: 'variable'  },
  { code: 'TE-',  name: 'Temperature −',  category: 'variable'  },
  { code: 'IMP',  name: 'Impact',         category: 'variable'  },
]

const MARINE_LOAD_TYPES: { code: string; name: string; category: 'permanent' | 'variable' }[] = [
  { code: 'DL',    name: 'Dead Load',      category: 'permanent' },
  { code: 'LL',    name: 'Live Load',      category: 'variable'  },
  { code: 'IMP',   name: 'Impact Load',    category: 'variable'  },
  { code: 'WINDX', name: 'Wind X',         category: 'variable'  },
  { code: 'WINDZ', name: 'Wind Z',         category: 'variable'  },
  { code: 'WAVEX', name: 'Wave X',         category: 'variable'  },
  { code: 'WAVEZ', name: 'Wave Z',         category: 'variable'  },
  { code: 'CUX',   name: 'Current X',      category: 'variable'  },
  { code: 'CUZ',   name: 'Current Z',      category: 'variable'  },
  { code: 'TE+',   name: 'Temperature +',  category: 'variable'  },
  { code: 'TE-',   name: 'Temperature −',  category: 'variable'  },
  { code: 'ML',    name: 'Mooring',        category: 'variable'  },
  { code: 'BE',    name: 'Berthing',       category: 'variable'  },
]

// ── Partial factor table definitions ─────────────────────────────────────────

type PartialRow =
  | { type: 'header' }
  | { type: 'section'; label: string }
  | { type: 'data'; label: string; sym: string; bUnfav: string; bFav: string; cUnfav: string; cFav: string }

const BUILDING_PARTIAL_ROWS: PartialRow[] = [
  { type: 'header' },
  { type: 'section', label: 'Permanent Actions' },
  { type: 'data', label: 'Concrete self-weight', sym: 'γG', bUnfav: 'concrete_unfav_b', bFav: 'concrete_fav_b', cUnfav: 'concrete_unfav_c', cFav: 'concrete_fav_c' },
  { type: 'data', label: 'Steel self-weight',    sym: 'γG', bUnfav: 'steel_unfav_b',    bFav: 'steel_fav_b',    cUnfav: 'steel_unfav_c',    cFav: 'steel_fav_c'    },
  { type: 'section', label: 'Variable Actions' },
  { type: 'data', label: 'Live load',    sym: 'γQ', bUnfav: 'live_unfav_b',        bFav: '', cUnfav: 'live_unfav_c',        cFav: '' },
  { type: 'data', label: 'Wind load',   sym: 'γQ', bUnfav: 'wind_unfav_b',        bFav: '', cUnfav: 'wind_unfav_c',        cFav: '' },
  { type: 'data', label: 'Snow load',   sym: 'γQ', bUnfav: 'snow_unfav_b',        bFav: '', cUnfav: 'snow_unfav_c',        cFav: '' },
  { type: 'data', label: 'Temperature', sym: 'γQ', bUnfav: 'temperature_unfav_b', bFav: '', cUnfav: 'temperature_unfav_c', cFav: '' },
  { type: 'data', label: 'Impact load', sym: 'γQ', bUnfav: 'impact_unfav_b',      bFav: '', cUnfav: 'impact_unfav_c',      cFav: '' },
]

const MARINE_PARTIAL_ROWS: PartialRow[] = [
  { type: 'header' },
  { type: 'section', label: 'Permanent Actions' },
  { type: 'data', label: 'Steel self-weight',    sym: 'γG', bUnfav: 'steel_unfav_b',    bFav: 'steel_fav_b',    cUnfav: 'steel_unfav_c',    cFav: 'steel_fav_c'    },
  { type: 'data', label: 'Concrete self-weight', sym: 'γG', bUnfav: 'concrete_unfav_b', bFav: 'concrete_fav_b', cUnfav: 'concrete_unfav_c', cFav: 'concrete_fav_c' },
  { type: 'section', label: 'Variable Actions' },
  { type: 'data', label: 'Live load',       sym: 'γQ', bUnfav: 'live_unfav_b',          bFav: '', cUnfav: 'live_unfav_c',          cFav: '' },
  { type: 'data', label: 'Wind load',       sym: 'γQ', bUnfav: 'wind_unfav_b',          bFav: '', cUnfav: 'wind_unfav_c',          cFav: '' },
  { type: 'data', label: 'Wave load',       sym: 'γQ', bUnfav: 'wave_unfav_b',          bFav: '', cUnfav: 'wave_unfav_c',          cFav: '' },
  { type: 'data', label: 'Current load',    sym: 'γQ', bUnfav: 'current_unfav_b',       bFav: '', cUnfav: 'current_unfav_c',       cFav: '' },
  { type: 'data', label: 'Temperature',     sym: 'γQ', bUnfav: 'temperature_unfav_b',   bFav: '', cUnfav: 'temperature_unfav_c',   cFav: '' },
  { type: 'data', label: 'Impact load',     sym: 'γQ', bUnfav: 'impact_unfav_b',        bFav: '', cUnfav: 'impact_unfav_c',        cFav: '' },
  { type: 'data', label: 'Mooring',         sym: 'γQ', bUnfav: 'mooring_unfav_b',       bFav: '', cUnfav: 'mooring_unfav_c',       cFav: '' },
  { type: 'data', label: 'Berthing (Char)', sym: 'γQ', bUnfav: 'berthing_char_unfav_b', bFav: '', cUnfav: 'berthing_char_unfav_c', cFav: '' },
]

// ── ψ table definitions ───────────────────────────────────────────────────────

const BUILDING_PSI_ROWS = [
  { key: 'live_load',        label: 'Live load'    },
  { key: 'wind_load',        label: 'Wind load'    },
  { key: 'snow_load',        label: 'Snow load'    },
  { key: 'temperature_load', label: 'Temperature'  },
  { key: 'impact_load',      label: 'Impact load'  },
]

const MARINE_PSI_ROWS = [
  { key: 'live_load',        label: 'Live load'       },
  { key: 'wind_load',        label: 'Wind load'       },
  { key: 'wave_load',        label: 'Wave load'       },
  { key: 'current_load',     label: 'Current load'    },
  { key: 'temperature_load', label: 'Temperature'     },
  { key: 'impact_load',      label: 'Impact load'     },
  { key: 'mooring',          label: 'Mooring'         },
  { key: 'berthing_char',    label: 'Berthing (Char)' },
]

// ── Default factor sets ───────────────────────────────────────────────────────

const BUILDING_PARTIAL_DEFAULTS: Record<string, number> = {
  ...DEFAULT_PARTIAL_FACTORS,
  snow_unfav_b: 1.50,
  snow_unfav_c: 1.30,
}

const BUILDING_PSI_DEFAULTS: Record<string, [number, number, number]> = {
  live_load:        [0.7, 0.5, 0.3],
  wind_load:        [0.6, 0.2, 0.0],
  snow_load:        [0.5, 0.2, 0.0],
  temperature_load: [0.6, 0.5, 0.0],
  impact_load:      [0.7, 0.5, 0.3],
}

const MARINE_PARTIAL_DEFAULTS: Record<string, number> = { ...DEFAULT_PARTIAL_FACTORS }

const MARINE_PSI_DEFAULTS: Record<string, [number, number, number]> = {
  live_load:        [0.7, 0.5, 0.3],
  wind_load:        [0.5, 0.2, 0.0],
  wave_load:        [0.6, 0.2, 0.0],
  current_load:     [0.6, 0.2, 0.0],
  temperature_load: [0.6, 0.6, 0.5],
  impact_load:      [0.7, 0.5, 0.3],
  mooring:          [0.5, 0.2, 0.0],
  berthing_char:    [0.75, 0.75, 0.0],
}

function clonePF(d: Record<string, number>) { return { ...d } }
function cloneCF(d: Record<string, [number, number, number]>) {
  return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, [...v] as [number, number, number]]))
}

// ── EditCell ──────────────────────────────────────────────────────────────────

function EditCell({ value, defaultValue, onChange, width = 88 }: {
  value: number; defaultValue: number; onChange: (v: number) => void; width?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const modified = Math.abs(value - defaultValue) > 0.0001

  function commit() {
    const v = parseFloat(draft)
    if (!isNaN(v) && v >= 0 && v <= 9.99) onChange(v)
    setEditing(false)
  }

  return (
    <td style={{ width, minWidth: width, padding: 0, background: modified ? MODIFIED : 'transparent', borderBottom: '1px solid #e8ecf0', textAlign: 'center' }}>
      {editing
        ? <input autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            style={{ width: width - 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 3, padding: '2px 3px', background: '#fffde7', outline: 'none' }}
          />
        : <span onClick={() => { setDraft(value.toFixed(2)); setEditing(true) }}
            title="Click to edit"
            style={{ display: 'block', padding: '4px 0', cursor: 'pointer', fontSize: 12, fontWeight: modified ? 700 : 400, color: modified ? MOD_FG : '#1e293b' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = ACCENT }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = modified ? MOD_FG : '#1e293b' }}
          >{value.toFixed(2)}</span>
      }
    </td>
  )
}

// ── PartialTable ──────────────────────────────────────────────────────────────

function PartialTable({ rows, pf, defaults, onChange, customRows }: {
  rows: PartialRow[]
  pf: Record<string, number>
  defaults: Record<string, number>
  onChange: (key: string, val: number) => void
  customRows?: CustomPsiRow[]
}) {
  const thSt: React.CSSProperties = { background: HDR_BG, color: HDR_FG, fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }
  const secSt: React.CSSProperties = { background: SEC_BG, color: SEC_FG, fontSize: 11, fontWeight: 700, padding: '4px 10px', textAlign: 'left' }
  const custSecSt: React.CSSProperties = { background: '#fffbeb', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '4px 10px', textAlign: 'left', borderTop: '1px solid #fde68a', borderBottom: '1px solid #fde68a' }
  let di = 0

  return (
    <table style={{ borderCollapse: 'collapse', border: '1px solid #c7d2fe' }}>
      <colgroup>
        <col style={{ width: 188 }} /><col style={{ width: 44 }} />
        <col style={{ width: 88 }} /><col style={{ width: 88 }} />
        <col style={{ width: 88 }} /><col style={{ width: 88 }} />
      </colgroup>
      <tbody>
        {rows.map((row, ri) => {
          if (row.type === 'header') return (
            <tr key={ri}>
              <th style={{ ...thSt, textAlign: 'left' }}>Action</th>
              <th style={thSt}>Sym</th>
              <th style={thSt}>Set B Unfav</th>
              <th style={thSt}>Set B Fav</th>
              <th style={thSt}>Set C Unfav</th>
              <th style={thSt}>Set C Fav</th>
            </tr>
          )
          if (row.type === 'section') return (
            <tr key={ri}><td colSpan={6} style={secSt}>{row.label}</td></tr>
          )
          di++
          const bg = di % 2 === 0 ? ROW_ALT : ROW_NORM
          return (
            <tr key={ri} style={{ background: bg }}>
              <td style={{ fontSize: 12, padding: '3px 10px', borderBottom: '1px solid #e8ecf0' }}>{row.label}</td>
              <td style={{ fontSize: 11, padding: '3px 8px', borderBottom: '1px solid #e8ecf0', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>{row.sym}</td>
              {[row.bUnfav, row.bFav, row.cUnfav, row.cFav].map((k, ki) =>
                k
                  ? <EditCell key={ki} value={pf[k] ?? defaults[k] ?? 1.0} defaultValue={defaults[k] ?? 1.0} onChange={v => onChange(k, v)} />
                  : <td key={ki} style={{ borderBottom: '1px solid #e8ecf0', background: '#f1f5f9' }} />
              )}
            </tr>
          )
        })}

        {/* Custom variable load rows */}
        {customRows && customRows.length > 0 && <>
          <tr><td colSpan={6} style={custSecSt}>Custom Loads</td></tr>
          {customRows.map((r, ci) => {
            const bKey = `${r.key}_unfav_b`
            const cKey = `${r.key}_unfav_c`
            const bDef = defaults[bKey] ?? 1.50
            const cDef = defaults[cKey] ?? 1.30
            return (
              <tr key={r.key} style={{ background: ci % 2 === 0 ? '#fffef5' : '#fffbeb' }}>
                <td style={{ fontSize: 12, padding: '3px 10px', borderBottom: '1px solid #e8ecf0' }}>
                  {r.label}
                  <span style={{ marginLeft: 6, fontSize: 10, color: '#d97706', fontWeight: 700, background: '#fef3c7', borderRadius: 3, padding: '1px 5px' }}>custom</span>
                </td>
                <td style={{ fontSize: 11, padding: '3px 8px', borderBottom: '1px solid #e8ecf0', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>γQ</td>
                <EditCell value={pf[bKey] ?? bDef} defaultValue={bDef} onChange={v => onChange(bKey, v)} />
                <td style={{ borderBottom: '1px solid #e8ecf0', background: '#f1f5f9' }} />
                <EditCell value={pf[cKey] ?? cDef} defaultValue={cDef} onChange={v => onChange(cKey, v)} />
                <td style={{ borderBottom: '1px solid #e8ecf0', background: '#f1f5f9' }} />
              </tr>
            )
          })}
        </>}
      </tbody>
    </table>
  )
}

// ── PsiTable ──────────────────────────────────────────────────────────────────

function PsiTable({ rows, cf, defaults, onChange }: {
  rows: { key: string; label: string }[]
  cf: Record<string, [number, number, number]>
  defaults: Record<string, [number, number, number]>
  onChange: (key: string, idx: 0 | 1 | 2, val: number) => void
}) {
  const thSt: React.CSSProperties = { background: HDR_BG, color: HDR_FG, fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }

  return (
    <table style={{ borderCollapse: 'collapse', border: '1px solid #c7d2fe' }}>
      <colgroup>
        <col style={{ width: 188 }} />
        <col style={{ width: 88 }} /><col style={{ width: 88 }} /><col style={{ width: 88 }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...thSt, textAlign: 'left' }}>Variable Action</th>
          <th style={thSt}>ψ₀</th><th style={thSt}>ψ₁</th><th style={thSt}>ψ₂</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => {
          const cur = cf[r.key] ?? defaults[r.key] ?? [0.7, 0.5, 0.3]
          const def = defaults[r.key] ?? [0.7, 0.5, 0.3]
          return (
            <tr key={r.key} style={{ background: ri % 2 === 0 ? ROW_NORM : ROW_ALT }}>
              <td style={{ fontSize: 12, padding: '3px 10px', borderBottom: '1px solid #e8ecf0' }}>{r.label}</td>
              {([0, 1, 2] as (0 | 1 | 2)[]).map(i => (
                <EditCell key={i} value={cur[i]} defaultValue={def[i]} onChange={v => onChange(r.key, i, v)} />
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Project type selector bar ─────────────────────────────────────────────────

function ProjectTypeBar({ projectType, onChange }: {
  projectType: ProjectType
  onChange: (t: ProjectType) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, background: '#f1f5f9', borderRadius: 10, padding: 4, alignSelf: 'flex-start' }}>
      {([
        ['building', '🏢', 'Building', 'EN 1990'],
        ['marine',   '⚓', 'Marine',   'BS / Custom'],
      ] as [ProjectType, string, string, string][]).map(([id, icon, label, sub]) => {
        const active = projectType === id
        const isBuilding = id === 'building'
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: active ? '#fff' : 'transparent',
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
            transition: 'all 0.13s',
          }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, fontWeight: active ? 800 : 500, color: active ? (isBuilding ? '#3730a3' : '#0369a1') : '#64748b', lineHeight: 1.2 }}>{label}</span>
              <span style={{ fontSize: 10, color: active ? (isBuilding ? '#6366f1' : '#0ea5e9') : '#94a3b8', fontWeight: 500 }}>{sub}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Custom ψ row type ─────────────────────────────────────────────────────────

type CustomPsiRow = { key: string; label: string }

// ── Step 1: Load Cases ────────────────────────────────────────────────────────

function Step1({ loads, onChange, projectType, onAddCustom, onRemoveCustom }: {
  loads: LoadInstance[]
  onChange: (loads: LoadInstance[]) => void
  projectType: ProjectType
  onAddCustom: (row: CustomPsiRow) => void
  onRemoveCustom: (key: string) => void
}) {
  const TYPES = projectType === 'building' ? BUILDING_LOAD_TYPES : MARINE_LOAD_TYPES
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customCode, setCustomCode]         = useState('')
  const [customName, setCustomName]         = useState('')
  const [customCat, setCustomCat]           = useState<'permanent' | 'variable'>('variable')

  function add(tmpl: typeof TYPES[number]) {
    const existing = loads.filter(l =>
      l.code === tmpl.code || (l.code.startsWith(tmpl.code) && /\d$/.test(l.code))
    )
    if (existing.length === 1) {
      const updated = loads.map(l =>
        l.code === tmpl.code ? { ...l, code: `${tmpl.code}1`, name: `${tmpl.name} 1` } : l
      )
      onChange([...updated, { code: `${tmpl.code}2`, name: `${tmpl.name} 2`, category: tmpl.category }])
      return
    }
    const suffix = existing.length > 1 ? existing.length + 1 : ''
    onChange([...loads, { code: `${tmpl.code}${suffix}`, name: suffix ? `${tmpl.name} ${suffix}` : tmpl.name, category: tmpl.category }])
  }

  function submitCustom() {
    const code = customCode.trim().toUpperCase()
    const name = customName.trim() || code
    if (!code) return
    const psiKey = `custom_${code.toLowerCase()}`
    onChange([...loads, { code, name, category: customCat }])
    if (customCat === 'variable') onAddCustom({ key: psiKey, label: name })
    setCustomCode(''); setCustomName(''); setCustomCat('variable'); setShowCustomForm(false)
  }

  function remove(i: number) {
    const l = loads[i]
    const psiKey = `custom_${l.code.toLowerCase()}`
    onRemoveCustom(psiKey)
    onChange(loads.filter((_, j) => j !== i))
  }

  const perm = loads.filter(l => l.category === 'permanent').length

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={S.sectionLabel}>Load Cases</div>
      <div style={S.card}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Click to add:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {TYPES.map(lt => (
            <button key={lt.code} onClick={() => add(lt)} style={{
              ...S.btn, padding: '4px 10px', fontSize: 11,
              background: lt.category === 'permanent' ? '#eef2ff' : '#f0fdf4',
              color: lt.category === 'permanent' ? '#4338ca' : '#166534',
            }}>+ {lt.code}</button>
          ))}
          <button onClick={() => setShowCustomForm(v => !v)} style={{
            ...S.btn, padding: '4px 10px', fontSize: 11,
            background: showCustomForm ? '#fef3c7' : '#fffbeb',
            color: '#92400e', border: '1px dashed #fcd34d',
          }}>+ Custom…</button>
        </div>

        {showCustomForm && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="Code (e.g. EQ)"
              value={customCode}
              onChange={e => setCustomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && submitCustom()}
              style={{ width: 90, fontSize: 12, fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 7px', textTransform: 'uppercase' }}
            />
            <input
              placeholder="Name (e.g. Earthquake)"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitCustom()}
              style={{ flex: 1, minWidth: 130, fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 7px' }}
            />
            <select value={customCat} onChange={e => setCustomCat(e.target.value as 'permanent' | 'variable')}
              style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 6px', background: '#fff' }}>
              <option value="variable">Variable</option>
              <option value="permanent">Permanent</option>
            </select>
            <button onClick={submitCustom} style={{ ...S.btn, padding: '4px 14px', fontSize: 12, background: ACCENT, color: '#fff' }}>Add</button>
            <button onClick={() => setShowCustomForm(false)} style={{ ...S.btn, padding: '4px 8px', fontSize: 12, background: '#f1f5f9', color: '#64748b' }}>✕</button>
          </div>
        )}

        {loads.length === 0
          ? <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No loads added yet.</div>
          : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '22px 64px 180px 80px 36px', gap: '0 6px', marginBottom: 4 }}>
                {['#', 'Code', 'Name', 'Type', ''].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {loads.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px 64px 180px 80px 36px', gap: '0 6px', alignItems: 'center', padding: '4px 0', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{l.code}</span>
                  <input value={l.name}
                    onChange={e => onChange(loads.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', width: '100%', boxSizing: 'border-box' }} />
                  <span style={{ ...S.badge, fontSize: 10, padding: '2px 6px', background: l.category === 'permanent' ? '#eef2ff' : '#f0fdf4', color: l.category === 'permanent' ? '#4338ca' : '#166534' }}>
                    {l.category === 'permanent' ? 'perm' : 'var'}
                  </span>
                  <button onClick={() => remove(i)} style={{ ...S.btn, padding: '2px 5px', fontSize: 11, background: '#fee2e2', color: '#dc2626' }}>✕</button>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 11, color: ACCENT, fontWeight: 600 }}>
                {loads.length} loads · {perm} permanent · {loads.length - perm} variable
              </div>
            </>
          )
        }
      </div>
    </div>
  )
}

// ── Step 2: Settings ──────────────────────────────────────────────────────────

function Step2({ material, setMaterial, mode, setMode, types, setTypes }: {
  material: MaterialType; setMaterial: (m: MaterialType) => void
  mode: ComboMode; setMode: (m: ComboMode) => void
  types: ComboTypes; setTypes: (t: ComboTypes) => void
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={S.sectionLabel}>Settings</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ ...S.card, minWidth: 190 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Material (γG)</div>
          {(['steel', 'concrete'] as MaterialType[]).map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 4, fontSize: 12 }}>
              <input type="radio" checked={material === m} onChange={() => setMaterial(m)} style={{ accentColor: ACCENT }} />
              {m === 'steel' ? 'Steel' : 'Concrete'}
            </label>
          ))}
        </div>
        <div style={{ ...S.card, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Mode</div>
          {([['simple', 'Simple (dominant only)'], ['full', 'Full (all accompany)']] as [ComboMode, string][]).map(([m, label]) => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 4, fontSize: 12 }}>
              <input type="radio" checked={mode === m} onChange={() => setMode(m)} style={{ accentColor: ACCENT }} />
              {label}
            </label>
          ))}
        </div>
        <div style={{ ...S.card, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>ULS</div>
          {([['persistent', '6.10 Set B'], ['persistent_c', '6.10 Set C'], ['accidental', '6.11b Accidental']] as [keyof ComboTypes, string][]).map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 3, fontSize: 12 }}>
              <input type="checkbox" checked={types[k]} onChange={() => setTypes({ ...types, [k]: !types[k] })} style={{ accentColor: ACCENT }} /> {label}
            </label>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', margin: '8px 0 6px' }}>SLS</div>
          {([['sls_char', 'Characteristic 6.14'], ['sls_freq', 'Frequent 6.15'], ['sls_quasi', 'Quasi-perm 6.16']] as [keyof ComboTypes, string][]).map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 3, fontSize: 12 }}>
              <input type="checkbox" checked={types[k]} onChange={() => setTypes({ ...types, [k]: !types[k] })} style={{ accentColor: ACCENT }} /> {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Factors ───────────────────────────────────────────────────────────

function StepFactors({ projectType, pf, setPF, cf, setCF, customPsiRows }: {
  projectType: ProjectType
  pf: Record<string, number>;  setPF: (f: Record<string, number>) => void
  cf: Record<string, [number, number, number]>; setCF: (f: Record<string, [number, number, number]>) => void
  customPsiRows: CustomPsiRow[]
}) {
  const isBuilding   = projectType === 'building'
  const pfRows       = isBuilding ? BUILDING_PARTIAL_ROWS : MARINE_PARTIAL_ROWS
  const psiRows      = isBuilding ? BUILDING_PSI_ROWS     : MARINE_PSI_ROWS
  const pfDef        = isBuilding ? BUILDING_PARTIAL_DEFAULTS : MARINE_PARTIAL_DEFAULTS
  const cfDef        = isBuilding ? BUILDING_PSI_DEFAULTS     : MARINE_PSI_DEFAULTS
  const standard     = isBuilding ? 'EN 1990' : 'BS / Custom'

  const CUSTOM_DEFAULT: [number, number, number] = [0.7, 0.5, 0.3]

  function reset() { setPF(clonePF(pfDef)); setCF(cloneCF(cfDef)) }

  function onChangePF(key: string, val: number) { setPF({ ...pf, [key]: val }) }
  function onChangeCF(key: string, idx: 0 | 1 | 2, val: number) {
    const base = cfDef[key] ?? CUSTOM_DEFAULT
    const cur = [...(cf[key] ?? base)] as [number, number, number]
    cur[idx] = val; setCF({ ...cf, [key]: cur })
  }

  const anyModified =
    Object.keys(pfDef).some(k => Math.abs((pf[k] ?? pfDef[k]) - pfDef[k]) > 0.0001) ||
    Object.keys(cfDef).some(k => {
      const d = cfDef[k], c = cf[k] ?? d
      return d.some((v, i) => Math.abs(c[i] - v) > 0.0001)
    }) ||
    customPsiRows.some(r => {
      const c = cf[r.key] ?? CUSTOM_DEFAULT
      return CUSTOM_DEFAULT.some((v, i) => Math.abs(c[i] - v) > 0.0001)
    })

  // Merged ψ rows: standard rows + custom divider + custom rows
  const allPsiRows: ({ key: string; label: string; isCustom?: boolean } | { divider: true; label: string })[] = [
    ...psiRows,
    ...(customPsiRows.length > 0
      ? [{ divider: true as const, label: 'Custom Loads' }, ...customPsiRows.map(r => ({ ...r, isCustom: true }))]
      : []),
  ]

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={S.sectionLabel}>
          Factors — {standard}
          {anyModified && <span style={{ marginLeft: 8, fontSize: 10, color: MOD_FG, background: MODIFIED, border: '1px solid #fde68a', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>modified</span>}
        </div>
        <button onClick={reset} style={{ ...S.btn, padding: '3px 12px', fontSize: 11, background: '#f1f5f9', color: '#475569', marginBottom: 6 }}>↺ Reset</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 11, color: '#94a3b8' }}>
        <span style={{ display: 'inline-block', width: 24, height: 13, background: MODIFIED, border: '1px solid #fde68a', borderRadius: 3 }} />
        <span style={{ color: MOD_FG, fontWeight: 600 }}>Modified from default</span>
        <span>· Click any value to edit</span>
      </div>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 5 }}>
            Partial Factors <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(γG, γQ)</span>
          </div>
          <PartialTable rows={pfRows} pf={pf} defaults={pfDef} onChange={onChangePF} customRows={customPsiRows} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 5 }}>
            Combination Factors <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(ψ₀, ψ₁, ψ₂)</span>
          </div>
          {/* Extended ψ table including custom rows */}
          <table style={{ borderCollapse: 'collapse', border: '1px solid #c7d2fe' }}>
            <colgroup>
              <col style={{ width: 188 }} />
              <col style={{ width: 88 }} /><col style={{ width: 88 }} /><col style={{ width: 88 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ background: HDR_BG, color: HDR_FG, fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Variable Action</th>
                <th style={{ background: HDR_BG, color: HDR_FG, fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>ψ₀</th>
                <th style={{ background: HDR_BG, color: HDR_FG, fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>ψ₁</th>
                <th style={{ background: HDR_BG, color: HDR_FG, fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>ψ₂</th>
              </tr>
            </thead>
            <tbody>
              {allPsiRows.map((row, ri) => {
                if ('divider' in row) return (
                  <tr key={`div-${ri}`}>
                    <td colSpan={4} style={{ background: '#fffbeb', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderBottom: '1px solid #fde68a', borderTop: '1px solid #fde68a' }}>
                      {row.label}
                    </td>
                  </tr>
                )
                const def = cfDef[row.key] ?? CUSTOM_DEFAULT
                const cur = cf[row.key] ?? def
                const isCustom = 'isCustom' in row && row.isCustom
                return (
                  <tr key={row.key} style={{ background: isCustom ? '#fffef5' : (ri % 2 === 0 ? ROW_NORM : ROW_ALT) }}>
                    <td style={{ fontSize: 12, padding: '3px 10px', borderBottom: '1px solid #e8ecf0', color: isCustom ? '#92400e' : undefined }}>
                      {row.label}
                      {isCustom && <span style={{ marginLeft: 6, fontSize: 10, color: '#d97706', fontWeight: 700, background: '#fef3c7', borderRadius: 3, padding: '1px 5px' }}>custom</span>}
                    </td>
                    {([0, 1, 2] as (0 | 1 | 2)[]).map(i => (
                      <EditCell key={i} value={cur[i]} defaultValue={def[i]} onChange={v => onChangeCF(row.key, i, v)} />
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────

function Results({ loads, material, mode, types, pf, cf }: {
  loads: LoadInstance[]; material: MaterialType; mode: ComboMode; types: ComboTypes
  pf: Record<string, number>; cf: Record<string, [number, number, number]>
}) {
  const [outputTab, setOutputTab] = useState<'staad' | 'report'>('report')
  const [copied, setCopied] = useState(false)

  const permLoads = loads.filter(l => l.category === 'permanent')
  const varLoads  = loads.filter(l => l.category === 'variable')
  const allLoads  = [...permLoads, ...varLoads]
  const { combos, envelopes } = generateAll(loads, pf, cf, material, types, mode)

  function buildStaad() {
    if (!combos.length) return 'No combinations — check settings above.'
    let out = '', prev = ''
    for (const c of combos) {
      const sec = sectionHeader(c.name)
      if (sec && sec !== prev) { out += `\n* ${sec.slice(2)}\n`; prev = sec }
      out += formatStaad(c)
    }
    if (envelopes.length) {
      out += '\nPERFORM ANALYSIS\n\nDEFINE ENVELOPE\n'
      envelopes.forEach((e, i) => { out += `${e.start} TO ${e.end} ENVELOPE ${i + 2} TYPE ${e.type}\n` })
      out += 'END DEFINE ENVELOPE\n'
    }
    return out
  }

  function buildReport() {
    if (!combos.length) return 'No combinations — check settings above.'
    let out = '', prev = ''
    for (const c of combos) {
      const sec = sectionHeader(c.name)
      if (sec && sec !== prev) { out += `\n${sec}\n`; prev = sec }
      out += formatReport(c, allLoads)
    }
    return out
  }

  const activeText = outputTab === 'staad' ? buildStaad() : buildReport()

  function copy() {
    navigator.clipboard.writeText(activeText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

  if (!loads.length || !varLoads.length) {
    return <div style={{ ...S.card, color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Add at least one permanent and one variable load to generate combinations.</div>
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={S.sectionLabel}>Results — {combos.length} combination{combos.length !== 1 ? 's' : ''}</div>
      <div style={S.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {envelopes.map(e => (
            <span key={e.type} style={{ ...S.badge, background: e.type === 'STRENGTH' ? '#fef3c7' : '#ede9fe', color: e.type === 'STRENGTH' ? '#92400e' : '#4c1d95' }}>
              {e.type === 'STRENGTH' ? 'ULS' : 'SLS'} {e.start}–{e.end} ({e.end - e.start + 1})
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setOutputTab('report')} style={tabBtn(outputTab === 'report')}>Report Format</button>
            <button onClick={() => setOutputTab('staad')}  style={tabBtn(outputTab === 'staad')}>STAAD Format</button>
          </div>
          <button onClick={copy} style={{ ...S.btn, background: copied ? '#dcfce7' : '#eef2ff', color: copied ? '#166534' : ACCENT }}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
        <div style={S.mono}>{activeText}</div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LoadComboGenerator() {
  const [projectType, setProjectType] = useState<ProjectType>('building')

  const [loads, setLoads]             = useState<LoadInstance[]>([
    { code: 'DL', name: 'Dead Load', category: 'permanent' },
    { code: 'LL', name: 'Live Load', category: 'variable'  },
  ])
  const [customPsiRows, setCustomPsiRows] = useState<CustomPsiRow[]>([])
  const [material, setMaterial]       = useState<MaterialType>('concrete')
  const [mode, setMode]               = useState<ComboMode>('full')
  const [types, setTypes]             = useState<ComboTypes>({
    persistent: true, persistent_c: false, accidental: false,
    sls_char: true,   sls_freq: false,     sls_quasi: false,
  })
  const [pf, setPF] = useState<Record<string, number>>(clonePF(BUILDING_PARTIAL_DEFAULTS))
  const [cf, setCF] = useState<Record<string, [number, number, number]>>(cloneCF(BUILDING_PSI_DEFAULTS))

  function switchType(t: ProjectType) {
    if (t === projectType) return
    setProjectType(t)
    setLoads([
      { code: 'DL', name: 'Dead Load', category: 'permanent' },
      { code: 'LL', name: 'Live Load', category: 'variable'  },
    ])
    setCustomPsiRows([])
    if (t === 'building') {
      setPF(clonePF(BUILDING_PARTIAL_DEFAULTS))
      setCF(cloneCF(BUILDING_PSI_DEFAULTS))
      setMaterial('concrete')
    } else {
      setPF(clonePF(MARINE_PARTIAL_DEFAULTS))
      setCF(cloneCF(MARINE_PSI_DEFAULTS))
      setMaterial('steel')
    }
  }

  const setLoadsStable   = useCallback((l: LoadInstance[]) => setLoads(l), [])
  const onAddCustom      = useCallback((row: CustomPsiRow) => {
    setCustomPsiRows(prev => prev.some(r => r.key === row.key) ? prev : [...prev, row])
    setCF(prev => ({ ...prev, [row.key]: [0.7, 0.5, 0.3] }))
  }, [])
  const onRemoveCustom   = useCallback((key: string) => {
    setCustomPsiRows(prev => prev.filter(r => r.key !== key))
    setCF(prev => { const next = { ...prev }; delete next[key]; return next })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ProjectTypeBar projectType={projectType} onChange={switchType} />
      <StepFactors projectType={projectType} pf={pf} setPF={setPF} cf={cf} setCF={setCF} customPsiRows={customPsiRows} />
      <Step1 loads={loads} onChange={setLoadsStable} projectType={projectType} onAddCustom={onAddCustom} onRemoveCustom={onRemoveCustom} />
      <Step2 material={material} setMaterial={setMaterial} mode={mode} setMode={setMode} types={types} setTypes={setTypes} />
      <Results loads={loads} material={material} mode={mode} types={types} pf={pf} cf={cf} />
    </div>
  )
}
