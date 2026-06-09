'use client'
import { useState, useEffect, useRef } from 'react'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { Ec2SlsInput } from '../rect-engine/rect-sls-calc'
import { RectReport } from './rect-report'
import RectUlsDetails from './uls/rect-uls-details'
import RectStDetails from './st/rect-st-details'
import { RectSlsPanel } from './sls/rect-sls-panel'
import { ShearSectionDiagram } from './st/rect-st-diagram'

export interface ReportMeta {
  project: string
  report: string
  designer: string
  checker: string
  approver: string
  date: string
}

const FIELD_STYLE: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #cbd5e1', borderRadius: 6,
  outline: 'none', background: '#fff', color: '#1e293b',
  boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3, display: 'block',
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label style={LABEL_STYLE}>{label}</label>
      <input style={FIELD_STYLE} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function SectionRow({ color, label, desc, checked, onToggle, detChecked, onDetToggle, detDesc }: {
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

export function RectExportModal({
  inp, res, sls, onClose,
}: {
  inp: Ec2RectInput
  res: Ec2RectResult
  sls: Ec2SlsInput
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [meta, setMeta] = useState<ReportMeta>({
    project: '', report: 'RC Section — Structural Check', designer: '', checker: '', approver: '',
    date: today,
  })
  const [inclUls,      setInclUls]      = useState(true)
  const [inclUlsDet,   setInclUlsDet]   = useState(true)
  const [inclSls,      setInclSls]      = useState(true)
  const [inclSlsDet,   setInclSlsDet]   = useState(true)
  const [inclShear,    setInclShear]    = useState(true)
  const [inclShearDet, setInclShearDet] = useState(true)

  function toggleUls(v: boolean) { setInclUls(v); setInclUlsDet(v) }
  function toggleSls(v: boolean) { setInclSls(v); setInclSlsDet(v) }
  function toggleShear(v: boolean) { setInclShear(v); setInclShearDet(v) }

  const ulsRef      = useRef<HTMLDivElement>(null)
  const ulsDetRef   = useRef<HTMLDivElement>(null)
  const slsRef      = useRef<HTMLDivElement>(null)
  const slsDetRef   = useRef<HTMLDivElement>(null)
  const shearRef    = useRef<HTMLDivElement>(null)
  const shearDetRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof ReportMeta) => (v: string) => setMeta(prev => ({ ...prev, [k]: v }))

  function handlePrint() {
    const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const headerInner = `<span><strong style="color:#1e40af">Civil Base</strong>&nbsp;·&nbsp;Structural Calculation Report&nbsp;·&nbsp;EN 1992-1-1:2004+AC:2008</span><span>${meta.report || 'RC Section'}</span>`
    const footerInner = `<strong style="color:#1e40af">Civil Base</strong><span style="margin:0 auto">© Civil Base · All rights reserved · For professional use only — verify independently</span><span>Generated ${generated}</span>`

    const MM = 96 / 25.4
    const PAGE_H = 297 * MM
    const MARGIN_X = 15
    const HDR_H_MM = 13; const FTR_H_MM = 14
    const HDR_GAP_MM = 2; const FTR_GAP_MM = 6
    const TOP_P1_MM = 10; const TOP_PN_MM = HDR_H_MM + HDR_GAP_MM
    const BOT_MM = FTR_H_MM + FTR_GAP_MM
    const TOP_P1 = TOP_P1_MM * MM; const TOP_PN = TOP_PN_MM * MM
    const BOT    = BOT_MM * MM
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
        .cb-hdr { position: absolute; top: 0; left: ${MARGIN_X}mm; right: ${MARGIN_X}mm; height: ${HDR_H_MM}mm;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #e2e8f0; background: #fff; font-size: 8px; color: #64748b; }
        .cb-ftr { position: absolute; bottom: 0; left: ${MARGIN_X}mm; right: ${MARGIN_X}mm; height: ${FTR_H_MM}mm;
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

    type SectionDef = { heading?: HTMLElement; ref: React.RefObject<HTMLDivElement | null>; isRef: boolean; label?: string }
    const defs: SectionDef[] = []
    if (inclUls)      defs.push({ ref: ulsRef,      isRef: true  })
    if (inclUlsDet)   defs.push({ ref: ulsDetRef,   isRef: false, label: 'ULS — Calculation Details' })
    if (inclSls)      defs.push({ ref: slsRef,       isRef: false, label: 'SLS — Serviceability Check' })
    if (inclSlsDet)   defs.push({ ref: slsDetRef,     isRef: false, label: 'SLS — Calculation Details' })
    if (inclShear)    defs.push({ ref: shearRef,     isRef: false, label: 'Shear & Torsion — EC2 §6.2/§6.3 Results' })
    if (inclShearDet) defs.push({ ref: shearDetRef,  isRef: false, label: 'Shear & Torsion — Calculation Details' })

    const measureWrap = document.createElement('div')
    measureWrap.style.cssText = `position:fixed; top:8px; left:0; width:${FLOW_W}px; opacity:0; pointer-events:none; z-index:-1; overflow:visible;`
    document.body.appendChild(measureWrap)

    type MeasureEntry = { wrap: HTMLElement; isRef: boolean; heading?: HTMLElement }
    const entries: MeasureEntry[] = defs.map(d => {
      const heading = d.label ? makeSectionHeading(d.label) : undefined
      const wrap = document.createElement('div')
      wrap.style.width = `${FLOW_W}px`
      if (d.ref.current) {
        wrap.innerHTML = d.ref.current.innerHTML
        stripMathML(wrap)
      }
      if (d.isRef) {
        const root = wrap.firstElementChild as HTMLElement | null
        if (root) { root.style.padding = '0'; root.style.minHeight = '0' }
      }
      measureWrap.appendChild(wrap)
      return { wrap, isRef: d.isRef, heading }
    })

    const afterPaint = () => new Promise<void>(res => requestAnimationFrame(() => requestAnimationFrame(() => res())))

    afterPaint().then(() => {
      type Item = { el: HTMLElement; h: number; full: boolean }
      type Section = { heading?: HTMLElement; items: Item[] }
      const sections: Section[] = []

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
        sections.push({ heading: entry.heading, items })
      })

      document.body.removeChild(measureWrap)

      const COL_W = (FLOW_W - 20) / 2
      type Page = { fulls: HTMLElement[]; lefts: HTMLElement[]; rights: HTMLElement[]; isFirst: boolean }
      const pages: Page[] = []
      let isVeryFirst = true

      for (const section of sections) {
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

      pages.forEach(p => {
        const page = document.createElement('div')
        page.className = 'cb-page'
        if (!p.isFirst) page.insertAdjacentHTML('beforeend', `<div class="cb-hdr">${headerInner}</div>`)
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Export Calculation Report</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Fill in project details and choose which sections to include</div>
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
              <SectionRow
                color="#1d4ed8" label="ULS" desc="Bending · Axial · N-M curve · section diagram"
                checked={inclUls} onToggle={toggleUls}
                detChecked={inclUlsDet} onDetToggle={setInclUlsDet}
                detDesc="Step-by-step derivation: stresses, strains, forces"
              />
              <SectionRow
                color="#0d9488" label="SLS" desc="Crack width · stress limits · cracked section"
                checked={inclSls} onToggle={toggleSls}
                detChecked={inclSlsDet} onDetToggle={setInclSlsDet}
                detDesc="Cracked section analysis with formulas"
              />
              <SectionRow
                color="#b45309" label="Shear & Torsion" desc="VRd,c · VRd,s · VRd,max · TRd,c · TRd,max"
                checked={inclShear} onToggle={toggleShear}
                detChecked={inclShearDet} onDetToggle={setInclShearDet}
                detDesc="Full EC2 §6.2/§6.3 derivation with formulas"
              />
            </div>
            {!inclUls && !inclUlsDet && !inclSls && !inclSlsDet && !inclShear && !inclShearDet && (
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 6 }}>
                Select at least one section to print.
              </div>
            )}
          </div>
        </div>

        {(() => {
          const noneSelected = !inclUls && !inclUlsDet && !inclSls && !inclSlsDet && !inclShear && !inclShearDet
          return (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
                Cancel
              </button>
              <button onClick={handlePrint} disabled={noneSelected} style={{ fontSize: 12, fontWeight: 700, padding: '7px 20px', borderRadius: 7, cursor: 'pointer', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', border: 'none', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', opacity: noneSelected ? 0.4 : 1 }}>
                Print / Save PDF
              </button>
            </div>
          )
        })()}
      </div>

      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: 794, pointerEvents: 'none' }}>
        <div ref={ulsRef}>
          <RectReport inp={inp} res={res} meta={meta} />
        </div>
        <div ref={ulsDetRef}>
          <RectUlsDetails inp={inp} res={res} />
        </div>
        <div ref={slsRef}>
          <RectSlsPanel inp={inp} uls={res} sls={sls} />
        </div>
        <div ref={slsDetRef}>
          <RectSlsPanel inp={inp} uls={res} sls={sls} detailsOnly />
        </div>
        <div ref={shearRef}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#fafafa', display: 'inline-block' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  Cross-section with stirrups
                </div>
                <ShearSectionDiagram inp={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>EC2 §6.2 — Shear Resistance</div>
                {([
                  ['VEd',                             `${(inp.VEd ?? 0).toFixed(1)} kN`],
                  ['Stirrup Φw / s / legs',           `Φ${inp.stirrup_phi ?? 10} / ${inp.stirrup_s ?? 200} mm / ${inp.stirrup_legs ?? 2}`],
                  ['Strut angle θ',                   `${res.theta_deg.toFixed(1)}°${res.theta_is_override ? ' (Assumed)' : ' (EC2 optimal)'}`],
                  ['z = 0.9d',                        `${(res.z_shear * 1000).toFixed(0)} mm`],
                  ['Asw/s required',                  `${res.Asw_req.toFixed(0)} mm²/m`],
                  ['Asw/s provided',                  `${res.Asw_prov.toFixed(0)} mm²/m — ${res.Asw_prov_ok ? 'OK ✓' : 'FAIL ✗'}`],
                  ['Asw/s min §9.2.2',                `${res.Asw_min.toFixed(0)} mm²/m — ${res.Asw_min_ok ? 'OK ✓' : 'FAIL ✗'}`],
                  ['VRd,c (§6.2.2)',                  `${res.VRd_c.toFixed(2)} kN`],
                  ['VRd,s (§6.2.3)',                  `${res.VRd_s.toFixed(2)} kN`],
                  ['VRd,max (§6.2.3)',                `${res.VRd_max.toFixed(2)} kN`],
                  ['VRd = min(VRd,s, VRd,max)',       `${res.VRd.toFixed(2)} kN`],
                  ['VEd ≤ VRd',                       `${(inp.VEd ?? 0).toFixed(2)} ≤ ${res.VRd.toFixed(2)} kN — ${res.shear_ok ? 'PASS ✓' : 'FAIL ✗'}`],
                ] as [string, string][]).map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9', fontSize: 10.5 }}>
                    <span style={{ color: '#374151' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>EC2 §6.3 — Torsion</div>
                {res.TEd <= 0 ? (
                  <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic' }}>
                    TEd = 0 — no torsion applied. TRd,c = {res.TRd_c.toFixed(2)} kNm / TRd,max = {res.TRd_max.toFixed(2)} kNm
                  </div>
                ) : (([
                  ['TEd',                             `${res.TEd.toFixed(1)} kNm`],
                  ['tef (eff. wall)',                 `${(res.tef * 1000).toFixed(0)} mm`],
                  ['Ak (enclosed area)',              `${(res.Ak * 1e6).toFixed(0)} mm²`],
                  ['uk (perimeter)',                  `${(res.uk * 1000).toFixed(0)} mm`],
                  ['TRd,c (cracking)',                `${res.TRd_c.toFixed(2)} kNm`],
                  ['TRd,max (strut)',                 `${res.TRd_max.toFixed(2)} kNm`],
                  ...(res.TEd > res.TRd_c ? [
                    ['At/s required',                 `${res.At_req_s.toFixed(0)} mm²/m`],
                    ['Asl required',                  `${res.Asl_req.toFixed(0)} mm²`],
                    ['T/Tmax + V/Vmax ≤ 1.0',        `${(res.TEd / res.TRd_max + (inp.VEd ?? 0) / res.VRd_max).toFixed(3)} — ${res.torsion_interaction_ok ? 'PASS ✓' : 'FAIL ✗'}`],
                  ] : [
                    ['TEd ≤ TRd,c',                  'No torsion reinf. needed — OK ✓'],
                  ]),
                ] as [string, string][]).map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #f1f5f9', fontSize: 10.5 }}>
                    <span style={{ color: '#374151' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
                  </div>
                )))}
              </div>
            </div>
          </div>
        </div>
        <div ref={shearDetRef}>
          <RectStDetails inp={inp} res={res} />
        </div>
      </div>
    </div>
  )
}
