'use client'
import { useState, useRef, useEffect } from 'react'
import { BookOpen, FileText, Hash, Search, Plus, Pencil, Trash2, Check, X, ArrowUpAZ, ArrowDownAZ, LayoutGrid, SlidersHorizontal, ScrollText, HardHat, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Subject } from '../../../../_types'
import CommunityStats from '../../../../_components/social/feed/CommunityStats'
import HomeFooter from '../../../../_components/shared/HomeFooter'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../../../../i18n/LanguageContext'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
  '#475569', '#f97316', '#14b8a6', '#a855f7',
]

function randomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}

function categoryColor(name: string): string {
  if (!name) return '#475569'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length]
}

function subjectColor(s: Subject): string {
  if (s.color) return s.color
  const seed = s.id || s.name || 'x'
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length]
}

interface Props {
  stats: { subjects: number; pdfs: number; formulas: number } | null
  subjects: Subject[]
  recentSubjects: Subject[]
  onSelectSubject: (s: Subject) => void
  onOpenSearch: () => void
  onAddSubject: () => void
  onUpdateSubject: (id: string, fields: Partial<{ name: string; code: string; category: string; color: string }>) => Promise<void>
  onDeleteSubject: (e: React.MouseEvent, s: Subject) => void
  isLoggedIn: boolean
  isAdmin: boolean
  onSignIn: () => void
}

// ── Combobox (input + dropdown from existing options) ────────────────────────
function CategoryCombobox({ value, onChange, allCategories, placeholder }: {
  value: string
  onChange: (v: string) => void
  allCategories: string[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const suggestions = allCategories.filter(c => c.toLowerCase().includes(value.toLowerCase()) && c !== value)

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, marginTop: 2, overflow: 'hidden' }}>
          {suggestions.map(c => (
            <div key={c} onMouseDown={() => { onChange(c); setOpen(false) }}
              style={{ padding: '7px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColor(c), flexShrink: 0 }} />
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({ subject, allCategories, onSave, onClose, onDelete }: {
  subject: Subject
  allCategories: string[]
  onSave: (fields: Partial<{ name: string; code: string; category: string; color: string }>) => Promise<void>
  onClose: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [name, setName] = useState(subject.name)
  const [code, setCode] = useState(subject.code ?? '')
  const [category, setCategory] = useState(subject.category ?? '')
  const [color, setColor] = useState(() => subject.color || randomColor())
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), code: code.trim(), category: category.trim(), color })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onMouseDown={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        onMouseDown={e => e.stopPropagation()}>
        <div style={{ height: 64, background: color }} />
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{t('home_edit_subject')}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
          </div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={t('home_subject_name_placeholder')}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder={t('home_subject_code_placeholder')}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          <CategoryCombobox value={category} onChange={setCategory} allCategories={allCategories} placeholder={t('home_subject_category_placeholder')} />
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>{t('home_card_color')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ width: 26, height: 26, borderRadius: 6, background: c, border: color.toLowerCase() === c.toLowerCase() ? '2px solid #1e293b' : '2px solid transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {color.toLowerCase() === c.toLowerCase() && <Check size={13} color="#fff" />}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} title={t('home_pick_custom_color')}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, border: '2px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
              </label>
              <input
                value={color}
                onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setColor(e.target.value) }}
                placeholder="#3b82f6"
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={e => onDelete(e)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, background: 'none', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
              <Trash2 size={13} /> {t('home_delete')}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 8, background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>{t('home_cancel')}</button>
            <button onClick={handleSave} disabled={!name.trim() || saving}
              style={{ padding: '7px 18px', borderRadius: 8, background: name.trim() ? color : '#e2e8f0', border: 'none', color: name.trim() ? '#fff' : '#94a3b8', cursor: name.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 600 }}>
              {saving ? t('home_saving') : t('home_save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, onClick, onEdit }: {
  subject: Subject; onClick: () => void; onEdit: (e: React.MouseEvent) => void
}) {
  const color = subjectColor(subject)
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff', boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s', transform: hovered ? 'translateY(-2px)' : 'none' }}>
      <div onClick={onClick} style={{ height: 80, background: color, position: 'relative' }}>
        <BookOpen size={20} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', bottom: 10, left: 12 }} />
        <button onClick={onEdit}
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 6, padding: '3px 5px', cursor: 'pointer', display: hovered ? 'flex' : 'none', alignItems: 'center', color: '#fff' }}>
          <Pencil size={11} />
        </button>
      </div>
      <div onClick={onClick} style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color, lineHeight: 1.4, marginBottom: 3 }}>{subject.name}</div>
        {subject.code && <div style={{ fontSize: 11, color: '#64748b' }}>{subject.code}</div>}
        {subject.category && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: color, padding: '1px 7px', borderRadius: 8, opacity: 0.85 }}>{subject.category}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sort/filter dropdown ─────────────────────────────────────────────────────
