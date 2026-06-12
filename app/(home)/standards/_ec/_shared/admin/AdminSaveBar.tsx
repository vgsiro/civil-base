'use client'

// Floating "Edit Page" toggle button — fixed top-right, below the tab bar
export function AdminEditToggle({
  editMode,
  onToggle,
}: {
  editMode: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      title={editMode ? 'Exit edit mode' : 'Edit page content'}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: editMode ? '#4f46e5' : '#f1f5f9',
        color: editMode ? '#fff' : '#64748b',
        border: `1px solid ${editMode ? '#4f46e5' : '#e2e8f0'}`,
        borderRadius: 7, padding: '5px 11px', fontSize: 11, fontWeight: 700,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = editMode ? '#4338ca' : '#e2e8f0' }}
      onMouseLeave={e => { e.currentTarget.style.background = editMode ? '#4f46e5' : '#f1f5f9' }}>
      {editMode
        ? <><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> Exit Edit</>
        : <><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> Edit Page</>
      }
    </button>
  )
}

// Top bar shown while in edit mode
export function AdminEditBar({
  dirty,
  saving,
  onSave,
  onDiscard,
}: {
  dirty: number
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 16px', background: '#eef2ff',
      borderBottom: '1.5px solid #c7d2fe', flexShrink: 0,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#4338ca', flex: 1 }}>
        {saving ? 'Saving…' : dirty > 0 ? `${dirty} unsaved change${dirty !== 1 ? 's' : ''}` : 'Edit mode — click any field to edit'}
      </span>
      <button onClick={onDiscard} disabled={saving}
        style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: 'none', border: '1px solid #a5b4fc', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
        Discard
      </button>
      <button onClick={onSave} disabled={saving}
        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: saving ? '#818cf8' : '#4f46e5', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.12s' }}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
