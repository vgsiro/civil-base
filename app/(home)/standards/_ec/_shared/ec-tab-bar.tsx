'use client'

// ── Shared sub-tab bar for all EC pages ───────────────────────────────────────
// To change tab style globally, edit EcTabBar here.
// To add a new tab type icon, add to TAB_ICONS below.

export type EcTab = {
  id:    string
  label: string
  icon:  React.ReactNode
}

// ── Standard icons — reuse these in tabsMap in page.tsx ──────────────────────
export const TAB_ICONS = {
  overview: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.9"/>
    </svg>
  ),
  reference: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="7.5" y1="7.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="3" y1="5" x2="7" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5" y1="3" x2="5" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  tables: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="1" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="5" y1="5" x2="5" y2="13" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  standards: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4.5" y1="7"   x2="9.5" y2="7"   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  na: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 11V3l3.5 5.5L10 3v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
} satisfies Record<string, React.ReactNode>

// ── EcTabBar component ────────────────────────────────────────────────────────
export function EcTabBar({ tabs, active, accentColor, onChange, rightSlot }: {
  tabs:        EcTab[]
  active:      string
  accentColor: string
  onChange:    (id: string) => void
  rightSlot?:  React.ReactNode
}) {
  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 16px',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? accentColor : '#64748b',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${isActive ? accentColor : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#1e293b' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.6 }}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        )
      })}
      {rightSlot && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
          {rightSlot}
        </div>
      )}
    </div>
  )
}