type SortMode = 'default' | 'az' | 'za' | 'category'
function SortDropdown({ sort, onSort }: { sort: SortMode; onSort: (s: SortMode) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const options: { value: SortMode; label: string; icon: React.ReactNode }[] = [
    { value: 'default', label: t('home_sort_default'), icon: <LayoutGrid size={13} /> },
    { value: 'az', label: t('home_sort_az'), icon: <ArrowUpAZ size={13} /> },
    { value: 'za', label: t('home_sort_za'), icon: <ArrowDownAZ size={13} /> },
    { value: 'category', label: t('home_sort_category'), icon: <SlidersHorizontal size={13} /> },
  ]
  const current = options.find(o => o.value === sort)!

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: sort !== 'default' ? '#eff6ff' : '#f8fafc', border: `1px solid ${sort !== 'default' ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer', color: sort !== 'default' ? '#3b82f6' : '#64748b', fontSize: 12 }}>
        {current.icon} {current.label}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 180, overflow: 'hidden' }}>
          {options.map(o => (
            <div key={o.value} onMouseDown={() => { onSort(o.value); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: sort === o.value ? '#3b82f6' : '#1e293b', background: sort === o.value ? '#eff6ff' : '#fff', fontWeight: sort === o.value ? 600 : 400 }}
              onMouseEnter={e => { if (sort !== o.value) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (sort !== o.value) e.currentTarget.style.background = '#fff' }}>
              {o.icon} {o.label}
              {sort === o.value && <Check size={12} style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Category multi-select filter ─────────────────────────────────────────────
function FilterCategoryInput({ value, onChange, allCategories, selectedCategories, onToggleCategory, onClear }: {
  value: string; onChange: (v: string) => void
  allCategories: string[]; selectedCategories: string[]
  onToggleCategory: (c: string) => void; onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const suggestions = value.trim() ? allCategories.filter(c => c.toLowerCase().includes(value.toLowerCase())) : allCategories
  const hasFilter = selectedCategories.length > 0

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, background: hasFilter ? '#eff6ff' : '#f8fafc', border: `1px solid ${hasFilter ? '#3b82f6' : '#e2e8f0'}`, cursor: 'pointer', fontSize: 12, color: hasFilter ? '#3b82f6' : '#64748b' }}>
        <SlidersHorizontal size={12} />
        {hasFilter ? `${selectedCategories.length} ${selectedCategories.length > 1 ? t('home_filter_category_other') : t('home_filter_category_one')}` : t('home_filter_category')}
        {hasFilter && <span onMouseDown={e => { e.stopPropagation(); onClear() }} style={{ marginLeft: 2, opacity: 0.7, lineHeight: 1 }}>×</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 180, overflow: 'hidden' }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
            <input autoFocus value={value} onChange={e => onChange(e.target.value)}
              placeholder={t('home_filter_search_placeholder')}
              style={{ width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {suggestions.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>{t('home_filter_no_categories')}</div>
          )}
          {suggestions.map(c => {
            const checked = selectedCategories.includes(c)
            return (
              <div key={c} onMouseDown={() => onToggleCategory(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', background: checked ? '#eff6ff' : '#fff' }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.background = '#fff' }}>
                <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checked ? categoryColor(c) : '#cbd5e1'}`, background: checked ? categoryColor(c) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {checked && <Check size={9} color="#fff" />}
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColor(c), flexShrink: 0 }} />
                <span style={{ color: '#1e293b', fontWeight: checked ? 600 : 400 }}>{c}</span>
              </div>
            )
          })}
          {hasFilter && (
            <div onMouseDown={onClear} style={{ padding: '7px 12px', fontSize: 11, color: '#94a3b8', cursor: 'pointer', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              {t('home_filter_clear_all')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared card link wrapper ──────────────────────────────────────────────────
function CardLink({ href, hoverColor, children, onClick }: { href: string; hoverColor: string; children: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'block', borderRadius: 12, overflow: 'hidden', border: `2px solid ${hovered ? hoverColor : '#e2e8f0'}`, cursor: 'pointer', background: '#fff', boxShadow: hovered ? `0 6px 20px ${hoverColor}30` : '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s', transform: hovered ? 'translateY(-2px)' : 'none', textDecoration: 'none' }}>
      {children}
    </Link>
  )
}

function EC0Card() {
  const { t } = useTranslation()
  return (
    <CardLink href="/standards?tab=ec0" hoverColor="#6366f1">
      <div style={{ height: 80, background: 'linear-gradient(135deg, #3730a3, #6366f1)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <ScrollText size={20} color="rgba(255,255,255,0.7)" />
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>EC0</span>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#3730a3', lineHeight: 1.4, marginBottom: 3 }}>{t('home_card_ec0_title')}</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{t('home_card_ec0_desc')}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#6366f1', padding: '1px 7px', borderRadius: 8 }}>{t('home_badge_eurocode_tools')}</span>
        </div>
      </div>
    </CardLink>
  )
}

function EC1Card() {
  const { t } = useTranslation()
  return (
    <CardLink href="/standards?tab=ec1" hoverColor="#0ea5e9">
      <div style={{ height: 80, background: 'linear-gradient(135deg, #0369a1, #0ea5e9)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <ScrollText size={20} color="rgba(255,255,255,0.7)" />
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>EC1</span>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', lineHeight: 1.4, marginBottom: 3 }}>{t('home_card_ec1_title')}</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{t('home_card_ec1_desc')}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#0ea5e9', padding: '1px 7px', borderRadius: 8 }}>{t('home_badge_eurocode_tools')}</span>
        </div>
      </div>
    </CardLink>
  )
}

function EC2Card() {
  const { t } = useTranslation()
  return (
    <CardLink href="/standards?tab=ec2" hoverColor="#10b981">
      <div style={{ height: 80, background: 'linear-gradient(135deg, #065f46, #10b981)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <ScrollText size={20} color="rgba(255,255,255,0.7)" />
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>EC2</span>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', lineHeight: 1.4, marginBottom: 3 }}>{t('home_card_ec2_title')}</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{t('home_card_ec2_desc')}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#10b981', padding: '1px 7px', borderRadius: 8 }}>{t('home_badge_eurocode_tools')}</span>
        </div>
      </div>
    </CardLink>
  )
}

function EC3Card() {
  const { t } = useTranslation()
  return (
    <CardLink href="/standards?tab=ec3" hoverColor="#8b5cf6">
      <div style={{ height: 80, background: 'linear-gradient(135deg, #4c1d95, #8b5cf6)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <ScrollText size={20} color="rgba(255,255,255,0.7)" />
        <span style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>EC3</span>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95', lineHeight: 1.4, marginBottom: 3 }}>{t('home_card_ec3_title')}</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{t('home_card_ec3_desc')}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#8b5cf6', padding: '1px 7px', borderRadius: 8 }}>{t('home_badge_eurocode_tools')}</span>
        </div>
      </div>
    </CardLink>
  )
}

function DesignToolsCard() {
  const { t } = useTranslation()
  return (
    <CardLink href="/tools" hoverColor="#6366f1">
      <div style={{ height: 80, background: 'linear-gradient(135deg, #1e1b4b, #4338ca, #6366f1)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.8)"/>
          <rect x="13" y="1" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.5)"/>
          <rect x="1" y="13" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.5)"/>
          <rect x="13" y="13" width="8" height="8" rx="1.5" fill="rgba(255,255,255,0.8)"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>EC0 · EC1 · EC2 · EC3</span>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#3730a3', lineHeight: 1.4, marginBottom: 3 }}>{t('home_card_design_tools_title')}</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{t('home_card_design_tools_desc')}</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#6366f1', padding: '1px 7px', borderRadius: 8 }}>{t('home_badge_tool_library')}</span>
        </div>
      </div>
    </CardLink>
  )
}

function StructuralAICard({ isLoggedIn, onSignIn }: { isLoggedIn: boolean; onSignIn: () => void }) {
  const { t } = useTranslation()
  return (
    <CardLink href="/structural-ai" hoverColor="#f59e0b" onClick={!isLoggedIn ? (e) => { e.preventDefault(); onSignIn() } : undefined}>
      <div style={{ height: 80, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 10px' }}>
        <HardHat size={22} color="#f59e0b" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {['PASS', 'FAIL'].map(v => (
              <span key={v} style={{ fontSize: 9, fontWeight: 800, color: v === 'PASS' ? '#4ade80' : '#f87171', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>{v}</span>
            ))}
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>η = 0.82</span>
        </div>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: 3 }}>{t('home_card_structural_ai_title')}</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{t('home_card_structural_ai_desc')}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: '#0f172a', padding: '1px 7px', borderRadius: 8 }}>{t('home_badge_ai_assistant')}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 7px', borderRadius: 8 }}>EN · TCVN</span>
        </div>
      </div>
    </CardLink>
  )
}

function DashboardStats() {
  const [s, setS] = useState<{ views: number; members: number; verified: number; posts: number } | null>(null)
  const { t } = useTranslation()
  useEffect(() => {
    Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
    ]).then(([{ count: v }, { count: m }, { count: vr }, { count: p }]) =>
      setS({ views: v ?? 0, members: m ?? 0, verified: vr ?? 0, posts: p ?? 0 })
    )
  }, [])
  if (!s) return null
  const items = [
    { label: t('home_stat_visits'),   value: s.views,    color: '#60a5fa' },
    { label: t('home_stat_members'),  value: s.members,  color: '#34d399' },
    { label: t('home_stat_verified'), value: s.verified, color: '#38bdf8' },
    { label: t('home_stat_posts'),    value: s.posts,    color: '#fbbf24' },
  ]
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
      {items.map(item => (
        <div key={item.label} style={{ textAlign: 'center' as const }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage({ stats, subjects, recentSubjects, onSelectSubject, onOpenSearch, onAddSubject, onUpdateSubject, onDeleteSubject, isLoggedIn, isAdmin, onSignIn }: Props) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sort, setSort] = useState<SortMode>('default')
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  const allCategories = [...new Set(subjects.map(s => s.category ?? '').filter(Boolean))].sort()

  const q = searchQuery.toLowerCase().trim()

  let display = subjects
    .filter(s => selectedCategories.length === 0 || selectedCategories.includes(s.category ?? ''))
    .filter(s => !q || (s.name ?? '').toLowerCase().includes(q) || (s.code ?? '').toLowerCase().includes(q))

  if (sort === 'az') display = [...display].sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'za') display = [...display].sort((a, b) => b.name.localeCompare(a.name))
  else if (sort === 'category') display = [...display].sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name))

  type Group = { label: string; items: Subject[] }
  const groups: Group[] = sort === 'category'
    ? (() => {
        const m = new Map<string, Subject[]>()
        for (const s of display) {
          const k = s.category || ''
          if (!m.has(k)) m.set(k, [])
          m.get(k)!.push(s)
        }
        const result: Group[] = []
        ;[...m.keys()].filter(k => k).sort().forEach(k => result.push({ label: k, items: m.get(k)! }))
        if (m.has('')) result.push({ label: '', items: m.get('')! })
        return result
      })()
    : [{ label: '', items: display }]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>{t('home_hero_kicker')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{t('home_hero_title')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, flexWrap: 'wrap' as const }}>
          <div style={{ flex: '1 1 320px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t('home_community_title')}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{t('home_community_sub')}</div>
              </div>
            </div>
            <a href="/feed"
              style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}>
              {t('home_community_cta')}
            </a>
          </div>

          <a href="/donate"
            style={{ flexShrink: 0, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', transition: 'background 0.15s, border-color 0.15s', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.18)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(251,191,36,0.55)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.1)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(251,191,36,0.3)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #d97706, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>☕</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{t('home_donate_title')}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{t('home_donate_sub')}</div>
            </div>
          </a>

          <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
            <DashboardStats />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {isAdmin && <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', width: 'calc(2 * 214px + 14px)' }}>
          <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('home_search_subjects_placeholder')}
            style={{ width: '100%', padding: '6px 26px 6px 26px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
              <X size={11} />
            </button>
          )}
        </div>
        <FilterCategoryInput value={filterCategory} onChange={v => setFilterCategory(v)} allCategories={allCategories} selectedCategories={selectedCategories} onToggleCategory={cat => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} onClear={() => { setFilterCategory(''); setSelectedCategories([]) }} />
        <div style={{ flex: 1 }} />
        <button onClick={onAddSubject}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: '#3b82f6', border: 'none', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 600 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}>
          <Plus size={13} /> {t('home_new_subject')}
        </button>
      </div>}

      {/* Engineering Tools */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: '#f59e0b' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('home_section_engineering_tools')}</span>
          <div style={{ flex: 1 }} />
          {isAdmin && <SortDropdown sort={sort} onSort={setSort} />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(214px, 214px))', gap: 14, marginBottom: 24 }}>
          <StructuralAICard isLoggedIn={isLoggedIn} onSignIn={onSignIn} />
          <DesignToolsCard />
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />
      </div>

      {/* Eurocode */}
      <div style={{ padding: '0 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: '#1d4ed8' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('home_section_eurocode')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(214px, 214px))', gap: 14, marginBottom: 24 }}>
          <EC0Card /><EC1Card /><EC2Card /><EC3Card />
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />
      </div>

      {/* My Subjects */}
      {isAdmin && <div style={{ padding: '0 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: '#3b82f6' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('home_section_my_subjects')}</span>
          {subjects.length > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>{subjects.length} {subjects.length !== 1 ? t('home_subjects_count_other') : t('home_subjects_count_one')}</span>}
        </div>

        {display.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <BookOpen size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{subjects.length === 0 ? t('home_no_subjects_yet') : t('home_no_subjects_match')}</p>
            {subjects.length === 0 && <p style={{ fontSize: 12, marginTop: 4 }}>{t('home_no_subjects_hint')}</p>}
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label || '__all__'} style={{ marginBottom: label ? 32 : 0 }}>
              {label && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: categoryColor(label) }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{items.length} {items.length !== 1 ? t('home_subjects_count_other') : t('home_subjects_count_one')}</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(214px, 214px))', gap: 14 }}>
                {items.map(s => (
                  <SubjectCard key={s.id} subject={s}
                    onClick={() => onSelectSubject(s)}
                    onEdit={e => { e.stopPropagation(); setEditingSubject(s) }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>}

      <HomeFooter />

      {editingSubject && (
        <EditModal
          subject={editingSubject}
          allCategories={allCategories}
          onSave={async fields => { await onUpdateSubject(editingSubject.id, fields) }}
          onClose={() => setEditingSubject(null)}
          onDelete={e => { onDeleteSubject(e, editingSubject); setEditingSubject(null) }}
        />
      )}
    </div>
  )
}
