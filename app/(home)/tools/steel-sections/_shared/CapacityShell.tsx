'use client'
import type { ReactNode } from 'react'

const ACCENT = '#0369a1'

export type CapacityTab = 'results' | 'details'

interface CapacityShellProps {
  searchSlot: ReactNode
  grade: string
  grades: string[]
  onGrade: (g: string) => void
  gradeLabel: string
  tab: CapacityTab
  onTab: (t: CapacityTab) => void
  tabLabels: { results: string; details: string }
  /** Export button label — omit to hide */
  exportLabel?: string
  onExport?: () => void
  /** When true, show a Premium badge instead of the export button */
  exportLocked?: boolean
  exportLockedLabel?: string
  /** When true, replace the Details tab content with a LockedBanner */
  detailsLockedBanner?: ReactNode
  headerSlot?: ReactNode
  children: ReactNode
}

export function CapacityShell({
  searchSlot,
  grade,
  grades,
  onGrade,
  gradeLabel,
  tab,
  onTab,
  tabLabels,
  exportLabel,
  onExport,
  exportLocked,
  exportLockedLabel,
  detailsLockedBanner,
  headerSlot,
  children,
}: CapacityShellProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid #f1f5f9',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {searchSlot}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{gradeLabel}:</span>
          {grades.map(g => (
            <button
              key={g}
              onClick={() => onGrade(g)}
              style={{
                padding: '4px 14px', borderRadius: 20,
                border: `1.5px solid ${grade === g ? ACCENT : '#e2e8f0'}`,
                background: grade === g ? ACCENT : '#fff',
                color: grade === g ? '#fff' : '#475569',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >{g}</button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
        {headerSlot}

        {/* Results / Details pill toggle + export button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          {(['results', 'details'] as const).map(k => (
            <button
              key={k}
              onClick={() => onTab(k)}
              style={{
                padding: '5px 18px', borderRadius: 20, fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${tab === k ? ACCENT : '#e2e8f0'}`,
                background: tab === k ? ACCENT : '#fff',
                color: tab === k ? '#fff' : '#64748b',
              }}
            >
              {tabLabels[k]}
            </button>
          ))}

          {exportLocked ? (
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 600,
              color: '#8b5cf6', background: '#f5f3ff',
              border: '1px solid #ddd6fe', borderRadius: 99,
              padding: '3px 10px', cursor: 'default',
            }}>
              {exportLockedLabel ?? 'Premium ↑'}
            </span>
          ) : exportLabel && onExport ? (
            <button
              onClick={onExport}
              style={{
                marginLeft: 'auto', padding: '5px 14px', borderRadius: 20,
                fontSize: 11, fontWeight: 600,
                border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {exportLabel}
            </button>
          ) : null}
        </div>

        {/* If details tab is locked, show the banner instead of children */}
        {tab === 'details' && detailsLockedBanner
          ? detailsLockedBanner
          : children
        }
      </div>
    </div>
  )
}
