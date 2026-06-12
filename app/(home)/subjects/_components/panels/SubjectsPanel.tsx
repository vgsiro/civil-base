'use client'
import { useState } from 'react'
import { Plus, Trash2, Pencil, CheckSquare, Square, MessageCircle, PanelLeftClose, Pin, PinOff, ChevronRight, Filter } from 'lucide-react'
import type { Subject, RenameState } from '../../../../_types'
import { useTranslation } from '../../../../i18n/LanguageContext'

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
]
function categoryColor(name: string): string {
  if (!name) return '#94a3b8'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

interface Props {
  subjects: Subject[]
  selectedSubject: Subject | null
  selectMode: boolean
  selectedSubjectIds: Set<string>
  renaming: RenameState | null
  showAddSubject: boolean
  onSelectSubject: (s: Subject) => void
  onToggleSelect: (id: string) => void
  onDeleteSubject: (e: React.MouseEvent, s: Subject) => void
  onStartRename: (e: React.MouseEvent, type: 'subject', item: Subject) => void
  onOpenChat: (e: React.MouseEvent, s: Subject) => void
  onToggleSelectMode: () => void
  onToggleAddSubject: () => void
  onAddSubject: (name: string, code: string, category: string) => void
  renameState: RenameState | null
  renameInputRef: React.RefObject<HTMLInputElement | null>
  onRenameChange: (name: string, code?: string, category?: string) => void
  onRenameKey: (e: React.KeyboardEvent) => void
  onRenameBlur: () => void
  onCollapse: () => void
  onTogglePin: () => void
  pinned: boolean
}

export default function SubjectsPanel({
  subjects, selectedSubject, selectMode, selectedSubjectIds, renaming,
  showAddSubject, onSelectSubject, onToggleSelect, onDeleteSubject,
  onStartRename, onOpenChat, onToggleSelectMode, onToggleAddSubject, onAddSubject,
  renameState, renameInputRef, onRenameChange, onRenameKey, onRenameBlur,
  onCollapse, onTogglePin, pinned,
}: Props) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  function handleAdd() {
    if (!newName.trim()) return
    onAddSubject(newName, newCode, newCategory)
    setNewName(''); setNewCode(''); setNewCategory('')
  }

  function toggleCategoryCollapse(cat: string) {
    setCollapsedCategories(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  const allCategories = [...new Set(subjects.map(s => s.category || '').filter(Boolean))].sort()

  const sorted = subjects.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const filtered = filterCategory ? sorted.filter(s => (s.category || '') === filterCategory) : sorted

  const groups: { category: string; items: Subject[] }[] = filterCategory
    ? [{ category: filterCategory, items: filtered }]
    : [{ category: '', items: filtered }]

  function renderSubject(s: Subject) {
    const isSelected = selectedSubject?.id === s.id
    const isSelectChecked = selectedSubjectIds.has(s.id)
    const color = categoryColor(s.category || '')
    return (
      <div key={s.id} tabIndex={0}
        onClick={() => selectMode ? onToggleSelect(s.id) : onSelectSubject(s)}
        style={{
          padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
          background: selectMode && isSelectChecked ? '#fef2f2' : isSelected ? '#eff6ff' : 'white',
          borderLeft: selectMode && isSelectChecked ? `3px solid #ef4444` : isSelected ? `3px solid ${color}` : `3px solid transparent`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
        {selectMode && (
          <span style={{ marginRight: '8px', color: isSelectChecked ? '#ef4444' : '#cbd5e1', flexShrink: 0 }}>
            {isSelectChecked ? <CheckSquare size={15} /> : <Square size={15} />}
          </span>
        )}
        {renaming?.id === s.id ? (
          <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
            <input ref={renameInputRef} value={renaming!.name}
              onChange={e => onRenameChange(e.target.value, renaming!.code, renaming!.category)}
              onKeyDown={onRenameKey} onBlur={onRenameBlur} autoFocus
              style={{ width: '100%', padding: '2px 6px', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '13px', fontWeight: '500', marginBottom: '3px', outline: 'none', boxSizing: 'border-box' }} />
            <input value={renaming!.code ?? ''}
              onChange={e => onRenameChange(renaming!.name, e.target.value, renaming!.category)}
              onKeyDown={onRenameKey} onBlur={onRenameBlur} placeholder={t('home_panel_code_placeholder')}
              style={{ width: '100%', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', outline: 'none', marginBottom: '3px', boxSizing: 'border-box' }} />
            <input value={renaming!.category ?? ''}
              onChange={e => onRenameChange(renaming!.name, renaming!.code, e.target.value)}
              onKeyDown={onRenameKey} onBlur={onRenameBlur} placeholder={t('home_subject_category_placeholder')}
              style={{ width: '100%', padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div title={s.name} style={{ fontSize: '13px', fontWeight: '500', color: isSelected ? '#1d4ed8' : '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
            {s.code && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.code}</div>}
            {s.category && (
              <div style={{ marginTop: 3 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: color, background: `${color}18`, padding: '1px 6px', borderRadius: 4 }}>
                  {s.category}
                </span>
              </div>
            )}
          </div>
        )}
        {!selectMode && renaming?.id !== s.id && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <button onClick={e => onOpenChat(e, s)} title={t('home_panel_ask_ai')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
              <MessageCircle size={12} />
            </button>
            <button onClick={e => onStartRename(e, 'subject', s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
              <Pencil size={12} />
            </button>
            <button onClick={e => onDeleteSubject(e, s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{t('home_panel_subjects')}</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={onToggleSelectMode} title={t('home_panel_select_mode')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectMode ? '#3b82f6' : '#94a3b8', padding: '2px' }}>
            <CheckSquare size={15} />
          </button>
          <button onClick={onToggleAddSubject} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
            <Plus size={16} />
          </button>
          <button onClick={() => { setShowFilter(f => !f); if (showFilter) setFilterCategory(null) }} title={t('home_panel_filter_by_category')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: filterCategory ? '#3b82f6' : showFilter ? '#3b82f6' : '#94a3b8', padding: '2px' }}>
            <Filter size={13} />
          </button>
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

      {showFilter && allCategories.length > 0 && (
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <button onClick={() => setFilterCategory(null)}
            style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, border: 'none', cursor: 'pointer', background: filterCategory === null ? '#1e293b' : '#f1f5f9', color: filterCategory === null ? '#fff' : '#64748b', fontWeight: filterCategory === null ? 600 : 400 }}>
            All
          </button>
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, border: 'none', cursor: 'pointer', background: filterCategory === cat ? categoryColor(cat) : '#f1f5f9', color: filterCategory === cat ? '#fff' : '#64748b', fontWeight: filterCategory === cat ? 600 : 400 }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {showAddSubject && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <input placeholder={t('home_subject_name_placeholder')} value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }} />
          <input placeholder={t('home_subject_code_placeholder')} value={newCode} onChange={e => setNewCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }} />
          <input placeholder={t('home_subject_category_placeholder')} value={newCategory} onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }} />
          <button onClick={handleAdd}
            style={{ width: '100%', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            {t('home_panel_add_subject')}
          </button>
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filterCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: categoryColor(filterCategory), flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1 }}>{filterCategory}</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{filtered.length}</span>
          </div>
        )}
        {filtered.map(s => renderSubject(s))}
        {subjects.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{t('home_no_subjects_yet')}</div>
        )}
      </div>
    </div>
  )
}
