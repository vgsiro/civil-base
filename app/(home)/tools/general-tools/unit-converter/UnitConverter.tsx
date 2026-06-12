'use client'
import { useState, useCallback } from 'react'
import { CATEGORIES, convertValue, type Category, type UnitDef } from './units'
import PageDiscussion from '../../../../_components/home/discussion/PageDiscussion'

function fmt(v: number): string {
  if (!isFinite(v)) return ''
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e15 || (abs < 1e-4 && abs > 0)) return v.toExponential(6).replace(/\.?0+e/, 'e')
  // round to 8 significant figures, then format with thousand separators
  const rounded = parseFloat(v.toPrecision(8))
  const [int, dec] = rounded.toString().split('.')
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec ? `${intFormatted}.${dec}` : intFormatted
}

function parse(raw: string): number {
  // strip thousand separators before parsing
  return parseFloat(raw.replace(/,/g, ''))
}

function CategorySidebar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="uc-sidebar" style={{ width: 200, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: '#f8fafc', overflowY: 'auto' }}>
      {CATEGORIES.map(cat => (
        <button key={cat.id} onClick={() => onChange(cat.id)} style={{
          display: 'block', width: '100%', textAlign: 'left', padding: '11px 18px',
          border: 'none', background: active === cat.id ? '#fff' : 'none',
          borderLeft: active === cat.id ? '3px solid #f97316' : '3px solid transparent',
          color: active === cat.id ? '#f97316' : '#475569',
          fontWeight: active === cat.id ? 700 : 400,
          fontSize: 13, cursor: 'pointer',
          transition: 'background 0.1s, color 0.1s',
        }}
          onMouseEnter={e => { if (active !== cat.id) e.currentTarget.style.background = '#f1f5f9' }}
          onMouseLeave={e => { if (active !== cat.id) e.currentTarget.style.background = 'none' }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}

function UnitFields({ category }: { category: Category }) {
  // formatted values shown when not focused
  const [values, setValues] = useState<Record<string, string>>({})
  // raw numeric strings shown when focused (no commas)
  const [rawValues, setRawValues] = useState<Record<string, string>>({})
  const [focused, setFocused] = useState<string | null>(null)

  const handleChange = useCallback((fromUnit: UnitDef, raw: string) => {
    const num = parse(raw)
    const nextRaw: Record<string, string> = { [fromUnit.id]: raw }
    const nextFmt: Record<string, string> = { [fromUnit.id]: raw }
    if (!isNaN(num) && raw.trim() !== '') {
      for (const u of category.units) {
        if (u.id === fromUnit.id) continue
        const converted = convertValue(num, fromUnit, u)
        nextFmt[u.id] = fmt(converted)
        nextRaw[u.id] = parseFloat(converted.toPrecision(8)).toString()
      }
    } else {
      for (const u of category.units) {
        if (u.id !== fromUnit.id) { nextFmt[u.id] = ''; nextRaw[u.id] = '' }
      }
    }
    setValues(nextFmt)
    setRawValues(nextRaw)
  }, [category])

  const key = category.id

  return (
    <div key={key} className="uc-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, padding: '28px 28px 80px' }}>
      {category.units.map(unit => {
        const isFocused = focused === unit.id
        const displayValue = isFocused ? (rawValues[unit.id] ?? '') : (values[unit.id] ?? '')
        return (
          <div key={unit.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
              {unit.label} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({unit.symbol})</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={e => handleChange(unit, e.target.value)}
                placeholder="0"
                style={{
                  width: '100%', padding: '9px 52px 9px 12px',
                  border: `1.5px solid ${isFocused ? '#f97316' : '#e2e8f0'}`, borderRadius: 8,
                  fontSize: 14, fontFamily: 'monospace', color: '#1e293b',
                  background: '#fff', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={() => setFocused(unit.id)}
                onBlur={() => setFocused(null)}
              />
              <span style={{
                position: 'absolute', right: 10,
                fontSize: 12, fontWeight: 700, color: '#f97316',
                pointerEvents: 'none', userSelect: 'none',
              }}>
                {unit.symbol}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const CAT_STORAGE_KEY = 'uc_active_cat'

export default function UnitConverter({ pageKey }: { pageKey: string }) {
  const [activeCat, setActiveCat] = useState(() => {
    if (typeof window === 'undefined') return CATEGORIES[0].id
    const saved = localStorage.getItem(CAT_STORAGE_KEY)
    return saved && CATEGORIES.find(c => c.id === saved) ? saved : CATEGORIES[0].id
  })
  const category = CATEGORIES.find(c => c.id === activeCat)!

  function handleCatChange(id: string) {
    setActiveCat(id)
    localStorage.setItem(CAT_STORAGE_KEY, id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Mobile category select — hidden on desktop via CSS */}
      <div className="uc-mobile-cat" style={{ display: 'none' }}>
        <select
          value={activeCat}
          onChange={e => handleCatChange(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#1e293b', outline: 'none' }}
        >
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Category sidebar — hidden on mobile via CSS */}
        <CategorySidebar active={activeCat} onChange={handleCatChange} />

        {/* Fields panel */}
        <div className="uc-fields-panel" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f97316' }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{category.label}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>— type in any field to convert all</span>
          </div>
          <UnitFields category={category} />
          <div style={{ padding: '0 28px 40px' }}>
            <PageDiscussion pageKey={pageKey} />
          </div>
        </div>
      </div>
    </div>
  )
}
