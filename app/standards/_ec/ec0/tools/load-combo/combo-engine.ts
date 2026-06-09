// Eurocode EN 1990 combination engine — ported from core/engine.py + core/defaults.py

// ── Types ─────────────────────────────────────────────────────────────────────

export type LoadCategory = 'permanent' | 'variable'

export interface LoadInstance {
  code: string      // e.g. 'DL', 'LL', 'WINDX1'
  name: string      // e.g. 'Dead Load'
  category: LoadCategory
}

export interface Combination {
  number: number
  name: string
  factors: Record<number, number>  // 1-based load index → factor
}

export interface ComboTypes {
  persistent:   boolean
  persistent_c: boolean
  accidental:   boolean
  sls_char:     boolean
  sls_freq:     boolean
  sls_quasi:    boolean
}

export type MaterialType = 'steel' | 'concrete'
export type ComboMode    = 'simple' | 'full'

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_PARTIAL_FACTORS: Record<string, number> = {
  steel_unfav_b:    1.20,
  steel_fav_b:      0.95,
  steel_unfav_c:    1.00,
  steel_fav_c:      1.00,
  concrete_unfav_b: 1.35,
  concrete_fav_b:   0.95,
  concrete_unfav_c: 1.00,
  concrete_fav_c:   1.00,
  live_unfav_b:         1.50,
  live_unfav_c:         1.30,
  wind_unfav_b:         1.50,
  wind_unfav_c:         1.30,
  wave_unfav_b:         1.50,
  wave_unfav_c:         1.30,
  current_unfav_b:      1.50,
  current_unfav_c:      1.30,
  temperature_unfav_b:  1.50,
  temperature_unfav_c:  1.20,
  mooring_unfav_b:      1.50,
  mooring_unfav_c:      1.30,
  berthing_char_unfav_b: 1.35,
  berthing_char_unfav_c: 1.15,
  impact_unfav_b:       2.00,
  impact_unfav_c:       2.00,
}

export const DEFAULT_COMBO_FACTORS: Record<string, [number, number, number]> = {
  live_load:        [0.70, 0.50, 0.30],
  wind_load:        [0.50, 0.20, 0.00],
  wave_load:        [0.60, 0.20, 0.00],
  current_load:     [0.60, 0.20, 0.00],
  temperature_load: [0.60, 0.60, 0.50],
  mooring:          [0.50, 0.20, 0.00],
  berthing_char:    [0.75, 0.75, 0.00],
  impact_load:      [0.70, 0.50, 0.30],
}

export const LOAD_TYPES: { code: string; name: string; category: LoadCategory }[] = [
  { code: 'DL',    name: 'Dead Load',      category: 'permanent' },
  { code: 'SDL',   name: 'Super Dead Load', category: 'permanent' },
  { code: 'LL',    name: 'Live Load',      category: 'variable'  },
  { code: 'IMP',   name: 'Impact Load',    category: 'variable'  },
  { code: 'WINDX', name: 'Wind X',         category: 'variable'  },
  { code: 'WINDZ', name: 'Wind Z',         category: 'variable'  },
  { code: 'WAVEX', name: 'Wave X',         category: 'variable'  },
  { code: 'WAVEZ', name: 'Wave Z',         category: 'variable'  },
  { code: 'CUX',   name: 'Current X',      category: 'variable'  },
  { code: 'CUZ',   name: 'Current Z',      category: 'variable'  },
  { code: 'TE+',   name: 'Temperature +',  category: 'variable'  },
  { code: 'TE-',   name: 'Temperature −',  category: 'variable'  },
  { code: 'ML',    name: 'Mooring Load',   category: 'variable'  },
  { code: 'BE',    name: 'Berthing',       category: 'variable'  },
]

// ── Lookup helpers ────────────────────────────────────────────────────────────

