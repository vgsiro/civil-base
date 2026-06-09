'use client'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { RebarRow } from '../rect-engine/rect-types'
import { Ec2SlsInput } from '../rect-engine/rect-sls-calc'
import { CONCRETE_GRADES } from '../../../tables/Ec2Tables'
import { INPUT_STYLE, LABEL_STYLE, SELECT_STYLE } from '../../../../../_lib/ui-styles'
import { Field, EcmInput, Box } from '../../../../_shared/ui-atoms'

// ── Checkbox row ──────────────────────────────────────────────────────────────
function CbRow({ checked, onChange, children, indent }: {
  checked: boolean; onChange: (v: boolean) => void
  children: React.ReactNode; indent?: boolean
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 7, cursor: 'pointer', paddingLeft: indent ? 16 : 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 13, height: 13, marginTop: 1, accentColor: '#10b981', cursor: 'pointer', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4 }}>{children}</span>
    </label>
  )
}

// ── Concrete grade dropdown + fck field ──────────────────────────────────────
function ConcreteGradeField({ fck, concreteName, onFck, onName }: {
  fck: number; concreteName: string
  onFck: (v: number) => void; onName: (v: string) => void
}) {
  const matched  = CONCRETE_GRADES.find(g => g.fck === fck)
  const isCustom = !matched || concreteName !== matched.grade
  const selectVal = matched && !isCustom ? String(fck) : 'custom'

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'custom') return
    const g = CONCRETE_GRADES.find(gr => String(gr.fck) === val)
    if (!g) return
    onFck(g.fck)
    onName(g.grade)
  }

  const handleFckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (!isFinite(v)) return
    onFck(v)
    const newMatched = CONCRETE_GRADES.find(g => g.fck === v)
    if (newMatched && concreteName === matched?.grade) onName(newMatched.grade)
    else if (newMatched && concreteName === newMatched.grade) { /* keep */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>
        <span style={{ ...LABEL_STYLE, marginBottom: 3, display: 'block' }}>Concrete grade</span>
        <select value={selectVal} onChange={handleSelect}
          style={{ ...SELECT_STYLE, padding: '5px 8px', fontSize: 12, width: '100%' }}>
          {CONCRETE_GRADES.map(g => (
            <option key={g.fck} value={String(g.fck)}>
              {g.grade} — fck = {g.fck} MPa
            </option>
          ))}
          {isCustom && (
            <option value="custom">Custom — fck = {fck} MPa</option>
          )}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...LABEL_STYLE, marginBottom: 0 }}>
            Grade name
            {isCustom && <span style={{ color: '#f59e0b', marginLeft: 4, fontSize: 9, fontWeight: 700 }}>CUSTOM</span>}
          </span>
          <input type="text" value={concreteName}
            onChange={e => onName(e.target.value)}
            style={{ ...INPUT_STYLE, padding: '5px 8px', fontSize: 12 }}
            placeholder="e.g. C30/37" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...LABEL_STYLE, marginBottom: 0 }}>
            f<sub>ck</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>[MPa]</span>
          </span>
          <input type="number" value={fck} min={12} max={90} step={1}
            onChange={handleFckChange}
            style={{ ...INPUT_STYLE, padding: '5px 8px', fontSize: 12 }} />
        </label>
      </div>
      {matched && (
        <div style={{ fontSize: 10, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '4px 8px', display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <span>f<sub>cm</sub> = {matched.fcm} MPa</span>
          <span>f<sub>ctm</sub> = {matched.fctm.toFixed(2)} MPa</span>
          <span>E<sub>cm</sub> = {matched.Ecm.toLocaleString()} MPa</span>
          <span>f<sub>cd</sub> = {matched.fcd_100.toFixed(2)} MPa</span>
        </div>
      )}
    </div>
  )
}

