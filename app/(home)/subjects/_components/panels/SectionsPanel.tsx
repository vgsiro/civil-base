'use client'
import { useState } from 'react'
import { Plus, Trash2, Pencil, ChevronRight, CheckSquare, Square, PanelLeftClose, Pin, PinOff } from 'lucide-react'
import type { Subject, Section, RenameState } from '../../../../_types'
import { useTranslation } from '../../../../i18n/LanguageContext'

interface Props {
  sections: Section[]
  selectedSubject: Subject | null
  selectedSection: Section | null
  selectMode: boolean
  selectedSectionIds: Set<string>
  renaming: RenameState | null
  showAddSection: boolean
  onSelectSection: (s: Section) => void
  onToggleSelect: (id: string) => void
  onDeleteSection: (e: React.MouseEvent, s: Section) => void
  onStartRename: (e: React.MouseEvent, type: 'section', item: Section) => void
  onToggleAddSection: () => void
  onAddSection: (name: string) => void
  renameInputRef: React.RefObject<HTMLInputElement | null>
  onRenameChange: (name: string) => void
  onRenameKey: (e: React.KeyboardEvent) => void
  onRenameBlur: () => void
  onCollapse: () => void
  onTogglePin: () => void
  pinned: boolean
}

export default function SectionsPanel({
  sections, selectedSubject, selectedSection, selectMode, selectedSectionIds, renaming,
  showAddSection, onSelectSection, onToggleSelect, onDeleteSection, onStartRename,
  onToggleAddSection, onAddSection, renameInputRef, onRenameChange, onRenameKey, onRenameBlur,
  onCollapse, onTogglePin, pinned,
}: Props) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState('')

  function handleAdd() {
    if (!newName.trim()) return
    onAddSection(newName)
    setNewName('')
  }

  return (
    <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{t('home_panel_sections')}</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {selectedSubject && !selectMode && (
            <button onClick={onToggleAddSection} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
              <Plus size={16} />
            </button>
          )}
          <button onClick={onTogglePin} title={pinned ? t('home_panel_unpin_sidebar') : t('home_panel_pin_sidebar')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: pinned ? '#3b82f6' : '#cbd5e1', padding: '2px' }}>
            {pinned ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
          <button onClick={onCollapse} title={t('home_panel_collapse')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>

      {showAddSection && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <input placeholder={t('home_panel_section_name_placeholder')} value={newName} onChange={e => setNewName(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px' }} />
          <button onClick={handleAdd}
            style={{ width: '100%', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            {t('home_panel_add_section')}
          </button>
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1 }}
        onKeyDown={e => { if (e.key === 'F2' && selectedSection && !selectMode) onStartRename(e as any, 'section', selectedSection) }}>
        {!selectedSubject && (
          <div style={{ padding: '20px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>{t('home_panel_select_subject')}</div>
        )}
        {sections.map(s => (
          <div key={s.id} tabIndex={0}
            onClick={() => selectMode ? onToggleSelect(s.id) : onSelectSection(s)}
            style={{
              padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
              background: selectMode && selectedSectionIds.has(s.id) ? '#fef2f2' : selectedSection?.id === s.id ? '#eff6ff' : 'white',
              borderLeft: selectMode && selectedSectionIds.has(s.id) ? '3px solid #ef4444' : selectedSection?.id === s.id ? '3px solid #3b82f6' : '3px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
            {selectMode && (
              <span style={{ marginRight: '8px', color: selectedSectionIds.has(s.id) ? '#ef4444' : '#cbd5e1', flexShrink: 0 }}>
                {selectedSectionIds.has(s.id) ? <CheckSquare size={15} /> : <Square size={15} />}
              </span>
            )}
            {renaming?.id === s.id ? (
              <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
                <input ref={renameInputRef} value={renaming!.name}
                  onChange={e => onRenameChange(e.target.value)}
                  onKeyDown={onRenameKey} onBlur={onRenameBlur} autoFocus
                  style={{ width: '100%', padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '13px', outline: 'none' }} />
              </div>
            ) : (
              <span title={s.name} style={{ fontSize: '13px', color: selectedSection?.id === s.id ? '#1d4ed8' : '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            )}
            {!selectMode && renaming?.id !== s.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                <ChevronRight size={14} color="#94a3b8" />
                <button onClick={e => onStartRename(e, 'section', s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                  <Pencil size={12} />
                </button>
                <button onClick={e => onDeleteSection(e, s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