const GAMMA_MAP: Record<string, string> = {
  DL: 'steel_unfav_{set}', SDL: 'steel_unfav_{set}',
  LL: 'live_unfav_{set}',
  WINDX: 'wind_unfav_{set}', WINDZ: 'wind_unfav_{set}',
  WAVEX: 'wave_unfav_{set}', WAVEZ: 'wave_unfav_{set}',
  CUX: 'current_unfav_{set}', CUZ: 'current_unfav_{set}',
  'TE+': 'temperature_unfav_{set}', 'TE-': 'temperature_unfav_{set}',
  ML: 'mooring_unfav_{set}',
  BE: 'berthing_char_unfav_{set}',
  IMP: 'impact_unfav_{set}',
}

const PSI_MAP: Record<string, string> = {
  LL: 'live_load',
  WINDX: 'wind_load', WINDZ: 'wind_load',
  WAVEX: 'wave_load', WAVEZ: 'wave_load',
  CUX: 'current_load', CUZ: 'current_load',
  'TE+': 'temperature_load', 'TE-': 'temperature_load',
  ML: 'mooring',
  BE: 'berthing_char',
  IMP: 'impact_load',
}

function baseCode(code: string): string {
  return code.replace(/\d+$/, '')
}

function getGamma(code: string, pf: Record<string, number>, set: 'b' | 'c'): number {
  const base = baseCode(code)
  const tmpl = GAMMA_MAP[base] ?? `live_unfav_${set}`
  return pf[tmpl.replace('{set}', set)] ?? 1.5
}

function getPermanentFactor(material: MaterialType, pf: Record<string, number>, set: 'b' | 'c'): number {
  const key = material === 'steel'
    ? (set === 'b' ? 'steel_unfav_b' : 'steel_unfav_c')
    : (set === 'b' ? 'concrete_unfav_b' : 'concrete_unfav_c')
  return pf[key] ?? 1.0
}

function getPsi(code: string, cf: Record<string, [number, number, number]>, idx: 0 | 1 | 2): number {
  const base = baseCode(code)
  const key = PSI_MAP[base] ?? 'live_load'
  return cf[key]?.[idx] ?? [0.7, 0.5, 0.3][idx]
}

// ── Combination generators ────────────────────────────────────────────────────

function generatePersistent(
  permLoads: LoadInstance[], varLoads: LoadInstance[],
  allLoads: LoadInstance[], pf: Record<string, number>,
  cf: Record<string, [number, number, number]>,
  material: MaterialType, startNum: number, mode: ComboMode, counterStart: number
): { combos: Combination[]; counter: number } {
  const combos: Combination[] = []
  let counter = counterStart

  for (const dominant of varLoads) {
    counter++
    const factors: Record<number, number> = {}
    for (const perm of permLoads) {
      factors[allLoads.indexOf(perm) + 1] = getPermanentFactor(material, pf, 'b')
    }
    factors[allLoads.indexOf(dominant) + 1] = getGamma(dominant.code, pf, 'b')
    if (mode === 'full') {
      for (const v of varLoads) {
        if (v === dominant) continue
        const combined = getGamma(v.code, pf, 'b') * getPsi(v.code, cf, 0)
        if (combined > 0) factors[allLoads.indexOf(v) + 1] = combined
      }
    }
    combos.push({ number: startNum + combos.length, name: `ULS_B${counter}`, factors })
  }
  return { combos, counter }
}

function generatePersistentC(
  permLoads: LoadInstance[], varLoads: LoadInstance[],
  allLoads: LoadInstance[], pf: Record<string, number>,
  cf: Record<string, [number, number, number]>,
  material: MaterialType, startNum: number, mode: ComboMode
): Combination[] {
  const combos: Combination[] = []
  varLoads.forEach((dominant, di) => {
    const factors: Record<number, number> = {}
    for (const perm of permLoads) {
      factors[allLoads.indexOf(perm) + 1] = getPermanentFactor(material, pf, 'c')
    }
    factors[allLoads.indexOf(dominant) + 1] = getGamma(dominant.code, pf, 'c')
    if (mode === 'full') {
      for (const v of varLoads) {
        if (v === dominant) continue
        const combined = getGamma(v.code, pf, 'c') * getPsi(v.code, cf, 0)
        if (combined > 0) factors[allLoads.indexOf(v) + 1] = combined
      }
    }
    combos.push({ number: startNum + combos.length, name: `ULS_C${di + 1}`, factors })
  })
  return combos
}

