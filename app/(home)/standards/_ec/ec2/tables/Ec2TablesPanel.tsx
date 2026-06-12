'use client'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import PageDiscussion from '../../../../../_components/home/discussion/PageDiscussion'
import { ConcretePropertiesTable, AnchorageLapTable, ReinforcementQuantityTable, CONCRETE_GRADES, ANCHORAGE_DATA, LAP_DATA } from './Ec2Tables'
import { TablesList, MobilePanelPicker, TableEntry } from '../../_shared/TablesList'
import { useAdminEdit } from '../../_shared/admin/useAdminEdit'
import { EditableText } from '../../_shared/admin/EditableText'
import { AdminEditToggle, AdminEditBar } from '../../_shared/admin/AdminSaveBar'
import { getEcContent } from '@/lib/ec-content'


interface RawTable { id: string; number: string; name: string }

const EMPTY_TABLES: Record<string, RawTable[]> = {
  'en1992-1-1': [], 'en1992-1-2': [], 'en1992-2': [], 'en1992-3': [],
}

const TABLE_COMPONENTS: Record<string, () => React.ReactElement> = {
  concrete_props: ConcretePropertiesTable,
  anchorage:      AnchorageLapTable,
  rebar_qty:      ReinforcementQuantityTable,
}

const DEFAULT_PART  = 'en1992-1-1'
const DEFAULT_TABLE = 'concrete_props'
const ACCENT        = '#10b981'
const ACCENT_DARK   = '#065f46'
const ACCENT_BG     = '#f0fdf4'
const PANEL_MIN     = 40
const PANEL_MAX     = 320