// ── Rebar row field ───────────────────────────────────────────────────────────
function ReinfField({ label, nbars, phi, onNbars, onPhi, onAdd, onRemove }: {
  label: string; nbars: number; phi: number
  onNbars: (v: number) => void; onPhi: (v: number) => void
  onAdd: () => void; onRemove: () => void
}) {
  const btnBase: React.CSSProperties = {
    width: 24, height: 24, borderRadius: 5, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', lineHeight: 1, padding: 0, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', flex: 1 }}>{label}</span>
        <button style={{ ...btnBase, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
          onClick={onRemove} title="Remove 1 bar">−</button>
        <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{nbars}</span>
        <button style={{ ...btnBase, background: '#ecfdf5', color: '#047857', border: '1px solid #d1fae5' }}
          onClick={onAdd} title="Add 1 bar">+</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="No. bars" value={nbars} onChange={v => onNbars(Math.max(0, Math.round(v)))} min={0} max={30} step={1}
          tip="Number of side bars per side (L3). Placed symmetrically on left and right faces." />
        <Field label="Dia. Φ" value={phi} onChange={onPhi} unit="mm" min={8} max={40} step={2}
          tip={<>Side bar diameter Φ [mm]. Anchored between outermost top and bottom bar centres.</>} />
      </div>
    </div>
  )
}

// ── Main input panel ──────────────────────────────────────────────────────────
export interface RectInputPanelProps {
  inp: Ec2RectInput
  res: Ec2RectResult
  hasSideBars: boolean
  set: <K extends keyof Ec2RectInput>(k: K, v: Ec2RectInput[K]) => void
  setInp: React.Dispatch<React.SetStateAction<Ec2RectInput>>
  toggleSideBars: (checked: boolean) => void
  setRow1: (i: number, patch: Partial<RebarRow>) => void
  addRow1: () => void
  removeRow1: (i: number) => void
  setRow2: (i: number, patch: Partial<RebarRow>) => void
  addRow2: () => void
  removeRow2: (i: number) => void
  addSide: () => void
  removeSide: () => void
  activeTab: 'uls' | 'sls' | 'shear-torsion'
  sls: Ec2SlsInput
  setSls: (patch: Partial<Ec2SlsInput>) => void
}