function generateAccidental(
  permLoads: LoadInstance[], varLoads: LoadInstance[],
  allLoads: LoadInstance[], pf: Record<string, number>,
  cf: Record<string, [number, number, number]>,
  material: MaterialType, startNum: number, mode: ComboMode
): Combination[] {
  const combos: Combination[] = []
  varLoads.forEach((dominant, di) => {
    const factors: Record<number, number> = {}
    for (const perm of permLoads) {
      factors[allLoads.indexOf(perm) + 1] = getPermanentFactor(material, pf, 'c')
    }
    factors[allLoads.indexOf(dominant) + 1] = getPsi(dominant.code, cf, 1)
    if (mode === 'full') {
      for (const v of varLoads) {
        if (v === dominant) continue
        const psi2 = getPsi(v.code, cf, 2)
        if (psi2 > 0) factors[allLoads.indexOf(v) + 1] = psi2
      }
    }
    combos.push({ number: startNum + combos.length, name: `ACC${di + 1}`, factors })
  })
  return combos
}

function generateSlsChar(
  permLoads: LoadInstance[], varLoads: LoadInstance[],
  allLoads: LoadInstance[], cf: Record<string, [number, number, number]>,
  startNum: number, mode: ComboMode, counterStart: number
): { combos: Combination[]; counter: number } {
  const combos: Combination[] = []
  let counter = counterStart
  for (const dominant of varLoads) {
    counter++
    const factors: Record<number, number> = {}
    for (const perm of permLoads) factors[allLoads.indexOf(perm) + 1] = 1.0
    factors[allLoads.indexOf(dominant) + 1] = 1.0
    if (mode === 'full') {
      for (const v of varLoads) {
        if (v === dominant) continue
        const psi0 = getPsi(v.code, cf, 0)
        if (psi0 > 0) factors[allLoads.indexOf(v) + 1] = psi0
      }
    }
    combos.push({ number: startNum + combos.length, name: `SLS_CHAR${counter}`, factors })
  }
  return { combos, counter }
}

function generateSlsFreq(
  permLoads: LoadInstance[], varLoads: LoadInstance[],
  allLoads: LoadInstance[], cf: Record<string, [number, number, number]>,
  startNum: number, mode: ComboMode, counterStart: number
): { combos: Combination[]; counter: number } {
  const combos: Combination[] = []
  let counter = counterStart
  for (const dominant of varLoads) {
    counter++
    const factors: Record<number, number> = {}
    for (const perm of permLoads) factors[allLoads.indexOf(perm) + 1] = 1.0
    factors[allLoads.indexOf(dominant) + 1] = getPsi(dominant.code, cf, 1)
    if (mode === 'full') {
      for (const v of varLoads) {
        if (v === dominant) continue
        const psi2 = getPsi(v.code, cf, 2)
        if (psi2 > 0) factors[allLoads.indexOf(v) + 1] = psi2
      }
    }
    combos.push({ number: startNum + combos.length, name: `SLS_FREQ${counter}`, factors })
  }
  return { combos, counter }
}

function generateSlsQuasi(
  permLoads: LoadInstance[], varLoads: LoadInstance[],
  allLoads: LoadInstance[], cf: Record<string, [number, number, number]>,
  startNum: number
): Combination[] {
  const factors: Record<number, number> = {}
  for (const perm of permLoads) factors[allLoads.indexOf(perm) + 1] = 1.0
  for (const v of varLoads) {
    const psi2 = getPsi(v.code, cf, 2)
    if (psi2 > 0) factors[allLoads.indexOf(v) + 1] = psi2
  }
  return [{ number: startNum, name: 'SLS_QUASI', factors }]
}