function ResizablePanel({ defaultWidth, minWidth = PANEL_MIN, maxWidth = PANEL_MAX, accentHover = '#6ee7b7', children }: {
  defaultWidth: number; minWidth?: number; maxWidth?: number
  accentHover?: string; children: (collapsed: boolean) => React.ReactNode
}) {
  const [width, setWidth]         = useState(defaultWidth)
  const [collapsed, setCollapsed] = useState(false)
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true; startX.current = e.clientX; startW.current = collapsed ? 0 : width
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const next = startW.current + ev.clientX - startX.current
      if (next > minWidth) { setCollapsed(false); setWidth(Math.min(maxWidth, next)) } else setCollapsed(true)
    }
    const onUp = () => {
      dragging.current = false; document.body.style.cursor = document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }, [collapsed, minWidth, maxWidth, width])

  return (
    <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      <div style={{ width: collapsed ? minWidth : width, background: '#fff', overflowY: collapsed ? 'hidden' : 'auto', overflowX: 'hidden', transition: collapsed ? 'width 0.18s' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {children(collapsed)}
      </div>
      <div onMouseDown={onMouseDown}
        style={{ width: 4, flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', position: 'relative' }}
        onMouseEnter={e => { if (!collapsed) e.currentTarget.style.background = accentHover }}
        onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0' }}>
        <button onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 24, background: '#cbd5e1', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1e293b', padding: 0, zIndex: 1 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </div>
  )
}

export default function Ec2TablesPanel({ section, pageKey, onNavChange, editMode = false, onEditDone }: {
  section: string; pageKey?: string; onNavChange: (key: string, val: string) => void
  editMode?: boolean; onEditDone?: () => void
}) {
  const { t } = useTranslation()
  const { dirty, saving, stage, save, discard } = useAdminEdit('ec2', editMode, onEditDone)

  const DEFAULT_TABLES = useMemo<Record<string, RawTable[]>>(() => ({
    'en1992-1-1': [
      { id: 'concrete_props', number: 'Table 3.1', name: t('std_ec2_tbl_t3_1_name') },
      { id: 'anchorage',      number: 'Table 8.2', name: t('std_ec2_tbl_t8_2_name') },
      { id: 'rebar_qty',      number: 'Table A',   name: t('std_ec2_tbl_ta_name')   },
    ],
    'en1992-1-2': [], 'en1992-2': [], 'en1992-3': [],
  }), [t])

  const defaultParts = useMemo(() => [
    { id: 'en1992-1-1', code: 'EN 1992-1-1', label: t('std_tbl_ec2_1_1') },
    { id: 'en1992-1-2', code: 'EN 1992-1-2', label: t('std_tbl_ec2_1_2') },
    { id: 'en1992-2',   code: 'EN 1992-2',   label: t('std_tbl_ec2_2')   },
    { id: 'en1992-3',   code: 'EN 1992-3',   label: t('std_tbl_ec2_3')   },
  ], [t])

  const [parts, setParts]               = useState(defaultParts)
  const [dbParts, setDbParts]           = useState<typeof defaultParts | null>(null)
  const [tablesByPart, setTablesByPart] = useState<Record<string, RawTable[]>>(EMPTY_TABLES)
  const [concreteRows, setConcreteRows] = useState(CONCRETE_GRADES)
  const [anchorRows, setAnchorRows]     = useState(ANCHORAGE_DATA)
  const [lapRows, setLapRows]           = useState(LAP_DATA)

  useEffect(() => { if (!dbParts) setParts(defaultParts) }, [defaultParts]) // eslint-disable-line react-hooks/exhaustive-deps
  const [dbTables, setDbTables] = useState<Record<string, RawTable[]> | null>(null)
  useEffect(() => { if (!dbTables) setTablesByPart(DEFAULT_TABLES) }, [DEFAULT_TABLES]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getEcContent<typeof defaultParts>('ec2', 'tables_parts', 'parts').then(saved => { if (saved) { setDbParts(saved); setParts(saved) } })
    getEcContent<Record<string, RawTable[]>>('ec2', 'tables_parts', 'tables_by_part').then(saved => { if (saved) { setDbTables(saved); setTablesByPart(saved) } })
    getEcContent<typeof CONCRETE_GRADES>('ec2', 'table_rows', 'concrete_props').then(saved => { if (saved) setConcreteRows(saved) })
    getEcContent<typeof ANCHORAGE_DATA>('ec2', 'table_rows', 'anchorage').then(saved => { if (saved) setAnchorRows(saved) })
    getEcContent<typeof LAP_DATA>('ec2', 'table_rows', 'lap').then(saved => { if (saved) setLapRows(saved) })
  }, [])

  const activePart = parts.find(p => (tablesByPart[p.id] ?? []).some(t => t.id === section))?.id ?? DEFAULT_PART
  const [selectedPart, setSelectedPart] = useState(activePart)

  const tablesForPart = tablesByPart[selectedPart] ?? []
  const allIds        = tablesForPart.map(t => t.id)
  const activeTable   = allIds.includes(section) ? section : (allIds[0] ?? DEFAULT_TABLE)

  function selectPart(partId: string) {
    setSelectedPart(partId)
    const first = tablesByPart[partId]?.[0]?.id
    if (first) onNavChange('section', first)
  }

  function selectTable(tableId: string, partId?: string) {
    if (partId) setSelectedPart(partId)
    onNavChange('section', tableId)
  }

  function commitPartLabel(partId: string, field: 'code' | 'label', value: string) {
    const next = parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
    setParts(next)
    stage('tables_parts', 'parts', next)
  }

  function commitConcreteRow(idx: number, field: string, value: string) {
    const next = concreteRows.map((r, i) => i === idx ? { ...r, [field]: isNaN(Number(value)) ? value : Number(value) } : r)
    setConcreteRows(next as typeof CONCRETE_GRADES)
    stage('table_rows', 'concrete_props', next)
  }

  function commitAnchorRow(idx: number, field: string, value: string) {
    const next = anchorRows.map((r, i) => i === idx ? { ...r, [field]: isNaN(Number(value)) ? value : Number(value) } : r)
    setAnchorRows(next as typeof ANCHORAGE_DATA)
    stage('table_rows', 'anchorage', next)
  }

  function commitLapRow(idx: number, field: string, value: string) {
    const next = lapRows.map((r, i) => i === idx ? { ...r, [field]: isNaN(Number(value)) ? value : Number(value) } : r)
    setLapRows(next as typeof LAP_DATA)
    stage('table_rows', 'lap', next)
  }

  function commitTableField(partId: string, tableId: string, field: 'number' | 'name', value: string) {
    const next = {
      ...tablesByPart,
      [partId]: (tablesByPart[partId] ?? []).map(t => t.id === tableId ? { ...t, [field]: value } : t),
    }
    setTablesByPart(next)
    stage('tables_parts', 'tables_by_part', next)
  }

  const ALL_TABLES: TableEntry[] = parts.flatMap(p =>
    (tablesByPart[p.id] ?? []).map(t => ({ ...t, partId: p.id, partCode: p.code }))
  )

  const visibleTables: TableEntry[] = tablesForPart.map(t => ({
    ...t, partId: selectedPart, partCode: parts.find(p => p.id === selectedPart)?.code ?? ''
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {editMode && (
        <AdminEditBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
      )}

      <MobilePanelPicker
        parts={parts} selectedPartId={selectedPart} tablesForPart={tablesForPart}
        allTables={ALL_TABLES} activeId={activeTable} accentColor={ACCENT}
        onSelectPart={selectPart} onSelectTable={selectTable}
      />

      <div className="ec-tables-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* Panel 1: EN 1992 parts */}
      <ResizablePanel defaultWidth={170} maxWidth={280} accentHover="#6ee7b7">
        {collapsed => collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {parts.map(p => {
                const empty = (tablesByPart[p.id] ?? []).length === 0
                return (
                  <button key={p.id} onClick={() => !empty && selectPart(p.id)} title={p.code}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: empty ? 'not-allowed' : 'pointer', fontSize: 9, fontWeight: 700, opacity: empty ? 0.35 : 1, background: selectedPart === p.id ? ACCENT_BG : 'transparent', color: selectedPart === p.id ? ACCENT_DARK : '#64748b' }}>
                    {p.code.replace('EN 1992-', '')}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>EN 1992 {t('std_tbl_parts_label')}</div>
              {parts.map(p => {
                const empty = (tablesByPart[p.id] ?? []).length === 0
                return (
                  <button key={p.id} onClick={() => !empty && selectPart(p.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '9px 12px', opacity: empty ? 0.35 : 1, background: selectedPart === p.id ? ACCENT_BG : 'transparent', border: 'none', borderLeft: `3px solid ${selectedPart === p.id ? ACCENT : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: empty ? 'not-allowed' : 'pointer', textAlign: 'left', flexShrink: 0 }}
                    onMouseEnter={e => { if (selectedPart !== p.id && !empty) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (selectedPart !== p.id) e.currentTarget.style.background = 'transparent' }}>
                    <EditableText
                      value={p.code}
                      editMode={editMode}
                      onCommit={v => commitPartLabel(p.id, 'code', v)}
                      style={{ fontSize: 12, fontWeight: 700, color: selectedPart === p.id ? ACCENT_DARK : '#1e293b' }}
                    />
                    <EditableText
                      value={p.label}
                      editMode={editMode}
                      onCommit={v => commitPartLabel(p.id, 'label', v)}
                      style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}
                    />
                  </button>
                )
              })}
            </>
          )
        }
      </ResizablePanel>

      {/* Panel 2: Tables list with editable names */}
      <ResizablePanel defaultWidth={200} maxWidth={300} accentHover="#6ee7b7">
        {collapsed => (
          <TablesList
            allTables={ALL_TABLES} visibleTables={visibleTables}
            activeId={activeTable} collapsed={collapsed}
            accentColor={ACCENT} accentBg={ACCENT_BG} accentDark={ACCENT_DARK}
            onSelect={selectTable}
            editMode={editMode}
            onCommitTableField={(tableId, field, value) => commitTableField(selectedPart, tableId, field, value)}
          />
        )}
      </ResizablePanel>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        {activeTable === 'concrete_props' && <ConcretePropertiesTable editMode={editMode} rows={concreteRows} onRowChange={(i, f, v) => commitConcreteRow(i, f as string, v)} />}
        {activeTable === 'anchorage'      && <AnchorageLapTable editMode={editMode} rows={anchorRows} lapRows={lapRows} onRowChange={(i, f, v) => commitAnchorRow(i, f as string, v)} onLapRowChange={(i, f, v) => commitLapRow(i, f as string, v)} />}
        {activeTable === 'rebar_qty'      && <ReinforcementQuantityTable />}
        {tablesForPart.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{t('std_tbl_no_tables')}</div>
            <div>{t('std_tbl_no_tables_desc')}</div>
          </div>
        )}
        {pageKey && <PageDiscussion pageKey={pageKey} />}
      </div>

      </div>{/* end flex panels row */}
    </div>
  )
}
