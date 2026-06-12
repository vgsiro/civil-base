'use client'
import { useState, useCallback } from 'react'
import { CATEGORIES, convertValue, type Category, type UnitDef } from './units'

function fmt(v: number): string {
  if (!isFinite(v)) return '—'
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e9 || (abs < 1e-4 && abs > 0)) return v.toExponential(6).replace(/\.?0+e/, 'e')
  if (abs >= 1000) return parseFloat(v.toPrecision(8)).toLocaleString('en-US', { maximumFractionDigits: 6 })
  return parseFloat(v.toPrecision(8)).toString()
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
  const [values, setValues] = useState<Record<string, string>>({})

  const handleChange = useCallback((fromUnit: UnitDef, raw: string) => {
    const next: Record<string, string> = { [fromUnit.id]: raw }
    const num = parseFloat(raw)
    if (!isNaN(num) && raw.trim() !== '') {
      for (const u of category.units) {
        if (u.id === fromUnit.id) continue
        next[u.id] = fmt(convertValue(num, fromUnit, u))
      }
    } else {
      for (const u of category.units) {
        if (u.id !== fromUnit.id) next[u.id] = ''
      }
    }
    setValues(next)
  }, [category])

  // reset when category changes
  const key = category.id

  return (
    <div key={key} className="uc-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, padding: '28px 28px 80px' }}>
      {category.units.map(unit => (
        <div key={unit.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
            {unit.label} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({unit.symbol})</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              value={values[unit.id] ?? ''}
              onChange={e => handleChange(unit, e.target.value)}
              placeholder="—"
              style={{
                width: '100%', padding: '9px 52px 9px 12px',
                border: '1.5px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, fontFamily: 'monospace', color: '#1e293b',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#f97316' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
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
      ))}
    </div>
  )
}

export default function UnitConverter() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id)
  const category = CATEGORIES.find(c => c.id === activeCat)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Mobile category select — hidden on desktop via CSS */}
      <div className="uc-mobile-cat" style={{ display: 'none' }}>
        <select
          value={activeCat}
          onChange={e => setActiveCat(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#1e293b', outline: 'none' }}
        >
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Category sidebar — hidden on mobile via CSS */}
        <CategorySidebar active={activeCat} onChange={setActiveCat} />

        {/* Fields panel */}
        <div className="uc-fields-panel" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: '#f97316' }} />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{category.label}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>— type in any field to convert all</span>
          </div>
          <UnitFields category={category} />
        </div>
      </div>
    </div>
  )
}
