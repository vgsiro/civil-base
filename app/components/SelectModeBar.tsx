'use client'

interface Props {
  totalSelected: number
  deleting: boolean
  onExit: () => void
  onDelete: () => void
}

export default function SelectModeBar({ totalSelected, deleting, onExit, onDelete }: Props) {
  return (
    <div style={{ background: '#1e40af', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '14px', fontWeight: '500' }}>
        {totalSelected === 0 ? 'Select items to delete' : `${totalSelected} selected`}
      </span>
      <div style={{ flex: 1 }} />
      <button onClick={onExit}
        style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
        Cancel
      </button>
      <button onClick={onDelete} disabled={totalSelected === 0 || deleting}
        style={{ padding: '6px 16px', background: totalSelected === 0 ? '#64748b' : '#ef4444', color: 'white', border: 'none', borderRadius: '7px', cursor: totalSelected === 0 ? 'default' : 'pointer', fontSize: '13px', fontWeight: '500', opacity: deleting ? 0.7 : 1 }}>
        {deleting ? 'Deleting...' : `Delete${totalSelected > 0 ? ` (${totalSelected})` : ''}`}
      </button>
    </div>
  )
}
