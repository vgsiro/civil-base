'use client'
import { useState, useEffect, useRef, RefObject } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportMeta {
  project: string
  report: string
  designer: string
  checker: string
  approver: string
  date: string
}

/** One printable section. Set isRef=true for sections that use a cb-sections two-col grid (like RectReport). */
export interface PrintSection {
  ref: RefObject<HTMLDivElement | null>
  /** Shown as a bold heading above the section in the PDF. Omit for the first report page. */
  label?: string
  /** true → the ref renders a full report page (cb-sections two-col grid); false → treat as a detail block */
  isRef?: boolean
}

/** A selectable group of sections shown in the modal's checkbox list. */
export interface SectionGroup {
  color: string
  label: string
  desc: string
  detDesc: string
  /** refs[0] = results section, refs[1] = details section */
  refs: [RefObject<HTMLDivElement | null>, RefObject<HTMLDivElement | null>]
  /** true → refs[0] is a full report page (isRef mode) */
  firstIsRef?: boolean
  defaultOn?: boolean
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const FIELD_STYLE: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #cbd5e1', borderRadius: 6,
  outline: 'none', background: '#fff', color: '#1e293b',
  boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3, display: 'block',
}

// ─── Internal components ─────────────────────────────────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <input style={FIELD_STYLE} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

export function SectionRow({ color, label, desc, checked, onToggle, detChecked, onDetToggle, detDesc }: {
  color: string; label: string; desc: string
  checked: boolean; onToggle: (v: boolean) => void
  detChecked: boolean; onDetToggle: (v: boolean) => void
  detDesc: string
}) {
  const active = checked || detChecked
  return (
    <div style={{
      border: `1.5px solid ${active ? color + '50' : '#e2e8f0'}`,
      borderRadius: 8, background: active ? color + '06' : '#f8fafc',
      padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'all 0.15s',
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={e => onToggle(e.target.checked)}
          style={{ width: 14, height: 14, accentColor: color, cursor: 'pointer', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: checked ? color : '#475569' }}>{label}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>{desc}</span>
        </div>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingLeft: 24 }}>
        <input type="checkbox" checked={detChecked} onChange={e => onDetToggle(e.target.checked)}
          style={{ width: 12, height: 12, accentColor: color, cursor: 'pointer', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: detChecked ? color : '#94a3b8', fontWeight: detChecked ? 600 : 400 }}>
          Include details — {detDesc}
        </span>
      </label>
    </div>
  )
}

// ─── Core pagination + print engine ──────────────────────────────────────────

