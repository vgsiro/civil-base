'use client'
import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { calcEc2Rect, Ec2RectInput, Ec2RectResult } from './rect-engine/rect-calc'
import { RebarRow } from './rect-engine/rect-types'
import { Ec2SlsInput } from './rect-engine/rect-sls-calc'
import { RectInputPanel } from './rect-ui/rect-input-panel'
import { RectResultsPanel } from './rect-ui/rect-results-panel'
import { supabase } from '@/lib/supabase'
import { useToolAccess } from '@/lib/useSubscription'
import { CopyProvider } from '@/app/(home)/standards/_lib/ui'
import { encodeRectState, decodeRectState } from './rect-url-state'

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

export default function Ec2RectCalc({ onBack }: { onBack?: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      setUserEmail(user?.email ?? null)
    })
  }, [])
  const toolAccess = useToolAccess('ec2_rect_section_check', userId, userEmail)

  // Decode initial state from URL, fall back to DEFAULT
  const [inp, setInp] = useState<Ec2RectInput>(() => {
    const raw = searchParams.get('s')
    if (raw) { const decoded = decodeRectState(raw); if (decoded) return decoded.inp }
    return DEFAULT
  })
  const [hasSideBars, setHasSideBars] = useState(() => inp.nbars3 > 0)
  const [ulsResetKey,   setUlsResetKey]   = useState(0)
  const [slsResetKey,   setSlsResetKey]   = useState(0)
  const [stResetKey,    setStResetKey]    = useState(0)
  const [rebarResetKey, setRebarResetKey] = useState(0)
  const [sls, setSlsState] = useState<Ec2SlsInput>(() => {
    const raw = searchParams.get('s')
    if (raw) { const decoded = decodeRectState(raw); if (decoded) return decoded.sls }
    return defaultSls(DEFAULT)
  })

  // Write state to URL on every change (debounced, replace only — no history entries)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString())
      p.set('s', encodeRectState({ inp, sls }))
      router.replace(`/standards?${p.toString()}`)
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inp, sls])

  const rawRectTab = searchParams.get('rectTab')
  const activeTab: 'uls' | 'sls' | 'shear-torsion' = (rawRectTab === 'sls' || rawRectTab === 'shear-torsion') ? rawRectTab : 'uls'

  const setActiveTab = useCallback((tab: 'uls' | 'sls' | 'shear-torsion') => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('rectTab', tab)
    router.replace(`/standards?${p.toString()}`)
  }, [router, searchParams])

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

  const handleReset = useCallback(() => {
    setInp(DEFAULT)
    setHasSideBars(DEFAULT.nbars3 > 0)
    setSlsState(defaultSls(DEFAULT))
  }, [])

  const handleResetUls = useCallback(() => {
    setInp(prev => ({
      ...prev,
      h: DEFAULT.h, b: DEFAULT.b,
      concreteName: DEFAULT.concreteName, fck: DEFAULT.fck, fyk: DEFAULT.fyk,
      acc: DEFAULT.acc, gc: DEFAULT.gc, gs: DEFAULT.gs,
      ecmOverride: undefined,
      c1: DEFAULT.c1, c2: DEFAULT.c2,
      rows1: DEFAULT.rows1, rows2: DEFAULT.rows2,
      nbars3: DEFAULT.nbars3, phi3: DEFAULT.phi3,
      MEd: DEFAULT.MEd, NEd: DEFAULT.NEd,
      firstOrder: undefined, useMinEcc: undefined, useImperfection: undefined,
      M1: undefined, N1: undefined, M2: undefined, N2: undefined, l0: DEFAULT.l0,
      secondOrder: undefined, phi_inf: undefined, phi_ef: undefined,
      M0Eqp: undefined, M0EdRef: undefined,
    }))
    setHasSideBars(DEFAULT.nbars3 > 0)
    setSlsState(prev => ({ ...prev, Msk: Math.round(DEFAULT.MEd * 0.6), Nsk: Math.round(DEFAULT.NEd * 0.6) }))
    setUlsResetKey(k => k + 1)
    setRebarResetKey(k => k + 1)
  }, [])

  const handleResetSls = useCallback(() => {
    setInp(prev => ({
      ...prev,
      c1: DEFAULT.c1, c2: DEFAULT.c2,
      rows1: DEFAULT.rows1, rows2: DEFAULT.rows2,
      nbars3: DEFAULT.nbars3, phi3: DEFAULT.phi3,
    }))
    setHasSideBars(DEFAULT.nbars3 > 0)
    setSlsState(defaultSls(inp))
    setSlsResetKey(k => k + 1)
    setRebarResetKey(k => k + 1)
  }, [inp])

  const handleResetSt = useCallback(() => {
    setInp(prev => ({
      ...prev,
      c1: DEFAULT.c1, c2: DEFAULT.c2,
      rows1: DEFAULT.rows1, rows2: DEFAULT.rows2,
      nbars3: DEFAULT.nbars3, phi3: DEFAULT.phi3,
      VEd: DEFAULT.VEd, TEd: undefined,
      stirrup_phi: DEFAULT.stirrup_phi, stirrup_s: DEFAULT.stirrup_s,
      stirrup_legs: DEFAULT.stirrup_legs,
      theta_deg: DEFAULT.theta_deg, theta_override: undefined,
      tie_phi: undefined, tie_n: undefined,
    }))
    setHasSideBars(DEFAULT.nbars3 > 0)
    setStResetKey(k => k + 1)
    setRebarResetKey(k => k + 1)
  }, [])

  return (
    <CopyProvider canCopy={toolAccess.canCopyDetails}>
      {onBack && (
        <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          <button onClick={onBack}
            style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            ‹ EC2
          </button>
        </div>
      )}
      <div className="rect-tool-layout" style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, overflow: 'visible', minWidth: 0 }}>
        <RectInputPanel
          inp={inp} res={res} hasSideBars={hasSideBars}
          set={set} setInp={setInp} toggleSideBars={toggleSideBars}
          setRow1={setRow1} addRow1={addRow1} removeRow1={removeRow1}
          setRow2={setRow2} addRow2={addRow2} removeRow2={removeRow2}
          addSide={addSide} removeSide={removeSide}
          activeTab={activeTab} sls={sls} setSls={setSls}
          onReset={handleReset}
          onResetUls={handleResetUls}
          onResetSls={handleResetSls}
          onResetSt={handleResetSt}
          ulsResetKey={ulsResetKey}
          slsResetKey={slsResetKey}
          stResetKey={stResetKey}
          rebarResetKey={rebarResetKey}
        />
        <RectResultsPanel
          inp={inp} res={res}
          activeTab={activeTab} onTabChange={setActiveTab}
          sls={sls}
          setRow1={setRow1} setRow2={setRow2}
          setInp={setInp}
          toolAccess={toolAccess}
        />
      </div>
    </CopyProvider>
  )
}