export function RectInputPanel({
  inp, res, hasSideBars,
  set, setInp, toggleSideBars,
  setRow1, addRow1, removeRow1,
  setRow2, addRow2, removeRow2,
  addSide, removeSide,
  activeTab, sls, setSls,
}: RectInputPanelProps) {
  const l0Default = 10
  const showUls   = activeTab === 'uls'
  const showSls   = activeTab === 'sls'
  const showShear = activeTab === 'shear-torsion'

  return (
    <div style={{ width: 300, flexShrink: 0, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Input Parameters</div>

      <Box title="GEOMETRY">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Height h" value={Math.round(inp.h * 1000)} onChange={v => set('h', v / 1000)} unit="mm" min={100} max={3000} step={50}
            tip="Total section height h [mm]" />
          <Field label="Width b"  value={Math.round(inp.b * 1000)} onChange={v => set('b', v / 1000)} unit="mm" min={100} max={2000} step={50}
            tip="Total section width b [mm]" />
        </div>
      </Box>

      <Box title="MATERIALS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ConcreteGradeField
            fck={inp.fck} concreteName={inp.concreteName}
            onFck={v => set('fck', v)}
            onName={v => set('concreteName', v)}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
              <span>E<sub>cm</sub> <span style={{ color: '#94a3b8' }}>(EC2)</span> = <strong>{Math.round(res.EcmCode).toLocaleString()} MPa</strong></span>
              {inp.ecmOverride != null && (
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>→ using {Math.round(inp.ecmOverride).toLocaleString()} MPa</span>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={inp.ecmOverride != null}
                onChange={e => {
                  if (!e.target.checked) {
                    setInp(prev => { const { ecmOverride: _, ...rest } = prev; return rest as Ec2RectInput })
                  } else {
                    setInp(prev => ({ ...prev, ecmOverride: Math.round(res.EcmCode) }))
                  }
                }}
                style={{ width: 13, height: 13, accentColor: '#10b981', cursor: 'pointer' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>Override E<sub>cm</sub></span>
            </label>
            {inp.ecmOverride != null && (
              <EcmInput value={inp.ecmOverride} onCommit={v => set('ecmOverride', v)} />
            )}
          </div>
          <Field labelNode={<>f<sub>yk</sub></>} value={inp.fyk} onChange={v => set('fyk', v)} unit="MPa" min={400} max={600} step={50}
            tip={<>Characteristic yield strength of reinforcement f<sub>yk</sub> [MPa]. EC2 §3.2</>} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <Field labelNode={<>α<sub>cc</sub></>} value={inp.acc} onChange={v => set('acc', v)} min={0.8} max={1} step={0.05}
              tip={<>Long-term compressive strength coefficient α<sub>cc</sub>. EC2 §3.1.6 — typically 0.85–1.0 per national annex</>} />
            <Field labelNode={<>γ<sub>c</sub></>}  value={inp.gc}  onChange={v => set('gc', v)}  min={1} max={2}   step={0.05}
              tip={<>Partial safety factor for concrete γ<sub>c</sub>. EC2 §2.4.2.4 — persistent/transient: 1.5, accidental: 1.2</>} />
            <Field labelNode={<>γ<sub>s</sub></>}  value={inp.gs}  onChange={v => set('gs', v)}  min={1} max={1.5} step={0.05}
              tip={<>Partial safety factor for reinforcement γ<sub>s</sub>. EC2 §2.4.2.4 — persistent/transient: 1.15, accidental: 1.0</>} />
          </div>
        </div>
      </Box>

      {showUls && <Box title="ULS LOADS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field labelNode={<>M<sub>Ed</sub> (+bot)</>}  value={inp.MEd} onChange={v => set('MEd', v)} unit="kNm" step={10}
            tip={<>Design bending moment M<sub>Ed</sub> [kNm]. Positive = sagging (tension at bottom). EC2 §6.1</>} />
          <Field labelNode={<>N<sub>Ed</sub> (−comp)</>} value={inp.NEd} onChange={v => set('NEd', v)} unit="kN"  step={50}
            tip={<>Design axial force N<sub>Ed</sub> [kN]. Negative = compression, positive = tension. EC2 §6.1</>} />
        </div>
      </Box>}

      {showShear && <Box title="SHEAR &amp; TORSION LOADS &amp; REINFORCEMENT">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field labelNode={<>V<sub>Ed</sub></>} value={inp.VEd ?? 0} onChange={v => set('VEd', v)} unit="kN" step={10}
            tip={<>Design shear force V<sub>Ed</sub> [kN]. EC2 §6.2</>} />
          <Field labelNode={<>T<sub>Ed</sub></>} value={inp.TEd ?? 0} onChange={v => set('TEd', v)} unit="kNm" step={5} min={0}
            tip={<>Design torsional moment T<sub>Ed</sub> [kNm]. EC2 §6.3</>} />
          <Field labelNode={<>Stirrup Φ</>} value={inp.stirrup_phi ?? 10} onChange={v => set('stirrup_phi', v)} unit="mm" min={6} max={20} step={2}
            tip="Stirrup (shear link) bar diameter [mm]. Affects concrete cover to longitudinal bar centres." />
          <Field labelNode={<>Spacing s</>} value={inp.stirrup_s ?? 200} onChange={v => set('stirrup_s', v)} unit="mm" min={50} max={600} step={25}
            tip="Stirrup longitudinal spacing s [mm]. EC2 §9.2.2 max: 0.75d ≤ 300 mm" />
          {(() => {
            const nTop = inp.rows2[0]?.n ?? 2
            const maxLegs = Math.max(2, 2 * Math.floor(nTop / 2))
            const legs = inp.stirrup_legs ?? 2
            const overLegs = legs > maxLegs
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field
                  labelNode={<>Legs n<sub>w</sub><span style={{ color: '#94a3b8', fontWeight: 400 }}> (max {maxLegs})</span></>}
                  value={legs}
                  onChange={v => set('stirrup_legs', Math.min(Math.max(2, Math.round(v / 2) * 2), maxLegs))}
                  min={2} max={maxLegs} step={2}
                  tip={<>Number of shear legs n<sub>w</sub> (vertical stirrup branches). Must be even. More legs = more shear capacity without increasing bar size.</>}
                />
                {overLegs && (
                  <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, lineHeight: 1.3 }}>
                    ⚠ Only {nTop} top bars — max {maxLegs} legs
                  </div>
                )}
              </div>
            )
          })()}
          <div />
        </div>
        {/* Locked strut angle display + optional override */}
        <div style={{ marginTop: 6, padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>θ (strut):</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: inp.theta_override ? '#7c3aed' : '#0369a1', minWidth: 50 }}>
              {inp.theta_override ? `${(inp.theta_deg ?? 21.8).toFixed(1)}°` : <span style={{ color: '#0369a1' }}>auto</span>}
            </span>
            <span style={{ fontSize: 10, color: '#64748b' }}>(EC2 §6.2.3, locked from V<sub>Ed</sub>)</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#7c3aed', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={!!inp.theta_override}
                onChange={e => set('theta_override', e.target.checked)}
                style={{ accentColor: '#7c3aed' }}
              />
              Override
            </label>
          </div>
          {inp.theta_override && (
            <div style={{ marginTop: 4 }}>
              <Field
                labelNode={<>θ override</>}
                value={inp.theta_deg ?? 21.8}
                onChange={v => set('theta_deg', Math.min(45, Math.max(21.8, v)))}
                unit="°" min={21.8} max={45} step={0.5}
                tip="Strut inclination angle θ [°]. EC2 §6.2.3 limits: 21.8° (cot θ = 2.5) to 45° (cot θ = 1.0). Lower angle = more shear capacity but more horizontal steel needed."
              />
            </div>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horizontal Ties</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          <Field labelNode={<>Tie Φ</>} value={inp.tie_phi ?? 0} onChange={v => set('tie_phi', v)} unit="mm" min={0} max={20} step={2}
            tip="Horizontal cross-tie bar diameter [mm]. Set to 0 to disable. Ties connect side bars at selected levels." />
          {(() => {
            const maxTies = inp.nbars3 > 0 ? inp.nbars3 : 0
            const tieN = inp.tie_n ?? 1
            const overLimit = (inp.tie_phi ?? 0) > 0 && maxTies > 0 && tieN > maxTies
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field
                  labelNode={<>No. of ties{maxTies > 0 ? <span style={{ color: '#94a3b8', fontWeight: 400 }}> (max {maxTies})</span> : null}</>}
                  value={tieN}
                  onChange={v => set('tie_n', Math.min(Math.max(1, Math.round(v)), maxTies > 0 ? maxTies : 99))}
                  min={1} max={maxTies > 0 ? maxTies : 20} step={1}
                  tip="Number of horizontal tie levels. Ties are placed at the uppermost side bar levels."
                />
                {overLimit && (
                  <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, lineHeight: 1.3 }}>
                    ⚠ Only {maxTies} side bar{maxTies !== 1 ? 's' : ''} available
                  </div>
                )}
              </div>
            )
          })()}
        </div>
        {inp.nbars3 === 0 && (inp.tie_phi ?? 0) > 0 && (
          <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
            ⚠ No side bars — add side bars (Layer 3) to place ties
          </div>
        )}
        <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>Set Tie Φ = 0 to disable</div>
      </Box>}

      {showSls && <Box title="SLS LOADS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
            Quasi-permanent combination (default = 0.6 × ULS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field labelNode={<>M<sub>sk</sub> (+bot)</>}  value={sls.Msk} onChange={v => setSls({ Msk: v })} unit="kNm" step={10}
              tip={<>Quasi-permanent SLS bending moment M<sub>sk</sub> [kNm]. Used for crack width and stress checks. EC2 §7.3.4</>} />
            <Field labelNode={<>N<sub>sk</sub> (−comp)</>} value={sls.Nsk} onChange={v => setSls({ Nsk: v })} unit="kN"  step={50}
              tip={<>Quasi-permanent SLS axial force N<sub>sk</sub> [kN]. Negative = compression. EC2 §7.3.4</>} />
          </div>
          <div>
            <span style={{ ...LABEL_STYLE, marginBottom: 3, display: 'block' }}>Crack width limit w<sub>k</sub></span>
            <select
              value={sls.wk_lim}
              onChange={e => setSls({ wk_lim: parseFloat(e.target.value) })}
              style={{ ...SELECT_STYLE, padding: '5px 8px', fontSize: 12, width: '100%' }}
            >
              <option value={0.2}>0.2 mm (XS, XD, XF — aggressive)</option>
              <option value={0.3}>0.3 mm (XC — typical)</option>
              <option value={0.4}>0.4 mm (X0, XC1 — mild)</option>
            </select>
          </div>
          <div>
            <span style={{ ...LABEL_STYLE, marginBottom: 3, display: 'block' }}>k<sub>c</sub> — stress distribution factor</span>
            <select
              value={sls.kc}
              onChange={e => setSls({ kc: parseFloat(e.target.value) })}
              style={{ ...SELECT_STYLE, padding: '5px 8px', fontSize: 12, width: '100%' }}
            >
              <option value={0.4}>0.4 — bending (rectangular)</option>
              <option value={0.9}>0.9 — near-pure tension</option>
              <option value={1.0}>1.0 — pure tension</option>
            </select>
          </div>
        </div>
      </Box>}

      {/* ── Reinforcement layers — shown for all tabs ────────────────────────── */}
      {<Box title="LAYER 2 — TOP">
        <Field label="Cover c₂" value={Math.round(inp.c2 * 1000)} onChange={v => set('c2', v / 1000)} unit="mm" min={20} max={200} step={5}
          tip={<>Nominal concrete cover c<sub>2</sub> to stirrup outer face at top [mm]. EC2 §4.4.1. Bar centre = c<sub>2</sub> + Φ<sub>stirrup</sub>/2 + Φ<sub>bar</sub>/2</>} />
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {inp.rows2.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, alignItems: 'end' }}>
              <Field label={i === 0 ? 'Bars / row' : ''} value={row.n} onChange={v => setRow2(i, { n: Math.max(1, Math.round(v)) })} min={1} max={30} step={1}
                tip="Number of bars in this top row" />
              <Field label={i === 0 ? 'Dia. Φ [mm]' : ''} value={row.phi} onChange={v => setRow2(i, { phi: v })} min={8} max={40} step={2}
                tip="Bar diameter Φ [mm] for this top row" />
              {inp.rows2.length > 1
                ? <button onClick={() => removeRow2(i)} style={{ height: 28, width: 28, borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                : <div style={{ width: 28 }} />}
            </div>
          ))}
        </div>
        <button onClick={addRow2} style={{ marginTop: 6, width: '100%', padding: '4px 0', borderRadius: 5, border: '1px solid #d1fae5', background: '#ecfdf5', color: '#047857', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add row</button>
      </Box>}

      {<Box title="LAYER 1 — BOTTOM">
        <Field label="Cover c₁" value={Math.round(inp.c1 * 1000)} onChange={v => set('c1', v / 1000)} unit="mm" min={20} max={200} step={5}
          tip={<>Nominal concrete cover c<sub>1</sub> to stirrup outer face at bottom [mm]. EC2 §4.4.1. Bar centre = c<sub>1</sub> + Φ<sub>stirrup</sub>/2 + Φ<sub>bar</sub>/2</>} />
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {inp.rows1.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, alignItems: 'end' }}>
              <Field label={i === 0 ? 'Bars / row' : ''} value={row.n} onChange={v => setRow1(i, { n: Math.max(1, Math.round(v)) })} min={1} max={30} step={1}
                tip="Number of bars in this bottom row" />
              <Field label={i === 0 ? 'Dia. Φ [mm]' : ''} value={row.phi} onChange={v => setRow1(i, { phi: v })} min={8} max={40} step={2}
                tip="Bar diameter Φ [mm] for this bottom row" />
              {inp.rows1.length > 1
                ? <button onClick={() => removeRow1(i)} style={{ height: 28, width: 28, borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                : <div style={{ width: 28 }} />}
            </div>
          ))}
        </div>
        <button onClick={addRow1} style={{ marginTop: 6, width: '100%', padding: '4px 0', borderRadius: 5, border: '1px solid #d1fae5', background: '#ecfdf5', color: '#047857', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add row</button>
      </Box>}

      {<Box title="LAYER 3 — SIDES">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: hasSideBars ? 8 : 0, cursor: 'pointer' }}>
          <input type="checkbox" checked={hasSideBars} onChange={e => toggleSideBars(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: '#10b981', cursor: 'pointer' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>Include side bars</span>
        </label>
        {hasSideBars && (
          <ReinfField label="Side bars (per side)"
            nbars={inp.nbars3} phi={inp.phi3}
            onNbars={v => set('nbars3', v)} onPhi={v => set('phi3', v)}
            onAdd={addSide} onRemove={removeSide} />
        )}
      </Box>}

      {/* ── First-order / Second-order effects — ULS only ────────────────────── */}
      {showUls && <Box title="FIRST-ORDER EFFECTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <CbRow checked={!!inp.firstOrder} onChange={v => set('firstOrder', v)}>
            <strong>Enable first-order eccentricity</strong>
          </CbRow>
          {inp.firstOrder && <>
            <CbRow checked={!!inp.useMinEcc} onChange={v => set('useMinEcc', v)} indent>
              e₀ = Max(M₁/N₁ ; M₂/N₂ ; Max(h/30, 20 mm))
            </CbRow>
            {inp.useMinEcc && (
              <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  End 1 (bottom)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Field labelNode={<>M<sub>1</sub></>} value={inp.M1 ?? inp.MEd} onChange={v => set('M1', v)} unit="kNm" step={10}
                    tip={<>End moment at bottom of column M<sub>1</sub> [kNm]. Used for equivalent moment calculation. EC2 §5.8.8.2</>} />
                  <Field labelNode={<>N<sub>1</sub></>} value={inp.N1 ?? inp.NEd} onChange={v => set('N1', v)} unit="kN" step={50}
                    tip={<>Axial force at bottom of column N<sub>1</sub> [kN]. Used to compute eccentricity e<sub>1</sub> = M<sub>1</sub>/N<sub>1</sub>.</>} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  End 2 (top)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <Field labelNode={<>M<sub>2</sub></>} value={inp.M2 ?? inp.MEd} onChange={v => set('M2', v)} unit="kNm" step={10}
                    tip={<>End moment at top of column M<sub>2</sub> [kNm]. EC2 §5.8.8.2</>} />
                  <Field labelNode={<>N<sub>2</sub></>} value={inp.N2 ?? inp.NEd} onChange={v => set('N2', v)} unit="kN" step={50}
                    tip={<>Axial force at top of column N<sub>2</sub> [kN].</>} />
                </div>
              </div>
            )}
            <CbRow checked={!!inp.useImperfection} onChange={v => set('useImperfection', v)} indent>
              Geometric imperfection e<sub>a</sub> = l₀ / 400
            </CbRow>
            {inp.useImperfection && (
              <div style={{ paddingLeft: 16 }}>
                <Field label="Effective length l₀" value={inp.l0 ?? l0Default} onChange={v => set('l0', v)} unit="m" min={0.1} step={0.5}
                  tip={<>Effective buckling length l<sub>0</sub> [m]. Used for geometric imperfection e<sub>a</sub> = l<sub>0</sub>/400. EC2 §5.2</>} />
              </div>
            )}
          </>}
        </div>
      </Box>}

      {showUls && <Box title="SECOND-ORDER EFFECTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <CbRow checked={!!inp.secondOrder} onChange={v => set('secondOrder', v)}>
            <strong>Nominal curvature method</strong> (EC2 §5.8.8)
          </CbRow>
          {inp.secondOrder && <>
            <Field label="Effective length l₀" value={inp.l0 ?? l0Default} onChange={v => set('l0', v)} unit="m" min={0.1} step={0.5}
              tip={<>Effective buckling length l<sub>0</sub> [m]. Pin-pin = L, fixed-pin = 0.7L, fixed-fixed = 0.5L. EC2 §5.8.3</>} />
            {!inp.firstOrder && (
              <CbRow checked={!!inp.useImperfection} onChange={v => set('useImperfection', v)} indent>
                Geometric imperfection e<sub>a</sub> = l₀ / 400
              </CbRow>
            )}

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Effective creep ratio φ<sub>ef</sub>
              </div>
              <Field
                labelNode={<>φ(∞,t₀) — long-term creep</>}
                value={inp.phi_inf ?? 1.5}
                onChange={v => set('phi_inf', v)}
                min={0} max={5} step={0.1}
                tip={<>Basic creep coefficient φ(∞,t₀). Typical range 1.0–3.0 depending on humidity, cement class, age at loading. EC2 §3.1.4 / Annex B</>}
              />
              <Field
                labelNode={<>M<sub>0Eqp</sub> — quasi-perm. SLS moment</>}
                value={inp.M0Eqp ?? Math.round(inp.MEd * 0.6)}
                onChange={v => set('M0Eqp', v)}
                unit="kNm" step={10}
                tip={<>Quasi-permanent SLS moment for effective creep ratio φ<sub>ef</sub> calculation. EC2 §5.8.4 — typically 0.6 × M<sub>Ed</sub></>}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>
                  M<sub>0Ed</sub> — ULS moment reference
                </span>
                <select
                  value={inp.M0EdRef ?? '1'}
                  onChange={e => set('M0EdRef', e.target.value as '1' | '2')}
                  style={{ ...SELECT_STYLE, padding: '5px 8px', fontSize: 12 }}>
                  <option value="1">M₁ (end 1 — bottom)</option>
                  <option value="2">M₂ (end 2 — top)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 5, padding: '5px 8px', fontSize: 11 }}>
                <span style={{ color: '#0369a1', fontWeight: 600 }}>
                  φ<sub>ef</sub> = φ(∞,t₀) · M<sub>0Eqp</sub>/M<sub>0Ed</sub>
                </span>
                <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, color: inp.phi_ef != null ? '#94a3b8' : '#0369a1' }}>
                  {res.phi_ef_calc.toFixed(3)}
                  {inp.phi_ef != null && <span style={{ color: '#f59e0b', marginLeft: 4 }}>(overridden)</span>}
                </span>
              </div>
              <CbRow checked={inp.phi_ef != null} onChange={v => set('phi_ef', v ? res.phi_ef_calc : undefined)} indent>
                Override φ<sub>ef</sub> directly
              </CbRow>
              {inp.phi_ef != null && (
                <div style={{ paddingLeft: 16 }}>
                  <Field
                    labelNode={<>φ<sub>ef</sub> — override value</>}
                    value={inp.phi_ef}
                    onChange={v => set('phi_ef', v)}
                    min={0} max={10} step={0.1}
                    tip={<>Effective creep ratio φ<sub>ef</sub> used directly in nominal curvature method. EC2 §5.8.4</>}
                  />
                </div>
              )}
            </div>
          </>}
        </div>
      </Box>}
    </div>
  )
}
