'use client'
import { GREEN } from '../../../../_shared/ui-atoms'

const RED = '#dc2626'

export function PassFailBar({ items }: { items: { label: string; ok: boolean }[] }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map(({ label, ok }) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 99, padding: '2px 8px 2px 5px',
        }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: ok ? GREEN : RED }}>●</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: ok ? '#166534' : '#991b1b', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: ok ? GREEN : RED, marginLeft: 3 }}>{ok ? 'PASS' : 'FAIL'}</span>
        </div>
      ))}
    </div>
  )
}
