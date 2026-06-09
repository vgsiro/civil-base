'use client'
import { useMemo, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { calcEc2Rect, Ec2RectInput, Ec2RectResult } from './rect-engine/rect-calc'
import { RebarRow } from './rect-engine/rect-types'
import { Ec2SlsInput } from './rect-engine/rect-sls-calc'
import { RectInputPanel } from './rect-ui/rect-input-panel'
import { RectResultsPanel } from './rect-ui/rect-results-panel'

const DEFAULT: Ec2RectInput = {
  h: 1.0, b: 0.5,
  concreteName: 'C30/37', fck: 30, fyk: 500,
  acc: 1.0, gc: 1.5, gs: 1.15,
  MEd: 1000, NEd: -2000, VEd: 300, l0: 10,
  stirrup_phi: 10, stirrup_s: 150, stirrup_legs: 2, theta_deg: 21.8,
  rows1: [{ n: 4, phi: 25 }], c1: 0.075,
  rows2: [{ n: 4, phi: 25 }], c2: 0.075,
  nbars3: 5, phi3: 16,
}

function defaultSls(inp: Ec2RectInput): Ec2SlsInput {
  return { Msk: Math.round(inp.MEd * 0.6), Nsk: Math.round(inp.NEd * 0.6), wk_lim: 0.3, kc: 0.4 }
}

export default function Ec2RectCalc() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [inp, setInp] = useState<Ec2RectInput>(DEFAULT)
  const [hasSideBars, setHasSideBars] = useState(DEFAULT.nbars3 > 0)

  const rawRectTab = searchParams.get('rectTab')
  const activeTab: 'uls' | 'sls' | 'shear-torsion' = (rawRectTab === 'sls' || rawRectTab === 'shear-torsion') ? rawRectTab : 'uls'

  const setActiveTab = useCallback((tab: 'uls' | 'sls' | 'shear-torsion') => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('rectTab', tab)
    router.replace(`/standards?${p.toString()}`)
  }, [router, searchParams])
  const [sls, setSlsState] = useState<Ec2SlsInput>(() => defaultSls(DEFAULT))
  const setSls = useCallback((patch: Partial<Ec2SlsInput>) =>
    setSlsState(prev => ({ ...prev, ...patch })), [])

  const set = useCallback(<K extends keyof Ec2RectInput>(k: K, v: Ec2RectInput[K]) => {
    setInp(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'MEd' || k === 'NEd') {
        setSlsState(s => ({
          ...s,
          ...(k === 'MEd' ? { Msk: Math.round((v as number) * 0.6) } : {}),
          ...(k === 'NEd' ? { Nsk: Math.round((v as number) * 0.6) } : {}),
        }))
      }
      return next
    })
  }, [])

  const toggleSideBars = useCallback((checked: boolean) => {
    setHasSideBars(checked)
    if (!checked) setInp(prev => ({ ...prev, nbars3: 0 }))
    else setInp(prev => ({ ...prev, nbars3: prev.nbars3 > 0 ? prev.nbars3 : 2 }))
  }, [])

  const res = useMemo<Ec2RectResult>(() => {
    try { return calcEc2Rect(inp) }
    catch { return calcEc2Rect(DEFAULT) }
  }, [inp])

  const setRow1 = useCallback((i: number, patch: Partial<RebarRow>) =>
    setInp(prev => { const r = prev.rows1.map((row, idx) => idx === i ? { ...row, ...patch } : row); return { ...prev, rows1: r } }), [])
  const addRow1 = useCallback(() =>
    setInp(prev => ({ ...prev, rows1: [...prev.rows1, { n: prev.rows1[prev.rows1.length - 1]?.n ?? 2, phi: prev.rows1[prev.rows1.length - 1]?.phi ?? 20 }] })), [])
  const removeRow1 = useCallback((i: number) =>
    setInp(prev => ({ ...prev, rows1: prev.rows1.filter((_, idx) => idx !== i) })), [])

  const setRow2 = useCallback((i: number, patch: Partial<RebarRow>) =>
    setInp(prev => { const r = prev.rows2.map((row, idx) => idx === i ? { ...row, ...patch } : row); return { ...prev, rows2: r } }), [])
  const addRow2 = useCallback(() =>
    setInp(prev => ({ ...prev, rows2: [...prev.rows2, { n: prev.rows2[prev.rows2.length - 1]?.n ?? 2, phi: prev.rows2[prev.rows2.length - 1]?.phi ?? 16 }] })), [])
  const removeRow2 = useCallback((i: number) =>
    setInp(prev => ({ ...prev, rows2: prev.rows2.filter((_, idx) => idx !== i) })), [])

  const addSide    = useCallback(() => set('nbars3', inp.nbars3 + 1), [inp.nbars3, set])
  const removeSide = useCallback(() => set('nbars3', Math.max(0, inp.nbars3 - 1)), [inp.nbars3, set])

  return (
    <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
      <RectInputPanel
        inp={inp} res={res} hasSideBars={hasSideBars}
        set={set} setInp={setInp} toggleSideBars={toggleSideBars}
        setRow1={setRow1} addRow1={addRow1} removeRow1={removeRow1}
        setRow2={setRow2} addRow2={addRow2} removeRow2={removeRow2}
        addSide={addSide} removeSide={removeSide}
        activeTab={activeTab} sls={sls} setSls={setSls}
      />
      <RectResultsPanel
        inp={inp} res={res}
        activeTab={activeTab} onTabChange={setActiveTab}
        sls={sls}
        setRow1={setRow1} setRow2={setRow2}
        setInp={setInp}
      />
    </div>
  )
}