export function runPrint(sections: PrintSection[], meta: ReportMeta) {
  const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const headerInner = `<span><strong style="color:#1e40af">CivilAxis</strong>&nbsp;·&nbsp;Structural Calculation Report</span><span>${meta.report || 'Report'}</span>`
  const footerInner = `<strong style="color:#1e40af">CivilAxis</strong><span style="margin:0 auto">© CivilAxis · All rights reserved · For professional use only — verify independently</span><span>Generated ${generated}</span>`

  const MM = 96 / 25.4
  const PAGE_H = 297 * MM
  const MARGIN_X = 15; const MARGIN_Y = 10
  const HDR_H_MM = 8; const FTR_H_MM = 8
  const HDR_GAP_MM = 4; const FTR_GAP_MM = 4; const P1_GAP_MM = 6
  const P1_HDR_H_MM = 32   // project info block on first page (blue banner ~10mm + 2-row meta grid ~18mm + gap ~4mm)
  const TOP_P1_MM = MARGIN_Y + P1_HDR_H_MM + P1_GAP_MM
  const TOP_PN_MM = MARGIN_Y + HDR_H_MM + HDR_GAP_MM
  const BOT_MM = MARGIN_Y + FTR_H_MM + FTR_GAP_MM
  const TOP_P1 = TOP_P1_MM * MM; const TOP_PN = TOP_PN_MM * MM
  const BOT = BOT_MM * MM
  const USABLE_P1 = PAGE_H - TOP_P1 - BOT
  const USABLE_PN = PAGE_H - TOP_PN - BOT
  const FLOW_W = 210 * MM - 2 * MARGIN_X * MM

  const style = document.createElement('style')
  style.id = '__cb_print_style__'
  style.textContent = `
    @media print {
      @page { size: A4; margin: 0; }
      body > *:not(#__cb_report_root__) { display: none !important; }
      #__cb_report_root__ { display: block !important; }
      .cb-page { position: relative; width: 210mm; height: 297mm; overflow: hidden;
        page-break-after: always; background: #fff;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cb-page:last-child { page-break-after: auto; }
      .cb-hdr { position: absolute; top: ${MARGIN_Y}mm; left: ${MARGIN_X}mm; right: ${MARGIN_X}mm; height: ${HDR_H_MM}mm;
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid #e2e8f0; background: #fff; font-size: 8px; color: #64748b; }
      .cb-hdr-p1 { top: ${MARGIN_Y}mm; height: ${P1_HDR_H_MM}mm; display: block; border-bottom: none; }
      .cb-ftr { position: absolute; bottom: ${MARGIN_Y}mm; left: ${MARGIN_X}mm; right: ${MARGIN_X}mm; height: ${FTR_H_MM}mm;
        display: flex; align-items: center; justify-content: space-between;
        border-top: 1.5px solid #e2e8f0; background: #fff; font-size: 8px; color: #64748b; }
      .cb-flow { position: absolute; left: ${MARGIN_X}mm; right: ${MARGIN_X}mm;
        font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; }
      .cb-section { break-inside: avoid; }
      .screen-only { display: none !important; }
    }
  `
  document.head.appendChild(style)

  function stripMathML(root: HTMLElement) {
    root.querySelectorAll('.katex-mathml').forEach(el => el.remove())
  }

  function makeSectionHeading(text: string) {
    const d = document.createElement('div')
    d.style.cssText = `font-size:13px;font-weight:800;color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:6px;margin:0 0 8px;`
    d.textContent = text
    return d
  }

  type MeasureEntry = { wrap: HTMLElement; isRef: boolean; heading?: HTMLElement }

  const measureWrap = document.createElement('div')
  measureWrap.style.cssText = `position:fixed; top:8px; left:0; width:${FLOW_W}px; opacity:0; pointer-events:none; z-index:-1; overflow:visible;`
  document.body.appendChild(measureWrap)

  const entries: MeasureEntry[] = sections.map(s => {
    const heading = s.label ? makeSectionHeading(s.label) : undefined
    const wrap = document.createElement('div')
    wrap.style.width = `${FLOW_W}px`
    if (s.ref.current) {
      wrap.innerHTML = s.ref.current.innerHTML
      stripMathML(wrap)
    }
    if (s.isRef) {
      const root = wrap.firstElementChild as HTMLElement | null
      if (root) { root.style.padding = '0'; root.style.minHeight = '0' }
    }
    measureWrap.appendChild(wrap)
    return { wrap, isRef: !!s.isRef, heading }
  })

  const afterPaint = () => new Promise<void>(res => requestAnimationFrame(() => requestAnimationFrame(() => res())))

  afterPaint().then(() => {
    type Item = { el: HTMLElement; h: number; full: boolean }
    type Section = { heading?: HTMLElement; items: Item[] }
    const pageSections: Section[] = []

    entries.forEach(entry => {
      const root = entry.wrap.firstElementChild as HTMLElement | null
      if (!root) return
      const items: Item[] = []

      Array.from(root.children).forEach(child => {
        const el = child as HTMLElement
        if (el.classList.contains('screen-only')) return
        const h = el.getBoundingClientRect().height
        if (h < 4) return
        if (entry.isRef && el.classList.contains('cb-sections')) {
          Array.from(el.children).forEach(sec => {
            const s = sec as HTMLElement
            const sh = s.getBoundingClientRect().height
            if (sh >= 4) items.push({ el: s, h: sh + 8, full: false })
          })
        } else {
          items.push({ el, h: h + 10, full: true })
        }
      })

      if (items.length === 0 && !entry.heading) return
      pageSections.push({ heading: entry.heading, items })
    })

    document.body.removeChild(measureWrap)

    const COL_W = (FLOW_W - 20) / 2
    type Page = { fulls: HTMLElement[]; lefts: HTMLElement[]; rights: HTMLElement[]; isFirst: boolean }
    const pages: Page[] = []
    let isVeryFirst = true

    for (const section of pageSections) {
      const allItems = section.items
      let idx = 0
      let firstPageOfSection = true

      do {
        const isFirst = isVeryFirst
        const budget = isFirst ? USABLE_P1 : USABLE_PN
        let fullH = 0, leftH = 0, rightH = 0
        const fulls: HTMLElement[] = [], lefts: HTMLElement[] = [], rights: HTMLElement[] = []

        if (firstPageOfSection && section.heading) {
          const hh = section.heading.getBoundingClientRect().height + 14
          fullH += hh
          fulls.push(section.heading)
        }

        while (idx < allItems.length) {
          const it = allItems[idx]
          const hasContent = fulls.length > 0 || lefts.length > 0 || rights.length > 0
          if (it.full) {
            if (lefts.length > 0 || rights.length > 0) break
            if (hasContent && fullH + it.h > budget) break
            fulls.push(it.el); fullH += it.h; idx++
          } else {
            const toLeft = leftH <= rightH
            const colH = fullH + (toLeft ? leftH : rightH)
            if (hasContent && colH + it.h > budget) break
            if (toLeft) { lefts.push(it.el); leftH += it.h }
            else        { rights.push(it.el); rightH += it.h }
            idx++
          }
        }

        if (fulls.length === 0 && lefts.length === 0 && rights.length === 0 && idx < allItems.length) {
          fulls.push(allItems[idx++].el)
        }

        const hasContent = fulls.length > 1 || lefts.length > 0 || rights.length > 0 ||
          (fulls.length === 1 && fulls[0] !== section.heading)
        if (hasContent) {
          pages.push({ fulls, lefts, rights, isFirst })
          isVeryFirst = false
        }
        firstPageOfSection = false
      } while (idx < allItems.length)
    }

    const reportRoot = document.createElement('div')
    reportRoot.id = '__cb_report_root__'
    reportRoot.style.cssText = 'display:none; font-family:"Segoe UI",Arial,sans-serif; font-size:11px; color:#1e293b;'

    const logoSvg = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="6" fill="#1d4ed8"/><rect x="6" y="22" width="20" height="3" rx="1.5" fill="white" opacity="0.9"/><rect x="7" y="7" width="3" height="15" rx="1.5" fill="white"/><rect x="22" y="7" width="3" height="15" rx="1.5" fill="white"/><rect x="10" y="7" width="12" height="3" rx="1.5" fill="white" opacity="0.7"/></svg>`
    const metaFields: [string, string][] = [
      ['Project',          meta.project   || '—'],
      ['Report / Subject', meta.report    || '—'],
      ['Designer',         meta.designer  || '—'],
      ['Checker',          meta.checker   || '—'],
      ['Approver',         meta.approver  || '—'],
      ['Date',             meta.date      || '—'],
    ]
    const metaCells = metaFields.map(([label, value], i) => `
      <div style="padding:6px 10px;background:${i % 2 === 0 ? '#f0f9ff' : '#fff'};${i % 3 !== 2 ? 'border-right:1px solid #e0f2fe;' : ''}${i < 3 ? 'border-bottom:1px solid #e0f2fe;' : ''}">
        <div style="font-size:8px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;font-weight:600">${label}</div>
        <div style="font-size:11px;color:#1e293b;font-weight:600;margin-top:1px;min-height:14px">${value}</div>
      </div>`).join('')
    const p1HeaderInner = `
      <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);border-radius:6px 6px 0 0;padding:10px 16px;display:flex;align-items:center;gap:10px;">
        ${logoSvg}
        <div>
          <div style="color:#fff;font-weight:800;font-size:15px;letter-spacing:-.02em">CivilAxis</div>
          <div style="color:#bfdbfe;font-size:9px;letter-spacing:.06em;text-transform:uppercase">Structural Calculation Report</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #bfdbfe;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
        ${metaCells}
      </div>`

    pages.forEach(p => {
      const page = document.createElement('div')
      page.className = 'cb-page'
      if (p.isFirst) {
        page.insertAdjacentHTML('beforeend', `<div class="cb-hdr cb-hdr-p1">${p1HeaderInner}</div>`)
      } else {
        page.insertAdjacentHTML('beforeend', `<div class="cb-hdr">${headerInner}</div>`)
      }
      const flow = document.createElement('div')
      flow.className = 'cb-flow'
      flow.style.top = `${p.isFirst ? TOP_P1_MM : TOP_PN_MM}mm`
      p.fulls.forEach(el => flow.appendChild(el.cloneNode(true)))
      if (p.lefts.length > 0 || p.rights.length > 0) {
        const cols = document.createElement('div')
        cols.style.cssText = `display:flex; gap:20px; margin-top:${p.fulls.length > 0 ? 10 : 0}px;`
        const left = document.createElement('div'); left.style.width = `${COL_W}px`
        const right = document.createElement('div'); right.style.width = `${COL_W}px`
        p.lefts.forEach(el => left.appendChild(el.cloneNode(true)))
        p.rights.forEach(el => right.appendChild(el.cloneNode(true)))
        cols.appendChild(left); cols.appendChild(right)
        flow.appendChild(cols)
      }
      page.appendChild(flow)
      page.insertAdjacentHTML('beforeend', `<div class="cb-ftr">${footerInner}</div>`)
      reportRoot.appendChild(page)
    })

    document.body.appendChild(reportRoot)
    requestAnimationFrame(() => {
      reportRoot.style.display = 'block'
      window.print()
      reportRoot.style.display = 'none'
      document.body.removeChild(reportRoot)
      document.head.removeChild(style)
    })
  })
}

// ─── ExportModal ─────────────────────────────────────────────────────────────

export function ExportModal({
  title = 'Export Calculation Report',
  subtitle = 'Fill in project details and choose which sections to include',
  defaultReport = 'Structural Calculation',
  groups,
  children,
  onClose,
}: {
  title?: string
  subtitle?: string
  defaultReport?: string
  groups: SectionGroup[]
  /** Render the hidden ref divs. Receives current meta so report headers stay in sync. */
  children: (meta: ReportMeta) => React.ReactNode
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [meta, setMeta] = useState<ReportMeta>({
    project: '', report: defaultReport, designer: '', checker: '', approver: '', date: today,
  })

  const [checked, setChecked] = useState<boolean[]>(() => groups.map(g => g.defaultOn ?? true))
  const [detChecked, setDetChecked] = useState<boolean[]>(() => groups.map(g => g.defaultOn ?? true))

  function toggleGroup(i: number, v: boolean) {
    setChecked(prev => prev.map((c, j) => j === i ? v : c))
    setDetChecked(prev => prev.map((c, j) => j === i ? v : c))
  }

  const set = (k: keyof ReportMeta) => (v: string) => setMeta(prev => ({ ...prev, [k]: v }))

  const noneSelected = checked.every(c => !c) && detChecked.every(c => !c)

  function handlePrint() {
    const sections: PrintSection[] = []
    groups.forEach((g, i) => {
      if (checked[i])    sections.push({ ref: g.refs[0], isRef: g.firstIsRef })
      if (detChecked[i]) sections.push({ ref: g.refs[1], label: `${g.label} — Calculation Details` })
    })
    runPrint(sections, meta)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, width: 500,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', maxHeight: '92vh',
      }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <Field label="Project" value={meta.project} onChange={set('project')} />
          <Field label="Report / Subject" value={meta.report} onChange={set('report')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Designer" value={meta.designer} onChange={set('designer')} />
            <Field label="Checker" value={meta.checker} onChange={set('checker')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Approver" value={meta.approver} onChange={set('approver')} />
            <Field label="Date" value={meta.date} onChange={set('date')} />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Sections to include
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groups.map((g, i) => (
                <SectionRow
                  key={i}
                  color={g.color} label={g.label} desc={g.desc} detDesc={g.detDesc}
                  checked={checked[i]} onToggle={v => toggleGroup(i, v)}
                  detChecked={detChecked[i]} onDetToggle={v => setDetChecked(prev => prev.map((c, j) => j === i ? v : c))}
                />
              ))}
            </div>
            {noneSelected && (
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 6 }}>
                Select at least one section to print.
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
            Cancel
          </button>
          <button onClick={handlePrint} disabled={noneSelected} style={{ fontSize: 12, fontWeight: 700, padding: '7px 20px', borderRadius: 7, cursor: 'pointer', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', border: 'none', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', opacity: noneSelected ? 0.4 : 1 }}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Hidden content for printing — provided by the tool */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: 794, pointerEvents: 'none' }}>
        {children(meta)}
      </div>
    </div>
  )
}