// ── Master orchestrator ───────────────────────────────────────────────────────

export interface EnvelopeRange { start: number; end: number; type: 'STRENGTH' | 'SERVICEABILITY' }

export function generateAll(
  loads: LoadInstance[],
  pf: Record<string, number>,
  cf: Record<string, [number, number, number]>,
  material: MaterialType,
  types: ComboTypes,
  mode: ComboMode,
): { combos: Combination[]; envelopes: EnvelopeRange[] } {
  const permLoads = loads.filter(l => l.category === 'permanent')
  const varLoads  = loads.filter(l => l.category === 'variable')
  const allLoads  = [...permLoads, ...varLoads]

  let comboNum = loads.length + 1
  const combos: Combination[] = []
  const envelopes: EnvelopeRange[] = []

  const ulsStart = comboNum
  let ulsBCtr = 0

  if (types.persistent) {
    const r = generatePersistent(permLoads, varLoads, allLoads, pf, cf, material, comboNum, mode, ulsBCtr)
    combos.push(...r.combos); comboNum += r.combos.length; ulsBCtr = r.counter
  }
  if (types.persistent_c) {
    const batch = generatePersistentC(permLoads, varLoads, allLoads, pf, cf, material, comboNum, mode)
    combos.push(...batch); comboNum += batch.length
  }
  if (types.accidental) {
    const batch = generateAccidental(permLoads, varLoads, allLoads, pf, cf, material, comboNum, mode)
    combos.push(...batch); comboNum += batch.length
  }

  const ulsEnd = comboNum - 1
  if (ulsEnd >= ulsStart) envelopes.push({ start: ulsStart, end: ulsEnd, type: 'STRENGTH' })

  const slsStart = comboNum
  let slsCharCtr = 0, slsFreqCtr = 0

  if (types.sls_char) {
    const r = generateSlsChar(permLoads, varLoads, allLoads, cf, comboNum, mode, slsCharCtr)
    combos.push(...r.combos); comboNum += r.combos.length; slsCharCtr = r.counter
  }
  if (types.sls_freq) {
    const r = generateSlsFreq(permLoads, varLoads, allLoads, cf, comboNum, mode, slsFreqCtr)
    combos.push(...r.combos); comboNum += r.combos.length; slsFreqCtr = r.counter
  }
  if (types.sls_quasi) {
    const batch = generateSlsQuasi(permLoads, varLoads, allLoads, cf, comboNum)
    combos.push(...batch); comboNum += batch.length
  }

  const slsEnd = comboNum - 1
  if (slsEnd >= slsStart) envelopes.push({ start: slsStart, end: slsEnd, type: 'SERVICEABILITY' })

  void slsCharCtr; void slsFreqCtr; void ulsBCtr

  return { combos, envelopes }
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatStaad(combo: Combination): string {
  const factors = Object.entries(combo.factors)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([n, f]) => `${n} ${f.toFixed(2)}`)
    .join(' ')
  return `LOAD COMB ${combo.number} ${combo.name}\n${factors}\n`
}

export function formatReport(combo: Combination, loads: LoadInstance[]): string {
  const parts = Object.entries(combo.factors)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([n, f]) => {
      const name = loads[Number(n) - 1]?.code ?? `L${n}`
      return Number(f) === 1.0 ? name : `${Number(f).toFixed(2)}(${name})`
    })
    .join(' + ')
  return `LOAD COMB ${combo.number} ${combo.name}\n${parts}\n`
}

export function sectionHeader(name: string): string | null {
  if (name.startsWith('ULS_B'))    return '— Persistent & Transient Set B'
  if (name.startsWith('ULS_C'))    return '— Persistent & Transient Set C'
  if (name.startsWith('ACC'))      return '— Accidental Set C'
  if (name.startsWith('SLS_CHAR')) return '— SLS Characteristic'
  if (name.startsWith('SLS_FREQ')) return '— SLS Frequent'
  if (name.startsWith('SLS_QUASI')) return '— SLS Quasi-permanent'
  return null
}
